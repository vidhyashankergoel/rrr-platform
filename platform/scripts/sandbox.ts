/**
 * SANDBOX
 *
 * Spins up a fully isolated instance: its own SQLite database, its own port,
 * its own agent inbox. Nothing it writes touches your development data, so
 * destructive end-to-end tests can run freely.
 *
 *   npx tsx scripts/sandbox.ts            # start, leave running
 *   npx tsx scripts/sandbox.ts --e2e      # start, run the E2E suite, stop
 *   npx tsx scripts/sandbox.ts --reset    # wipe the sandbox database first
 *
 * Why a separate database matters: the E2E suite submits real enquiry forms
 * and drives real chat conversations. Those become Lead and Conversation rows
 * carrying (fake) personal information. Mixing that into the database you will
 * eventually point at production is how test data ends up in a real CRM.
 */

import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { existsSync, rmSync, mkdirSync } from "node:fs";
import path from "node:path";

const PORT = Number(process.env.SANDBOX_PORT ?? 3210);
const BASE = `http://localhost:${PORT}`;
const DB_FILE = path.resolve("prisma/sandbox.db");
const DB_URL = `file:${DB_FILE}`;
const INBOX = path.resolve(".sandbox-inbox");
const VAULT = path.resolve(".sandbox-vault");

const reset = process.argv.includes("--reset");
const e2e = process.argv.includes("--e2e");

const env = {
  ...process.env,
  NODE_ENV: "development",
  DATABASE_URL: DB_URL,
  NEXT_PUBLIC_SITE_URL: BASE,
  ADMIN_TOKEN: "sandboxsandboxsandboxsandbox0001",
  AGENT_INBOX: INBOX,
  OBSIDIAN_VAULT: VAULT,
  // No outbound anything from a sandbox, ever.
  RESEND_API_KEY: "",
  LLM_BASE_URL: "",
};

function sh(cmd: string, args: string[]) {
  const r = spawnSync(cmd, args, { env, stdio: "inherit" });
  if (r.status !== 0) {
    console.error(`\nFailed: ${cmd} ${args.join(" ")}`);
    process.exit(1);
  }
}

async function waitFor(url: string, timeoutMs = 90_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  return false;
}

async function main() {
  console.log("========================================");
  console.log(" SANDBOX");
  console.log("========================================");
  console.log(` port:     ${PORT}`);
  console.log(` database: ${DB_FILE}`);
  console.log(` inbox:    ${INBOX}`);
  console.log(` outbound: disabled (no mail provider, no model gateway)`);
  console.log("");

  if (reset) {
    for (const f of [DB_FILE, `${DB_FILE}-journal`]) {
      if (existsSync(f)) {
        rmSync(f);
        console.log(`  removed ${path.basename(f)}`);
      }
    }
    for (const d of [INBOX, VAULT]) {
      if (existsSync(d)) {
        rmSync(d, { recursive: true, force: true });
        console.log(`  removed ${path.basename(d)}/`);
      }
    }
  }

  mkdirSync(INBOX, { recursive: true });
  mkdirSync(VAULT, { recursive: true });

  console.log("\n-> creating the sandbox schema");
  sh("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"]);

  console.log(`\n-> starting the server on ${PORT}`);
  const server: ChildProcess = spawn("npx", ["next", "dev", "-p", String(PORT)], {
    env,
    stdio: e2e ? "ignore" : "inherit",
  });

  const shutdown = () => {
    if (!server.killed) server.kill("SIGTERM");
  };
  process.on("SIGINT", () => {
    shutdown();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    shutdown();
    process.exit(143);
  });

  const up = await waitFor(BASE);
  if (!up) {
    console.error("\nThe sandbox server did not come up in time.");
    shutdown();
    process.exit(1);
  }
  console.log(`\n   sandbox ready at ${BASE}`);
  console.log(`   admin token: ${env.ADMIN_TOKEN}`);

  if (!e2e) {
    console.log("\n   Leave this running. Ctrl-C to stop.\n");
    return;
  }

  console.log("\n-> running the end-to-end suite against the sandbox\n");
  const r = spawnSync("npx", ["tsx", "scripts/e2e-test.ts"], {
    env: { ...env, TEST_BASE: BASE },
    stdio: "inherit",
  });

  shutdown();
  process.exit(r.status ?? 1);
}

main();
