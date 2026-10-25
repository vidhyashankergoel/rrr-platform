/**
 * THE CUSTOM POSTER — the `diy` backend for the linkedin-* skills
 *
 * The skills support three publishing tiers: `manual` (copy and paste),
 * `publora` (a third-party scheduler), and `diy` — a command the operator has
 * written. This is that command.
 *
 *   export LINKEDIN_SKILLS_CUSTOM_POSTER="npx tsx /path/to/scripts/linkedin-poster.ts"
 *
 * The skills then invoke it as `<cmd> <kind> <target_url>` with the payload on
 * stdin, and read JSON back on stdout.
 *
 * WHY THIS EXISTS RATHER THAN JUST USING PUBLORA
 * ----------------------------------------------
 * Publora works, and for many people it is the right answer — two minutes of
 * setup against a LinkedIn developer application that takes days. The reason
 * this path exists anyway is that it keeps two things in our hands:
 *
 *   1. The compliance gate runs on the real outgoing text, here, immediately
 *      before the API call. A post drafted by a skill has not been through
 *      `screen()` — the skills know LinkedIn's rules, not ours, and nothing in
 *      them knows which client names may never appear.
 *
 *   2. The LinkedIn credential stays with us. Routing publishing through a
 *      third party means granting it posting rights to the company page, and
 *      that authorisation outlives any one post.
 *
 * It refuses by default. Credentials have to exist, and a human has to confirm
 * — the same two gates `publish.ts` already enforces, because a skill calling
 * this unattended is exactly the loop that posts a backlog nobody read.
 */

import { readFileSync } from "node:fs";
import { screen } from "../src/lib/marketing/compliance";
import { checkPost, errorsOf } from "../src/lib/marketing/guidelines";
import { publish, credentialsPresent } from "../src/lib/marketing/publish";
import type { Finished } from "../src/lib/marketing/pipeline";

interface SkillPayload {
  kind: "post" | "comment" | "reply" | "reshare";
  draft_text?: string;
  target_url?: string;
  [k: string]: unknown;
}

/** Everything this writes to stdout is JSON — the caller parses it. */
function emit(body: Record<string, unknown>): never {
  process.stdout.write(JSON.stringify(body, null, 2) + "\n");
  process.exit(body.ok === true ? 0 : 1);
}

function readStdin(): string {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function main() {
  const kind = (process.argv[2] ?? "post") as SkillPayload["kind"];
  const raw = readStdin();

  let payload: SkillPayload;
  try {
    payload = raw.trim() ? (JSON.parse(raw) as SkillPayload) : { kind };
  } catch (err) {
    emit({ ok: false, stage: "parse", error: `payload was not JSON: ${String(err)}` });
  }

  const text = (payload!.draft_text ?? "").trim();
  if (!text) emit({ ok: false, stage: "parse", error: "no draft_text in the payload" });

  // --- Our gate, on the real outgoing text -------------------------------
  // This is the whole reason this file exists. The skills apply LinkedIn's
  // rules; they have never heard of our client list.
  const violations = screen(text);
  if (violations.length) {
    emit({
      ok: false,
      stage: "compliance",
      error: "blocked by the compliance gate",
      violations: violations.map((v) => ({ rule: v.rule, detail: v.detail, found: v.found })),
    });
  }

  // --- LinkedIn's own published rules ------------------------------------
  const hashtags = text.match(/#[A-Za-z][A-Za-z0-9]*/g) ?? [];
  const issues = errorsOf(
    checkPost({ text, hashtags, hasImage: false, link: payload!.target_url }),
  );
  if (issues.length) {
    emit({
      ok: false,
      stage: "guidelines",
      error: "blocked by LinkedIn's published rules",
      issues: issues.map((i) => ({ rule: i.rule, basis: i.basis, detail: i.detail })),
    });
  }

  // --- Credentials --------------------------------------------------------
  const creds = credentialsPresent();
  if (!creds.ok) {
    emit({
      ok: false,
      stage: "credentials",
      error: `not configured to publish — missing ${creds.missing.join(", ")}`,
      remedy:
        "Register a LinkedIn developer app, request the Community Management API, " +
        "and grant w_organization_social against the company page.",
      draft_was_clean: true,
    });
  }

  // --- The human gate -----------------------------------------------------
  // `publish()` requires an explicit confirm and nothing here can supply one:
  // this process is started BY a skill, not by a person. That is deliberate.
  // Passing confirm:true here would hand every skill a silent publish button
  // and defeat the gate that `marketing-test.ts` asserts cannot be bypassed.
  const confirmed = process.argv.includes("--confirm");

  void publish(
    {
      date: new Date().toISOString().slice(0, 10),
      angleId: `skill-${kind}`,
      pillar: "skill-authored",
      text,
      hashtags,
      link: payload!.target_url ?? "",
      trail: [`custom-poster: ${kind}`, "compliance: clear", "guidelines: clean"],
    } satisfies Finished,
    { confirm: confirmed, dryRun: !confirmed },
  ).then((outcome) => {
    emit({
      ok: outcome.status === "published",
      stage: "publish",
      status: outcome.status,
      summary: outcome.summary,
      urn: outcome.urn,
      note: confirmed
        ? undefined
        : "Dry run. Nothing was posted. Re-run with --confirm, from a person, to publish.",
    });
  });
}

main();
