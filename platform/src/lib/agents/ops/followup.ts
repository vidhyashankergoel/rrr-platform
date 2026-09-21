/**
 * FOLLOW-UP RUNNER
 *
 * Chases the enquiries that went quiet, and stops chasing at the right point.
 *
 * WHY IT STOPS
 * ------------
 * The stopping rule is the important part. Three touches, spread over three
 * weeks, then the lead goes dormant and we leave them alone. A fourth email
 * does not win work; it makes the firm look desperate and, under CASL, an
 * unwanted commercial message with no express consent is an offence rather
 * than a nuisance.
 *
 * Each touch also has to *say something new*. "Just checking in" is the
 * message that trained everyone to ignore follow-ups — so each step here
 * carries a different, genuinely useful reason to reply.
 *
 * Everything it writes is a draft for approval. See ops/types.ts.
 */

import { company, currencyFromDollars as money } from "../../company";
import { auditOffer } from "../../catalogue";
import { referenceFor } from "../../email-templates";
import type { OpsAgent, OpsContext, OpsResult } from "./types";

/** What each touch is actually *for*. */
const STEPS: { step: number; angle: string; build: (name: string) => string }[] = [
  {
    step: 1,
    angle: "Make it easy to say no, and give them something either way.",
    build: (name) =>
      [
        `Hello ${name},`,
        "",
        "You got in touch a few days ago and I have not heard back, which is",
        "completely fine — people get pulled onto other things.",
        "",
        "One thing before I leave you alone: if the hold-up is that you do not yet",
        "know the size of the problem, that is exactly what the audit is for —",
        `${money(auditOffer.price)}, ${auditOffer.durationLabel}, read-only, and the report is yours whether`,
        "or not you use us for the work.",
        "",
        "If the timing is wrong, say so and I will stop emailing.",
      ].join("\n"),
  },
  {
    step: 2,
    angle: "Answer the objection they most likely have but did not state.",
    build: (name) =>
      [
        `Hello ${name},`,
        "",
        "Second and second-last note from me.",
        "",
        "The thing most people are weighing at this point is risk: whether a",
        "small firm can be trusted with production infrastructure, and whether",
        "they end up locked in. So, plainly — everything we build lives in your",
        "repositories and your cloud accounts, documented well enough for someone",
        "else to take over. If you stop working with us you keep all of it.",
        "",
        `If that was not the hesitation, tell me what was and I will answer it.`,
      ].join("\n"),
  },
  {
    step: 3,
    angle: "Close the loop honestly and stop.",
    build: (name) =>
      [
        `Hello ${name},`,
        "",
        "Last one — I will not chase you again after this.",
        "",
        "I am closing your enquiry off so it stops sitting in our queue. Nothing",
        "is deleted and nothing expires: if this comes back around in six months,",
        "reply to this email and we will pick up where we left off.",
        "",
        `Everything we do is priced publicly at ${company.siteUrl}/pricing if you`,
        "ever want a number without speaking to anyone.",
        "",
        "Good luck with it either way.",
      ].join("\n"),
  },
];

function signature(reference: string): string {
  return [
    "",
    "—",
    company.shortName,
    company.tagline,
    "",
    `${company.email} · ${company.phone}`,
    company.siteUrl,
    "",
    `Your reference: ${reference}`,
  ].join("\n");
}

export const followupRunner: OpsAgent = {
  key: "followup-runner",
  name: "Follow-up runner",
  purpose: "Drafts the scheduled follow-ups that are due, and retires a lead after the third.",
  intervalSec: 900,
  requires: [],

  async run(ctx: OpsContext): Promise<OpsResult> {
    const due = await ctx.db.followUpTask.findMany({
      where: { status: "SCHEDULED", runAfter: { lte: ctx.now } },
      include: { lead: true },
      orderBy: { runAfter: "asc" },
      take: 20,
    });

    if (due.length === 0) {
      return { status: "ok", summary: "no follow-ups due", created: 0, proposed: 0 };
    }

    let proposed = 0;
    let retired = 0;
    let cancelled = 0;
    const notes: string[] = [];

    for (const task of due) {
      const lead = task.lead;

      // Stop conditions, checked before anything is written. Each of these is
      // a reason the chase is no longer appropriate.
      const stop =
        !lead ? "lead deleted"
        : lead.unsubscribedAt ? "unsubscribed"
        : !lead.consentContact ? "no consent to contact"
        : lead.stage === "WON" ? "already won"
        : lead.stage === "LOST" ? "marked lost"
        : lead.stage === "DORMANT" ? "already dormant"
        : null;

      if (stop) {
        await ctx.db.followUpTask.update({
          where: { id: task.id },
          data: { status: "CANCELLED", ranAt: ctx.now, result: `Not sent — ${stop}` },
        });
        cancelled += 1;
        notes.push(`${lead?.email ?? task.leadId}: cancelled (${stop})`);
        continue;
      }

      // Somebody replied since this was scheduled? Then there is nothing to chase.
      const replied = await ctx.db.inboundMail.count({
        where: { leadId: lead!.id, receivedAt: { gt: task.createdAt } },
      });
      if (replied > 0) {
        await ctx.db.followUpTask.update({
          where: { id: task.id },
          data: { status: "CANCELLED", ranAt: ctx.now, result: "Not sent — they replied" },
        });
        cancelled += 1;
        notes.push(`${lead!.email}: cancelled (they replied)`);
        continue;
      }

      const spec = STEPS.find((s) => s.step === task.step) ?? STEPS[STEPS.length - 1]!;
      const firstName = lead!.name.trim().split(/\s+/)[0] || "there";
      const bodyText = spec.build(firstName) + signature(referenceFor(lead!.id));

      if (!ctx.dryRun) {
        await ctx.db.approval.create({
          data: {
            kind: "OUTBOUND_EMAIL",
            title: `Follow-up ${task.step} of ${STEPS.length} — ${lead!.company || lead!.name}`,
            summary: spec.angle,
            payloadJson: JSON.stringify({
              leadId: lead!.id,
              toEmail: lead!.email,
              subject:
                task.step === 1
                  ? `Following up — ${company.shortName}`
                  : task.step === 2
                    ? `One more thought — ${company.shortName}`
                    : `Closing this off — ${company.shortName}`,
              bodyText,
              sequenceKey: "followup",
              sequenceStep: task.step,
            }),
            riskNote:
              task.step === STEPS.length
                ? "Final touch. After this the lead goes dormant and we stop contacting them."
                : `Touch ${task.step} of ${STEPS.length}. ${task.reason}`,
            leadId: lead!.id,
          },
        });

        await ctx.db.followUpTask.update({
          where: { id: task.id },
          data: { status: "DONE", ranAt: ctx.now, result: `Draft raised for approval (step ${task.step})` },
        });

        // The third touch retires the lead whether or not it is approved.
        // Leaving it NEW would let a later run start the sequence again.
        if (task.step >= STEPS.length) {
          await ctx.db.lead.update({
            where: { id: lead!.id },
            data: { stage: "DORMANT", lostReason: "No response after three follow-ups" },
          });
          retired += 1;
        }
      }

      proposed += 1;
      notes.push(`${lead!.email}: follow-up ${task.step} drafted`);
    }

    return {
      status: "ok",
      summary: ctx.dryRun
        ? `${due.length} follow-up(s) due`
        : `${proposed} follow-up draft(s) raised, ${cancelled} cancelled, ${retired} lead(s) retired`,
      proposed,
      created: cancelled + retired,
      detail: { notes },
    };
  },
};
