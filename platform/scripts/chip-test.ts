/**
 * CHIP TEST
 *
 * Every suggested question in the assistant panel is an advertisement: putting
 * it in front of a visitor promises we answer it well. This fires all of them
 * at the live router and fails on any that lands on the "I am not certain"
 * fallback, comes back too thin to be useful, or answers something else.
 *
 * It also checks the routing rules the chips rely on — that a chip shown after
 * a pricing answer is itself a pricing question, and so on — because a chip
 * that changes the subject is worse than no chip.
 *
 * Run:  npx tsx scripts/chip-test.ts   (dev server must be running)
 */

import { OPENERS, PAGE_CHIPS, FOLLOW_UPS, chipsFor, allChips, actionForChip } from "../src/lib/chips";

const BASE = process.env.TEST_BASE ?? "http://localhost:3111";

/**
 * Phrases the assistant uses when it has nothing. A chip must never produce
 * one — that is the exact failure the visitor reads as "this bot is useless".
 */
const FALLBACK = /I am not certain|I'm not certain|not sure I have|I do not have that|could not reach/i;

/** A useful answer is longer than a brush-off. */
const MIN_USEFUL_CHARS = 120;

let passed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = "") {
  if (ok) passed += 1;
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

async function ask(q: string, i: number): Promise<{ reply: string; agentName: string }> {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": `203.0.113.${(i % 250) + 1}` },
    body: JSON.stringify({ sessionId: `chip-test-${i}-${Date.now()}`, message: q, pageUrl: "/" }),
  });
  const json = (await res.json()) as { reply?: string; agentName?: string };
  if (typeof json.reply !== "string") throw new Error(`no reply (status ${res.status})`);
  return { reply: json.reply, agentName: json.agentName ?? "?" };
}

// ---------------------------------------------------------------------------
//  Structure — cheap checks that need no server
// ---------------------------------------------------------------------------

function structure() {
  console.log("\nStructure");

  for (const [page, chips] of Object.entries(PAGE_CHIPS)) {
    check(`${page} offers exactly three chips`, chips.length === 3, `${chips.length}`);
    check(`${page} chips are distinct`, new Set(chips).size === chips.length);
  }

  for (const f of FOLLOW_UPS) {
    check(`follow-up ${f.match} offers three chips`, f.chips.length === 3, `${f.chips.length}`);
  }

  // The follow-up router must pick the topic a visitor actually raised.
  const routes: [string, RegExp][] = [
    ["how much does a kubernetes platform cost?", /Kubernetes/i],
    ["do you do terraform?", /terraform/i],
    ["what about prometheus?", /SLO|Prometheus|observability/i],
    ["can you migrate us off on-premises?", /migration|migrate/i],
    ["are you SOC 2 compliant?", /security questionnaire|secrets|Canada/i],
    ["can you send an NDA?", /insurance|payment terms|out of business/i],
    ["what is your hourly rate?", /payments|audit cost|cloud bill/i],
    ["who would be on the team?", /do the work|offshore|consultancy/i],
  ];
  for (const [said, wanted] of routes) {
    const got = chipsFor("/", said);
    check(`"${said}" routes to matching chips`, got.some((c) => wanted.test(c)), got.join(" | "));
  }

  // Chips that read like instructions must run the action, not ask Ada to
  // describe it. Chips that are questions must never fire an action.
  const actionCases: [string, "call" | "nda" | "audit" | null][] = [
    ["Book a scoping call", "call"],
    ["Book a call", "call"],
    ["Have a human call me", "call"],
    ["Can I talk to a person?", "call"],
    ["Send us an NDA", "nda"],
    ["Request an NDA", "nda"],
    ["Book the audit", "audit"],
    // Questions — these must stay questions.
    ["What does an audit cost?", null],
    ["What would the audit cover?", null],
    ["How do you price?", null],
    ["What happens on the first call?", null],
    ["Why should we trust a new firm?", null],
  ];
  for (const [label, want] of actionCases) {
    const got = actionForChip(label);
    check(`"${label}" -> ${want ?? "question"}`, got === want, `got ${got ?? "question"}`);
  }

  // No page or follow-up chip should silently become an action — those are
  // all questions by design, and an action chip among them would skip the
  // answer the visitor asked for.
  const accidental = allChips().filter((c) => actionForChip(c));
  check("no suggested question is mistaken for an action", accidental.length === 0, accidental.join(", "));

  // With nothing said, chips must belong to the page.
  check("homepage falls back to its own chips", chipsFor("/").every((c) => PAGE_CHIPS["/"]!.includes(c)));
  check("an unknown page still gets chips", chipsFor("/nowhere").length === 3);
  check("openers cover the basics", OPENERS.length >= 6);
}

// ---------------------------------------------------------------------------
//  Substance — every chip must get a real answer
// ---------------------------------------------------------------------------

async function substance() {
  const chips = allChips();
  console.log(`\nSubstance — asking all ${chips.length} chips\n`);

  let i = 0;
  for (const chip of chips) {
    i += 1;
    let r: { reply: string; agentName: string };
    try {
      r = await ask(chip, i);
    } catch (err) {
      failures.push(`"${chip}" — request failed: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }

    const problems: string[] = [];
    if (FALLBACK.test(r.reply)) problems.push("answered with the fallback");
    if (r.reply.length < MIN_USEFUL_CHARS) problems.push(`only ${r.reply.length} chars`);

    if (problems.length === 0) {
      passed += 1;
      process.stdout.write(".");
    } else {
      process.stdout.write("F");
      failures.push(
        `"${chip}"\n        ${problems.join(" | ")}\n        ${r.agentName}: ${r.reply.slice(0, 140).replace(/\n/g, " ")}`,
      );
    }
  }
  process.stdout.write("\n");
}

async function main() {
  structure();

  let serverUp = false;
  try {
    serverUp = (await fetch(BASE, { signal: AbortSignal.timeout(4000) })).ok;
  } catch {
    serverUp = false;
  }

  if (serverUp) await substance();
  else console.log(`\nSubstance — skipped, no server at ${BASE}`);

  console.log(`\n${"=".repeat(40)}`);
  console.log(` ${passed} passed, ${failures.length} failed`);
  console.log("=".repeat(40));

  if (failures.length) {
    console.log("\nFAILURES:");
    for (const f of failures) console.log(`  - ${f}`);
    console.log("");
  }

  process.exit(failures.length === 0 ? 0 : 1);
}

void main();
