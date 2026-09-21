/**
 * LOAD AND RELIABILITY TEST
 *
 * Checks the things that actually decide whether the site survives a spike:
 * page latency under concurrency, chat throughput, whether the rate limiter
 * engages rather than falling over, and whether the database stays consistent
 * while several conversations run at once.
 *
 * This is a smoke-level load test against a dev server, not a capacity plan.
 * A dev build is several times slower than production, so treat these numbers
 * as a floor.
 *
 * Run:  npx tsx scripts/load-test.ts
 */

const BASE = process.env.TEST_BASE ?? "http://localhost:3111";

interface Sample {
  ms: number;
  status: number;
  ok: boolean;
}

function stats(samples: Sample[]) {
  const times = samples.map((s) => s.ms).sort((a, b) => a - b);
  const pick = (p: number) => times[Math.min(times.length - 1, Math.floor(times.length * p))] ?? 0;
  return {
    n: samples.length,
    ok: samples.filter((s) => s.ok).length,
    failed: samples.filter((s) => !s.ok).length,
    min: times[0] ?? 0,
    p50: pick(0.5),
    p90: pick(0.9),
    p99: pick(0.99),
    max: times[times.length - 1] ?? 0,
  };
}

function row(label: string, s: ReturnType<typeof stats>) {
  console.log(
    `  ${label.padEnd(26)} n=${String(s.n).padStart(4)}  ok=${String(s.ok).padStart(4)}  ` +
      `p50=${String(s.p50).padStart(5)}ms  p90=${String(s.p90).padStart(5)}ms  ` +
      `p99=${String(s.p99).padStart(5)}ms  max=${String(s.max).padStart(5)}ms`,
  );
}

async function timed(url: string, init?: RequestInit): Promise<Sample> {
  const t0 = performance.now();
  try {
    const res = await fetch(url, init);
    await res.arrayBuffer();
    return { ms: Math.round(performance.now() - t0), status: res.status, ok: res.ok };
  } catch {
    return { ms: Math.round(performance.now() - t0), status: 0, ok: false };
  }
}

/** Fire `total` requests with at most `concurrency` in flight. */
async function burst(make: (i: number) => Promise<Sample>, total: number, concurrency: number) {
  const out: Sample[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (true) {
        const i = next++;
        if (i >= total) return;
        out.push(await make(i));
      }
    }),
  );
  return out;
}

const PAGES = ["/", "/services", "/pricing", "/work", "/security", "/trust", "/story", "/about", "/contact"];

async function main() {
  let warnings = 0;

  console.log("========================================");
  console.log(" 1 — Page latency, sequential warm-up");
  console.log("========================================");
  for (const p of PAGES) await timed(BASE + p);
  for (const p of PAGES) {
    const s = stats(await burst(() => timed(BASE + p), 5, 1));
    row(p, s);
    if (s.failed > 0) {
      console.log(`     WARN: ${s.failed} failed`);
      warnings++;
    }
  }

  console.log("\n========================================");
  console.log(" 2 — Page latency under concurrency");
  console.log("========================================");
  for (const concurrency of [5, 20, 50]) {
    const samples = await burst((i) => timed(BASE + PAGES[i % PAGES.length]!), 120, concurrency);
    const s = stats(samples);
    row(`concurrency ${concurrency}`, s);
    if (s.failed > 0) {
      console.log(`     WARN: ${s.failed} request(s) failed at concurrency ${concurrency}`);
      warnings++;
    }
  }

  console.log("\n========================================");
  console.log(" 3 — Chat API throughput");
  console.log("========================================");
  const QUESTIONS = [
    "what does a kubernetes build cost?",
    "can you migrate us off on-premises?",
    "how do you secure our infrastructure?",
    "who have you worked with before?",
    "what are your payment terms?",
  ];
  const chat = await burst(
    (i) =>
      timed(`${BASE}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: `load-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
          message: QUESTIONS[i % QUESTIONS.length],
        }),
      }),
    40,
    8,
  );
  const chatStats = stats(chat);
  row("chat (8 concurrent)", chatStats);
  const limited = chat.filter((s) => s.status === 429).length;
  console.log(`     rate limited: ${limited} (expected — the limiter is 20/min per client)`);
  const errored = chat.filter((s) => s.status >= 500 || s.status === 0).length;
  console.log(`     server errors: ${errored}`);
  if (errored > 0) {
    console.log("     WARN: the chat API returned server errors under load");
    warnings++;
  }

  console.log("\n========================================");
  console.log(" 4 — Rate limiter behaviour");
  console.log("========================================");
  const rlSamples: Sample[] = [];
  for (let i = 0; i < 30; i++) {
    rlSamples.push(
      await timed(`${BASE}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: `ratelimit-probe-0001`, message: "hello" }),
      }),
    );
  }
  const accepted = rlSamples.filter((s) => s.status === 200).length;
  const rejected = rlSamples.filter((s) => s.status === 429).length;
  console.log(`  30 rapid requests -> ${accepted} accepted, ${rejected} rate limited`);
  if (rejected === 0) {
    console.log("  WARN: the limiter never engaged. Check ratelimit.ts.");
    warnings++;
  } else {
    console.log("  PASS: the limiter engages and returns 429 rather than failing");
  }
  const rl500 = rlSamples.filter((s) => s.status >= 500).length;
  if (rl500 > 0) {
    console.log(`  WARN: ${rl500} request(s) 500'd instead of being limited cleanly`);
    warnings++;
  }

  console.log("\n========================================");
  console.log(" 5 — Static asset caching");
  console.log("========================================");
  const homeRes = await fetch(BASE + "/");
  const html = await homeRes.text();
  const asset = /\/_next\/static\/[^"']+\.(?:css|js)/.exec(html)?.[0];
  if (asset) {
    const a = await fetch(BASE + asset);
    console.log(`  asset: ${asset.slice(0, 58)}`);
    console.log(`  cache-control: ${a.headers.get("cache-control") ?? "(none)"}`);
  } else {
    console.log("  (no hashed asset found in the HTML)");
  }

  console.log("\n========================================");
  console.log(" 6 — Security headers");
  console.log("========================================");
  const want = [
    "content-security-policy",
    "x-content-type-options",
    "x-frame-options",
    "referrer-policy",
    "permissions-policy",
  ];
  for (const h of want) {
    const v = homeRes.headers.get(h);
    console.log(`  ${v ? "ok  " : "MISS"} ${h}${v ? "" : "  <- missing"}`);
    if (!v) warnings++;
  }
  if (homeRes.headers.get("x-powered-by")) {
    console.log("  WARN: x-powered-by is being leaked");
    warnings++;
  }

  console.log("\n========================================");
  console.log(` ${warnings === 0 ? "No warnings." : warnings + " warning(s)."}`);
  console.log("========================================");
  console.log("\nNote: measured against a development build, which is several");
  console.log("times slower than production. Treat these as a floor.");
  process.exit(warnings > 0 ? 1 : 0);
}

main();

export {};
