/**
 * THE LINE
 *
 * Runs the team in order and produces finished posts, or an explanation of
 * why there are none. Three a week, which is the cadence the firm asked for
 * and also about the most a two-person company can sustain without the
 * quality visibly sagging by week six.
 *
 * WHY POSTS ARE QUEUED AND NOT SENT
 * ---------------------------------
 * Nothing here publishes. The output is a queue a person reads. That is the
 * same rule the operations agents run under, and it matters more here, not
 * less: an operations agent that gets something wrong sends one person a bad
 * email, whereas this one would put it in front of the entire audience the
 * firm is trying to earn.
 *
 * See `publish.ts` for the one compliant route to actually posting, and why
 * it is switched off.
 */

import { TEAM, strategist, writer, editor, designer, officer, reviewer, type Draft, type Slot } from "./team";

export interface Finished {
  date: string;
  angleId: string;
  pillar: string;
  /** Exactly what gets pasted or posted, hashtags and link included. */
  text: string;
  hashtags: string[];
  link: string;
  alt?: string;
  svg?: string;
  imageName?: string;
  trail: string[];
}

export interface Rejected {
  date: string;
  angleId?: string;
  /** Which agent stopped it. */
  stage: string;
  reasons: string[];
}

export interface Run {
  made: Finished[];
  rejected: Rejected[];
}

/**
 * Posting days. Tuesday, Wednesday and Thursday — the midweek window where
 * professional-audience engagement is consistently strongest, and Monday and
 * Friday are where posts go to be ignored.
 */
const POST_DAYS = [2, 3, 4];

/** The next `count` posting days on or after `from`, as ISO dates. */
export function upcomingSlots(from: Date, count = 3): string[] {
  const dates: string[] = [];
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));

  // 28 days is four weeks; if three posting days have not appeared by then,
  // something is wrong with POST_DAYS rather than with the calendar.
  for (let i = 0; i < 28 && dates.length < count; i += 1) {
    if (POST_DAYS.includes(cursor.getUTCDay())) {
      dates.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

/** Run one slot through every agent. Any refusal stops the line. */
export function composeOne(slot: Slot): { finished?: Finished; rejected?: Rejected } {
  const picked = strategist.run(slot);
  if (!picked.verdict.ok || !picked.output) {
    return { rejected: { date: slot.date, stage: strategist.role, reasons: picked.verdict.reasons } };
  }

  let draft: Draft = picked.output;

  for (const agent of [writer, editor, designer, officer, reviewer]) {
    const step = agent.run(draft);
    if (!step.verdict.ok || !step.output) {
      return {
        rejected: {
          date: slot.date,
          angleId: draft.angle.id,
          stage: agent.role,
          reasons: step.verdict.reasons,
        },
      };
    }
    draft = step.output;
  }

  const text = [draft.body, "", draft.link, "", draft.hashtags.join(" ")].join("\n");

  return {
    finished: {
      date: slot.date,
      angleId: draft.angle.id,
      pillar: draft.pillar,
      text,
      hashtags: draft.hashtags,
      link: draft.link,
      alt: draft.visual?.alt,
      svg: draft.visual?.svg,
      imageName: draft.visual ? `${draft.slot.date}-${draft.angle.id}.svg` : undefined,
      trail: draft.trail,
    },
  };
}

/**
 * Plan a run. `alreadyUsed` carries the angle ids published before now, so
 * the strategist does not repeat itself across invocations — the scheduler
 * reads them from the queue on disk and passes them in.
 */
export function plan(from: Date, alreadyUsed: string[], count = 3): Run {
  const made: Finished[] = [];
  const rejected: Rejected[] = [];
  const used = [...alreadyUsed];

  for (const date of upcomingSlots(from, count)) {
    const { finished, rejected: no } = composeOne({ date, used });
    if (finished) {
      made.push(finished);
      used.push(finished.angleId);
    } else if (no) {
      rejected.push(no);
    }
  }

  return { made, rejected };
}

/** For `marketing:team` — the roster, so the charters are visible. */
export const roster = () =>
  TEAM.map((a) => ({ role: a.role, name: a.name, charter: a.charter }));
