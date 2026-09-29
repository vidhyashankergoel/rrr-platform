/**
 * Regenerate prisma/schema.production.prisma from prisma/schema.prisma.
 *
 *   npm run db:sync-production
 *
 * WHY TWO SCHEMA FILES
 * --------------------
 * Prisma fixes the datasource provider at the schema level — it cannot come
 * from an environment variable. But local development and the test suites want
 * SQLite (no server to run, fast, disposable), while production must use
 * Postgres, because a serverless platform has no persistent filesystem for a
 * SQLite file to live on.
 *
 * So: one schema is authored, the other generated from it. The generated one
 * is committed rather than built on the fly, so what Vercel builds against is
 * visible in review rather than conjured during a deploy.
 *
 * `npm run test:security` fails if they drift, which is the whole point — a
 * model added to one and not the other would deploy a database missing a
 * table, and the failure would appear as a runtime error in front of a
 * customer rather than at build time.
 */

import { readFileSync, writeFileSync } from "node:fs";

const SOURCE = "prisma/schema.prisma";
const TARGET = "prisma/schema.production.prisma";

const HEADER = `// =============================================================================
//  GENERATED — do not edit by hand.
//
//  This is ${SOURCE} with one change: the datasource provider is
//  postgresql instead of sqlite. Vercel builds against this file.
//
//  Two files exist because Prisma fixes the provider at the schema level; it
//  cannot be set from an environment variable. Local development and the test
//  suites stay on SQLite (no server to run, fast, disposable), while
//  production uses Postgres because a serverless platform has no persistent
//  filesystem for a SQLite file to live on.
//
//  Regenerate with:  npm run db:sync-production
//  \`npm run test:security\` fails if the two drift apart.
// =============================================================================

`;

/** The part of a schema that must be identical in both files. */
export function comparableBody(schema: string): string {
  const start = schema.indexOf("generator client {");
  if (start === -1) throw new Error("no generator block found");
  return schema
    .slice(start)
    .replace(/provider\s*=\s*"(sqlite|postgresql)"/g, 'provider = "DB"')
    .trim();
}

export function buildProduction(devSchema: string): string {
  const start = devSchema.indexOf("generator client {");
  const body = devSchema.slice(start).replace(
    /datasource db \{\s*provider = "sqlite"/,
    'datasource db {\n  provider = "postgresql"',
  );
  if (!body.includes('provider = "postgresql"')) {
    throw new Error("could not switch the datasource provider — has the schema changed shape?");
  }
  return HEADER + body;
}

// Only act when run directly, so the test can import the helpers above.
if (process.argv[1]?.endsWith("sync-production-schema.ts")) {
  const dev = readFileSync(SOURCE, "utf8");
  const produced = buildProduction(dev);
  writeFileSync(TARGET, produced);
  console.log(`Regenerated ${TARGET} from ${SOURCE}.`);
}
