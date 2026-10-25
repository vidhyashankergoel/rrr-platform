/**
 * PROMOTE — the agent that watches the firm's public presence
 *
 * The other operations agents react to things that arrive: an email, an
 * enquiry, a booking. Nothing was watching the side of the business that has
 * no inbox — the site, the draft queue, the published work. A new consultancy
 * does not fail because it answered an enquiry slowly. It fails because no
 * enquiry ever arrives, and nothing was designed to notice that.
 *
 * So this one runs on the clock and asks the questions a person would ask if
 * they remembered to:
 *
 *   1. Is the site up, and still saying what we think it says?
 *   2. Is anything queued to post, or has the pipeline run dry?
 *   3. What is the single best promotional thing to do next?
 *
 * WHAT IT DOES NOT DO
 * -------------------
 * It publishes nothing, messages nobody, and changes no page. Every output is
 * a note for a person, in the same approval queue everything else lands in.
 *
 * That is not timidity. The actions this agent would otherwise take — posting,
 * connecting, emailing — are exactly the ones governed by a platform's terms
 * or by CASL, and an unattended loop is the worst possible place to get either
 * wrong. See `rules/outbound-marketing.md`.
 *
 * It also needs no credentials: everything below is a public GET against our
 * own site plus files already in the repository. An agent that only runs once
 * somebody provisions a token is an agent that never runs.
 */

import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { company } from "../../company";
import type { OpsAgent, OpsContext, OpsResult } from "./types";

/** Pages whose breakage costs enquiries, not just tidiness. */
const CRITICAL_PAGES = ["/", "/audit", "/services", "/pricing", "/contact"];

/** Generated routes that quietly stop existing after a bad deploy. */
const GENERATED = ["/robots.txt", "/sitemap.xml", "/og.png"];

const QUEUE = "marketing/queue";

/** A draft older than this is going stale. */
const STALE_DRAFT_DAYS = 21;

/** Below this many queued drafts, the pipeline is running dry. */
const THIN_QUEUE = 2;

export interface Finding {
  severity: "critical" | "warning" | "note";
  text: string;
}

async function probe(url: string, timeoutMs = 10_000) {
  const started = Date.now();
  try {
    const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(timeoutMs) });
    return { status: res.status, ms: Date.now() - started };
  } catch {
    return { status: 0, ms: Date.now() - started };
  }
}

/** The site, as a stranger reaching it would find it. */
export async function checkSite(base: string): Promise<Finding[]> {
  const found: Finding[] = [];

  for (const path of CRITICAL_PAGES) {
    const { status, ms } = await probe(base + path);
    if (status !== 200) {
      found.push({
        severity: "critical",
        text: `${path} returned ${status || "no response"} — a page buyers reach from search is down`,
      });
    } else if (ms > 3_000) {
      found.push({ severity: "warning", text: `${path} took ${(ms / 1000).toFixed(1)}s` });
    }
  }

  for (const path of GENERATED) {
    const { status } = await probe(base + path);
    if (status !== 200) {
      found.push({
        severity: "critical",
        text: `${path} returned ${status || "no response"} — generated routes vanish silently on a bad deploy, and this one carries our search presence`,
      });
    }
  }

  // Both of these break invisibly: nothing on the page changes, and the cost
  // shows up weeks later as flat traffic and an unverified property.
  try {
    const res = await fetch(base + "/", { signal: AbortSignal.timeout(10_000) });
    const html = await res.text();

    if (!html.includes('property="og:image"')) {
      found.push({
        severity: "critical",
        text: "no og:image on the homepage — every share renders a blank grey card",
      });
    }
    if (!html.includes('name="google-site-verification"')) {
      found.push({
        severity: "critical",
        text: "the Search Console tag is gone — the property will silently unverify and take the search data with it",
      });
    }
    if (!/rel="canonical"/.test(html)) {
      found.push({ severity: "warning", text: "no canonical on the homepage" });
    }
  } catch {
    found.push({ severity: "critical", text: "could not read the homepage at all" });
  }

  // The apex must keep redirecting, or both hostnames compete again.
  const apex = base.replace("://www.", "://");
  if (apex !== base) {
    const { status } = await probe(apex + "/");
    if (status !== 301 && status !== 308) {
      found.push({
        severity: "warning",
        text: `the apex returned ${status || "no response"} instead of a redirect — both hostnames may be serving the site again`,
      });
    }
  }

  return found;
}

/** Is there anything to post, and is any of it going stale? */
export function checkQueue(now: Date): Finding[] {
  const found: Finding[] = [];

  if (!existsSync(QUEUE)) {
    return [{ severity: "warning", text: "no draft queue — run `npm run marketing:plan`" }];
  }

  const drafts = readdirSync(QUEUE).filter((f) => f.endsWith(".md"));
  if (drafts.length === 0) {
    return [{ severity: "warning", text: "the draft queue is empty — nothing is scheduled to go out" }];
  }

  if (drafts.length < THIN_QUEUE) {
    found.push({ severity: "note", text: `only ${drafts.length} draft(s) queued — the pipeline is running dry` });
  }

  // A draft dated in the past was never posted. Saying so is the point: the
  // failure mode of a review queue is that nobody reviews it.
  const overdue: string[] = [];
  const stale: string[] = [];

  for (const file of drafts) {
    const date = /^date:\s*(\S+)$/m.exec(readFileSync(join(QUEUE, file), "utf8"))?.[1];
    if (!date) continue;
    const ageDays = Math.floor((now.getTime() - new Date(`${date}T00:00:00Z`).getTime()) / 86_400_000);
    if (ageDays > STALE_DRAFT_DAYS) stale.push(`${date} (${ageDays}d)`);
    else if (ageDays > 0) overdue.push(date);
  }

  if (overdue.length) {
    found.push({
      severity: "note",
      text: `${overdue.length} draft(s) past their posting date, still unposted: ${overdue.slice(0, 3).join(", ")}`,
    });
  }
  if (stale.length) {
    found.push({
      severity: "warning",
      text: `${stale.length} draft(s) over ${STALE_DRAFT_DAYS} days old — rewrite or drop: ${stale.slice(0, 3).join(", ")}`,
    });
  }

  return found;
}

/**
 * The next best promotional action.
 *
 * Deliberately one thing. A list of twelve suggestions is a list nobody acts
 * on, and the ordering is the opinion: fix what is broken, then publish what
 * is already written, then go and earn distribution.
 */
export function nextAction(site: Finding[], queue: Finding[]): string {
  const broken = site.find((f) => f.severity === "critical");
  if (broken) return `Fix this first — ${broken.text}`;

  if (queue.some((f) => f.text.includes("past their posting date"))) {
    return "Post the drafts already written and approved. They cost nothing now.";
  }
  if (queue.some((f) => f.text.includes("running dry") || f.text.includes("queue is empty"))) {
    return "Run `npm run marketing:plan` — there is nothing queued to publish.";
  }
  return "Invite connections to follow the page (page admin, Invite connections) — the largest free lever at a low follower count, one click per person.";
}

export const promoteAgent: OpsAgent = {
  key: "promote",
  name: "Promote",
  purpose:
    "Watches the public side of the business — the site, the draft queue — and says what to do next. Publishes nothing.",
  // Hourly. The site going down matters within the hour; nothing else here
  // changes faster, and a tighter loop would only add noise.
  intervalSec: 3_600,
  requires: [],

  async run(ctx: OpsContext): Promise<OpsResult> {
    const base = company.siteUrl.replace(/\/$/, "");

    const site = await checkSite(base);
    const queue = checkQueue(ctx.now);
    const findings = [...site, ...queue];

    const critical = findings.filter((f) => f.severity === "critical");
    const warning = findings.filter((f) => f.severity === "warning");

    for (const f of findings) ctx.log(`[${f.severity}] ${f.text}`);
    const action = nextAction(site, queue);
    ctx.log(`next: ${action}`);

    // Findings go out through the run log and the result, the same way the
    // watchdog escalates. Deliberately not an Approval row: ApprovalKind is a
    // closed Prisma enum about customer-facing decisions, and widening it for
    // "the site is down" would need a production migration to say something
    // the log already says.
    //
    // And the agent did its job even when the news is bad — reporting a broken
    // site is success, not failure. Returning "failed" here would make the
    // tick blame the messenger, and a loop that marks itself failed every hour
    // is a loop people stop reading.

    return {
      status: "ok",
      summary: critical.length
        ? `${critical.length} critical, ${warning.length} warning(s) — ${action}`
        : warning.length
          ? `${warning.length} warning(s) — ${action}`
          : `presence healthy — ${action}`,
      detail: {
        critical: critical.map((f) => f.text),
        warning: warning.map((f) => f.text),
        nextAction: action,
      },
    };
  },
};
