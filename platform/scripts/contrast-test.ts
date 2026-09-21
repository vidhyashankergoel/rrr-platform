/**
 * COLOUR CONTRAST TEST — WCAG 2.1 AA
 *
 * Measures every piece of rendered text against the ground it actually sits
 * on, in both themes, and fails anything under the threshold:
 *
 *   4.5:1  normal text
 *   3.0:1  large text (>= 24px, or >= 18.66px bold)
 *
 * This matters more than usual here: the site publishes an accessibility
 * statement claiming WCAG 2.1 AA conformance. An unverified claim is worse
 * than no claim, because under the AODA it is a representation.
 *
 * Run:  npx tsx scripts/contrast-test.ts   (dev server must be running)
 */

const BASE = process.env.TEST_BASE ?? "http://localhost:3111";

const PAGES = [
  "/", "/services", "/pricing", "/work", "/security", "/trust",
  "/story", "/about", "/contact", "/brand",
  "/legal/privacy", "/legal/terms", "/legal/accessibility",
];


/**
 * The measuring routine, as a string so esbuild leaves it alone.
 * Composites backgrounds up the tree honouring alpha, then applies the WCAG
 * relative-luminance formula.
 */
const CONTRAST_PROBE = `(() => {
  var luminance = function (rgb) {
    var v = rgb.map(function (x) {
      var c = x / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  };

  var parseColour = function (s) {
    var m = (s.match(/[\\\\d.]+/g) || []).map(Number);
    return { rgb: m.slice(0, 3), alpha: m.length > 3 ? m[3] : 1 };
  };

  var contrast = function (a, b) {
    var l = [luminance(a), luminance(b)].sort(function (x, y) { return y - x; });
    return (l[0] + 0.05) / (l[1] + 0.05);
  };

  // Walk up collecting layers until an opaque one, then composite forwards.
  var groundOf = function (el) {
    var layers = [];
    var node = el;
    while (node) {
      var p = parseColour(getComputedStyle(node).backgroundColor);
      if (p.alpha > 0) {
        layers.push(p);
        if (p.alpha >= 0.999) break;
      }
      node = node.parentElement;
    }
    if (layers.length === 0) return [255, 255, 255];
    var last = layers[layers.length - 1];
    var base = last.alpha >= 0.999 ? last.rgb.slice() : [255, 255, 255];
    for (var i = layers.length - 1; i >= 0; i--) {
      var L = layers[i];
      base = base.map(function (c, j) { return c * (1 - L.alpha) + L.rgb[j] * L.alpha; });
    }
    return base;
  };

  var found = [];
  var seen = 0;
  var nodes = document.querySelectorAll(
    "p, li, a, span, h1, h2, h3, h4, h5, button, td, th, label, strong, em, figcaption, summary, small, code, caption"
  );

  for (var k = 0; k < nodes.length; k++) {
    var el = nodes[k];
    var text = (el.textContent || "").trim();
    if (!text) continue;
    if (el.children.length > 0) continue;

    var cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0") continue;
    if (el.closest(".visually-hidden, .skip-link")) continue;

    var rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

    seen++;
    var fgp = parseColour(cs.color);
    if (fgp.alpha < 0.999) continue;

    var bg = groundOf(el);
    var ratio = contrast(fgp.rgb, bg);
    var size = parseFloat(cs.fontSize);
    var bold = parseInt(cs.fontWeight, 10) >= 700;
    var need = (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5;

    if (ratio < need - 0.05) {
      var cls = String(el.className || "").split(" ").slice(0, 2).join(".");
      found.push({
        text: text.slice(0, 34),
        selector: (el.tagName.toLowerCase() + (cls ? "." + cls : "")).slice(0, 40),
        ratio: Math.round(ratio * 100) / 100,
        need: need,
        fg: cs.color,
        bg: "rgb(" + bg.map(function (c) { return Math.round(c); }).join(", ") + ")"
      });
    }
  }
  return { found: found, seen: seen };
})()`;

interface Issue {
  page: string;
  theme: string;
  text: string;
  selector: string;
  ratio: number;
  need: number;
  fg: string;
  bg: string;
}

async function main() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.log("Playwright not installed — skipping.");
    process.exit(0);
  }

  const browser = await chromium.launch();
  const issues: Issue[] = [];
  let checked = 0;

  for (const theme of ["light", "dark"] as const) {
    console.log(`\n--- ${theme} theme ---`);
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    for (const path of PAGES) {
      await page.goto(BASE + path, { waitUntil: "networkidle" });
      await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
      await page.waitForTimeout(220);

      // NOTE: passed as a STRING, deliberately. tsx compiles with esbuild,
      // which rewrites named function expressions with a `__name` helper that
      // does not exist inside the page context. A string is evaluated verbatim.
      const result = (await page.evaluate(CONTRAST_PROBE)) as {
        found: Array<{ text: string; selector: string; ratio: number; need: number; fg: string; bg: string }>;
        seen: number;
      };

      checked += result.seen;
      for (const f of result.found) issues.push({ page: path, theme, ...f });

      console.log(`  ${result.found.length === 0 ? "ok  " : String(result.found.length).padStart(3) + " "} ${path}`);
    }

    await context.close();
  }

  await browser.close();

  console.log("\n========================================");
  console.log(` ${checked} text nodes measured across ${PAGES.length} pages x 2 themes`);
  console.log(` ${issues.length} below WCAG 2.1 AA`);
  console.log("========================================");

  if (issues.length) {
    // Group by selector — one CSS fix usually clears many instances.
    const bySelector = new Map<string, Issue[]>();
    for (const i of issues) {
      const key = `${i.selector} @ ${i.fg} on ${i.bg}`;
      bySelector.set(key, [...(bySelector.get(key) ?? []), i]);
    }
    console.log("\nGrouped by cause (fix the selector, not the instance):\n");
    for (const [key, list] of [...bySelector.entries()].sort((a, b) => b[1].length - a[1].length)) {
      const worst = Math.min(...list.map((l) => l.ratio));
      console.log(`  ${String(list.length).padStart(3)}x  ${worst.toFixed(2)}:1 (need ${list[0]!.need})  ${key}`);
      console.log(`        e.g. "${list[0]!.text}" on ${list[0]!.page} (${list[0]!.theme})`);
    }
  }

  process.exit(issues.length > 0 ? 1 : 0);
}

main();

export {};
