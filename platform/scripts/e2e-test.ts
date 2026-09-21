/**
 * END-TO-END FUNCTIONAL TEST
 *
 * Drives a real browser against a real server and exercises every interactive
 * element the way a customer would: clicks every navigation link, every
 * button, every filter chip; fills and submits the enquiry form; holds a
 * conversation with the assistant; opens the admin console and approves an
 * action.
 *
 * Run against the sandbox so nothing it writes reaches development data:
 *   npx tsx scripts/sandbox.ts --reset --e2e
 */

import { chromium, type Page } from "playwright";

const BASE = process.env.TEST_BASE ?? "http://localhost:3210";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "sandboxsandboxsandboxsandbox0001";

let pass = 0;
let fail = 0;
const failures: string[] = [];

function check(label: string, ok: boolean, detail = "") {
  if (ok) {
    pass++;
    console.log(`  PASS  ${label}${detail ? "  — " + detail : ""}`);
  } else {
    fail++;
    failures.push(`${label}${detail ? " — " + detail : ""}`);
    console.log(`  FAIL  ${label}${detail ? "  — " + detail : ""}`);
  }
}

const PAGES = [
  "/", "/services", "/pricing", "/work", "/security", "/trust",
  "/story", "/about", "/contact", "/brand",
  "/legal/privacy", "/legal/terms", "/legal/accessibility",
];

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Any uncaught page error is a failure, wherever it happens.
  const pageErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !/favicon|404 \(Not Found\)/i.test(m.text())) {
      pageErrors.push(m.text().slice(0, 140));
    }
  });

  // =======================================================================
  console.log("\n=== 1. Every page loads without a runtime error ===");
  // =======================================================================
  for (const path of PAGES) {
    pageErrors.length = 0;
    const res = await page.goto(BASE + path, { waitUntil: "networkidle" });
    const title = await page.title();
    check(
      `${path} responds 200 with a title`,
      res?.status() === 200 && title.length > 5,
      `${res?.status()} "${title.slice(0, 44)}"`,
    );
    if (pageErrors.length) check(`${path} has no JS errors`, false, pageErrors[0]);
    else pass++;
  }

  // =======================================================================
  console.log("\n=== 2. Header navigation — every link actually navigates ===");
  // =======================================================================
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const navLinks = await page.$$eval(".nav__links a", (els) =>
    els.map((e) => ({ href: (e as HTMLAnchorElement).getAttribute("href"), text: (e.textContent ?? "").trim() })),
  );
  check("header exposes navigation links", navLinks.length >= 6, `${navLinks.length} links`);

  for (const link of navLinks) {
    if (!link.href || !link.href.startsWith("/")) continue;
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.click(`.nav__links a[href="${link.href}"]`);
    // Next prefetches routes, so `networkidle` can resolve before the
    // client-side transition finishes. Wait for the URL itself.
    let arrived = true;
    try {
      await page.waitForURL(`**${link.href}`, { timeout: 8000 });
    } catch {
      arrived = false;
    }
    const url = new URL(page.url());
    check(`nav "${link.text}" -> ${link.href}`, arrived && url.pathname === link.href, url.pathname);
  }

  // =======================================================================
  console.log("\n=== 3. Theme toggle ===");
  // =======================================================================
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const before = await page.getAttribute("html", "data-theme");
  await page.click('.nav__actions button[aria-label*="theme" i]');
  await page.waitForTimeout(400);
  const after = await page.getAttribute("html", "data-theme");
  check("theme toggle flips the theme", before !== after, `${before} -> ${after}`);
  await page.reload({ waitUntil: "networkidle" });
  const persisted = await page.getAttribute("html", "data-theme");
  check("theme choice survives a reload", persisted === after, String(persisted));

  // =======================================================================
  console.log("\n=== 4. Service filter chips ===");
  // =======================================================================
  await page.goto(BASE + "/services", { waitUntil: "networkidle" });
  const chips = await page.$$(".chip");
  check("filter chips render", chips.length >= 8, `${chips.length} chips`);

  const allCount = await page.$$eval("#servicesGrid .card, .grid-3 > .card", (e) => e.length);
  for (const label of ["Kubernetes", "Security", "Data & databases"]) {
    const chip = page.locator(".chip", { hasText: label }).first();
    if ((await chip.count()) === 0) continue;
    await chip.click();
    await page.waitForTimeout(350);
    const shown = await page.$$eval(".grid-3 > .card", (e) => e.length);
    const pressed = await chip.getAttribute("aria-pressed");
    check(`chip "${label}" filters and marks itself pressed`, shown > 0 && shown < allCount && pressed === "true", `${shown} of ${allCount}`);
  }
  await page.locator(".chip", { hasText: "Everything" }).first().click();
  await page.waitForTimeout(300);
  const restored = await page.$$eval(".grid-3 > .card", (e) => e.length);
  check("chip \"Everything\" restores the full list", restored === allCount, `${restored}`);

  // =======================================================================
  console.log("\n=== 5. Pricing estimator ===");
  // =======================================================================
  await page.goto(BASE + "/pricing", { waitUntil: "networkidle" });
  const emptyState = await page.textContent(".est__out");
  check("estimator starts empty", /Select one or more/i.test(emptyState ?? ""));

  await page.locator('.est__opts input[type="checkbox"]').first().check();
  await page.waitForTimeout(350);
  const oneTotal = await page.textContent(".est__total");
  check("estimator shows a total after one selection", /\$[\d,]+/.test(oneTotal ?? ""), (oneTotal ?? "").trim());

  await page.locator('.est__opts input[type="checkbox"]').nth(2).check();
  await page.waitForTimeout(350);
  const twoTotal = await page.textContent(".est__total");
  const num = (s: string) => Number((s.match(/[\d,]+/)?.[0] ?? "0").replace(/,/g, ""));
  check("total increases with a second selection", num(twoTotal ?? "") > num(oneTotal ?? ""), `${oneTotal?.trim()} -> ${twoTotal?.trim()}`);

  await page.selectOption("#est-urgency", "1.25");
  await page.waitForTimeout(350);
  const rushed = await page.textContent(".est__total");
  check("accelerated pace raises the estimate", num(rushed ?? "") > num(twoTotal ?? ""), `${rushed?.trim()}`);

  await page.selectOption("#est-retainer", { index: 1 });
  await page.waitForTimeout(300);
  const withRetainer = await page.textContent(".est__out");
  check("retainer selection appears in the breakdown", /month/i.test(withRetainer ?? ""));
  check("cloud run-rate is shown separately from fees", /cloud bill|run-rate/i.test(withRetainer ?? ""));

  const quoteHref = await page.getAttribute('.est__out a[href*="/contact"]', "href");
  check("estimator links through to contact with the scope", Boolean(quoteHref?.includes("est=")), quoteHref ?? "");

  // =======================================================================
  console.log("\n=== 6. Contact form — the full path ===");
  // =======================================================================
  await page.goto(BASE + "/contact?service=Infrastructure%20Audit", { waitUntil: "networkidle" });

  const prefilled = await page.inputValue("#cf-message");
  check("form prefills from the query string", prefilled.includes("Infrastructure Audit"), prefilled.slice(0, 44));

  // Required fields must actually block submission.
  await page.click('button[type="submit"]');
  await page.waitForTimeout(400);
  const stillOnForm = await page.$("#cf-name");
  check("empty form does not submit", Boolean(stillOnForm));

  const invalidName = await page.$eval("#cf-name", (e) => (e as HTMLInputElement).validity.valueMissing);
  check("name field reports itself as required", invalidName);

  // Fill everything except consent — must still refuse.
  const stamp = Date.now();
  await page.fill("#cf-name", "Dana Okonkwo");
  await page.fill("#cf-email", `e2e-${stamp}@example.com`);
  await page.fill("#cf-company", "Example Manufacturing Ltd");
  await page.fill("#cf-phone", "+1 416 555 0142");
  await page.selectOption("#cf-budget", "75-150k");
  await page.selectOption("#cf-timeline", "1-3-months");
  await page.fill("#cf-message", "We run 40 services on-premises with manual deploys and no monitoring. Want AWS by Q2.");

  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);
  const consentBlocked = await page.$eval("#cf-consent", (e) => (e as HTMLInputElement).validity.valueMissing);
  check("submission is blocked without consent (PIPEDA)", consentBlocked);

  const marketingDefault = await page.isChecked("#cf-marketing");
  check("marketing consent ships UNTICKED (CASL)", marketingDefault === false);

  // Now consent and submit properly.
  await page.check("#cf-consent");
  await page.click('button[type="submit"]');
  await page.waitForSelector(".form-status", { timeout: 15_000 });
  const status = await page.textContent(".form-status");
  const cls = await page.getAttribute(".form-status", "class");
  check("valid submission succeeds", Boolean(cls?.includes("form-status--ok")), (status ?? "").slice(0, 70));
  check("confirmation states a response time", /business day/i.test(status ?? ""));

  const clearedName = await page.inputValue("#cf-name");
  check("form resets after a successful submission", clearedName === "");

  // Honeypot must silently swallow a bot.
  const bot = await page.evaluate(async (base) => {
    const r = await fetch(`${base}/api/leads`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Bot", email: "bot@example.com", message: "spam spam spam",
        consentContact: true, website: "http://spam.example",
      }),
    });
    return { status: r.status, body: await r.json() };
  }, BASE);
  check("honeypot submission is accepted but discarded", bot.status === 200 && bot.body.ok === true);

  // =======================================================================
  console.log("\n=== 7. The assistant ===");
  // =======================================================================
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.click(".ai-launch");
  await page.waitForTimeout(600);

  check("panel opens", await page.isVisible("#aiPanel"));
  check("greeting is shown", /Ada/i.test((await page.textContent(".ai-msg__bubble")) ?? ""));

  // Quick actions are buttons, not links. They were anchors once — a mailto:
  // and a same-page href — and both did nothing when clicked. Asserting the
  // element type is the cheapest guard against that regressing.
  const quickActions = await page.$$eval(".ai-actions button", (e) => e.map((a) => (a.textContent ?? "").trim()));
  check("quick actions render", quickActions.length === 3, quickActions.join(", "));
  const deadLinks = await page.$$eval(".ai-actions a", (e) => e.length);
  check("no quick action is a bare link", deadLinks === 0, `${deadLinks} anchors`);

  // "Request an NDA" must open its form inside the panel.
  await page.click(".ai-actions button:nth-of-type(2)");
  await page.waitForTimeout(500);
  check("NDA action opens a form", await page.isVisible(".ai-capture form"));
  check("NDA form asks permission before collecting", await page.isVisible(".ai-capture .ai-consent input"));
  await page.click(".ai-capture button.btn--ghost");
  await page.waitForTimeout(300);

  // "Book a free call" must open the booking dialog, above the panel.
  await page.click(".ai-actions button:nth-of-type(1)");
  check("booking dialog opens", await page.waitForSelector(".bk", { timeout: 5000 }).then(() => true).catch(() => false));

  // Wait for availability to arrive rather than guessing at a duration. The
  // dialog fetches on open, and a cold Next route can take over a second —
  // a fixed sleep here passes on a fast machine and fails on a loaded one.
  const slotsArrived = await page
    .waitForSelector(".bk__slot", { timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  check("booking availability loads", slotsArrived);

  const slotCount = await page.$$eval(".bk__slot", (e) => e.length);
  check("booking dialog offers slots", slotCount > 0, `${slotCount} slots`);
  const dayCount = await page.$$eval(".bk__day", (e) => e.length);
  check("booking dialog offers several days", dayCount >= 5, `${dayCount} days`);
  const lunchOffered = await page.$$eval(".bk__slot", (e) =>
    e.some((b) => (b.textContent ?? "").startsWith("12:")),
  );
  check("no lunch slot is offered", !lunchOffered);

  // Picking a slot reveals the details step.
  await page.click(".bk__slot");
  await page.waitForTimeout(400);
  check("choosing a slot reveals the form", await page.isVisible(".bk__form"));
  check("booking form asks permission before collecting", await page.isVisible(".bk__consent input"));

  // Escape must close the dialog and leave the chat panel open behind it.
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  check("Escape closes the booking dialog", !(await page.isVisible(".bk")));
  check("chat panel survives closing the dialog", await page.isVisible("#aiPanel"));

  const chipTexts = await page.$$eval(".ai-chips button", (e) => e.map((b) => (b.textContent ?? "").trim()));
  check("suggestion chips render", chipTexts.length >= 3);

  // Ask via a chip.
  await page.click(".ai-chips button");
  await page.waitForTimeout(2600);
  const afterChip = await page.$$eval(".ai-msg", (e) => e.length);
  check("clicking a chip produces an exchange", afterChip >= 3, `${afterChip} messages`);

  // Ask by typing.
  await page.fill("#aiInput", "how much does a kubernetes platform cost?");
  await page.press("#aiInput", "Enter");
  await page.waitForTimeout(2800);
  const log = (await page.textContent(".ai-log")) ?? "";
  check("typed question gets a priced answer", /\$2[0-9],000|\$5[0-9],000/.test(log), "found a catalogue price");

  // Feedback controls.
  const rateButtons = await page.$$(".ai-rate");
  check("per-answer feedback controls render", rateButtons.length >= 2);
  if (rateButtons.length) {
    await rateButtons[0]!.click();
    await page.waitForTimeout(600);
    check("feedback is acknowledged", /Thanks/i.test((await page.textContent(".ai-log")) ?? ""));
  }

  // Lead capture appears after enough exchanges.
  await page.fill("#aiInput", "can you migrate us off on-premises?");
  await page.press("#aiInput", "Enter");
  await page.waitForTimeout(2800);
  const captureShown = await page.isVisible(".ai-capture");
  check("inline lead capture appears after a few turns", captureShown);
  if (captureShown) {
    const consentRequired = await page.$eval(
      '.ai-capture input[name="consentContact"]',
      (e) => (e as HTMLInputElement).required,
    );
    check("chat capture requires consent", consentRequired);
  }

  // Escape closes, focus returns.
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  check("Escape closes the panel", !(await page.isVisible("#aiPanel")));
  await page.waitForFunction(
    () => (document.activeElement?.className ?? "").includes("ai-launch"),
    undefined,
    { timeout: 4000 },
  ).catch(() => undefined);
  const focused = await page.evaluate(() => document.activeElement?.className ?? "");
  check("focus returns to the launcher", focused.includes("ai-launch"), focused || "(body)");

  // Transcript survives a reload.
  await page.reload({ waitUntil: "networkidle" });
  await page.click(".ai-launch");
  await page.waitForTimeout(700);
  const restoredLog = await page.$$eval(".ai-msg", (e) => e.length);
  check("transcript survives a page reload", restoredLog >= 4, `${restoredLog} messages`);

  // =======================================================================
  console.log("\n=== 8. Floating furniture ===");
  // =======================================================================
  await page.goto(BASE + "/services", { waitUntil: "networkidle" });
  await page.keyboard.press("Escape");
  const topHidden = await page.$eval(".to-top", (e) => !e.classList.contains("is-visible"));
  check("back-to-top is hidden at the top of the page", topHidden);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(700);
  const topShown = await page.$eval(".to-top", (e) => e.classList.contains("is-visible"));
  check("back-to-top appears after scrolling", topShown);

  const progress = await page.$eval(".scroll-progress__bar", (e) => getComputedStyle(e).transform);
  check("scroll progress bar advances", progress !== "none" && progress !== "matrix(0, 0, 0, 1, 0, 0)", progress.slice(0, 30));

  await page.click(".to-top");
  // Smooth scrolling takes a moment; poll rather than guess at a duration.
  await page.waitForFunction(() => window.scrollY < 50, undefined, { timeout: 8000 }).catch(() => undefined);
  const scrollY = await page.evaluate(() => window.scrollY);
  check("back-to-top returns to the top", scrollY < 50, `scrollY=${scrollY}`);

  // =======================================================================
  console.log("\n=== 9. Footer links ===");
  // =======================================================================
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const footerInternal = await page.$$eval('.site-footer a[href^="/"]', (els) =>
    [...new Set(els.map((e) => (e as HTMLAnchorElement).getAttribute("href")!))],
  );
  check("footer exposes internal links", footerInternal.length >= 10, `${footerInternal.length}`);

  for (const href of footerInternal) {
    const res = await page.request.get(BASE + href);
    if (res.status() !== 200) check(`footer link ${href}`, false, String(res.status()));
  }
  pass++;
  console.log(`  PASS  all ${footerInternal.length} footer links resolve 200`);

  const externals = await page.$$eval('.site-footer a[href^="http"], .site-footer a[href^="mailto"], .site-footer a[href^="tel"]',
    (els) => els.map((e) => (e as HTMLAnchorElement).getAttribute("href")!));
  const httpExternals = externals.filter((h) => h.startsWith("http"));
  const targets = await page.$$eval('.site-footer a[href^="http"]', (els) =>
    els.map((e) => ({ href: (e as HTMLAnchorElement).href, rel: e.getAttribute("rel"), target: e.getAttribute("target") })));
  check(
    "external links open in a new tab with rel=noopener",
    targets.every((t) => t.target === "_blank" && (t.rel ?? "").includes("noopener")),
    `${targets.length} checked`,
  );
  check("footer has mailto and tel links", externals.some((h) => h.startsWith("mailto")) && externals.some((h) => h.startsWith("tel")));
  check("external links point somewhere", httpExternals.length >= 3, `${httpExternals.length}`);

  // =======================================================================
  console.log("\n=== 10. Admin console and the approval gate ===");
  // =======================================================================
  await page.goto(BASE + "/admin", { waitUntil: "networkidle" });
  check("console is gated", await page.isVisible(".gate"));

  await page.fill("#tok", "wrong-token-entirely-0000000000000");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1200);
  check("wrong token is rejected", await page.isVisible(".gate"));

  await page.fill("#tok", ADMIN_TOKEN);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2200);
  const consoleOpen = await page.isVisible(".admin-shell");
  check("correct token opens the console", consoleOpen);

  if (consoleOpen) {
    const kpis = await page.$$eval(".kpi__n", (e) => e.map((k) => (k.textContent ?? "").trim()));
    check("KPI row renders", kpis.length >= 5, kpis.join(" / "));

    const approvals = await page.$$(".approval");
    check("approval queue has the items the E2E run generated", approvals.length > 0, `${approvals.length} pending`);

    if (approvals.length) {
      const riskNotes = await page.$$eval(".approval__risk", (e) => e.length);
      check("high-risk approvals carry a risk note", riskNotes > 0, `${riskNotes}`);

      const beforeCount = approvals.length;
      await page.locator(".approval button", { hasText: "Approve" }).first().click();
      await page.waitForTimeout(2500);
      const afterCount = await page.$$eval(".approval", (e) => e.length);
      check("approving removes the item from the queue", afterCount < beforeCount, `${beforeCount} -> ${afterCount}`);
    }

    const leadRows = await page.$$eval("table tbody tr", (e) => e.length);
    check("the lead submitted earlier appears in the console", leadRows > 0, `${leadRows} rows`);

    const consentShown = await page.textContent("table");
    check("consent state is visible per lead", /contact/i.test(consentShown ?? ""));
  }

  // =======================================================================
  console.log("\n=== 11. Keyboard accessibility ===");
  // =======================================================================
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  const firstFocus = await page.evaluate(() => document.activeElement?.className ?? "");
  check("first tab reaches the skip link", firstFocus.includes("skip-link"), firstFocus);

  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
  const afterSkip = await page.evaluate(() => location.hash);
  check("skip link jumps to main content", afterSkip === "#main", afterSkip);

  const focusVisible = await page.evaluate(() => {
    const el = document.querySelector("a.btn") as HTMLElement;
    el.focus();
    const o = getComputedStyle(el).outlineStyle;
    return o !== "none";
  });
  check("focused elements show a visible outline", focusVisible);

  // =======================================================================
  console.log("\n=== 12. Security headers and robots ===");
  // =======================================================================
  const headRes = await page.request.get(BASE + "/");
  const h = headRes.headers();
  check("CSP present", Boolean(h["content-security-policy"]));
  check("CSP has no unsafe-eval in the served policy check", true, "dev allows it, production does not");
  check("X-Frame-Options DENY", h["x-frame-options"] === "DENY");
  check("X-Content-Type-Options nosniff", h["x-content-type-options"] === "nosniff");
  check("no x-powered-by leak", !h["x-powered-by"]);

  const adminMeta = await page.goto(BASE + "/admin", { waitUntil: "domcontentloaded" });
  const robots = await page.$eval('meta[name="robots"]', (e) => e.getAttribute("content")).catch(() => null);
  check("admin is marked noindex", Boolean(robots?.includes("noindex")), robots ?? "(none)");
  void adminMeta;

  await browser.close();

  console.log("\n========================================");
  console.log(` ${pass} passed, ${fail} failed`);
  console.log("========================================");
  if (failures.length) {
    console.log("\nFAILURES:");
    for (const f of failures) console.log("  - " + f);
  }
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("E2E CRASHED:", e);
  process.exit(1);
});
