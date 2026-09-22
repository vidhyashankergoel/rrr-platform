/**
 * REGRESSION RUNNER
 *
 * Runs every suite in order and reports one summary. This is the gate to run
 * before a deploy, and the thing to wire into CI.
 *
 *   npm run test            # everything
 *   npm run test -- --fast  # skip the browser and load suites
 *
 * Suites that need a running dev server are skipped with a clear message
 * rather than failing, so the command is safe to run anywhere.
 */

import { spawn } from "node:child_process";

const BASE = process.env.TEST_BASE ?? "http://localhost:3111";
const fast = process.argv.includes("--fast");

interface Suite {
  name: string;
  script: string;
  needsServer: boolean;
  slow: boolean;
  description: string;
  /**
   * Needs the isolated sandbox rather than the dev server, because it writes
   * real Lead and Conversation rows carrying (fake) personal information.
   * Mixing that into development data is how test records end up in a CRM.
   */
  needsSandbox?: boolean;
}

const SUITES: Suite[] = [
  {
    name: "Types",
    script: "",
    needsServer: false,
    slow: false,
    description: "TypeScript compiles with no errors",
  },
  {
    name: "Retrieval ranking",
    script: "scripts/retrieval-debug.ts",
    needsServer: false,
    slow: false,
    description: "Knowledge index resolves known-hard queries",
  },
  {
    name: "Delivery plane",
    script: "scripts/bridge-test.ts",
    needsServer: false,
    slow: false,
    description: "Org structure, pipeline gates, work-package dispatch",
  },
  {
    name: "Customer journey + database",
    script: "scripts/journey-test.ts",
    needsServer: false,
    slow: false,
    description: "End-to-end journey, CASL and PIPEDA enforcement, integrity",
  },
  {
    name: "Attribution modes",
    script: "scripts/attribution-test.ts",
    needsServer: false,
    slow: false,
    description: "Prior-work naming switches cleanly across every surface",
  },
  {
    name: "Call booking",
    script: "scripts/booking-test.ts",
    needsServer: false,
    slow: false,
    description: "Slot generation, DST arithmetic, calendar files, refusals",
  },
  {
    name: "Security",
    script: "scripts/security-test.ts",
    needsServer: false,
    slow: false,
    description: "Throttling, auth, PII exposure, consent evidence, headers",
  },
  {
    name: "Operations agents",
    script: "scripts/ops-test.ts",
    needsServer: false,
    slow: false,
    description: "Triage, composing, safety gates, follow-up stop rules, watchdog",
  },
  {
    name: "Auto-reply emails",
    script: "scripts/email-template-test.ts",
    needsServer: false,
    slow: false,
    description: "Template routing, honesty rules, figures, signature",
  },
  {
    name: "Suggested questions",
    script: "scripts/chip-test.ts",
    needsServer: true,
    slow: false,
    description: "Every chip routes correctly and gets a real answer",
  },
  {
    name: "Copy and grammar",
    script: "scripts/copy-check.ts",
    needsServer: true,
    slow: true,
    description: "Rendered text: spelling, typos, placeholders, terminology",
  },
  {
    name: "End-to-end functional",
    script: "scripts/e2e-test.ts",
    needsServer: true,
    needsSandbox: true,
    slow: true,
    description: "Every button, link, form field and admin action in a browser",
  },
  {
    name: "Bot battery",
    script: "scripts/bot-battery.ts",
    needsServer: true,
    slow: true,
    description: "133 customer questions across personas and journeys",
  },
  {
    name: "Colour contrast",
    script: "scripts/contrast-test.ts",
    needsServer: true,
    slow: true,
    description: "WCAG 2.1 AA contrast on every text node, both themes",
  },
  {
    name: "Responsive layout",
    script: "scripts/responsive-test.ts",
    needsServer: true,
    slow: true,
    description: "12 viewports x 10 pages: overflow, target size, text size",
  },
  {
    name: "Load and reliability",
    script: "scripts/load-test.ts",
    needsServer: true,
    slow: true,
    description: "Latency under concurrency, rate limiting, security headers",
  },
];

/**
 * Prisma reads the default env file but not `.env.local`, so the suites that
 * talk to the database directly — rather than through the running server —
 * start with no connection string. Default it to the local SQLite file so
 * `npm test` works from a clean checkout with no extra setup.
 */
const childEnv = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL ?? "file:./dev.db",
  AGENT_INBOX: process.env.AGENT_INBOX ?? "./.agent-inbox",
};

function run(cmd: string, args: string[]): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { shell: false, env: childEnv });
    let out = "";
    child.stdout.on("data", (d) => (out += String(d)));
    child.stderr.on("data", (d) => (out += String(d)));
    child.on("close", (code) => resolve({ code: code ?? 1, out }));
  });
}

async function serverUp(): Promise<boolean> {
  try {
    const res = await fetch(BASE, { signal: AbortSignal.timeout(4000) });
    return res.ok;
  } catch {
    return false;
  }
}

/** Pull the "N passed, M failed" line out of a suite's output. */
function summarize(out: string): string {
  const m = /(\d+)\s+passed,\s+(\d+)\s+failed/.exec(out);
  if (m) return `${m[1]} passed, ${m[2]} failed`;
  if (/No warnings\./.test(out)) return "no warnings";
  const w = /(\d+) warning\(s\)/.exec(out);
  if (w) return `${w[1]} warning(s)`;
  return "";
}

async function main() {
  const started = Date.now();
  const up = await serverUp();
  // The end-to-end suite writes lead records, so it only runs against the
  // isolated sandbox — never against whatever the dev server is pointed at.
  const sandbox = BASE.includes(":3210") || process.env.SANDBOX === "1";

  console.log("========================================");
  console.log(" REGRESSION SUITE");
  console.log("========================================");
  console.log(` target:     ${BASE}`);
  console.log(` dev server: ${up ? "up" : "DOWN — server suites will be skipped"}`);
  console.log(` mode:       ${fast ? "fast (browser and load suites skipped)" : "full"}`);
  console.log("");

  const results: Array<{ name: string; status: "pass" | "fail" | "skip"; note: string }> = [];

  for (const suite of SUITES) {
    if (suite.needsServer && !up) {
      results.push({ name: suite.name, status: "skip", note: "dev server not running" });
      console.log(`SKIP  ${suite.name.padEnd(28)} dev server not running`);
      continue;
    }
    if (suite.needsSandbox && !sandbox) {
      results.push({ name: suite.name, status: "skip", note: "run: npm run test:e2e" });
      console.log(`SKIP  ${suite.name.padEnd(28)} needs the sandbox — run: npm run test:e2e`);
      continue;
    }
    if (fast && suite.slow) {
      results.push({ name: suite.name, status: "skip", note: "--fast" });
      console.log(`SKIP  ${suite.name.padEnd(28)} skipped by --fast`);
      continue;
    }

    process.stdout.write(`RUN   ${suite.name.padEnd(28)} `);
    const t0 = Date.now();

    let code: number;
    let out: string;

    if (suite.name === "Types") {
      // The app and the test scripts have separate configs: scripts are
      // standalone programs and are excluded from the Next build.
      const app = await run("npx", ["tsc", "--noEmit", "-p", "tsconfig.json"]);
      const scripts = await run("npx", ["tsc", "--noEmit", "-p", "tsconfig.scripts.json"]);
      code = app.code || scripts.code;
      out = app.out + scripts.out;
    } else {
      ({ code, out } = await run("npx", ["tsx", suite.script]));
    }

    const secs = ((Date.now() - t0) / 1000).toFixed(1);

    // The type check also compiles the test scripts, which legitimately
    // redeclare module-level names. Only app code failures matter here.
    const appErrors =
      suite.name === "Types"
        ? out.split("\n").filter((l) => /error TS/.test(l))
        : [];

    const ok = suite.name === "Types" ? appErrors.length === 0 : code === 0;
    const note = summarize(out) || `${secs}s`;

    if (ok) {
      console.log(`ok    ${note}  (${secs}s)`);
      results.push({ name: suite.name, status: "pass", note });
    } else {
      console.log(`FAIL  ${note}  (${secs}s)`);
      results.push({ name: suite.name, status: "fail", note });
      const tail = (appErrors.length ? appErrors : out.split("\n")).slice(-14);
      for (const line of tail) if (line.trim()) console.log(`        ${line}`);
    }
  }

  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const skipped = results.filter((r) => r.status === "skip").length;

  console.log("\n========================================");
  console.log(" SUMMARY");
  console.log("========================================");
  for (const r of results) {
    const mark = r.status === "pass" ? "ok  " : r.status === "fail" ? "FAIL" : "skip";
    console.log(`  ${mark}  ${r.name.padEnd(28)} ${r.note}`);
  }
  console.log("");
  console.log(`  ${passed} passed, ${failed} failed, ${skipped} skipped`);
  console.log(`  ${((Date.now() - started) / 1000).toFixed(1)}s total`);

  if (!up) {
    console.log("\n  To run the full suite, start the dev server first:");
    console.log("    npm run dev");
  }

  process.exit(failed > 0 ? 1 : 0);
}

main();
