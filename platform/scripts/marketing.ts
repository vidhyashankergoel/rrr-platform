/**
 * MARKETING CLI
 *
 *   npx tsx scripts/marketing.ts team        who is on the line, and their charters
 *   npx tsx scripts/marketing.ts plan        compose the next three posts into the queue
 *   npx tsx scripts/marketing.ts og          rebuild the site's link-preview image
 *   npx tsx scripts/marketing.ts analytics   what actually performed, from LinkedIn's export
 *
 * `plan` writes to `marketing/queue/`, which is committed. That is deliberate:
 * a queue in the repository is reviewed in a pull request, with the diff
 * showing exactly what is about to go out under the company name. A queue in
 * a database is reviewed by nobody.
 */

import { mkdirSync, writeFileSync, readdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { plan, roster, type Finished } from "../src/lib/marketing/pipeline";
import { ogCard } from "../src/lib/marketing/cards";
import { readReport } from "../src/lib/marketing/analytics";
import { credentialsPresent } from "../src/lib/marketing/publish";

const QUEUE = "marketing/queue";

/** Angle ids already queued, so the strategist never repeats one. */
function alreadyUsed(): string[] {
  if (!existsSync(QUEUE)) return [];
  return readdirSync(QUEUE)
    .filter((f) => f.endsWith(".md"))
    .map((f) => readFileSync(join(QUEUE, f), "utf8"))
    .flatMap((body) => /^angle:\s*(\S+)$/m.exec(body)?.[1] ?? []);
}

function front(post: Finished): string {
  return [
    "---",
    `date: ${post.date}`,
    `angle: ${post.angleId}`,
    `pillar: ${post.pillar}`,
    `image: ${post.imageName ?? "none"}`,
    `status: awaiting-review`,
    "---",
    "",
    "<!-- Everything below the rule is the post, exactly as it will appear. -->",
    "<!-- Edit it freely. Nothing publishes this; a person does.          -->",
    "",
    post.alt ? `**Alt text for the image:** ${post.alt}\n` : "",
    "---",
    "",
    post.text,
    "",
    "---",
    "",
    "How it was built:",
    ...post.trail.map((t) => `  - ${t}`),
    "",
  ].join("\n");
}

function cmdPlan() {
  const used = alreadyUsed();
  const run = plan(new Date(), used, 3);

  mkdirSync(QUEUE, { recursive: true });

  for (const post of run.made) {
    const stem = `${post.date}-${post.angleId}`;
    writeFileSync(join(QUEUE, `${stem}.md`), front(post));
    if (post.svg && post.imageName) {
      writeFileSync(join(QUEUE, post.imageName), post.svg);
    }
    console.log(`  queued  ${stem}${post.imageName ? "  (+ image)" : ""}`);
  }

  for (const no of run.rejected) {
    console.log(`  BLOCKED ${no.date} at ${no.stage}:`);
    for (const r of no.reasons) console.log(`            ${r}`);
  }

  console.log(`\n  ${run.made.length} queued, ${run.rejected.length} blocked`);
  console.log(`  ${used.length} angles already used`);

  const creds = credentialsPresent();
  console.log(
    creds.ok
      ? "  LinkedIn credentials present - publishing still needs an explicit human confirm"
      : `  Not configured to publish (${creds.missing.join(", ")}) - the queue is for pasting by hand`,
  );
}

async function cmdOg() {
  const card = ogCard();
  mkdirSync("public", { recursive: true });

  // Rasterise if sharp is available. It ships with Next, but this must not
  // become a hard build dependency - so the PNG is committed to the
  // repository and nothing at build or request time needs to render it.
  //
  // The SVG is only written when rasterisation failed, so that `public/` does
  // not carry a second copy of the same image that nothing references.
  try {
    const { default: sharp } = await import("sharp");
    await sharp(Buffer.from(card.svg)).png().toFile("public/og.png");
    console.log(`  public/og.png written (${card.width}x${card.height})`);
  } catch {
    writeFileSync("public/og.svg", card.svg);
    console.log("  sharp unavailable - wrote public/og.svg; convert it to og.png before committing");
  }
}

function cmdTeam() {
  console.log("\n  The line, in order:\n");
  for (const [i, a] of roster().entries()) {
    console.log(`  ${i + 1}. ${a.name}  (${a.role})`);
    console.log(`     ${a.charter}\n`);
  }
}

function cmdAnalytics() {
  const report = readReport();
  if (!report.available) {
    console.log(`  ${report.reason}`);
    return;
  }
  console.log(`\n  ${report.posts.length} posts in the export\n`);
  if (!report.byPillar.length) {
    console.log("  None carry a campaign tag yet, so none can be traced to a pillar.");
    console.log("  Posts queued by this system are tagged; earlier ones are not.");
    return;
  }
  for (const p of report.byPillar) {
    console.log(`  ${(p.medianRate * 100).toFixed(2)}%  ${p.pillar}  (${p.posts} posts)`);
  }
}

const command = process.argv[2] ?? "plan";
const commands: Record<string, () => void | Promise<void>> = {
  plan: cmdPlan,
  og: cmdOg,
  team: cmdTeam,
  analytics: cmdAnalytics,
};

const run = commands[command];
if (!run) {
  console.error(`unknown command "${command}" - expected one of ${Object.keys(commands).join(", ")}`);
  process.exit(1);
}
void (async () => {
  await run();
})();
