/**
 * RESPONSIVE / LAYOUT REGRESSION TEST
 *
 * Renders every page at every target viewport and asserts the things that
 * actually break: horizontal overflow, tap targets below the WCAG 2.1 AA
 * minimum, and text that has collapsed to an unreadable size.
 *
 * Needs a headless browser. If Playwright is not installed the script says so
 * and exits 0 rather than failing a pipeline for a missing optional tool.
 *
 * Run:  npx tsx scripts/responsive-test.ts
 */

const BASE = process.env.TEST_BASE ?? "http://localhost:3111";

const VIEWPORTS = [
  { name: "Galaxy Fold (closed)", width: 280, height: 653 },
  { name: "iPhone SE", width: 375, height: 667 },
  { name: "iPhone 14 Pro", width: 393, height: 852 },
  { name: "Pixel 8", width: 412, height: 915 },
  { name: "Galaxy Fold (open)", width: 717, height: 512 },
  { name: "iPad mini", width: 768, height: 1024 },
  { name: "iPad Pro 11", width: 834, height: 1194 },
  { name: "iPad Pro 12.9", width: 1024, height: 1366 },
  { name: "Laptop 13in", width: 1280, height: 800 },
  { name: "Laptop 15in", width: 1440, height: 900 },
  { name: "Desktop", width: 1920, height: 1080 },
  { name: "Ultrawide", width: 2560, height: 1080 },
];

const PAGES = [
  "/",
  "/services",
  "/pricing",
  "/work",
  "/security",
  "/trust",
  "/story",
  "/about",
  "/contact",
  "/legal/privacy",
];

async function main() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.log("Playwright not installed — skipping.");
    console.log("Install with:  npm i -D playwright && npx playwright install chromium");
    process.exit(0);
  }

  const browser = await chromium.launch();
  let pass = 0;
  let fail = 0;
  const failures: string[] = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n--- ${vp.name}  ${vp.width}x${vp.height} ---`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    for (const path of PAGES) {
      await page.goto(BASE + path, { waitUntil: "networkidle" });

      const report = await page.evaluate(() => {
        const doc = document.documentElement;

        // 1. Horizontal overflow — the single most common responsive defect.
        const overflowBy = doc.scrollWidth - doc.clientWidth;

        // 2. Elements actually sticking out past the viewport.
        const offenders: string[] = [];
        for (const el of Array.from(document.body.querySelectorAll("*"))) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (r.right > doc.clientWidth + 2) {
            const node = el as HTMLElement;
            // An element inside a deliberately scrollable container is fine.
            // Containers that scroll horizontally on purpose: a wide data
            // table or a process diagram is allowed to be wider than a phone,
            // provided it sits in its own scroller and the page does not move.
            const scroller = node.closest(
              ".table-scroll, .compare, .flow, .ai-log, .term__body, .ai-actions, .chips",
            );
            if (scroller) continue;
            offenders.push(
              `${node.tagName.toLowerCase()}${node.className ? "." + String(node.className).split(" ")[0] : ""} (+${Math.round(r.right - doc.clientWidth)}px)`,
            );
            if (offenders.length >= 3) break;
          }
        }

        // 3. Target size.
        //    WCAG 2.2 AA (2.5.8) sets a 24x24 CSS px floor everywhere.
        //    On touch-sized viewports we hold to 44x44 (WCAG 2.1 AAA 2.5.5),
        //    because a link that is fine with a mouse is not fine with a thumb.
        const touch = doc.clientWidth <= 860;
        const floor = touch ? 44 : 24;
        const small: string[] = [];
        for (const el of Array.from(
          document.querySelectorAll<HTMLElement>("a, button, input, select, textarea"),
        )) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          // Skip the skip-link, inline feedback links, and anything clipped
          // from view (honeypots, off-screen menus).
          if (el.closest(".skip-link, .ai-rate, .visually-hidden")) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === "hidden") continue;
          // Not interactive right now (a hidden back-to-top button, a closed
          // menu) — it is not a target, and a transform would mis-measure it.
          if (cs.pointerEvents === "none") continue;
          if (el.getAttribute("aria-hidden") === "true") continue;
          // WCAG 2.5.8 "Inline" exception: a target inside a sentence is
          // exempt, because enlarging it would break the line box.
          if (el.tagName === "A" && el.closest("p, .acc__body, .approval, .check-list li")) continue;
          // WCAG 2.5.8 "Spacing" exception: a checkbox or radio whose label
          // forms a large clickable row already satisfies the requirement.
          if (
            (el as HTMLInputElement).type === "checkbox" ||
            (el as HTMLInputElement).type === "radio"
          ) {
            const row = el.closest("label, .field--check, .opt, .ai-consent");
            if (row && row.getBoundingClientRect().height >= floor) continue;
          }
          if (r.height < floor - 0.5 || r.width < floor - 0.5) {
            small.push(
              `${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 18)}" ${Math.round(r.width)}x${Math.round(r.height)}`,
            );
            if (small.length >= 3) break;
          }
        }

        // 4. Unreadably small body text.
        const tiny: string[] = [];
        for (const el of Array.from(document.querySelectorAll<HTMLElement>("p, li, td"))) {
          const size = parseFloat(getComputedStyle(el).fontSize);
          if (size > 0 && size < 11 && (el.textContent ?? "").trim().length > 20) {
            tiny.push(`${el.tagName.toLowerCase()} ${size.toFixed(1)}px`);
            if (tiny.length >= 2) break;
          }
        }

        return { overflowBy, offenders, small, tiny };
      });

      const problems: string[] = [];
      if (report.overflowBy > 2) problems.push(`page scrolls sideways by ${report.overflowBy}px`);
      if (report.offenders.length) problems.push(`overflow: ${report.offenders.join(", ")}`);
      if (report.small.length) problems.push(`tap target: ${report.small.join(", ")}`);
      if (report.tiny.length) problems.push(`tiny text: ${report.tiny.join(", ")}`);

      if (problems.length === 0) {
        pass++;
        console.log(`  ok    ${path}`);
      } else {
        fail++;
        const line = `${vp.name} ${path}: ${problems.join(" | ")}`;
        failures.push(line);
        console.log(`  FAIL  ${path}`);
        for (const p of problems) console.log(`          ${p}`);
      }
    }

    await context.close();
  }

  await browser.close();

  console.log("\n========================================");
  console.log(` ${pass} passed, ${fail} failed across ${VIEWPORTS.length} viewports x ${PAGES.length} pages`);
  console.log("========================================");
  if (failures.length) {
    console.log("\nFAILURES:");
    for (const f of failures) console.log("  - " + f);
  }
  process.exit(fail > 0 ? 1 : 0);
}

main();

export {};
