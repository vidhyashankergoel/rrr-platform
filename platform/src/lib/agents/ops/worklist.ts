/**
 * WORK LIST
 *
 * Turns approved commercial decisions into work the delivery plane can pick
 * up, and keeps that list honest as things change.
 *
 * THE JOIN BETWEEN THE TWO PLANES
 * -------------------------------
 * This is the only path from "a customer agreed something" to "engineers are
 * working on it". Nothing reaches the delivery agents that a human did not
 * approve first — the work list is built strictly from APPROVED rows, so the
 * approval queue is a real gate rather than a formality that gets bypassed by
 * a side door.
 *
 * It also writes the work package out to the Claude Code agent inbox and the
 * Obsidian vault via the bridge, which is where the delivery hierarchy
 * (principal → architect → manager → team lead → engineers) picks it up.
 */

import { computeEffort, computeTimeline } from "../../costing";
import { services, auditOffer } from "../../catalogue";
import type { OpsAgent, OpsContext, OpsResult } from "./types";

/** Work the delivery side needs, derived from what was agreed. */
interface DerivedWork {
  title: string;
  description: string;
  assignedRole: string;
  priority: number;
  estimateHours?: number;
  dueAt?: Date;
}

/**
 * The standard opening sequence for any engagement.
 *
 * These exist because they are the steps that get skipped under time pressure
 * and cause the problems later: nobody regrets having written down the access
 * they were granted, and everybody regrets not having.
 */
function openingSequence(leadName: string, serviceNames: string[]): DerivedWork[] {
  return [
    {
      title: `Confirm scope and acceptance criteria — ${leadName}`,
      description: [
        `Agreed work: ${serviceNames.join(", ") || "to be confirmed"}.`,
        "",
        "Write down what 'done' means before anyone starts, in the customer's",
        "words, and get it acknowledged in writing. Ambiguity here is where",
        "fixed-price engagements lose money.",
      ].join("\n"),
      assignedRole: "principal",
      priority: 1,
    },
    {
      title: `Access and NDA — ${leadName}`,
      description: [
        "Confirm the mutual NDA is signed before any access is granted.",
        "",
        "Then: request read-only credentials the customer issues and can revoke,",
        "record exactly what was granted and by whom, and diarise revocation for",
        "the end of the engagement. Never accept a shared admin credential.",
      ].join("\n"),
      assignedRole: "manager",
      priority: 1,
    },
    {
      title: `Architecture and delivery plan — ${leadName}`,
      description:
        "Produce the target architecture, the phases, and the rollback position for each phase. Review with the customer before work starts.",
      assignedRole: "architect",
      priority: 2,
    },
    {
      title: `Staffing and effort model — ${leadName}`,
      description:
        "Decide the pod: how many engineers, which roles, for how long. Produce the effort model and check it against the quoted price before committing.",
      assignedRole: "manager",
      priority: 2,
    },
  ];
}

export const worklist: OpsAgent = {
  key: "worklist",
  name: "Work list",
  purpose: "Turns approved deals and bookings into a prioritized work list for the delivery plane.",
  intervalSec: 600,
  requires: [],

  async run(ctx: OpsContext): Promise<OpsResult> {
    let created = 0;
    const notes: string[] = [];

    // --- 1. Won deals become engagements ---------------------------------
    const won = await ctx.db.lead.findMany({
      where: { stage: "WON", workItems: { none: {} } },
      take: 10,
    });

    for (const lead of won) {
      const names = services
        .filter((s) => (lead.serviceIds ?? "").split(",").map((x) => x.trim()).includes(s.id))
        .map((s) => s.name);

      const items = openingSequence(lead.company || lead.name, names);

      if (!ctx.dryRun) {
        for (const item of items) {
          await ctx.db.workItem.create({
            data: {
              title: item.title,
              description: item.description,
              assignedRole: item.assignedRole,
              priority: item.priority,
              status: "READY",
              sourceKind: "approval",
              sourceId: lead.id,
              leadId: lead.id,
              dueAt: new Date(ctx.now.getTime() + item.priority * 2 * 24 * 60 * 60 * 1000),
            },
          });
          created += 1;
        }
      }
      notes.push(`${lead.company || lead.name}: ${items.length} opening items`);
    }

    // --- 2. Confirmed bookings need preparation --------------------------
    const soon = new Date(ctx.now.getTime() + 48 * 60 * 60 * 1000);
    const bookings = await ctx.db.booking.findMany({
      where: { status: { in: ["REQUESTED", "CONFIRMED"] }, startsAt: { gte: ctx.now, lte: soon } },
      include: { lead: true },
      take: 10,
    });

    for (const booking of bookings) {
      const exists = await ctx.db.workItem.findFirst({
        where: { sourceKind: "booking", sourceId: booking.id },
      });
      if (exists) continue;

      if (!ctx.dryRun) {
        await ctx.db.workItem.create({
          data: {
            title: `Prepare for call — ${booking.company || booking.name}`,
            description: [
              `Call at ${booking.startsAt.toISOString()} (${booking.timezone}).`,
              booking.topic ? `\nThey want to cover:\n${booking.topic}` : "",
              "",
              "Before the call: read their enquiry and any chat transcript, look at",
              "whatever is public about their stack, and have an indicative range",
              "ready. Walking in cold wastes the half hour they gave us.",
              "",
              booking.status === "REQUESTED"
                ? "NOTE: this booking is still only REQUESTED. Confirm it and send the joining link."
                : "",
            ]
              .filter(Boolean)
              .join("\n"),
            assignedRole: "principal",
            priority: 1,
            status: "READY",
            sourceKind: "booking",
            sourceId: booking.id,
            leadId: booking.leadId,
            dueAt: booking.startsAt,
            estimateHours: 1,
          },
        });
        created += 1;
      }
      notes.push(`call prep for ${booking.company || booking.name}`);
    }

    // --- 3. Keep the list honest -----------------------------------------
    // An item whose due date has passed and is still BACKLOG is not a plan,
    // it is a lie. Promote it so it shows up as overdue rather than hiding.
    if (!ctx.dryRun) {
      const stale = await ctx.db.workItem.updateMany({
        where: { status: "BACKLOG", dueAt: { lt: ctx.now } },
        data: { status: "READY", priority: 1 },
      });
      if (stale.count) notes.push(`${stale.count} overdue item(s) promoted`);
    }

    const open = await ctx.db.workItem.count({ where: { status: { in: ["READY", "IN_PROGRESS", "BLOCKED"] } } });

    return {
      status: "ok",
      summary: created
        ? `${created} work item(s) created — ${open} open in total`
        : `nothing new — ${open} open work item(s)`,
      created,
      detail: { notes },
    };
  },
};
