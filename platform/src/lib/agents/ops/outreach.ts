/**
 * OUTREACH — personalised connection notes, written for a person to send
 *
 * WHAT WAS ASKED FOR, AND WHY THIS IS NOT THAT
 * --------------------------------------------
 * The request was an agent that sends LinkedIn connection and follow requests
 * automatically. This agent does not do that, and the reason is not caution
 * for its own sake:
 *
 *  1. LinkedIn's User Agreement prohibits using software, bots or automated
 *     methods to access the service. Automated connection requests are among
 *     the most reliably detected of those behaviours — the request pattern of
 *     a script does not look like a person, and LinkedIn built its detection
 *     around exactly this case because it is the most common abuse.
 *
 *  2. The penalty lands on the account, and that account is the firm's main
 *     proof it exists. Every page of the site links to it. A restriction
 *     would take out the company page with it, because a company page is
 *     administered by personal profiles — lose the profile, lose the admin.
 *
 *  3. A connection request is an unsolicited commercial message to a real
 *     person. CASL's definition of a commercial electronic message is not
 *     limited to email, and s.13 puts the burden of proving the message was
 *     lawful on the sender. A script that fires several hundred of them is a
 *     hard thing to defend one message at a time.
 *
 * So the agent does the part that is actually hard and actually valuable —
 * writing something specific enough that a stranger replies — and a person
 * spends the ten seconds it takes to send it. The bottleneck in outreach was
 * never the clicking.
 *
 * WHERE THE NAMES COME FROM
 * -------------------------
 * `data/outreach-targets.json`, which you maintain by hand. It is git-ignored
 * and CI fails if it is ever tracked, because it contains the names, roles and
 * employers of real people — personal information under PIPEDA, in a public
 * repository. The example file next to it shows the shape.
 *
 * PIPEDA Principle 4 (limiting collection) is the reason the shape is as small
 * as it is: a name, where they work, a public reason you are contacting them.
 * There is nowhere to put a phone number or an inferred email, because
 * collecting those to cold-contact somebody is the thing the principle exists
 * to prevent.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { company } from "../../company";
import { auditOffer } from "../../catalogue";
import { currencyFromDollars as money } from "../../company";
import type { OpsAgent, OpsContext, OpsResult } from "./types";

/** LinkedIn truncates a personalised invitation note at 300 characters. */
export const NOTE_LIMIT = 300;

export interface OutreachTarget {
  /** How they are addressed in the note. First name is usually right. */
  name: string;
  /** Their role, as their profile states it. */
  role?: string;
  /** Where they work. */
  organization?: string;
  /**
   * The specific, public reason you are contacting THIS person — a talk they
   * gave, a post they wrote, a migration their company announced.
   *
   * Required, and deliberately so. A note without one is a template, the
   * recipient can tell, and a template sent at volume is the behaviour that
   * gets accounts restricted. If you cannot write this line, that is a signal
   * not to send the request rather than a field to leave blank.
   */
  why: string;
  /** Their profile URL, so you can find them again. Never fetched. */
  profileUrl?: string;
}

interface DraftedNote {
  target: OutreachTarget;
  note: string;
  followUp: string;
  tooLongBy: number;
}

const TARGETS_FILE = join(process.cwd(), "data", "outreach-targets.json");

/**
 * Read the target list.
 *
 * A malformed file is reported rather than thrown past: this runs unattended,
 * and "the JSON has a trailing comma" should not read as an agent crash.
 */
export function readTargets(path: string = TARGETS_FILE): {
  targets: OutreachTarget[];
  error?: string;
} {
  if (!existsSync(path)) return { targets: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    return { targets: [], error: err instanceof Error ? err.message : String(err) };
  }

  if (!Array.isArray(parsed)) {
    return { targets: [], error: "expected a JSON array of targets" };
  }

  const targets: OutreachTarget[] = [];
  for (const [i, raw] of parsed.entries()) {
    if (typeof raw !== "object" || raw === null) continue;
    const t = raw as Record<string, unknown>;
    const name = typeof t.name === "string" ? t.name.trim() : "";
    const why = typeof t.why === "string" ? t.why.trim() : "";

    // Both are load-bearing. A nameless target cannot be addressed, and a
    // target with no reason produces exactly the generic note this agent
    // exists to avoid, so neither gets a default.
    if (!name || !why) {
      return {
        targets: [],
        error: `entry ${i + 1} is missing ${!name ? "name" : "why"} — both are required`,
      };
    }

    targets.push({
      name,
      why,
      role: typeof t.role === "string" ? t.role.trim() : undefined,
      organization: typeof t.organization === "string" ? t.organization.trim() : undefined,
      profileUrl: typeof t.profileUrl === "string" ? t.profileUrl.trim() : undefined,
    });
  }

  return { targets };
}

/**
 * The invitation note.
 *
 * Written to the constraint that matters: it has to be worth reading in a
 * notification preview, by somebody who has never heard of us and gets several
 * of these a week. That rules out a pitch. What is left is the specific reason
 * this person, said plainly, and no ask at all — the ask is the connection.
 */
export function composeNote(t: OutreachTarget): string {
  const greeting = `Hi ${t.name.split(/\s+/)[0]},`;
  const closing = "— Vidhya, RRR Solution Providers (Toronto)";

  // Longest first; fall back as the character budget runs out. The signature
  // is never dropped — an unsigned note from a stranger is worse than a
  // shorter one.
  const candidates = [
    `${greeting} ${t.why} I run a small cloud and Kubernetes consultancy here in Toronto and spend most of my time on migrations and platform work. Would be glad to connect.\n${closing}`,
    `${greeting} ${t.why} I do cloud and Kubernetes platform work in Toronto — would be glad to connect.\n${closing}`,
    `${greeting} ${t.why} Would be glad to connect.\n${closing}`,
    `${greeting} ${t.why}`,
  ];

  return candidates.find((c) => c.length <= NOTE_LIMIT) ?? candidates[candidates.length - 1]!;
}

/**
 * What to say once they accept — which is a separate message and a separate
 * decision. Sending this automatically on acceptance is the other half of the
 * behaviour that gets accounts restricted, so it is drafted and left.
 */
export function composeFollowUp(t: OutreachTarget): string {
  const first = t.name.split(/\s+/)[0];
  const where = t.organization ? ` at ${t.organization}` : "";

  return [
    `Thanks for connecting, ${first}.`,
    "",
    "No pitch — I mostly wanted to be in touch with people doing this work in",
    "Canada. If it is ever useful:",
    "",
    `We publish our prices, which is unusual in consulting and makes budgeting`,
    `possible before anyone talks to anyone: ${company.siteUrl}/pricing`,
    "",
    `And if the infrastructure${where} is at the stage where nobody is quite`,
    `sure what is running where, we do a fixed-price audit — ${money(auditOffer.price)},`,
    `${auditOffer.durationLabel}, read-only access, and the written report is yours`,
    "whether or not you ever use us for the work.",
    "",
    "Either way, good to be connected.",
  ].join("\n");
}

export function draftFor(t: OutreachTarget): DraftedNote {
  const note = composeNote(t);
  return {
    target: t,
    note,
    followUp: composeFollowUp(t),
    tooLongBy: Math.max(0, note.length - NOTE_LIMIT),
  };
}

export const outreachAgent: OpsAgent = {
  key: "outreach",
  name: "Outreach",
  purpose:
    "Writes a personalised LinkedIn connection note and follow-up for each person on your target list. Sends nothing — automating connection requests breaches LinkedIn's User Agreement and risks the account the site links to.",
  intervalSec: 86_400,
  requires: [],

  async run(ctx: OpsContext): Promise<OpsResult> {
    const { targets, error } = readTargets();

    if (error) {
      return {
        status: "failed",
        summary: "could not read data/outreach-targets.json",
        reason: error,
      };
    }

    if (targets.length === 0) {
      return {
        status: "skipped",
        summary: "no outreach targets listed",
        reason:
          "Add people to platform/data/outreach-targets.json — copy outreach-targets.example.json for the shape. The file is git-ignored because it holds other people's personal information and this repository is public.",
      };
    }

    // One draft per person, ever. Re-drafting a note for somebody already in
    // the queue is how a person ends up sending two invitations to the same
    // stranger, which is the exact impression this is trying to avoid.
    const existing = await ctx.db.contentDraft.findMany({
      where: { channel: "linkedin", kind: "connection-note" },
      select: { title: true },
    });
    const done = new Set(existing.map((d) => d.title));

    const pending = targets.filter((t) => !done.has(`Connection note — ${t.name}`));
    if (pending.length === 0) {
      return {
        status: "ok",
        summary: `all ${targets.length} target(s) already have a note drafted`,
        created: 0,
      };
    }

    // Five a run. A person who sits down to send forty invitations in one
    // sitting looks like a script to LinkedIn whether or not one was used,
    // and the drafts are worth nothing if sending them costs the account.
    const batch = pending.slice(0, 5);

    if (ctx.dryRun) {
      return {
        status: "ok",
        summary: `would draft ${batch.length} connection note(s)`,
        created: 0,
        detail: { names: batch.map((t) => t.name) },
      };
    }

    let created = 0;
    for (const target of batch) {
      const drafted = draftFor(target);

      await ctx.db.contentDraft.create({
        data: {
          channel: "linkedin",
          kind: "connection-note",
          title: `Connection note — ${target.name}`,
          body: [
            `INVITATION NOTE (${drafted.note.length}/${NOTE_LIMIT} characters)`,
            "",
            drafted.note,
            "",
            "---",
            "",
            "AFTER THEY ACCEPT — send as a message, not with the invitation:",
            "",
            drafted.followUp,
            "",
            "---",
            "",
            target.profileUrl ? `Profile: ${target.profileUrl}` : "Profile: not recorded",
          ].join("\n"),
          rationale: [
            `Personalised on: ${target.why}`,
            "",
            "SEND THIS BY HAND. Automating LinkedIn connection requests breaches",
            "their User Agreement, and the account at risk is the one every page",
            "of the site links to — losing it also loses admin of the company page.",
          ].join("\n"),
          status: "DRAFT",
        },
      });

      created += 1;
      ctx.log(`connection note drafted for ${target.name} (${drafted.note.length} chars)`);
    }

    return {
      status: "ok",
      summary: `${created} connection note(s) drafted — send them by hand, a few a day`,
      created,
      detail: {
        remaining: pending.length - batch.length,
        reviewAt: `${company.siteUrl}/admin`,
      },
    };
  },
};
