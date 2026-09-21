/**
 * Mail transport selection and delivery.
 *
 * Two providers, because the firm has two different situations:
 *
 *  • RESEND — an HTTP API, free for 3,000 messages a month. The production
 *    choice. Needs a verified domain before it will send to anyone except the
 *    account owner (see `ownerOnly` below).
 *
 *  • SMTP — any mailbox with an app password, including the Gmail address the
 *    business currently uses. Works today, to any recipient, with no domain.
 *    Lower sending limits and worse deliverability for bulk, which does not
 *    matter at this volume.
 *
 * Whichever is configured, nothing here decides *whether* a message may be
 * sent — CASL consent and suppression live in mailer.ts and run first. This
 * module only knows how to put bytes on the wire.
 */

import nodemailer, { type Transporter } from "nodemailer";
import { company } from "./company";

export type Provider = "resend" | "smtp" | "none";

export interface MailConfig {
  provider: Provider;
  /** The From header. */
  from: string;
  /** Where enquiry and booking notifications land. */
  ownerInbox: string;
  /** Default Reply-To when a message does not set its own. */
  replyTo: string;
  /**
   * True when the sender can only deliver to `ownerInbox`.
   *
   * Resend's shared `onboarding@resend.dev` sender is for testing and refuses
   * any other recipient with a 403. That is fine for owner notifications —
   * which is the whole point of this setup — but it means visitor
   * acknowledgements cannot go out until a domain is verified. Knowing this
   * up front lets us queue those with an honest reason instead of firing
   * requests we know will fail.
   */
  ownerOnly: boolean;
  /** Setup problems, in the order they should be fixed. Empty means ready. */
  problems: string[];
  /** Things that work but are not what you want in production. */
  warnings: string[];
}

export interface Message {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

export interface DeliveryResult {
  ok: boolean;
  id?: string;
  /** Machine-readable reason when `ok` is false. */
  reason?: string;
  /** Provider detail, for the log and the admin console. */
  detail?: string;
}

const RESEND_TEST_SENDER = "onboarding@resend.dev";

/** Pull the bare address out of `Name <addr@host>`. */
export function bareAddress(value: string): string {
  const match = /<([^>]+)>/.exec(value);
  return (match ? match[1]! : value).trim().toLowerCase();
}

export function mailConfig(): MailConfig {
  const problems: string[] = [];
  const warnings: string[] = [];

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const smtpHost = process.env.SMTP_HOST?.trim();

  const provider: Provider = apiKey ? "resend" : smtpHost ? "smtp" : "none";

  // Notifications go to `notifyEmail`, which is a destination only. Falling
  // back to the public `company.email` would send them to whichever inbox is
  // printed in the footer — not necessarily the one being read.
  const ownerInbox = (
    process.env.MAIL_TO?.trim() ||
    company.notifyEmail ||
    process.env.MAIL_REPLY_TO?.trim() ||
    company.email
  ).trim();

  // Reply-To is the PUBLIC address, never `ownerInbox`. A visitor's mail
  // client shows this header, so defaulting it to the notification inbox
  // would publish a private mailbox to everyone who ever gets an
  // acknowledgement. Internal notifications override it with the prospect's
  // own address so a reply reaches the prospect.
  const replyTo = (process.env.MAIL_REPLY_TO?.trim() || company.email).trim();

  // Default the From to Resend's test sender, so a fresh API key with no
  // domain yet still delivers owner notifications rather than erroring.
  const from = (
    process.env.MAIL_FROM?.trim() ||
    (provider === "resend" ? `${company.shortName} <${RESEND_TEST_SENDER}>` : "") ||
    (provider === "smtp" ? `${company.shortName} <${process.env.SMTP_USER?.trim() ?? ""}>` : "")
  ).trim();

  const ownerOnly = provider === "resend" && bareAddress(from).endsWith("@resend.dev");

  if (provider === "none") {
    problems.push(
      "No mail provider configured. Set RESEND_API_KEY (recommended) or the SMTP_* variables in platform/.env.local.",
    );
  }

  if (provider === "smtp") {
    if (!process.env.SMTP_USER?.trim()) problems.push("SMTP_HOST is set but SMTP_USER is missing.");
    if (!process.env.SMTP_PASS?.trim()) problems.push("SMTP_HOST is set but SMTP_PASS is missing.");
    if (!process.env.MAIL_FROM?.trim() && !process.env.SMTP_USER?.trim()) {
      problems.push("Set MAIL_FROM, or SMTP_USER so it can be derived.");
    }
  }

  if (provider !== "none" && !from) {
    problems.push("MAIL_FROM is not set and could not be derived.");
  }

  if (!ownerInbox.includes("@")) {
    problems.push(`MAIL_TO does not look like an email address: "${ownerInbox}"`);
  }

  if (ownerOnly) {
    warnings.push(
      `Sending from ${RESEND_TEST_SENDER}, which Resend only delivers to the address the Resend ACCOUNT was created with. ` +
        `Notifications are addressed to ${ownerInbox} — that must be the same address, or every message is refused with a 403. ` +
        "Acknowledgements to visitors are queued rather than sent until a domain is verified at resend.com/domains.",
    );
  }

  // CASL s.6(2)(b) requires a physical mailing address in commercial messages.
  // Transactional replies are exempt, but the footer prints it either way and
  // an incomplete address looks careless to exactly the buyers we want.
  if (!process.env.CASL_MAILING_ADDRESS?.trim() && !company.addressLine) {
    warnings.push(
      "No mailing address configured. CASL s.6(2)(b) requires one in commercial messages — " +
        "set CASL_MAILING_ADDRESS before sending anything promotional.",
    );
  }

  return { provider, from, ownerInbox, replyTo, ownerOnly, problems, warnings };
}

// ---------------------------------------------------------------------------
//  Transports
// ---------------------------------------------------------------------------

let cachedSmtp: Transporter | null = null;

function smtpTransport(): Transporter {
  if (cachedSmtp) return cachedSmtp;

  const port = Number(process.env.SMTP_PORT ?? 587);
  cachedSmtp = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // Port 465 is implicit TLS; 587 upgrades with STARTTLS. Getting this
    // backwards produces a hang rather than an error, which is hard to debug.
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return cachedSmtp;
}

/** Verify the transport can authenticate, without sending anything. */
export async function verifyTransport(): Promise<DeliveryResult> {
  const cfg = mailConfig();

  if (cfg.provider === "none") return { ok: false, reason: "no-provider" };

  if (cfg.provider === "smtp") {
    try {
      await smtpTransport().verify();
      return { ok: true, detail: `${process.env.SMTP_HOST}:${process.env.SMTP_PORT ?? 587}` };
    } catch (err) {
      return { ok: false, reason: "smtp-verify-failed", detail: err instanceof Error ? err.message : String(err) };
    }
  }

  // Resend has no verify endpoint; listing domains proves the key works.
  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    });
    if (res.status === 401) return { ok: false, reason: "bad-api-key", detail: "Resend rejected the API key (401)." };
    if (!res.ok) return { ok: false, reason: "resend-error", detail: `HTTP ${res.status}` };

    const json = (await res.json()) as { data?: { name: string; status: string }[] };
    const domains = json.data ?? [];
    const verified = domains.filter((d) => d.status === "verified").map((d) => d.name);
    return {
      ok: true,
      detail: verified.length ? `verified domains: ${verified.join(", ")}` : "no verified domain yet",
    };
  } catch (err) {
    return { ok: false, reason: "network-error", detail: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Put one message on the wire.
 *
 * Returns rather than throws: every caller is fire-and-forget behind an
 * already-committed database write, and a mail failure must never surface to
 * the visitor as a failed enquiry.
 */
export async function deliver(msg: Message): Promise<DeliveryResult> {
  const cfg = mailConfig();

  if (cfg.provider === "none") return { ok: false, reason: "no-provider" };
  if (cfg.problems.length) return { ok: false, reason: "misconfigured", detail: cfg.problems[0] };

  // Do not fire a request we know Resend will refuse. Queueing it with a
  // truthful reason is more useful than a 403 in the log.
  if (cfg.ownerOnly && bareAddress(msg.to) !== bareAddress(cfg.ownerInbox)) {
    return {
      ok: false,
      reason: "owner-only-sender",
      detail: `Sender ${bareAddress(cfg.from)} can only deliver to ${cfg.ownerInbox}. Verify a domain to reach ${msg.to}.`,
    };
  }

  if (cfg.provider === "smtp") {
    try {
      const info = await smtpTransport().sendMail({
        from: cfg.from,
        to: msg.to,
        replyTo: msg.replyTo ?? cfg.replyTo,
        subject: msg.subject,
        text: msg.text,
      });
      return { ok: true, id: info.messageId, detail: info.response };
    } catch (err) {
      return { ok: false, reason: "smtp-send-failed", detail: err instanceof Error ? err.message : String(err) };
    }
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: cfg.from,
        reply_to: msg.replyTo ?? cfg.replyTo,
        to: [msg.to],
        subject: msg.subject,
        text: msg.text,
      }),
    });

    if (!res.ok) {
      const detail = (await res.text()).slice(0, 500);
      return {
        ok: false,
        reason: res.status === 403 ? "not-permitted" : res.status === 401 ? "bad-api-key" : "provider-error",
        detail: `HTTP ${res.status}: ${detail}`,
      };
    }

    const json = (await res.json()) as { id?: string };
    return { ok: true, id: json.id };
  } catch (err) {
    return { ok: false, reason: "network-error", detail: err instanceof Error ? err.message : String(err) };
  }
}
