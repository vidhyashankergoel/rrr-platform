/**
 * EMAIL HANDLER
 *
 * Takes what the inbox watcher found and decides what should happen to each
 * message: who owns it, how fast it needs answering, and what the first draft
 * of a reply looks like.
 *
 * The watcher observes. This one acts on the observation. Splitting them means
 * a classification bug cannot also be an action bug, and the handler can be
 * re-run over already-classified mail without touching the mailbox again.
 */

import { composeReply } from "./reply-composer";
import { company } from "../../company";
import type { OpsAgent, OpsContext, OpsResult } from "./types";

/** Who should see this, and how quickly. */
export interface Disposition {
  owner: "principal" | "delivery" | "finance" | "hr" | "nobody";
  /** Hours within which a person should have responded. */
  slaHours: number;
  action: "draft-reply" | "flag-for-person" | "file-only" | "ignore";
  why: string;
}

export function disposition(classification: string, urgency: string): Disposition {
  if (urgency === "high") {
    return {
      owner: "principal",
      slaHours: 2,
      action: "flag-for-person",
      why: "Urgent language. A machine-written reply to somebody in trouble reads badly — a person should write this one.",
    };
  }

  switch (classification) {
    case "customer-reply":
      return { owner: "principal", slaHours: 8, action: "draft-reply", why: "An existing customer is waiting on us." };
    case "new-enquiry":
      return { owner: "principal", slaHours: 8, action: "draft-reply", why: "New business arriving outside the website form." };
    case "booking-response":
      return { owner: "principal", slaHours: 4, action: "flag-for-person", why: "A call time needs confirming or moving — cheap to get wrong." };
    case "invoice-or-billing":
      return { owner: "finance", slaHours: 24, action: "flag-for-person", why: "Money. Never automated." };
    case "recruitment":
      return { owner: "hr", slaHours: 120, action: "file-only", why: "Worth a courteous reply eventually, not today." };
    case "vendor-or-spam":
      return { owner: "nobody", slaHours: 0, action: "ignore", why: "Cold outreach." };
    default:
      return { owner: "principal", slaHours: 24, action: "flag-for-person", why: "Unclassified — a person should look rather than a rule guess." };
  }
}

export const emailHandler: OpsAgent = {
  key: "email-handler",
  name: "Email handler",
  purpose: "Decides who owns each inbound message, how fast it must be answered, and drafts the reply where that is safe.",
  intervalSec: 300,
  requires: [],

  async run(ctx: OpsContext): Promise<OpsResult> {
    const pending = await ctx.db.inboundMail.findMany({
      where: { handled: false },
      orderBy: [{ urgency: "asc" }, { receivedAt: "asc" }],
      take: 25,
    });

    if (pending.length === 0) {
      return { status: "ok", summary: "nothing waiting in the inbox queue", created: 0, proposed: 0 };
    }

    let drafted = 0;
    let flagged = 0;
    const notes: string[] = [];

    for (const mail of pending) {
      const d = disposition(mail.classification, mail.urgency);
      notes.push(`${mail.fromEmail} [${mail.classification}] -> ${d.owner}, ${d.action}`);

      if (ctx.dryRun) continue;

      if (d.action === "draft-reply" && mail.leadId) {
        const draft = await composeReply(ctx.db, mail.leadId).catch(() => null);
        if (draft) {
          await ctx.db.approval.create({
            data: {
              kind: "OUTBOUND_EMAIL",
              title: `Reply to ${mail.fromName || mail.fromEmail}`,
              summary: `Re: ${mail.subject}`,
              payloadJson: JSON.stringify({
                leadId: mail.leadId,
                toEmail: mail.fromEmail,
                subject: `Re: ${mail.subject}`,
                bodyText: draft.bodyText,
                inReplyTo: mail.messageId,
              }),
              riskNote: `${d.why} Respond within ${d.slaHours}h.`,
              leadId: mail.leadId,
            },
          });
          drafted += 1;
        }
      } else if (d.action === "flag-for-person" && mail.leadId) {
        // FollowUpTask hangs off a Lead. Mail from someone we have never met
        // has nothing to hang off — the Approval the watcher already raised
        // is the record for those.
        await ctx.db.followUpTask.create({
          data: {
            leadId: mail.leadId,
            agentKey: "followup",
            runAfter: new Date(ctx.now.getTime() + d.slaHours * 60 * 60 * 1000),
            reason: `${mail.classification} from ${mail.fromEmail}: ${d.why}`,
            step: 1,
          },
        }).catch(() => undefined);
        flagged += 1;
      }

      await ctx.db.inboundMail.update({
        where: { id: mail.id },
        data: {
          handled: true,
          handledAt: ctx.now,
          handledNote: `${d.owner} · ${d.action} · SLA ${d.slaHours}h · ${d.why}`,
        },
      });
    }

    return {
      status: "ok",
      summary: ctx.dryRun
        ? `${pending.length} message(s) would be triaged`
        : `${pending.length} triaged — ${drafted} reply draft(s), ${flagged} flagged for a person`,
      created: pending.length,
      proposed: drafted + flagged,
      detail: { notes, inbox: company.email },
    };
  },
};
