/**
 * MARKETING TESTS
 *
 * The part of this system worth testing is not that it produces posts. It is
 * that it refuses to produce the wrong ones.
 *
 * A compliance gate nobody has tried to get past is an assumption. So most of
 * what follows is adversarial: posts that name a client, invent a metric,
 * claim followers the page does not have, or carry somebody's phone number,
 * each asserted to be blocked. If any of these ever starts passing, the gate
 * has stopped working and the first anyone would otherwise know is when it is
 * already published under the company name.
 */

import { PILLARS, ALL_ANGLES } from "../src/lib/marketing/pillars";
import { checkPost, errorsOf, MAX_POST_CHARS, MAX_ALT_CHARS } from "../src/lib/marketing/guidelines";
import { screen, clear } from "../src/lib/marketing/compliance";
import { quoteCard, diagramFor, ogCard } from "../src/lib/marketing/cards";
import { plan, upcomingSlots, composeOne } from "../src/lib/marketing/pipeline";
import { credentialsPresent } from "../src/lib/marketing/publish";
import { caseStudies } from "../src/lib/catalogue";
import { company } from "../src/lib/company";

let passed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = "") {
  if (ok) passed += 1;
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}
const heading = (t: string) => console.log(`\n${t}`);

// ===========================================================================
heading("The gate blocks what it must");
// ===========================================================================

// Every real client and prior employer, taken from the catalogue rather than
// written here — this file must not become a place a client name lives.
for (const study of caseStudies) {
  if (study.client?.trim()) {
    check(
      `a post naming a real client is blocked`,
      !clear(`We rebuilt the platform for ${study.client} last year.`),
      study.client,
    );
  }
  if (study.employer?.trim()) {
    check(
      `a post naming a prior employer is blocked`,
      !clear(`Delivered while at ${study.employer}.`),
      study.employer,
    );
  }
}

// A partial mention is still a mention.
const firstClient = caseStudies.find((c) => c.client?.trim())?.client ?? "";
const distinctive = firstClient.split(/\s+/).find((w) => w.length > 6 && w !== "Toronto");
if (distinctive) {
  check("a partial client mention is blocked",
    !clear(`The ${distinctive} rollout taught us something.`), distinctive);
}

for (const [label, text] of [
  ["invented followers", "Proud to have passed 50,000 followers this month."],
  ["invented ratings", "Over 2,000 five-star ratings from previous clients."],
  ["invented testimonials", "Backed by 300 reviews from happy clients."],
  ["superlative", "The #1 award-winning DevOps consultancy in Canada."],
  ["industry-leading", "Our industry-leading platform is world-class."],
  ["percentage claim", "We reduced their deployment time by 80% in six weeks."],
  ["multiplier claim", "Our pipeline is 10x faster than what they had."],
  ["zero-downtime claim", "We delivered zero downtime across the migration."],
  ["uptime claim", "We sustain 99.99% uptime for every client."],
  ["third-party email", "Reach our lead architect at someone.else@example.com"],
  ["third-party phone", "Call the project lead on +1 (416) 555-0188 for details."],
] as const) {
  check(`${label} is blocked`, !clear(text), text.slice(0, 48));
}

// Credential-shaped strings must never be publishable.
check("an access key is blocked", !clear("Set AKIAIOSFODNN7EXAMPLE in your pipeline."));
check("a token is blocked", !clear("Use sk-abcdefghijklmnopqrstuvwxyz0123 to authenticate."));

// ===========================================================================
heading("The gate does not block what it must not");
// ===========================================================================

// Our own identity. "Toronto" appears inside a former client's legal name;
// blocking it would make every post saying where the firm is into a breach.
check("the company's own city passes", clear(`We are a platform engineering firm in ${company.city}.`));
check("the company's own name passes", clear(`${company.legalName} was incorporated in Ontario.`));
check("the company's own email passes", clear(`Reach us at ${company.email}.`));
check("the company's own phone passes", clear(`Call ${company.phone}.`));
check("ordinary technical writing passes",
  clear("A canary deploy watches one SLO and rolls back without waiting for a human."));
check("naming a technology passes",
  clear("We use Terraform, Kubernetes and GitHub Actions on most engagements."));

// SVG path data is not a phone number. This was a real false positive: the
// officer screened raw markup and read "0 0 1200 1200" as somebody's number.
const card = quoteCard("A statement with no personal information in it.", "Governance");
check("a rendered card does not trip the gate", clear(card.alt), card.alt.slice(0, 40));

// ===========================================================================
heading("LinkedIn's published rules");
// ===========================================================================

const base = { hashtags: ["#DevOps"], hasImage: false, text: "x".repeat(400) };

check("a post over the character cap fails",
  errorsOf(checkPost({ ...base, text: "x".repeat(MAX_POST_CHARS + 1) })).length > 0);
check("an image without alt text fails",
  errorsOf(checkPost({ ...base, hasImage: true })).some((i) => i.rule === "alt-text"));
check("over-long alt text fails",
  errorsOf(checkPost({ ...base, hasImage: true, alt: "a".repeat(MAX_ALT_CHARS + 1) }))
    .some((i) => i.rule === "alt-text"));
check("engagement bait fails",
  errorsOf(checkPost({ ...base, text: `${"x".repeat(400)} Comment YES below if you agree.` }))
    .some((i) => i.rule === "engagement-bait"));
check("a malformed hashtag fails",
  errorsOf(checkPost({ ...base, hashtags: ["#not a tag"] })).some((i) => i.rule === "hashtags"));
check("a non-https link fails",
  errorsOf(checkPost({ ...base, link: "http://example.com" })).some((i) => i.rule === "link"));
check("an ordinary post passes",
  errorsOf(checkPost({ ...base, hasImage: true, alt: "A diagram of four stages." })).length === 0);

// ===========================================================================
heading("Pillars and rotation");
// ===========================================================================

const ids = ALL_ANGLES.map((a) => a.id);
check("every angle id is unique", new Set(ids).size === ids.length);
check("there are at least four weeks of material", ALL_ANGLES.length >= 12,
  `${ALL_ANGLES.length} angles`);
for (const angle of ALL_ANGLES) {
  check(`${angle.id} has evidence of its own`, angle.evidence.trim().length > 80,
    `${angle.evidence.length} chars`);
  check(`${angle.id} names a source`, angle.source.startsWith("/"));
}

// Every source must be a page that exists, or the post links into a 404.
const realRoutes = new Set(
  PILLARS.flatMap((p) => p.angles).map((a) => a.source),
);
for (const route of realRoutes) {
  const file = route === "/" ? "src/app/page.tsx" : `src/app${route}/page.tsx`;
  check(`${route} is a real page`, Boolean(require("node:fs").existsSync(file)), file);
}

// No two angles share evidence — that was the bug the first run shipped with.
const evidence = ALL_ANGLES.map((a) => a.evidence);
check("no two angles share the same evidence", new Set(evidence).size === evidence.length);

// ===========================================================================
heading("The line end to end");
// ===========================================================================

const slots = upcomingSlots(new Date("2026-10-05T00:00:00Z"), 3);
check("three slots are planned", slots.length === 3, slots.join(", "));
check("slots fall midweek",
  slots.every((d) => [2, 3, 4].includes(new Date(`${d}T00:00:00Z`).getUTCDay())), slots.join(", "));
check("slots are in order", slots.join() === [...slots].sort().join());

const run = plan(new Date("2026-10-05T00:00:00Z"), [], 3);
check("the line produces three posts", run.made.length === 3,
  run.rejected.map((r) => `${r.stage}: ${r.reasons[0]}`).join(" | "));
check("nothing was rejected", run.rejected.length === 0);

const pillarsUsed = new Set(run.made.map((p) => p.pillar));
check("a week does not repeat a pillar", pillarsUsed.size === run.made.length,
  [...pillarsUsed].join(", "));

for (const post of run.made) {
  check(`${post.angleId} is clean`, clear(post.text), screen(post.text).map((v) => v.rule).join(", "));
  check(`${post.angleId} carries campaign parameters`, post.link.includes("utm_content="));
  check(`${post.angleId} links to the canonical host`,
    post.link.startsWith(company.siteUrl.replace(/\/$/, "")));
  check(`${post.angleId} fits LinkedIn`, post.text.length <= MAX_POST_CHARS, `${post.text.length}`);
  if (post.svg) {
    check(`${post.angleId} has alt text`, Boolean(post.alt?.trim()));
    check(`${post.angleId} alt text fits`, (post.alt ?? "").length <= MAX_ALT_CHARS);
    check(`${post.angleId} card is square`, post.svg.includes('width="1200" height="1200"'));
  }
}

// The strategist must not hand back an angle it has already used.
const used = run.made.map((p) => p.angleId);
const second = plan(new Date("2026-10-12T00:00:00Z"), used, 3);
check("the next run repeats nothing",
  second.made.every((p) => !used.includes(p.angleId)),
  second.made.map((p) => p.angleId).join(", "));

// A second run in the same week must not book days that are already spoken
// for. This shipped broken: the planner returned the same three dates, the
// filenames differed because they carry the angle, and the queue quietly ended
// up with two posts on each of Tuesday, Wednesday and Thursday.
const week1 = plan(new Date("2026-10-05T00:00:00Z"), [], 3);
const booked = week1.made.map((p) => p.date);
const week2 = plan(new Date("2026-10-05T00:00:00Z"), week1.made.map((p) => p.angleId), 3, booked);
check("a second run does not double-book a day",
  week2.made.every((p) => !booked.includes(p.date)),
  `${booked.join(", ")} vs ${week2.made.map((p) => p.date).join(", ")}`);
check("a second run still produces three posts", week2.made.length === 3);
check("slots are never duplicated within one run",
  new Set(week1.made.map((p) => p.date)).size === week1.made.length);

// Exhaustion is reported, not papered over by repeating.
const exhausted = composeOne({ date: "2026-12-01", used: ids });
check("an exhausted rotation refuses rather than repeats",
  Boolean(exhausted.rejected) && exhausted.rejected!.stage === "strategist");

// ===========================================================================
heading("Cards");
// ===========================================================================

const q = quoteCard("Short statement.", "Governance");
const d = diagramFor(ALL_ANGLES.find((a) => a.visual === "diagram")!);
for (const [name, v] of [["quote", q], ["diagram", d]] as const) {
  check(`${name} card is well-formed`, v.svg.startsWith("<svg") && v.svg.trimEnd().endsWith("</svg>"));
  check(`${name} card carries the company name`, v.svg.includes(company.shortName));
  check(`${name} card carries the domain`,
    v.svg.includes(company.siteUrl.replace(/^https?:\/\//, "")));
  check(`${name} card has alt text within the cap`, v.alt.length > 0 && v.alt.length <= MAX_ALT_CHARS);
  check(`${name} card balances its tags`,
    (v.svg.match(/<text/g) ?? []).length === (v.svg.match(/<\/text>/g) ?? []).length);
}

const og = ogCard();
check("the link-preview card is 1200x630", og.width === 1200 && og.height === 630);
check("the link-preview card is well-formed", og.svg.startsWith("<svg"));
check("the link-preview image is committed",
  require("node:fs").existsSync("public/og.png"),
  "run npm run marketing:og");

// ===========================================================================
heading("Publishing stays shut");
// ===========================================================================

// This is the assertion that matters most in this file. Nothing may publish
// without credentials AND an explicit human confirm; a scheduled job has
// neither, and must never acquire them by accident.
const creds = credentialsPresent();
check("publishing reports what it is missing",
  creds.ok || creds.missing.length > 0, creds.missing.join(", "));

const publishSrc = require("node:fs").readFileSync("src/lib/marketing/publish.ts", "utf8");
check("publishing requires an explicit confirm", /opts\.confirm/.test(publishSrc));
check("publishing never auto-confirms", !/confirm:\s*true/.test(publishSrc));

const pipelineSrc = require("node:fs").readFileSync("src/lib/marketing/pipeline.ts", "utf8");
check("the pipeline cannot publish", !/publish\(/.test(pipelineSrc));

const workflow = "../.github/workflows/marketing.yml";
if (require("node:fs").existsSync(workflow)) {
  const yml = require("node:fs").readFileSync(workflow, "utf8");
  check("the scheduled job does not publish", !/marketing:publish|LINKEDIN_ACCESS_TOKEN/.test(yml));
}

// ===========================================================================
console.log(`\n${"=".repeat(46)}`);
console.log(` ${passed} passed, ${failures.length} failed`);
console.log("=".repeat(46));
if (failures.length) {
  console.log("\nFAILURES:");
  for (const f of failures) console.log(`  - ${f}`);
  console.log("");
}
process.exit(failures.length === 0 ? 0 : 1);
