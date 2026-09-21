/**
 * The operations plane.
 *
 * The agents in `src/lib/agents/` answer a visitor who is typing. These ones
 * run on a clock with nobody watching: they watch the inbox, draft replies,
 * chase follow-ups, keep the work list current and notice when something has
 * gone wrong.
 *
 * THE RULE IS UNCHANGED
 * ---------------------
 *   Agents propose. Humans dispose. The system executes.
 *
 * Running unattended makes that rule more important, not less. An agent here
 * may read anything, write to internal tables freely, and draft whatever it
 * likes — but anything a customer would see leaves as an Approval row and
 * waits for a person. See `autoSendPolicy()` below for the one narrow
 * exception and why it is safe.
 *
 * DESIGNED TO RUN WITH PIECES MISSING
 * -----------------------------------
 * Most of these need credentials that may not exist yet — an IMAP password, a
 * GitHub token, an LLM endpoint. An agent whose requirements are unmet reports
 * `skipped` with the reason rather than throwing. A half-configured system
 * must still do the parts it can.
 */

import type { PrismaClient } from "@prisma/client";

export type OpsAgentKey =
  | "inbox-watcher"
  | "email-handler"
  | "reply-composer"
  | "followup-runner"
  | "worklist"
  | "linkedin"
  | "github"
  | "watchdog";

export interface OpsContext {
  db: PrismaClient;
  /** Set on a dry run: draft and report, write nothing outward. */
  dryRun: boolean;
  /** Wall clock, injectable so tests are not time-dependent. */
  now: Date;
  log: (message: string) => void;
}

export interface OpsResult {
  status: "ok" | "skipped" | "failed";
  /** One line for the run log. */
  summary: string;
  /** Why it skipped — a missing credential, nothing to do. */
  reason?: string;
  /** Internal records created. */
  created?: number;
  /** Approvals raised for a human. */
  proposed?: number;
  detail?: Record<string, unknown>;
}

export interface OpsAgent {
  key: OpsAgentKey;
  name: string;
  /** What it does, in one sentence, for the run log and the docs. */
  purpose: string;
  /** Desired seconds between runs. The scheduler honours this. */
  intervalSec: number;
  /**
   * Environment variables this agent needs. Listed rather than checked ad hoc
   * so `npm run agents:status` can tell you what is missing before you wait
   * for a scheduled run to tell you.
   */
  requires: string[];
  run: (ctx: OpsContext) => Promise<OpsResult>;
}

/** True when every requirement of this agent is present. */
export function requirementsMet(agent: OpsAgent): { ok: boolean; missing: string[] } {
  const missing = agent.requires.filter((key) => !process.env[key]?.trim());
  return { ok: missing.length === 0, missing };
}

// ---------------------------------------------------------------------------
//  Auto-send policy
// ---------------------------------------------------------------------------

/**
 * Whether a drafted message may go out without a person reading it.
 *
 * The default is **no**, for everything an agent composes. That is a
 * deliberate choice and worth stating plainly, because it is the one place
 * this system is less autonomous than it could be:
 *
 *  • CASL s.13 puts the burden of proving a message was lawful on the sender.
 *    "Our software wrote it" is not a defence, and the ceiling is $10,000,000.
 *  • A model that drafts a price, a date or a commitment can be wrong in ways
 *    that are expensive and hard to walk back once sent.
 *  • The firm's whole pitch is that a named human is accountable. An
 *    unreviewed machine reply contradicts that on first contact.
 *
 * The exception is the fixed transactional acknowledgement sent the moment
 * somebody submits the form. That text is written by us, reviewed once, tested
 * in `email-template-test.ts`, and identical every time — so there is nothing
 * for a human to review that has not already been reviewed.
 *
 * Setting AGENT_AUTOSEND=all removes the gate. It is honoured because it is
 * the operator's business and their risk, and it is logged loudly every time
 * it is used so the decision stays visible rather than becoming a forgotten
 * default.
 */
export function autoSendPolicy(): { composed: boolean; templated: boolean; note: string } {
  const setting = process.env.AGENT_AUTOSEND?.trim().toLowerCase();

  if (setting === "all") {
    return {
      composed: true,
      templated: true,
      note: "AGENT_AUTOSEND=all — composed replies are sent WITHOUT human review.",
    };
  }
  return {
    composed: false,
    templated: true,
    note: "Composed replies are drafted for approval; fixed acknowledgements send automatically.",
  };
}
