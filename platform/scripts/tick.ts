/**
 * THE 24/7 LOOP
 *
 *   npm run agents:tick            one pass, then exit  (for cron)
 *   npm run agents:run             stay running, tick forever
 *   npm run agents:status          what is configured and what is missing
 *   npm run agents:tick -- --dry   decide everything, change nothing
 *   npm run agents:tick -- --only=watchdog,followup-runner
 *
 * FOR ACTUAL 24/7
 * ---------------
 * `agents:run` keeps a process alive and is the simplest thing that works.
 * For a machine that reboots, prefer cron calling `agents:tick` every five
 * minutes — a supervised one-shot recovers from a crash on its own, whereas
 * a dead long-running process stays dead until somebody notices.
 *
 *     *""/5 * * * * cd /path/to/platform && npm run agents:tick >> agents.log 2>&1
 *
 * (remove the quotes in the cron line — they are here only to keep this
 * comment from closing early.)
 */

import { loadEnvConfig } from "@next/env";
import type { OpsAgentKey } from "../src/lib/agents/ops/types";

loadEnvConfig(process.cwd());

const args = process.argv.slice(2);
const DRY = args.includes("--dry") || args.includes("--dry-run");
const FORCE = args.includes("--force");
const LOOP = args.includes("--loop");
const STATUS = args.includes("--status");
const onlyArg = args.find((a) => a.startsWith("--only="));

function line(text = "") {
  console.log(text);
}

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const ops = await import("../src/lib/agents/ops");
  const { mailConfig } = await import("../src/lib/mail-provider");
  const { activeProvider } = await import("../src/lib/llm");

  const db = new PrismaClient();

  // ---- status ------------------------------------------------------------
  if (STATUS) {
    const mail = mailConfig();
    const llm = activeProvider();

    line("\n========================================");
    line(" AGENT STATUS");
    line("========================================\n");
    line(`  mail      ${mail.provider}${mail.provider !== "none" ? ` -> ${mail.ownerInbox}` : ""}`);
    line(`  model     ${llm.mode} (${llm.detail})`);
    line(`  autosend  ${ops.autoSendPolicy().note}`);
    line("");
    line("  AGENT                 EVERY      STATUS");
    line("  " + "─".repeat(58));

    for (const agent of ops.OPS_AGENTS) {
      const req = ops.requirementsMet(agent);
      const every =
        agent.intervalSec >= 86_400 ? `${agent.intervalSec / 86_400}d`
        : agent.intervalSec >= 3600 ? `${agent.intervalSec / 3600}h`
        : `${agent.intervalSec / 60}m`;
      const status = req.ok ? "ready" : `needs ${req.missing.join(", ")}`;
      line(`  ${agent.key.padEnd(21)} ${every.padEnd(10)} ${status}`);
    }

    line("");
    for (const agent of ops.OPS_AGENTS) {
      line(`  ${agent.name}`);
      line(`    ${agent.purpose}`);
    }
    line("");
    await db.$disconnect();
    return;
  }

  // ---- one pass ----------------------------------------------------------
  const only = onlyArg
    ? (onlyArg.split("=")[1]!.split(",").map((s) => s.trim()) as OpsAgentKey[])
    : undefined;

  async function once() {
    const started = new Date();
    line(`\n── tick ${started.toISOString()}${DRY ? "  (dry run — nothing will change)" : ""}`);

    const report = await ops.tick({ db, dryRun: DRY, only, force: FORCE, now: started, log: line });

    for (const r of report.ran) {
      const mark = r.result.status === "failed" ? "✗" : r.result.status === "skipped" ? "–" : "✓";
      line(`  ${mark} ${r.key.padEnd(18)} ${r.result.summary}  (${r.ms}ms)`);
      if (r.result.reason) line(`      ${r.result.reason}`);
    }
    for (const s of report.skipped) {
      // "not due" is the normal case and would drown the log.
      if (s.reason !== "not due") line(`  – ${s.key.padEnd(18)} ${s.reason}`);
    }

    const failed = report.ran.filter((r) => r.result.status === "failed").length;
    if (failed) line(`  ${failed} agent(s) failed this tick`);
    return failed;
  }

  if (!LOOP) {
    const failed = await once();
    await db.$disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }

  // ---- forever -----------------------------------------------------------
  line("Running continuously. Ctrl-C to stop.");
  let stopping = false;

  const shutdown = async (signal: string) => {
    if (stopping) return;
    stopping = true;
    line(`\n${signal} — finishing the current tick, then stopping.`);
    await db.$disconnect().catch(() => undefined);
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  // A tick every minute. Each agent's own interval decides whether it
  // actually does anything, so this is cheap.
  while (!stopping) {
    try {
      await once();
    } catch (err) {
      // Never let the loop die. A scheduler that stops on an error is worse
      // than no scheduler, because it looks like it is still working.
      console.error("tick failed:", err instanceof Error ? err.message : err);
    }
    await new Promise((resolve) => setTimeout(resolve, 60_000));
  }
}

void main().catch((err) => {
  console.error("\nagents failed to start:", err instanceof Error ? err.message : err);
  process.exit(1);
});
