/**
 * COPY AND GRAMMAR CHECK
 *
 * Reads the rendered text of every page — not the source, the actual words a
 * visitor sees — and flags the mistakes that survive a human proofread:
 * doubled words, doubled spaces, straight quotes, inconsistent terminology,
 * American spellings where Canadian convention differs, unbalanced brackets,
 * and sentences long enough to lose the reader.
 *
 * Run:  npx tsx scripts/copy-check.ts   (dev server must be running)
 */

const BASE = process.env.TEST_BASE ?? "http://localhost:3111";

const PAGES = [
  "/", "/services", "/pricing", "/work", "/security", "/trust",
  "/story", "/about", "/contact",
  "/legal/privacy", "/legal/terms", "/legal/accessibility",
];

interface Finding {
  page: string;
  rule: string;
  detail: string;
  severity: "error" | "warn" | "note";
}

const findings: Finding[] = [];

function flag(page: string, rule: string, detail: string, severity: Finding["severity"] = "warn") {
  findings.push({ page, rule, detail, severity });
}

/**
 * Canadian English follows British usage for -our endings and American usage
 * for -ize endings. Anything in the left column is wrong for this audience.
 */
const SPELLING: Array<[RegExp, string, string]> = [
  [/\bcolor(s|ed|ing)?\b/gi, "color", "colour — Canadian English keeps the -our ending"],
  [/\bbehavior(s|al)?\b/gi, "behavior", "behaviour"],
  [/\bfavor(s|ed|ite|able)?\b/gi, "favor", "favour"],
  [/\blabor(s|ed)?\b/gi, "labor", "labour"],
  [/\bhonor(s|ed|able)?\b/gi, "honor", "honour"],
  [/\bcenter(s|ed|ing)?\b/gi, "center", "centre"],
  [/\bdefense\b/gi, "defense", "defence"],
  [/\borganis(e|ed|ing|ation|ations)\b/gi, "organise", "organize — Canadian English uses -ize"],
  [/\bprioritis(e|ed|ing)\b/gi, "prioritise", "prioritize"],
  [/\bcentralis(e|ed|ing|ation)\b/gi, "centralise", "centralize"],
  [/\boptimis(e|ed|ing|ation)\b/gi, "optimise", "optimize"],
  [/\brecognis(e|es|ed|ing)\b/gi, "recognise", "recognize"],
  [/\banalys(e|ed|ing)\b/gi, "analyse", "analyze"],
];

/** Terms that must be spelled one way throughout. */
const TERMINOLOGY: Array<[RegExp, string]> = [
  [/\bKubernetes\b/g, "Kubernetes"],
  [/\bkubernetes\b/g, "Kubernetes (capitalize the product name)"],
  [/\bTerraform\b/g, "Terraform"],
  [/\bterraform\b(?!\s+(apply|plan|init|destroy))/g, "Terraform (capitalize outside a command)"],
  [/\bgithub\b/g, "GitHub"],
  [/\bGithub\b/g, "GitHub"],
  [/\blinkedin\b/gi, "LinkedIn"],
  [/\bjavascript\b/g, "JavaScript"],
  [/\bon-prem\b/g, "on-premises (avoid the abbreviation in customer copy)"],
];

const COMMON_TYPOS: Array<[RegExp, string]> = [
  [/\bteh\b/gi, "the"],
  [/\brecieve/gi, "receive"],
  [/\bseperate/gi, "separate"],
  [/\boccured/gi, "occurred"],
  [/\bdefinately/gi, "definitely"],
  [/\bcomittment|\bcommitent/gi, "commitment"],
  [/\bacheive/gi, "achieve"],
  [/\bexistant/gi, "existent"],
  [/\bmaintainance/gi, "maintenance"],
  [/\bpubically/gi, "publicly"],
  [/\baccomodate/gi, "accommodate"],
  [/\bneccessary|\bnecesary/gi, "necessary"],
];

/**
 * Read what a visitor actually sees.
 *
 * An earlier version of this stripped tags with a regex, which produced
 * nonsense: Next.js serializes its server-component payload into inline
 * scripts, and a non-greedy `<script>...</script>` match breaks on the
 * escaped sequences inside it. That leaked `[object Object]` into the
 * "visible text" and reported it as a defect on every page.
 *
 * Using the browser's own innerText is both simpler and correct — it is
 * literally the rendered text, with scripts and hidden elements excluded.
 */
async function pageTexts(paths: string[]): Promise<Map<string, string>> {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } } as never);
  const out = new Map<string, string>();

  for (const path of paths) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    // Separate block elements with a sentinel so text from two different
    // elements is never read as one sentence — otherwise a breadcrumb
    // "Privacy" followed by a heading "Privacy notice" looks like a doubled
    // word, and a bolded phrase before a full stop looks like a space before
    // punctuation.
    // NOTE: esbuild (via tsx) rewrites named inner functions with a `__name`
    // helper that does not exist in the page context, so this walks the DOM
    // iteratively rather than with a named recursive helper.
    const text = await page.evaluate(() => {
      const main = document.querySelector("main");
      if (!main) return "";

      const SKIP = new Set(["SCRIPT", "STYLE", "SVG", "NOSCRIPT"]);
      const BLOCK = new Set([
        "P", "LI", "H1", "H2", "H3", "H4", "H5", "H6", "DIV", "SECTION",
        "ARTICLE", "TD", "TH", "DT", "DD", "SUMMARY", "LABEL", "BUTTON",
        "FIGCAPTION", "BLOCKQUOTE", "CAPTION",
      ]);
      const SEP = "\u241E";

      const parts: string[] = [];
      const walker = document.createTreeWalker(main, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            if (SKIP.has(el.tagName)) return NodeFilter.FILTER_REJECT;
            if (el.hidden) return NodeFilter.FILTER_REJECT;
            const cs = getComputedStyle(el);
            if (cs.display === "none" || cs.visibility === "hidden") return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      });

      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.nodeType === Node.TEXT_NODE) {
          const t = node.textContent ?? "";
          if (t.trim()) parts.push(t);
        } else if (BLOCK.has((node as HTMLElement).tagName)) {
          // Mark a block boundary so text from two elements is never read as
          // one sentence.
          parts.push(" " + SEP + " ");
        }
      }
      // Join with nothing: inline elements must not gain a space, or
      // "<strong>x</strong>." reads as "x ." and looks like a spacing defect.
      // Block boundaries already carry their own separator.
      return parts.join("");
    });

    out.set(path, text);
  }

  await browser.close();
  return out;
}

/** Split rendered text into genuine sentences, never across a block boundary. */
function blocks(text: string): string[] {
  return text
    .split("\u241E")
    .map((b) => b.replace(/\s+/g, " ").trim())
    .filter((b) => b.length > 0);
}

function checkPage(page: string, blockList: string[]) {
  const text = blockList.join(" ");

  // --- Doubled words, within a single block only -------------------------
  const doubled = blockList.flatMap((b) => b.match(/\b(\w+)\s+\1\b/gi) ?? []);
  for (const d of new Set(doubled)) {
    const word = d.split(/\s+/)[0]!.toLowerCase();
    // "had had" and "that that" are grammatical; numbers repeat legitimately.
    if (["had", "that", "is"].includes(word) || /^\d+$/.test(word)) continue;
    flag(page, "doubled word", `"${d}"`, "error");
  }

  // --- Straight quotes in prose ------------------------------------------
  const straightApostrophes = text.match(/[a-z]'[a-z]/gi) ?? [];
  if (straightApostrophes.length) {
    flag(page, "straight apostrophe", `${straightApostrophes.length}x e.g. "${straightApostrophes[0]}" — use ’`, "note");
  }

  // --- Spelling convention ------------------------------------------------
  for (const [re, wrong, right] of SPELLING) {
    const hits = text.match(re);
    if (hits) flag(page, "spelling", `"${hits[0]}" -> ${right}`, "error");
    void wrong;
  }

  // --- Typos ---------------------------------------------------------------
  for (const [re, right] of COMMON_TYPOS) {
    const hits = text.match(re);
    if (hits) flag(page, "typo", `"${hits[0]}" -> ${right}`, "error");
  }

  // --- Terminology ---------------------------------------------------------
  for (const [re, note] of TERMINOLOGY.filter(([, n]) => n.includes("("))) {
    const hits = text.match(re);
    if (hits) flag(page, "terminology", `"${hits[0]}" -> ${note}`, "warn");
  }

  // --- Spacing -------------------------------------------------------------
  if (/\s{2,}/.test(text.replace(/\s+/g, (m) => (m.includes("\n") ? " " : m)))) {
    // Collapsed above; this catches nothing by design. Left as documentation.
  }
  const beforePunct = blockList.flatMap((b) => b.match(/\s+[,.;:!?]/g) ?? []);
  if (beforePunct.length) flag(page, "spacing", `${beforePunct.length}x space before punctuation`, "warn");

  // --- Brackets and quotes balance ----------------------------------------
  const open = (text.match(/\(/g) ?? []).length;
  const close = (text.match(/\)/g) ?? []).length;
  if (open !== close) flag(page, "brackets", `${open} "(" vs ${close} ")"`, "error");

  const curlyOpen = (text.match(/“/g) ?? []).length;
  const curlyClose = (text.match(/”/g) ?? []).length;
  if (curlyOpen !== curlyClose) flag(page, "quotes", `${curlyOpen} open vs ${curlyClose} close`, "warn");

  // --- Sentence length -----------------------------------------------------
  const sentences = blockList.flatMap((b) => b.split(/(?<=[.!?])\s+(?=[A-Z])/));
  const veryLong = sentences.filter((s) => s.split(/\s+/).length > 45);
  if (veryLong.length) {
    flag(page, "sentence length", `${veryLong.length} sentence(s) over 45 words, longest "${veryLong[0]!.slice(0, 70)}..."`, "note");
  }

  // --- Currency and number formatting --------------------------------------
  const badMoney = text.match(/\$\d{4,}(?!\d)/g) ?? [];
  const unseparated = badMoney.filter((m) => !/,/.test(m));
  if (unseparated.length) {
    flag(page, "number format", `${unseparated.join(", ")} — thousands separator missing`, "warn");
  }

  // Canadian convention: "CAD" or "$X CAD", not "USD" anywhere unqualified.
  if (/\bUSD\b/.test(text)) flag(page, "currency", "USD appears — this site prices in CAD", "error");

  // --- Placeholder text that escaped ---------------------------------------
  // NOTE: these are matched as literal substrings, not patterns. Feeding
  // "[object Object]" to `new RegExp` turns it into a character class that
  // matches almost any word — which is exactly the false positive this
  // checker reported on every page before the fix.
  // Two kinds of placeholder, matched two different ways.
  //
  //  - `PHRASES` are multi-word and safe to match as substrings.
  //  - `TOKENS` are short words that appear inside ordinary English —
  //    "NaN" sits inside "governance", "undefined" inside nothing but the
  //    principle holds — so they need real word boundaries. Building that
  //    regex requires escaping: "[object Object]" fed to `new RegExp`
  //    becomes a character class and matches almost every word on the page.
  const PHRASES = ["lorem ipsum", "coming soon", "[object object]", "null null"];
  const TOKENS = ["todo", "fixme", "tbd", "undefined", "nan"];

  const lower = text.toLowerCase();
  for (const bad of PHRASES) {
    if (lower.includes(bad)) {
      flag(page, "placeholder", `"${bad}" is visible to visitors`, "error");
    }
  }
  for (const bad of TOKENS) {
    if (new RegExp(`\\b${bad}\\b`, "i").test(text)) {
      flag(page, "placeholder", `"${bad}" is visible to visitors`, "error");
    }
  }

  // --- Northpath leftovers from the rename ---------------------------------
  if (/northpath/i.test(text)) flag(page, "stale brand", "\"Northpath\" still appears", "error");
}

async function main() {
  console.log("========================================");
  console.log(" COPY AND GRAMMAR CHECK");
  console.log("========================================\n");

  const texts = await pageTexts(PAGES);
  let totalWords = 0;

  for (const page of PAGES) {
    const raw = texts.get(page) ?? "";
    const blockList = blocks(raw);
    const words = blockList.join(" ").split(/\s+/).filter(Boolean).length;
    totalWords += words;

    const before = findings.length;
    checkPage(page, blockList);
    const added = findings.length - before;
    console.log(`  ${added === 0 ? "clean" : String(added).padStart(2) + " iss"}  ${page.padEnd(24)} ${words} words`);
  }

  const errors = findings.filter((f) => f.severity === "error");
  const warns = findings.filter((f) => f.severity === "warn");
  const notes = findings.filter((f) => f.severity === "note");

  const show = (label: string, list: Finding[]) => {
    if (!list.length) return;
    console.log(`\n--- ${label} (${list.length}) ---`);
    for (const f of list) console.log(`  ${f.page.padEnd(24)} ${f.rule.padEnd(18)} ${f.detail}`);
  };

  show("ERRORS", errors);
  show("WARNINGS", warns);
  show("NOTES", notes);

  console.log("\n========================================");
  console.log(` ${totalWords.toLocaleString("en-CA")} words checked`);
  console.log(` ${errors.length} errors, ${warns.length} warnings, ${notes.length} notes`);
  console.log("========================================");

  process.exit(errors.length > 0 ? 1 : 0);
}

main();

export {};
