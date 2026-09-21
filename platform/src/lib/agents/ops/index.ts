/**
 * The operations roster, and the loop that runs it.
 *
 * Each agent declares how often it wants to run. The scheduler calls the ones
 * that are due, records every run, and never lets one agent's failure stop
 * the others — a broken GitHub token must not stop the follow-ups going out.
 */

import type { PrismaClient } from "@prisma/client";
import type { OpsAgent, OpsAgentKey, OpsContext, OpsResult } from "./types";
import { requirementsMet, autoSendPolicy } from "./types";

import { inboxWatcher } from "./inbox-watcher";
import { emailHandler } from "./email-handler";
import { replyComposer } from "./reply-composer";
import { followupRunner } from "./followup";
import { worklist } from "./worklist";
import { linkedinAgent, githubAgent } from "./presence";
import { watchdog } from "./watchdog";

/**
 * Order matters on a single tick: the watcher fills the queue the handler
 * drains, and the watchdog runs last so it sees the state the others left.
 */
export const OPS_AGENTS: OpsAgent[] = [
  inboxWatcher,
  emailHandler,
  replyComposer,
  followupRunner,
  worklist,
  linkedinAgent,
  githubAgent,
  watchdog,
];

export const OPS_BY_KEY = new Map<OpsAgentKey, OpsAgent>(OPS_AGENTS.map((a) => [a.key, a]));

export interface TickOptions {
  db: PrismaClient;
  dryRun?: boolean;
  /** Run these regardless of their schedule. */
  only?: OpsAgentKey[];
  /** Ignore the interval and run everything due or not. */
  force?: boolean;
  now?: Date;
  log?: (line: string) => void;
}

export interface TickReport {
  ran: { key: string; name: string; result: OpsResult; ms: number }[];
  skipped: { key: string; reason: string }[];
}

/** Has enough time passed since this agent last completed? */
async function isDue(db: PrismaClient, agent: OpsAgent, now: Date): Promise<boolean> {
  const last = await db.agentRun.findFirst({
    where: { agentKey: agent.key, trigger: "schedule" },
    orderBy: { createdAt: "desc" },
  });
  if (!last) return true;
  return now.getTime() - last.createdAt.getTime() >= agent.intervalSec * 1000;
}

/**
 * One pass over the roster.
 *
 * Every agent is wrapped: a throw becomes a FAILED AgentRun and the loop
 * continues. Unattended software that stops on the first error is unattended
 * software that stops.
 */
export async function tick(options: TickOptions): Promise<TickReport> {
  const { db, dryRun = false, only, force = false } = options;
  const now = options.now ?? new Date();
  const log = options.log ?? (() => undefined);

  const report: TickReport = { ran: [], skipped: [] };
  const roster = only ? OPS_AGENTS.filter((a) => only.includes(a.key)) : OPS_AGENTS;

  for (const agent of roster) {
    const requirements = requirementsMet(agent);
    if (!requirements.ok) {
      report.skipped.push({
        key: agent.key,
        reason: `needs ${requirements.missing.join(", ")}`,
      });
      continue;
    }

    if (!force && !only && !(await isDue(db, agent, now))) {
      report.skipped.push({ key: agent.key, reason: "not due" });
      continue;
    }

    const started = Date.now();
    const ctx: OpsContext = { db, dryRun, now, log: (m) => log(`  [${agent.key}] ${m}`) };

    let result: OpsResult;
    try {
      result = await agent.run(ctx);
    } catch (err) {
      result = {
        status: "failed",
        summary: "threw an exception",
        reason: err instanceof Error ? `${err.message}\n${err.stack ?? ""}`.slice(0, 900) : String(err),
      };
    }

    const ms = Date.now() - started;

    if (!dryRun) {
      await db.agentRun
        .create({
          data: {
            agentKey: agent.key,
            trigger: "schedule",
            status: result.status === "failed" ? "FAILED" : "SUCCEEDED",
            inputJson: JSON.stringify({ dryRun, forced: force }),
            outputJson: JSON.stringify(result).slice(0, 4000),
            error: result.status === "failed" ? (result.reason ?? "unknown") : null,
            latencyMs: ms,
          },
        })
        .catch(() => undefined);
    }

    report.ran.push({ key: agent.key, name: agent.name, result, ms });
  }

  return report;
}

export { requirementsMet, autoSendPolicy };
export type { OpsAgent, OpsAgentKey, OpsContext, OpsResult };
