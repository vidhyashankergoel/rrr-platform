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
import {
  displayClient,
  attributionLine,
  ATTRIBUTION_MODE,
  type AttributionMode,
} from "../src/lib/attribution";

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

  // =========================================================================
  //  The two ways a real client name has actually escaped
  // =========================================================================
  //
  // displayClient() was always correct. Both leaks went around it rather than
  // through it, which is why neither showed up in the tests above.
  //
  //  1. Hardcoded in prose. /story described the airport authority, the
  //     insurer, the bank AND the former employer by name in body copy that
  //     never called displayClient() at all. knowledge.ts listed all three in
  //     the answer Ada gives when a visitor asks about the track record — a
  //     chatbot volunteering them to anyone who asked.
  //
  //  2. Serialised into a client component's props. <CaseCard study={c} />
  //     took the whole CaseStudy, and Next ships every prop of a client
  //     component to the browser, so the raw name sat in view-source on a page
  //     that rendered only the descriptive label.
  //
  // These two checks are the regression guard for both.

  const SOURCE_ROOTS = ["src/app", "src/lib", "src/components"];

  // The real names may appear ONLY where they are data or are explained.
  const ALLOWED = new Set([
    "src/lib/catalogue.ts",   // the record itself; displayClient reads from it
    "src/lib/attribution.ts", // the module that decides how they are shown
  ]);

  const realNames = caseStudies.filter((c) => c.employer).map((c) => c.client);
  const employers = [...new Set(caseStudies.map((c) => c.employer).filter(Boolean))] as string[];

  const { readdirSync, readFileSync, statSync } = await import("node:fs");
  const { join, relative } = await import("node:path");

  const walk = (dir: string): string[] => {
    const out: string[] = [];
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) out.push(...walk(full));
      else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
    }
    return out;
  };

  const files = SOURCE_ROOTS.flatMap((r) => {
    try { return walk(r); } catch { return []; }
  });

  if (ATTRIBUTION_MODE !== "named") {
    for (const name of [...realNames, ...employers]) {
      const offenders = files.filter((f) => {
        if (ALLOWED.has(relative(".", f))) return false;
        return readFileSync(f, "utf8").includes(name);
      });
      check(
        `"${name}" appears in no page, component or data file outside the catalogue`,
        offenders.length === 0,
        offenders.map((f) => relative(".", f)).join(", "),
      );
    }
  }

  // A retired exam number is a small inaccuracy with an outsized cost: it is
  // the kind of detail a diligent buyer checks, and the diligent buyer is the
  // one worth winning. AZ-203 was retired in 2020 and replaced by AZ-204.
  //
  // This is guarded as a class rather than fixed as instances because it had
  // already been fixed three times — homepage, about page, trust page — and
  // turned up a fourth time in the answer Ada gives about certifications.
  {
    const RETIRED = ["AZ-203"];
    for (const exam of RETIRED) {
      const offenders = files.filter((f) => {
        const body = readFileSync(f, "utf8");
        // A line explaining why the code is retired is not a claim to hold it.
        return body
          .split("\n")
          .some((line) => line.includes(exam) && !line.trimStart().startsWith("//"));
      });
      check(
        `retired exam "${exam}" is not claimed anywhere`,
        offenders.length === 0,
        offenders.map((f) => relative(".", f)).join(", "),
      );
    }
  }

  // The view model handed to the CaseCard client component must not carry the
  // raw name in ANY field — it is serialised wholesale into the page payload.
  {
    const { toCaseView } = await import("../src/lib/case-view");
    for (const study of caseStudies.filter((c) => c.employer)) {
      const serialised = JSON.stringify(toCaseView(study));
      check(
        `${study.slug}: the client view model does not carry the real name`,
        !serialised.includes(study.client),
      );
      check(
        `${study.slug}: the client view model does not carry the employer`,
        !study.employer || !serialised.includes(study.employer),
      );
    }
  }


  // -------------------------------------------------------------------------
  // Slugs are published too
  // -------------------------------------------------------------------------
  // A slug reaches the browser three ways: as the React key in the streamed
  // payload, as the `id` on the article in /work, and as the aria-labelledby
  // target on the dialog. So a page can render "A global retail and investment
  // bank" and still name the bank in view-source — which is exactly what it
  // did. The slugs were "citibank", "gtaa" and "rsa": one name and two sets of
  // the organisation's own initials.
  const GENERIC_WORDS = new Set([
    "group", "canada", "canadian", "limited", "technologies", "international",
    "authority", "insurance", "services", "solutions", "systems", "company",
  ]);

  for (const study of caseStudies) {
    if (!study.employer) continue;        // our own clients are named on purpose

    const slug = study.slug.toLowerCase();

    for (const word of [study.client, study.employer]
      .filter((n): n is string => Boolean(n))
      .flatMap((n) => n.split(/[^A-Za-z]+/))
      .filter((w) => w.length >= 4 && !GENERIC_WORDS.has(w.toLowerCase()))) {
      check(`${study.slug}: the slug does not contain "${word}"`, !slug.includes(word.toLowerCase()));
    }

    // Initials, which is how "gtaa" and "rsa" got past a word-based check.
    const initials = study.client
      .split(/\s+/)
      .filter((w) => /^[A-Z]/.test(w))
      .map((w) => w[0].toLowerCase())
      .join("");
    if (initials.length >= 2) {
      check(`${study.slug}: the slug is not the client's initials`,
        slug.replace(/-/g, "") !== initials, initials);
    }
  }

  console.log("\n========================================");
  console.log(` ${pass} passed, ${fail} failed`);
  console.log("========================================");
  process.exit(fail > 0 ? 1 : 0);
}

main();
