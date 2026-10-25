/**
 * PRESENCE CHECK — the promote agent's checks, without a database
 *
 * The same checks the scheduled `promote` agent runs, callable with nothing
 * provisioned. That matters for where this runs: a laptop is not 24/7. It
 * sleeps, and a monitor that only notices an outage once somebody opens the
 * lid is not a monitor. This entry point exists so the check can run hourly in
 * CI instead, where it costs nothing and never sleeps.
 *
 *   npm run presence:check
 *
 * Always checks the real public site, deliberately — a monitor pointed at
 * localhost tells you the thing that cannot be down is up.
 *
 * Exits non-zero on a critical finding, so a scheduled job fails loudly rather
 * than writing to a log nobody opens.
 */

import { checkSite, checkQueue, nextAction } from "../src/lib/agents/ops/promote";
import { company } from "../src/lib/company";

async function main() {
  const base = company.siteUrl.replace(/\/$/, "");

  const site = await checkSite(base);
  const queue = checkQueue(new Date());
  const findings = [...site, ...queue];

  const critical = findings.filter((f) => f.severity === "critical");
  const warning = findings.filter((f) => f.severity === "warning");
  const note = findings.filter((f) => f.severity === "note");

  console.log(`\n${"=".repeat(62)}`);
  console.log(` PUBLIC PRESENCE — ${base}`);
  console.log("=".repeat(62));

  if (!findings.length) console.log("\n  Everything checked is healthy.");
  for (const f of critical) console.log(`\n  CRITICAL  ${f.text}`);
  for (const f of warning) console.log(`  warning   ${f.text}`);
  for (const f of note) console.log(`  note      ${f.text}`);

  console.log(`\n  Next: ${nextAction(site, queue)}\n`);
  console.log("=".repeat(62));
  console.log(` ${critical.length} critical, ${warning.length} warning, ${note.length} note`);
  console.log("=".repeat(62));

  process.exit(critical.length ? 1 : 0);
}

void main();
