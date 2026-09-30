/**
 * Run a Prisma command against the PRODUCTION (Postgres) database.
 *
 *   npm run db:production -- db push      create/update the tables
 *   npm run db:production -- migrate status
 *   npm run db:production -- studio       browse the data
 *
 * WHY THIS EXISTS
 * ---------------
 * Next.js reads `.env.local`; the Prisma CLI only auto-loads `.env`. So
 * `prisma db push` cannot see a DATABASE_URL that works perfectly well in the
 * application, and fails with "Environment variable not found" — which reads
 * like the variable is missing rather than merely invisible to that one tool.
 *
 * The obvious workaround is to paste the connection string onto the command
 * line. That puts a database password into shell history and into any
 * terminal recording. This loads it the way the app does and hands it to the
 * child process through its environment instead, where it is not logged.
 *
 * It also forces the production schema, so a Postgres command can never be
 * run against the SQLite schema by accident.
 */

import { loadEnvConfig } from "@next/env";
import { spawnSync } from "node:child_process";

loadEnvConfig(process.cwd());

const SCHEMA = "prisma/schema.production.prisma";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("\nUsage: npm run db:production -- <prisma command>");
  console.error("  e.g. npm run db:production -- db push\n");
  process.exit(1);
}

// Prefer the dedicated production URL. On this machine DATABASE_URL points at
// the local SQLite file so development and the test suites keep working — see
// scripts/split-database-urls.ts for why the two are kept apart.
const url = (process.env.PRODUCTION_DATABASE_URL ?? process.env.DATABASE_URL ?? "").trim();
if (!url) {
  console.error("\nDATABASE_URL is not set. Is platform/.env.local present?\n");
  process.exit(1);
}
if (!url.startsWith("postgres")) {
  // Refuse rather than let a Postgres command run against a SQLite file and
  // produce a confusing partial result.
  console.error(
    `\nDATABASE_URL is not a Postgres URL (it starts "${url.split(":")[0]}").` +
      "\nThis command only targets the production database.\n",
  );
  process.exit(1);
}

const host = url.replace(/^postgres(ql)?:\/\/[^@]*@/, "").split(/[/?]/)[0];
console.log(`\nprisma ${args.join(" ")} --schema=${SCHEMA}`);
console.log(`target: ${host}\n`);

const result = spawnSync("npx", ["prisma", ...args, `--schema=${SCHEMA}`], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: url },
});

process.exit(result.status ?? 1);
