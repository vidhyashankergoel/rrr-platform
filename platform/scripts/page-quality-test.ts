/**
 * PAGE QUALITY
 *
 * Structural checks that need a rendered page: heading hierarchy, the metadata
 * a search result is built from, and the handful of attributes assistive
 * technology depends on.
 *
 * Every assertion here corresponds to something that was actually wrong. The
 * site had 26 findings when this was first run against production, and all of
 * them had survived months of review because none of them are visible: a
 * heading level is not rendered, a meta description is not on the page, and a
 * title is only ever seen in a tab or a search result nobody was looking at.
 *
 *   TEST_BASE=http://localhost:3111 npx tsx scripts/page-quality-test.ts
 *
 * Needs a running server. Skips with a clear message rather than failing when
 * there is not one, in the same spirit as the other suites.
 */

const BASE = process.env.TEST_BASE ?? "http://localhost:3111";

const PAGES = [
  "/", "/audit", "/services", "/pricing", "/work", "/contact", "/about",
  "/security", "/trust", "/story", "/brand",
  "/legal/privacy", "/legal/terms", "/legal/accessibility",
];

/**
 * Google renders roughly 600px of title and 920px of description, which is
 * about these counts at average character width. They are guidance rather
 * than limits — going over truncates the tail, it does not break anything —
 * so the bounds here are deliberately a little looser than the advice.
 */
const TITLE_MAX = 65;
const DESC_MIN = 70;
const DESC_MAX = 165;

let passed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = "") {
  if (ok) passed += 1;
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const decodeEntities = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
   .replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
   .replace(/&rsquo;/g, "’").replace(/&nbsp;/g, " ");

async function main() {
  try {
    await fetch(BASE, { signal: AbortSignal.timeout(4000) });
  } catch {
    console.log(`\n  No server at ${BASE} — skipping.`);
    console.log("  Start one with `npm run dev`, or set TEST_BASE.\n");
    process.exit(0);
  }

  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();

  for (const path of PAGES) {
    const html = await (await fetch(BASE + path)).text();

    // --- The search result -------------------------------------------------
    const title = decodeEntities(/<title>([\s\S]*?)<\/title>/.exec(html)?.[1]?.trim() ?? "");
    check(`${path} has a title`, title.length > 0);
    check(`${path} title fits a search result`, title.length <= TITLE_MAX, `${title.length} chars`);
    if (title) titles.set(path, title);

    const desc = decodeEntities(/<meta name="description" content="([\s\S]*?)"/.exec(html)?.[1]?.trim() ?? "");
    check(`${path} has a meta description`, desc.length > 0);
    if (desc) {
      check(`${path} description is not truncated`, desc.length <= DESC_MAX, `${desc.length} chars`);
      check(`${path} description says enough`, desc.length >= DESC_MIN, `${desc.length} chars`);
      descriptions.set(path, desc);
    }

    // --- Heading hierarchy -------------------------------------------------
    // A screen reader user navigating by heading hears the levels as
    // structure. Skipping one describes a section that does not exist. Going
    // back up a level is fine; only skipping down is a defect.
    const headings = [...html.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g)]
      .map((m) => ({ level: Number(m[1]), text: decodeEntities(m[2].replace(/<[^>]+>/g, "")).trim() }));

    const h1s = headings.filter((h) => h.level === 1);
    check(`${path} has exactly one h1`, h1s.length === 1, `${h1s.length}`);

    let previous = 0;
    for (const h of headings) {
      if (previous && h.level > previous + 1) {
        check(`${path} does not skip a heading level`, false,
          `h${previous} to h${h.level} at "${h.text.slice(0, 40)}"`);
        break;
      }
      previous = h.level;
    }
    if (!headings.some((h, i) => i > 0 && h.level > headings[i - 1].level + 1)) {
      check(`${path} heading levels are contiguous`, true);
    }

    // --- Things assistive technology needs ---------------------------------
    check(`${path} declares a language`, /<html[^>]*lang="[a-z]{2}/i.test(html));
    check(`${path} has a main landmark`, html.includes("<main"));

    const imagesWithoutAlt = [...html.matchAll(/<img\b[^>]*>/g)]
      .map((m) => m[0])
      .filter((tag) => !/\balt=/.test(tag));
    check(`${path} images all carry alt text`, imagesWithoutAlt.length === 0,
      imagesWithoutAlt[0]?.slice(0, 60));

    // --- Sharing -----------------------------------------------------------
    check(`${path} has an og:title`, html.includes('property="og:title"'));
    check(`${path} has an og:image`, html.includes('property="og:image"'));

    // --- The canonical, which the sitemap has to agree with ----------------
    check(`${path} declares a canonical`, /rel="canonical"/.test(html));
  }

  // --- Uniqueness ----------------------------------------------------------
  // Two pages sharing a description is two pages competing for one result.
  for (const [label, map] of [["title", titles], ["description", descriptions]] as const) {
    const byValue = new Map<string, string[]>();
    for (const [path, value] of map) {
      byValue.set(value, [...(byValue.get(value) ?? []), path]);
    }
    for (const [value, paths] of byValue) {
      check(`${label} is unique`, paths.length === 1,
        paths.length > 1 ? `${paths.join(", ")} share "${value.slice(0, 44)}"` : "");
    }
  }

  console.log(`\n${"=".repeat(46)}`);
  console.log(` ${passed} passed, ${failures.length} failed across ${PAGES.length} pages`);
  console.log("=".repeat(46));
  if (failures.length) {
    console.log("\nFAILURES:");
    for (const f of failures) console.log(`  - ${f}`);
    console.log("");
  }
  process.exit(failures.length === 0 ? 0 : 1);
}

void main();
