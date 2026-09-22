/**
 * SECURITY TESTS
 *
 * The site is public and the database holds other people's personal
 * information: names, email addresses, phone numbers, and whatever they told
 * us in confidence in an enquiry or a chat.
 *
 * Every check here corresponds to a way that information could leave. They
 * exist because a protection nobody tests is a protection that quietly stops
 * working — and the failure is invisible until somebody else finds it.
 *
 *   npm run test:security                  # static checks, no server
 *   TEST_BASE=http://localhost:3111 npm run test:security   # plus live checks
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.TEST_BASE ?? "";

let passed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = "") {
  if (ok) passed += 1;
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

function heading(text: string) {
  console.log(`\n${text}`);
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === ".git") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const sourceFiles = walk("src").filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));
const apiRoutes = sourceFiles.filter((f) => f.includes("/api/") && f.endsWith("route.ts"));
const read = (f: string) => readFileSync(f, "utf8");

// ===========================================================================
heading("Every endpoint is throttled");
// ===========================================================================
// An unthrottled endpoint that takes an identifier is an oracle: it answers
// "does this exist?" as fast as an attacker can ask. Rate limiting is what
// turns an impractical attack into an impossible one.
for (const route of apiRoutes) {
  const src = read(route);
  const name = route.replace("src/app", "");
  check(`${name} is rate limited`, src.includes("rateLimit("), "no rateLimit call");
}

// The admin console is the highest-value target: it returns the customer list
// behind a single shared token. Both verbs must be throttled, not just writes.
const adminSrc = read("src/app/api/admin/approvals/route.ts");
const adminGet = adminSrc.slice(adminSrc.indexOf("export async function GET"), adminSrc.indexOf("export async function POST"));
check("admin GET is throttled before the token is checked", adminGet.includes("rateLimit("));
check("admin GET throttles before authorizing", adminGet.indexOf("rateLimit(") < adminGet.indexOf("authorized("));
check("failed admin logins are recorded", adminSrc.includes("admin.auth.failed"));

// ===========================================================================
heading("Authentication");
// ===========================================================================
check("admin compares tokens in constant time", /diff \|=|timingSafeEqual/.test(adminSrc),
  "a short-circuiting comparison leaks the token one character at a time");
check("admin refuses a short or missing token", /expected\.length < 16|!expected/.test(adminSrc));
check("admin never echoes the expected token", !/\$\{expected\}/.test(adminSrc));

// ===========================================================================
heading("Session identifiers");
// ===========================================================================
// A session id is what separates one visitor's conversation from another's.
for (const route of apiRoutes) {
  const src = read(route);
  if (!src.includes("sessionId")) continue;
  const name = route.replace("src/app", "");
  check(`${name} requires an unguessable session id`, /\{20,64\}/.test(src),
    "accepts a short, guessable identifier");
  check(`${name} does not accept an 8-character session`, !/sessionId: z\.string\(\)\.min\(8\)/.test(src));
}

// ===========================================================================
heading("Personal information in responses");
// ===========================================================================
// `unsubscribeToken` is a capability: anyone holding it can unsubscribe that
// person. `consentIpHash` is consent evidence. Neither is used by any screen.
// Inspect the select blocks themselves, not the whole file. Searching the
// file text was wrong: it matched the comment explaining why these columns
// are excluded, so the test failed on a codebase that was already correct.
const selectBlocks = [...adminSrc.matchAll(/select:\s*\{([^}]*)\}/g)].map((m) => m[1]!);
check("admin selects explicit columns rather than whole rows", selectBlocks.length > 0);
check(
  "no select block returns an unsubscribe token",
  selectBlocks.every((b) => !b.includes("unsubscribeToken")),
  "unsubscribeToken is a capability — holding it lets anyone unsubscribe that person",
);
check(
  "no select block returns a consent IP digest",
  selectBlocks.every((b) => !b.includes("consentIpHash")),
);
check(
  "the lead list does not fetch whole rows",
  !/db\.lead\.findMany\(\{\s*orderBy[^}]*\}\)/.test(adminSrc.replace(/\n\s*/g, " ")),
  "a findMany without a select returns every column",
);

// ===========================================================================
heading("Personal information in logs");
// ===========================================================================
// Hosting platforms retain logs, show them in a dashboard, and often forward
// them to a third party. A log line is a second copy of whatever it prints.
const mailerSrc = read("src/lib/mailer.ts");
check("the mailer does not dump message bodies in production",
  mailerSrc.includes('NODE_ENV === "production"') && mailerSrc.includes("could not be delivered"),
  "the full notification reaches production logs");
check("the mailer does not log recipient addresses in production",
  /production"\s*\?\s*`\[mailer\] message \$\{record\.id\}/.test(mailerSrc.replace(/\n\s*/g, " ")),
  "a customer address is written to the log");

// ===========================================================================
heading("Consent evidence");
// ===========================================================================
const dbSrc = read("src/lib/db.ts");
check("IP digests use a secret salt", dbSrc.includes("CONSENT_SALT"));
check("there is no hard-coded fallback salt", !/static-salt|northpath-static/.test(dbSrc),
  "a published salt makes the digest reversible");
check("hashing fails closed without a secret", dbSrc.includes("return null;") && dbSrc.includes("length < 16"));

// ===========================================================================
heading("Nothing sensitive is committed");
// ===========================================================================
const tracked = walk(".").map((f) => f.replace(/^\.\//, ""));
check("no database file in the working tree is tracked",
  !tracked.some((f) => /\.(db|sqlite3?)$/.test(f) && !f.includes("prisma/")),
  tracked.filter((f) => /\.(db|sqlite3?)$/.test(f)).join(", "));

const gitignore = read("../.gitignore");
for (const rule of ["*.db", "agent-inbox/", "*.pem"]) {
  check(`.gitignore excludes ${rule}`, gitignore.includes(rule));
}

// A credential committed to a public repository is public the moment it is
// pushed, and rotating it is the only real remedy.
const credentialShaped = /re_[A-Za-z0-9]{24,}|gh[pousr]_[A-Za-z0-9]{30,}|sk-[A-Za-z0-9]{32,}|AKIA[0-9A-Z]{16}/;
const leaky = sourceFiles.filter((f) => credentialShaped.test(read(f)));
check("no credential-shaped string in source", leaky.length === 0, leaky.join(", "));

// ===========================================================================
heading("Headers");
// ===========================================================================
const nextConfig = read("next.config.ts");
for (const header of [
  "Content-Security-Policy",
  "Strict-Transport-Security",
  "X-Frame-Options",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "Permissions-Policy",
]) {
  check(`${header} is set`, nextConfig.includes(header));
}
check("frame-ancestors denies embedding", /frame-ancestors 'none'/.test(nextConfig));
check("object-src is none", /object-src 'none'/.test(nextConfig));
check("unsafe-eval is development only",
  !nextConfig.includes("unsafe-eval") || nextConfig.includes("isDev"),
  "unsafe-eval must never reach production");

// The calendar file names a real person and must not sit in a shared cache.
const icsSrc = read("src/app/api/bookings/[id]/ics/route.ts");
check("the calendar file is marked private and uncacheable", icsSrc.includes("private, no-store"));
check("the calendar endpoint validates the id shape", /\^\[a-z0-9\]\{20,32\}\$/.test(icsSrc));
check("a missing and a cancelled booking are indistinguishable",
  (icsSrc.match(/return new Response\("Not found", \{ status: 404 \}\)/g) ?? []).length >= 2);

// ===========================================================================
heading("Consent is never assumed");
// ===========================================================================
const leadsSrc = read("src/app/api/leads/route.ts");
check("contact consent must be literally true", leadsSrc.includes("z.literal(true"));
const bookingsSrc = read("src/app/api/bookings/route.ts");
check("booking consent must be literally true", bookingsSrc.includes("z.literal(true"));
check("marketing consent defaults to false", leadsSrc.includes("default(false)"));

// A retention date set at creation is what makes PIPEDA Principle 5
// enforceable rather than aspirational.
check("leads are given a retention date", leadsSrc.includes("purgeAfter"));
check("bookings are given a retention date", bookingsSrc.includes("purgeAfter"));

// ===========================================================================
//  Live checks
// ===========================================================================
async function live() {
  heading(`Live (${BASE})`);

  const res = await fetch(BASE);
  const h = res.headers;
  check("HSTS is served", Boolean(h.get("strict-transport-security")) || BASE.startsWith("http://localhost"),
    "absent — required in production");
  check("CSP is served", Boolean(h.get("content-security-policy")));
  check("X-Frame-Options DENY", h.get("x-frame-options") === "DENY");
  check("X-Content-Type-Options nosniff", h.get("x-content-type-options") === "nosniff");
  check("the server version is not advertised", !h.get("x-powered-by"), h.get("x-powered-by") ?? "");

  // The admin API must refuse everyone who does not hold the token.
  const noToken = await fetch(`${BASE}/api/admin/approvals`);
  check("admin refuses an anonymous read", noToken.status === 401, `${noToken.status}`);

  const wrongToken = await fetch(`${BASE}/api/admin/approvals`, {
    headers: { authorization: "Bearer " + "0".repeat(48) },
  });
  check("admin refuses a wrong token", wrongToken.status === 401, `${wrongToken.status}`);

  const body = await wrongToken.text();
  check("a rejection reveals nothing", !/lead|email|token|expected/i.test(body.replace(/Unauthorized/i, "")), body.slice(0, 80));

  // A malformed booking id must never reach the database.
  const badIcs = await fetch(`${BASE}/api/bookings/..%2F..%2Fetc%2Fpasswd/ics`);
  check("a traversal-shaped booking id is refused", badIcs.status === 404, `${badIcs.status}`);

  const shortIcs = await fetch(`${BASE}/api/bookings/abc/ics`);
  check("a short booking id is refused", shortIcs.status === 404, `${shortIcs.status}`);

  // A short session id must be rejected outright.
  const weakSession = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": "203.0.113.200" },
    body: JSON.stringify({ sessionId: "aaaaaaaa", message: "hello" }),
  });
  check("a guessable session id is rejected", weakSession.status === 400, `${weakSession.status}`);

  // An enquiry without consent must be refused.
  const noConsent = await fetch(`${BASE}/api/leads`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": "203.0.113.201" },
    body: JSON.stringify({ name: "Test Person", email: "t@example.test", consentContact: false }),
  });
  check("an enquiry without consent is refused", noConsent.status === 400, `${noConsent.status}`);

  // No endpoint may list customers.
  for (const path of ["/api/leads", "/api/chat", "/api/chat/feedback"]) {
    const r = await fetch(`${BASE}${path}`);
    check(`${path} does not answer GET with data`, r.status === 405 || r.status === 404 || r.status >= 400, `${r.status}`);
  }

  // The booking availability endpoint is public by design — confirm it
  // exposes only times, never anybody who has booked one.
  const slots = await fetch(`${BASE}/api/bookings`);
  const slotsBody = await slots.text();
  check("availability exposes no personal information",
    !/@|name|email|phone/i.test(slotsBody.replace(/"timezone"|"durationMin"|"days"|"slots"|"startsAt"|"label"|"date"/g, "")),
    slotsBody.slice(0, 100));
}

async function main() {
  if (BASE) {
    try {
      await live();
    } catch (err) {
      failures.push(`live checks could not run — ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    console.log("\nLive — skipped (set TEST_BASE to include it)");
  }

  console.log(`\n${"=".repeat(46)}`);
  console.log(` ${passed} passed, ${failures.length} failed`);
  console.log("=".repeat(46));
  if (failures.length) {
    console.log("\nFAILURES:");
    for (const f of failures) console.log(`  - ${f}`);
    console.log("");
  }
  process.exit(failures.length === 0 ? 0 : 1);
}

void main();
