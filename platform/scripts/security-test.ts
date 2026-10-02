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
heading("Production schema");
// ===========================================================================
// Two schema files exist because Prisma fixes the datasource provider at the
// schema level. If a model is added to one and not the other, production
// deploys a database missing a table — and that surfaces as a runtime error
// in front of a customer rather than a build failure.
{
  const dev = read("prisma/schema.prisma");
  const prod = read("prisma/schema.production.prisma");
  const normalise = (schema: string) =>
    schema
      .slice(schema.indexOf("generator client {"))
      .replace(/provider\s*=\s*"(sqlite|postgresql)"/g, 'provider = "DB"')
      .trim();

  check("development schema uses SQLite", /provider\s*=\s*"sqlite"/.test(dev));
  check("production schema uses Postgres", /provider\s*=\s*"postgresql"/.test(prod));
  check(
    "the two schemas have not drifted",
    normalise(dev) === normalise(prod),
    "run: npm run db:sync-production",
  );
  check("the production schema is marked generated", /GENERATED — do not edit/.test(prod));
}

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
heading("The crawl surface matches the real routes");
// ===========================================================================
// The sitemap lists its URLs explicitly rather than globbing src/app, because
// a glob would hand /admin to Google with the same confidence as /pricing.
// That decision has a cost: the list can fall out of step with reality. So
// derive the real routes from the filesystem here and compare both ways —
// a new page missing from the sitemap is a page nobody finds, and /admin
// appearing in it is the mistake the explicit list exists to prevent.
const realRoutes = walk("src/app")
  .filter((f) => f.endsWith("/page.tsx"))
  .map((f) => f.replace(/^src\/app/, "").replace(/\/page\.tsx$/, ""));

const sitemapSrc = read("src/app/sitemap.ts");
const listedRoutes = [...sitemapSrc.matchAll(/path:\s*"([^"]*)"/g)].map((m) => m[1]);

check("the sitemap excludes the admin console", !listedRoutes.includes("/admin"),
  "/admin must never be advertised to a crawler");

const shouldList = realRoutes.filter((r) => r !== "/admin");
const missing = shouldList.filter((r) => !listedRoutes.includes(r));
const stale = listedRoutes.filter((r) => !realRoutes.includes(r));

check("every public page is in the sitemap", missing.length === 0, missing.join(", "));
check("the sitemap lists no page that no longer exists", stale.length === 0, stale.join(", "));

// robots.txt is a request, not a boundary — /admin is noindex in its own
// metadata and the admin APIs answer 401. These checks are about the crawler
// not wasting its budget, and about nothing appearing in a search result that
// invites somebody to go looking for a console.
const robotsSrc = read("src/app/robots.ts");
check("robots disallows the admin console", robotsSrc.includes('"/admin"'));
check("robots disallows the API surface", robotsSrc.includes('"/api/"'));
check("robots points at the sitemap", robotsSrc.includes("sitemap.xml"));

// Search Console re-checks ownership and silently unverifies the property if
// the tag stops being served — taking the sitemap, coverage reports and search
// data with it, with no notification worth the name. A deleted line in a
// metadata refactor is exactly how that happens.
const layoutSrc = read("src/app/layout.tsx");
check("the site claims Search Console ownership",
  /verification:\s*\{\s*google:/.test(layoutSrc),
  "metadata.verification.google is gone — the property will silently unverify");

// Every indexable page declares itself canonical. Without this a campaign link
// (?utm_source=linkedin) is a separate URL to a search engine, competing with
// the clean one it was meant to promote — which matters rather a lot for a
// site whose traffic is about to arrive tagged from LinkedIn.
//
// The canonical set and the sitemap set must be the same set. They answer the
// same question — "which URLs are this site?" — so if they ever disagree, one
// of them is lying to a crawler.
// The home route is "" when derived from the filesystem and in the sitemap,
// where it is concatenated onto the base URL, but "/" as a canonical, where it
// is a path in its own right. Both spellings are correct in their own place,
// so normalise before comparing rather than forcing one convention on the other.
const asPath = (r: string) => (r === "" ? "/" : r);

const canonicals = realRoutes
  .filter((r) => r !== "/admin")
  .map((r) => {
    const file = r === "" ? "src/app/page.tsx" : `src/app${r}/page.tsx`;
    const m = read(file).match(/canonical:\s*"([^"]*)"/);
    return { route: asPath(r), canonical: m?.[1] };
  });

const uncanonical = canonicals.filter((c) => !c.canonical).map((c) => c.route);
check("every indexable page declares a canonical", uncanonical.length === 0,
  uncanonical.join(", "));

const mismatched = canonicals.filter((c) => c.canonical && c.canonical !== c.route);
check("every canonical points at its own page", mismatched.length === 0,
  mismatched.map((c) => `${c.route} -> ${c.canonical}`).join(", "));

const canonSet = new Set(canonicals.map((c) => c.canonical));
const sitemapSet = new Set(listedRoutes.map(asPath));
check("the canonical set and the sitemap set agree",
  canonSet.size === sitemapSet.size && [...canonSet].every((c) => sitemapSet.has(c!)),
  `${canonSet.size} canonical vs ${sitemapSet.size} in sitemap`);

// The apex served the entire site with a 200, so the two hostnames were
// duplicates of each other. A removed redirect silently restores that.
const cfgSrc = read("next.config.ts");
check("the apex redirects to www",
  /type:\s*"host"/.test(cfgSrc) && /permanent:\s*true/.test(cfgSrc),
  "the apex-to-www redirect is gone — both hostnames will serve the site again");

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

  // A crawler must be able to find the sitemap, and must not be pointed at
  // the console. These are served by generated routes, so a build that drops
  // them fails here rather than silently going unnoticed for a month.
  const homeBody = await res.clone().text();
  check("the Search Console verification tag is served",
    /name="google-site-verification"/.test(homeBody),
    "absent from the live homepage — the property will unverify");

  // The trailing slash is optional and the sitemap omits it too; what matters
  // is that the page names itself on the canonical host, not which spelling.
  check("the homepage declares itself canonical",
    /rel="canonical" href="https:\/\/www\.rrrsolutionproviders\.ca\/?"/.test(homeBody),
    "missing or wrong canonical on the live homepage");

  // The apex is a real hostname, not whatever BASE points at, so this is the
  // one check that cannot be aimed at a local server — asserting it while
  // testing localhost would quietly be testing production instead.
  if (BASE.includes("rrrsolutionproviders.ca")) {
    // Follow nothing: the point is the status code the apex itself returns.
    const apex = await fetch("https://rrrsolutionproviders.ca/", { redirect: "manual" });
    check("the apex redirects rather than serving the site",
      apex.status === 308 || apex.status === 301,
      `${apex.status} — both hostnames are serving the site as duplicates`);
    check("the apex redirects to www",
      (apex.headers.get("location") ?? "").startsWith("https://www.rrrsolutionproviders.ca"),
      apex.headers.get("location") ?? "no location header");
  }

  const robotsRes = await fetch(`${BASE}/robots.txt`);
  check("robots.txt is served", robotsRes.status === 200, `${robotsRes.status}`);
  const robotsBody = await robotsRes.text();
  check("robots.txt disallows /admin", /Disallow:\s*\/admin/.test(robotsBody));
  check("robots.txt names the sitemap", /Sitemap:\s*http/.test(robotsBody));

  const sitemapRes = await fetch(`${BASE}/sitemap.xml`);
  check("sitemap.xml is served", sitemapRes.status === 200, `${sitemapRes.status}`);
  const sitemapBody = await sitemapRes.text();
  check("the served sitemap omits /admin", !/<loc>[^<]*\/admin<\/loc>/.test(sitemapBody));
  check("the served sitemap is not empty",
    (sitemapBody.match(/<loc>/g) ?? []).length >= 10,
    `${(sitemapBody.match(/<loc>/g) ?? []).length} urls`);

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
