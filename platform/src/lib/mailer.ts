/**
 * Outbound email, built around CASL rather than bolted onto it.
 *
 * Canada's Anti-Spam Legislation (S.C. 2010, c. 23) governs commercial
 * electronic messages sent to or from Canada. Three things matter here:
 *
 *  • s.6(1)  — consent is required before sending a commercial electronic
 *              message. Consent is either express (they said yes) or implied
 *              (an existing business relationship, time-limited).
 *  • s.6(2)  — every message must identify the sender and include a mailing
 *              address and contact information.
 *  • s.11    — every message must carry an unsubscribe mechanism that works
 *              for at least 60 days and is honoured within 10 business days.
 *  • s.13    — the burden of proving consent is on the sender. Hence the
 *              consent fields on the Lead record and the audit trail.
 *
 * A reply to an enquiry the recipient initiated is transactional and outside
 * the commercial-electronic-message definition. Anything that promotes the
 * business is commercial and is refused here without an express consent record.
 *
 * Penalties run to $1,000,000 for an individual and $10,000,000 for an
 * organization, so this module fails closed.
 */

import { db, audit } from "./db";
import { company } from "./company";
import { deliver, mailConfig } from "./mail-provider";

export interface SendInput {
  leadId?: string;
  toEmail: string;
  subject: string;
  bodyText: string;
  category: "TRANSACTIONAL" | "COMMERCIAL";
  /** Overrides the default Reply-To, e.g. to route replies to a named owner. */
  replyTo?: string;
  sequenceKey?: string;
  sequenceStep?: number;
  approvalId?: string;
}

export interface SendResult {
  ok: boolean;
  id?: string;
  reason?: string;
}

function mailingAddress(): string {
  const configured = process.env.CASL_MAILING_ADDRESS;
  if (configured && configured.trim().length > 0) return configured;
  return [company.legalName, company.addressLine, `${company.city}, ${company.region}`, company.country]
    .filter(Boolean)
    .join(", ");
}

/** CASL s.6(2) identification block plus the s.11 unsubscribe mechanism. */
function footer(unsubscribeToken?: string): string {
  const base = process.env.CASL_UNSUBSCRIBE_BASE ?? `${company.siteUrl}/unsubscribe`;
  const link = unsubscribeToken ? `${base}?t=${unsubscribeToken}` : `${base}`;

  return [
    "",
    "—",
    company.legalName,
    mailingAddress(),
    `${company.email} · ${company.phone}`,
    "",
    `You are receiving this because you contacted us. Unsubscribe at any time: ${link}`,
    "Unsubscribe requests are honoured within 10 business days.",
  ].join("\n");
}

export async function send(input: SendInput): Promise<SendResult> {
  // --- Suppression and consent checks: fail closed ------------------------
  let unsubscribeToken: string | undefined;

  if (input.leadId) {
    const lead = await db.lead.findUnique({ where: { id: input.leadId } });
    if (!lead) return { ok: false, reason: "lead-not-found" };

    unsubscribeToken = lead.unsubscribeToken;

    if (lead.unsubscribedAt) {
      await db.emailMessage.create({
        data: {
          leadId: input.leadId,
          toEmail: input.toEmail,
          subject: input.subject,
          bodyText: input.bodyText,
          category: input.category,
          status: "SUPPRESSED",
          error: "Recipient has unsubscribed",
        },
      });
      await audit({
        actor: "mailer",
        action: "email.suppressed",
        subject: input.toEmail,
        detail: "unsubscribed",
        leadId: input.leadId,
      });
      return { ok: false, reason: "unsubscribed" };
    }

    if (input.category === "COMMERCIAL" && !lead.consentMarketing) {
      await db.emailMessage.create({
        data: {
          leadId: input.leadId,
          toEmail: input.toEmail,
          subject: input.subject,
          bodyText: input.bodyText,
          category: input.category,
          status: "SUPPRESSED",
          error: "No express consent on record (CASL s.6(1))",
        },
      });
      await audit({
        actor: "mailer",
        action: "email.blocked.casl",
        subject: input.toEmail,
        detail: "commercial message without express consent",
        leadId: input.leadId,
      });
      return { ok: false, reason: "no-express-consent" };
    }

    if (input.category === "TRANSACTIONAL" && !lead.consentContact) {
      return { ok: false, reason: "no-contact-consent" };
    }
  }

  const body = input.bodyText + footer(unsubscribeToken);

  const record = await db.emailMessage.create({
    data: {
      leadId: input.leadId,
      toEmail: input.toEmail,
      subject: input.subject,
      bodyText: body,
      category: input.category,
      status: "QUEUED",
      approvalId: input.approvalId,
      sequenceKey: input.sequenceKey,
      sequenceStep: input.sequenceStep,
    },
  });

  // --- Delivery ------------------------------------------------------------
  //
  // Transport choice lives in mail-provider.ts. Every outcome is recorded
  // against the EmailMessage row, so the admin console always shows what
  // happened rather than leaving a message silently unaccounted for.
  const result = await deliver({
    to: input.toEmail,
    subject: input.subject,
    text: body,
    replyTo: input.replyTo,
  });

  if (result.ok) {
    await db.emailMessage.update({
      where: { id: record.id },
      data: { status: "SENT", sentAt: new Date(), providerId: result.id },
    });
    await audit({
      actor: "mailer",
      action: "email.sent",
      subject: input.toEmail,
      detail: input.subject,
      leadId: input.leadId,
    });
    return { ok: true, id: record.id };
  }

  // Nothing was configured, or the sender cannot legally reach this recipient
  // yet. Neither is a failure of this message — it stays QUEUED so it is not
  // lost and can go out once setup is finished.
  if (result.reason === "no-provider" || result.reason === "owner-only-sender") {
    await db.emailMessage.update({
      where: { id: record.id },
      data: { error: result.detail ?? "No mail provider configured" },
    });
    await audit({
      actor: "mailer",
      action: `email.queued.${result.reason}`,
      subject: input.toEmail,
      detail: result.detail,
      leadId: input.leadId,
    });
    return { ok: true, id: record.id, reason: `queued-${result.reason}` };
  }

  await db.emailMessage.update({
    where: { id: record.id },
    data: {
      status: "FAILED",
      failedAt: new Date(),
      error: (result.detail ?? result.reason ?? "unknown").slice(0, 500),
    },
  });
  console.error(`[mailer] ${input.toEmail}: ${result.reason} — ${result.detail ?? ""}`);
  return { ok: false, id: record.id, reason: result.reason };
}

// ---------------------------------------------------------------------------
//  INTERNAL NOTIFICATION
// ---------------------------------------------------------------------------

/**
 * Tell the business that a lead has arrived.
 *
 * Deliberately a different path from `send()` above:
 *
 *  - It goes to *us*, not to a customer, so CASL does not apply. CASL governs
 *    commercial electronic messages sent to a recipient; a system emailing its
 *    own operator is not one.
 *  - It therefore skips the consent and suppression checks, which exist to
 *    protect a recipient — here the recipient is the sender.
 *  - It is fire-and-forget. Failing to notify must never fail the visitor's
 *    submission: the lead is already safely in the database.
 *
 * With no mail provider configured it prints the notification in full and
 * records it, so nothing is lost and the gap is loud rather than silent.
 */
/**
 * Deliver an already-composed internal notification.
 *
 * Shared by `notifyOwner` (lead arrived) and the booking route (call
 * requested) so there is exactly one place where "tell the business" is
 * implemented, and exactly one place that has to be right about the
 * no-provider case.
 */
export async function notifyInternal(input: {
  subject: string;
  body: string;
  /** Replying to the notification should reach the prospect, not us. */
  replyTo?: string;
  leadId?: string;
  sequenceKey: string;
  /** Banner shown in the log when the message could not be delivered. */
  banner: string;
}): Promise<{ ok: boolean; reason?: string; detail?: string }> {
  const cfg = mailConfig();
  const to = cfg.ownerInbox;
  if (!to) return { ok: false, reason: "no-recipient" };

  const result = await deliver({
    to,
    subject: input.subject,
    text: input.body,
    replyTo: input.replyTo,
  });

  await db.emailMessage
    .create({
      data: {
        leadId: input.leadId,
        toEmail: to,
        subject: input.subject,
        bodyText: input.body,
        category: "TRANSACTIONAL",
        status: result.ok ? "SENT" : cfg.provider === "none" ? "QUEUED" : "FAILED",
        sentAt: result.ok ? new Date() : null,
        failedAt: result.ok || cfg.provider === "none" ? null : new Date(),
        providerId: result.id,
        error: result.ok ? null : (result.detail ?? result.reason ?? null),
        sequenceKey: input.sequenceKey,
      },
    })
    .catch(() => undefined);

  await audit({
    actor: "system",
    action: result.ok ? "owner.notified" : "owner.notify.failed",
    subject: to,
    detail: result.ok ? undefined : `${result.reason}: ${result.detail ?? ""}`.slice(0, 300),
    leadId: input.leadId,
  }).catch(() => undefined);

  if (!result.ok) {
    // Print the whole notification. If mail is not working, the log is the
    // only place this enquiry exists outside the database, and a silent
    // failure here means a lost customer.
    const rule = "=".repeat(57);
    console.warn(
      [
        "",
        rule,
        ` ${input.banner}`,
        ` reason: ${result.reason}${result.detail ? ` — ${result.detail}` : ""}`,
        rule,
        input.body,
        rule,
        " Fix with: npm run mail:check     (see docs/EMAIL-SETUP.md)",
        rule,
        "",
      ].join("\n"),
    );
  }

  return { ok: result.ok, reason: result.reason, detail: result.detail };
}

export async function notifyOwner(input: {
  leadId: string;
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  message?: string | null;
  budgetBand?: string | null;
  timeline?: string | null;
  serviceIds?: string | null;
  sourceUrl?: string | null;
  consentMarketing: boolean;
}): Promise<{ ok: boolean; reason?: string }> {
  const to = process.env.MAIL_TO ?? process.env.MAIL_REPLY_TO ?? company.email;
  if (!to) return { ok: false, reason: "no-recipient" };

  const subject = `New enquiry — ${input.company || input.name}`;
  const rule = "─".repeat(41);

  const body = [
    `A new enquiry has arrived on ${company.siteUrl}.`,
    "",
    rule,
    `Name:      ${input.name}`,
    `Email:     ${input.email}`,
    `Phone:     ${input.phone || "—"}`,
    `Company:   ${input.company || "—"}`,
    `Role:      ${input.jobTitle || "—"}`,
    rule,
    `Budget:    ${input.budgetBand || "not stated"}`,
    `Timeline:  ${input.timeline || "not stated"}`,
    `Interest:  ${input.serviceIds || "not specified"}`,
    `Came from: ${input.sourceUrl || "—"}`,
    `Marketing consent: ${input.consentMarketing ? "YES" : "no"}`,
    rule,
    "",
    "What they said:",
    "",
    input.message || "(no message)",
    "",
    rule,
    "",
    `Console:        ${company.siteUrl}/admin`,
    `Reply directly: ${input.email}`,
    "",
    "They have been told to expect a reply within one business day.",
  ].join("\n");
  return notifyInternal({
    subject,
    body,
    // Replying to the notification goes straight to the prospect.
    replyTo: input.email,
    leadId: input.leadId,
    sequenceKey: "owner-notification",
    banner: "NEW ENQUIRY — no mail provider configured, NOT delivered",
  });
}
