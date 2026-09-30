/**
 * Separate the local and production database URLs.
 *
 *   npm run db:split-urls
 *
 * WHY
 * ---
 * `neon link` pulls the production connection string into `.env.local` as
 * DATABASE_URL. That is correct for the deployed site but wrong for this
 * machine: the Prisma client generated here is built from the SQLite schema,
 * and a client built for one provider cannot talk to another. Local
 * development and every test suite stop working, with an error that blames
 * the schema rather than the URL.
 *
 * So the two are given separate names:
 *
 *   DATABASE_URL             file:./dev.db     local development and tests
 *   PRODUCTION_DATABASE_URL  postgres://...    `npm run db:production`
 *
 * Production itself is unaffected — Vercel holds its own DATABASE_URL, set
 * directly on the project, and never reads this file.
 *
 * Safe to re-run: it only moves a Postgres URL out of DATABASE_URL, and does
 * nothing if that has already happened.
 */

import { readFileSync, writeFileSync, copyFileSync, chmodSync } from "node:fs";

const FILE = ".env.local";

const original = readFileSync(FILE, "utf8");
const lines = original.split("\n");

/**
 * The LAST assignment wins, which is how dotenv resolves a duplicated key.
 *
 * `neon link` appends rather than replaces, so after linking there are two
 * DATABASE_URL lines: the original SQLite one and the Postgres one below it.
 * Reading the first would see `file:./dev.db`, conclude there was nothing to
 * do, and leave the app pointed at Postgres with a SQLite client — the exact
 * breakage this script exists to prevent.
 */
const valueOf = (key: string) => {
  const matches = lines.filter((l) => l.trim().startsWith(`${key}=`));
  const last = matches[matches.length - 1];
  return last ? last.trim().slice(key.length + 1).trim().replace(/^["']|["']$/g, "") : "";
};

const current = valueOf("DATABASE_URL");

if (!current.startsWith("postgres")) {
  console.log("  DATABASE_URL already points at a local file — nothing to do.");
  process.exit(0);
}

// Keep a copy before rewriting a file that holds live credentials.
copyFileSync(FILE, `${FILE}.backup`);
chmodSync(`${FILE}.backup`, 0o600);

const out: string[] = [];
let movedProduction = false;

for (const line of lines) {
  if (line.startsWith("DATABASE_URL=")) {
    if (!movedProduction) {
      out.push("# The deployed site uses its own DATABASE_URL, set on Vercel.");
      out.push("# This one is for local development and the test suites, which run");
      out.push("# against SQLite — the Prisma client here is generated from the SQLite");
      out.push("# schema and cannot speak to Postgres.");
      out.push("DATABASE_URL=file:./dev.db");
      out.push("");
      out.push("# Used by `npm run db:production` to reach the real database.");
      out.push(`PRODUCTION_DATABASE_URL=${current}`);
      movedProduction = true;
    }
    continue;
  }
  // Drop any previous copy so re-running cannot duplicate it.
  if (line.startsWith("PRODUCTION_DATABASE_URL=")) continue;
  out.push(line);
}

writeFileSync(FILE, out.join("\n"), { mode: 0o600 });
chmodSync(FILE, 0o600);

console.log("  DATABASE_URL            -> file:./dev.db      (local dev and tests)");
console.log("  PRODUCTION_DATABASE_URL -> the Neon database  (npm run db:production)");
console.log(`  previous file kept at ${FILE}.backup`);
