/**
 * INBOX WATCHER
 *
 * Reads the business mailbox over IMAP, matches messages to the people we
 * already know, classifies what each one is, and raises the ones that need a
 * person. It is the agent that means a reply sitting unread at 02:00 is
 * already triaged by 02:05.
 *
 * DELIBERATELY READ-ONLY
 * ----------------------
 * It marks nothing as read, deletes nothing, files nothing, and replies to
 * nothing. It opens the mailbox read-only at the protocol level, so a bug
 * here cannot destroy mail. Everything it decides becomes a row in our own
 * database; the mailbox is left exactly as the operator left it.
 *
 * That is a stronger guarantee than "we were careful". An agent with write
 * access to the business inbox is one bad regex away from archiving a
 * contract.
 *
 * WITHOUT CREDENTIALS
 * -------------------
 * Reports `skipped` with the missing variables named. Everything else in the
 * system keeps working — this agent adds reaction time, it is not load-bearing.
 */

import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import type { OpsAgent, OpsContext, OpsResult } from "./types";

export type MailClass =
  | "customer-reply"
  | "new-enquiry"
  | "booking-response"
  | "invoice-or-billing"
  | "recruitment"
  | "vendor-or-spam"
  | "unknown";

export interface ClassifiedMail {
  messageId: string;
  from: string;
  fromName: string;
  subject: string;
  receivedAt: Date;
  snippet: string;
  classification: MailClass;
  /** Confidence this needs a human today. */
  urgency: "high" | "normal" | "low";
  /** Matched to an existing lead, if we know them. */
  leadId?: string;
  reasons: string[];
}

/**
 * Classification by signal, not by model.
 *
 * A model would be better at the edges, but this runs on every message in the
 * mailbox and the cost would be constant and pointless for the 90% that are
 * obvious. The `unknown` bucket is escalated rather than dropped, so the
 * failure mode is "a human looks at it" rather than "it disappears".
 */
export function classify(input: {
  subject: string;
  body: string;
  from: string;
  knownLead: boolean;
}): { classification: MailClass; urgency: ClassifiedMail["urgency"]; reasons: string[] } {
  const text = `${input.subject}\n${input.body}`.toLowerCase();
  const reasons: string[] = [];

  const has = (re: RegExp, why: string) => {
    if (re.test(text)) {
      reasons.push(why);
      return true;
    }
    return false;
  };

  // Urgency first — it changes what a person should do, regardless of type.
  const urgent =
    has(/\b(outage|is down|production down|breach|urgent|asap|emergency|critical)\b/, "urgent language") ||
    has(/\b(deadline|by end of day|eod|today)\b/, "a stated deadline");

  // Noise, checked early so it cannot be mistaken for something important.
  if (
    has(/\b(unsubscribe|newsletter|webinar|marketing|promotion|sale ends|limited time)\b/, "bulk-mail markers") ||
    has(/\b(seo services|guest post|backlink|we can help you rank|outsourcing|hire our developers)\b/, "cold vendor pitch")
  ) {
    return { classification: "vendor-or-spam", urgency: "low", reasons };
  }

  if (has(/\b(resume|cv|curriculum vitae|job application|applying for|my portfolio)\b/, "job-seeker language")) {
    return { classification: "recruitment", urgency: "low", reasons };
  }

  if (has(/\b(invoice|receipt|payment|billing|overdue|remittance|purchase order|\bpo #)\b/, "billing language")) {
    return { classification: "invoice-or-billing", urgency: urgent ? "high" : "normal", reasons };
  }

  if (has(/\b(reschedul|cancel the call|move the call|confirm the call|calendar invite|accepted your invitation)\b/, "about a booking")) {
    return { classification: "booking-response", urgency: "normal", reasons };
  }

  if (input.knownLead) {
    reasons.push("sender matches an existing lead");
    return { classification: "customer-reply", urgency: urgent ? "high" : "normal", reasons };
  }

  // Problem language counts as enquiry language. Somebody describing what is
  // broken is asking for help even when they never use the word.
  if (
    has(/\b(quote|proposal|enquir|inquir|interested in|looking for|can you help|we need)\b/, "enquiry language") ||
    has(/\b(is down|not working|broken|failing|struggling with|problem with|issue with|help with)\b/, "describes a problem")
  ) {
    return { classification: "new-enquiry", urgency: urgent ? "high" : "normal", reasons };
  }

  // Deliberately escalated rather than binned.
  reasons.push("did not match any known pattern — escalated for a person");
  return { classification: "unknown", urgency: "normal", reasons };
}

function addressOf(value: string | undefined): string {
  if (!value) return "";
  const m = /<([^>]+)>/.exec(value);
  return (m ? m[1]! : value).trim().toLowerCase();
}

export const inboxWatcher: OpsAgent = {
  key: "inbox-watcher",
  name: "Inbox watcher",
  purpose: "Reads the business mailbox read-only, matches mail to known customers and triages what needs a person.",
  intervalSec: 300,
  requires: ["IMAP_HOST", "IMAP_USER", "IMAP_PASS"],

  async run(ctx: OpsContext): Promise<OpsResult> {
    const host = process.env.IMAP_HOST?.trim();
    const user = process.env.IMAP_USER?.trim();
    const pass = process.env.IMAP_PASS?.trim();

    if (!host || !user || !pass) {
      return {
        status: "skipped",
        summary: "mailbox not connected",
        reason: "Set IMAP_HOST, IMAP_USER and IMAP_PASS. For Gmail use imap.gmail.com with an App Password.",
      };
    }

    const client = new ImapFlow({
      host,
      port: Number(process.env.IMAP_PORT ?? 993),
      secure: process.env.IMAP_SECURE ? process.env.IMAP_SECURE === "true" : true,
      auth: { user, pass },
      logger: false,
    });

    const seen: ClassifiedMail[] = [];
    let raised = 0;

    try {
      await client.connect();

      // readOnly: true is the guarantee in this file's header. It stops the
      // server marking anything \Seen as a side effect of us reading it.
      const lock = await client.getMailboxLock("INBOX", { readOnly: true });

      try {
        // Only what arrived since the last run — one day on a cold start.
        const lastRun = await ctx.db.agentRun.findFirst({
          where: { agentKey: "inbox-watcher", status: "SUCCEEDED" },
          orderBy: { createdAt: "desc" },
        });
        const since = lastRun?.createdAt ?? new Date(ctx.now.getTime() - 24 * 60 * 60 * 1000);

        for await (const message of client.fetch({ since }, { envelope: true, source: true, uid: true })) {
          // `source` is optional in the fetch result type; a message without
          // one cannot be parsed, so skip rather than throw mid-mailbox.
          if (!message.source) continue;
          const parsed = await simpleParser(message.source).catch(() => null);
          if (!parsed) continue;

          const from = addressOf(parsed.from?.value?.[0]?.address ?? parsed.from?.text);
          if (!from || from === user.toLowerCase()) continue; // skip our own sent mail

          const messageId = parsed.messageId ?? `uid-${message.uid}`;

          // Idempotence: the scheduler may overlap a slow run with the next.
          const already = await ctx.db.inboundMail.findUnique({ where: { messageId } });
          if (already) continue;

          const body = (parsed.text ?? parsed.html ?? "").toString().slice(0, 4000);
          const subject = parsed.subject ?? "(no subject)";

          const lead = await ctx.db.lead.findFirst({
            where: { email: from },
            orderBy: { createdAt: "desc" },
          });

          const verdict = classify({ subject, body, from, knownLead: Boolean(lead) });

          const record: ClassifiedMail = {
            messageId,
            from,
            fromName: parsed.from?.value?.[0]?.name ?? "",
            subject,
            receivedAt: parsed.date ?? ctx.now,
            snippet: body.replace(/\s+/g, " ").trim().slice(0, 400),
            classification: verdict.classification,
            urgency: verdict.urgency,
            leadId: lead?.id,
            reasons: verdict.reasons,
          };
          seen.push(record);

          if (ctx.dryRun) continue;

          await ctx.db.inboundMail.create({
            data: {
              messageId: record.messageId,
              fromEmail: record.from,
              fromName: record.fromName || null,
              subject: record.subject,
              snippet: record.snippet,
              receivedAt: record.receivedAt,
              classification: record.classification,
              urgency: record.urgency,
              reasons: record.reasons.join("; "),
              leadId: record.leadId ?? null,
              purgeAfter: new Date(ctx.now.getTime() + 365 * 24 * 60 * 60 * 1000),
            },
          });

          // A customer reply or an urgent message is put in front of a person.
          const needsPerson =
            record.urgency === "high" ||
            record.classification === "customer-reply" ||
            record.classification === "new-enquiry" ||
            record.classification === "unknown";

          if (needsPerson) {
            await ctx.db.approval.create({
              data: {
                kind: "SALES_HANDOFF",
                title: `${record.urgency === "high" ? "URGENT — " : ""}${record.classification}: ${record.fromName || record.from}`,
                summary: `${record.subject}\n\n${record.snippet}`.slice(0, 600),
                payloadJson: JSON.stringify({ messageId: record.messageId, from: record.from, leadId: record.leadId }),
                riskNote: record.reasons.join("; "),
                leadId: record.leadId ?? null,
              },
            });
            raised += 1;
          }
        }
      } finally {
        lock.release();
      }
    } catch (err) {
      return {
        status: "failed",
        summary: "could not read the mailbox",
        reason: err instanceof Error ? err.message : String(err),
      };
    } finally {
      await client.logout().catch(() => undefined);
    }

    const counts = seen.reduce<Record<string, number>>((acc, m) => {
      acc[m.classification] = (acc[m.classification] ?? 0) + 1;
      return acc;
    }, {});

    return {
      status: "ok",
      summary: seen.length
        ? `${seen.length} new message(s): ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(", ")}`
        : "no new mail",
      created: seen.length,
      proposed: raised,
      detail: { counts, urgent: seen.filter((m) => m.urgency === "high").map((m) => m.subject) },
    };
  },
};
