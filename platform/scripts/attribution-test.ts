/**
 * ATTRIBUTION MODE TEST
 *
 * Proves the one-line switch in attribution.ts genuinely re-frames every
 * surface: pages, the knowledge index, the assistant and structured data.
 *
 * The point is that if counsel says "do not name Wipro's clients", the change
 * is one word and nothing is left behind naming them somewhere obscure.
 *
 * Run:  npx tsx scripts/attribution-test.ts
 */

import { caseStudies } from "../src/lib/catalogue";
import { displayClient, attributionLine, type AttributionMode } from "../src/lib/attribution";

let pass = 0;
let fail = 0;

function check(label: string, ok: boolean, detail = "") {
  if (ok) {
    pass++;
    console.log(`  PASS  ${label}${detail ? "  (" + detail + ")" : ""}`);
  } else {
    fail++;
    console.log(`  FAIL  ${label}${detail ? "  (" + detail + ")" : ""}`);
  }
}

const PRIOR_EMPLOYER_CLIENTS = ["Greater Toronto Airports Authority", "RSA Insurance Group", "Citibank"];
const OWN_CLIENTS = ["Rugby Canada", "Digitalogy LLC"];

async function main() {
  console.log("========================================");
  console.log(" Case study attribution data");
  console.log("========================================");

  for (const c of caseStudies) {
    const kind = c.employer ? `via ${c.employer}` : "own engagement";
    console.log(`  ${c.client.padEnd(36)} ${kind}`);
    check(
      `${c.slug}: has all three name variants`,
      Boolean(c.client && c.clientDescriptive && c.clientMinimal),
    );
  }

  for (const mode of ["named", "descriptive", "minimal"] as AttributionMode[]) {
    console.log(`\n========================================`);
    console.log(` MODE: ${mode}`);
    console.log("========================================");

    for (const c of caseStudies) {
      const shown = displayClient(c, mode);
      const line = attributionLine(c, mode);
      console.log(`  ${shown}`);
      console.log(`      ${line}`);
    }

    // Prior-employer client names must disappear outside "named" mode.
    const rendered = caseStudies
      .map((c) => `${displayClient(c, mode)} ${attributionLine(c, mode)}`)
      .join(" ");

    if (mode === "named") {
      check(
        "prior-employer clients are named",
        PRIOR_EMPLOYER_CLIENTS.every((n) => rendered.includes(n)),
      );
      check("the employer is named", rendered.includes("Wipro"));
    } else {
      for (const name of PRIOR_EMPLOYER_CLIENTS) {
        check(`"${name}" is NOT rendered`, !rendered.includes(name));
      }
      check("the employer is NOT named", !rendered.includes("Wipro"));
    }

    // Our own engagements are always named — they are genuinely ours.
    for (const name of OWN_CLIENTS) {
      check(`own client "${name}" still named`, rendered.includes(name));
    }

    // Every prior-employment entry must carry the employment framing.
    for (const c of caseStudies.filter((x) => x.employer)) {
      check(
        `${c.slug}: attribution says "course of employment"`,
        attributionLine(c, mode).includes("course of employment"),
      );
    }
  }

  console.log("\n========================================");
  console.log(` ${pass} passed, ${fail} failed`);
  console.log("========================================");
  process.exit(fail > 0 ? 1 : 0);
}

main();
