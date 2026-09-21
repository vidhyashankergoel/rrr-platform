/**
 * BRIDGE TO THE FIRM'S EXISTING AGENT SETUP
 *
 * The team already runs a Claude Code configuration (`.claude/` with agents,
 * skills, rules and commands) alongside an Obsidian vault used as the shared
 * brain. This module is the seam between this web application and that setup.
 *
 * It deliberately writes FILES rather than invoking anything. Two reasons:
 *
 *  1. A web request must never be able to start an autonomous agent that
 *     touches infrastructure. Dropping a work package on disk means a human
 *     opens it, reads it, and decides to run it.
 *  2. Files are diffable, reviewable and survive the process. A queue that
 *     lives in memory does not.
 *
 * Layout produced:
 *
 *   <AGENT_INBOX>/
 *     <engagement-id>/
 *       <stage>-<agent>.md        ← the work package, ready to hand to an agent
 *       manifest.json             ← machine-readable index
 *
 *   <OBSIDIAN_VAULT>/Engagements/
 *     <client> - <engagement-id>.md   ← the note the vault graph links from
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import type { WorkPackage } from "../agents/pipeline";
import { agentByKey } from "../agents/delivery-org";

const AGENT_INBOX = process.env.AGENT_INBOX ?? path.join(process.cwd(), "..", "agent-inbox");
const OBSIDIAN_VAULT = process.env.OBSIDIAN_VAULT ?? "";

/** Render a work package as the markdown brief an agent is given. */
export function renderWorkPackage(wp: WorkPackage): string {
  const agent = agentByKey(wp.assignedTo);

  return [
    "---",
    `id: ${wp.id}`,
    `engagement: ${wp.engagementId}`,
    `stage: ${wp.stage}`,
    `agent: ${wp.assignedTo}`,
    `skills: [${wp.skills.join(", ")}]`,
    `autonomous: false`,
    `created: ${wp.createdAt}`,
    `status: awaiting-pickup`,
    "---",
    "",
    `# ${wp.title}`,
    "",
    `**Assigned to:** ${agent?.title ?? wp.assignedTo}`,
    `**Stage:** ${wp.stage}`,
    `**Reviewed by:** ${wp.reviewChain.length ? wp.reviewChain.join(" → ") : "a named human"}`,
    "",
    "## Brief",
    "",
    wp.brief,
    "",
    "## Requirements",
    "",
    ...wp.requirements.map((r, i) => `${i + 1}. ${r}`),
    "",
    "## Definition of done",
    "",
    ...wp.definitionOfDone.map((d) => `- [ ] ${d}`),
    "",
    "## Guardrails — these are not advisory",
    "",
    ...wp.guardrails.map((g) => `- ${g}`),
    "",
    "## Skills to load",
    "",
    ...wp.skills.map((s) => `- \`${s}\``),
    "",
    "---",
    "",
    "**Before you start:** search the knowledge vault for prior work on this",
    "client, this technology and this problem shape. If nothing returns, say",
    "\"memory recall: none\" and proceed.",
    "",
    "**When you finish:** write what a future engagement would benefit from",
    "knowing back into the vault. Not command output — decisions, gotchas and",
    "the reasoning behind them.",
    "",
  ].join("\n");
}

export interface DispatchResult {
  ok: boolean;
  written: string[];
  vaultNote?: string;
  error?: string;
}

/**
 * Write work packages into the agent inbox. Called only after a human has
 * released an engagement stage — never directly from a customer-facing route.
 */
export async function dispatch(
  engagementId: string,
  clientName: string,
  packages: WorkPackage[],
): Promise<DispatchResult> {
  const written: string[] = [];

  try {
    const dir = path.join(AGENT_INBOX, engagementId);
    await mkdir(dir, { recursive: true });

    for (const wp of packages) {
      const file = path.join(dir, `${wp.stage.toLowerCase()}-${wp.assignedTo}.md`);
      await writeFile(file, renderWorkPackage(wp), "utf8");
      written.push(file);
    }

    const manifest = path.join(dir, "manifest.json");
    await writeFile(
      manifest,
      JSON.stringify(
        {
          engagementId,
          client: clientName,
          dispatchedAt: new Date().toISOString(),
          autonomous: false,
          note: "Every package requires a human to pick it up. Nothing here runs on its own.",
          packages: packages.map((p) => ({
            id: p.id,
            stage: p.stage,
            agent: p.assignedTo,
            title: p.title,
            reviewChain: p.reviewChain,
          })),
        },
        null,
        2,
      ),
      "utf8",
    );
    written.push(manifest);

    const vaultNote = await writeVaultNote(engagementId, clientName, packages);

    return { ok: true, written, vaultNote };
  } catch (err) {
    return {
      ok: false,
      written,
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
}

/**
 * Write the engagement note into the Obsidian vault. Uses wiki-links so the
 * graph view connects engagements to clients, technologies and prior work.
 */
async function writeVaultNote(
  engagementId: string,
  clientName: string,
  packages: WorkPackage[],
): Promise<string | undefined> {
  if (!OBSIDIAN_VAULT) return undefined;

  const dir = path.join(OBSIDIAN_VAULT, "Engagements");
  await mkdir(dir, { recursive: true });

  const safeClient = clientName.replace(/[^\w\s-]/g, "").trim();
  const file = path.join(dir, `${safeClient} - ${engagementId}.md`);

  const skills = [...new Set(packages.flatMap((p) => p.skills))];

  const body = [
    "---",
    `engagement: ${engagementId}`,
    `client: "${safeClient}"`,
    `opened: ${new Date().toISOString().slice(0, 10)}`,
    "tags: [engagement, active]",
    "---",
    "",
    `# ${safeClient} — ${engagementId}`,
    "",
    "## Status",
    "",
    `Released into delivery on ${new Date().toISOString().slice(0, 10)}.`,
    "",
    "## Work packages",
    "",
    ...packages.map((p) => `- **${p.stage}** → [[${p.assignedTo}]] — ${p.title}`),
    "",
    "## Technologies",
    "",
    ...skills.map((s) => `- [[${s}]]`),
    "",
    "## Decisions",
    "",
    "_Architecture decision records land here as they are written._",
    "",
    "## Lessons",
    "",
    "_Filled in at retrospective. This is the part a future engagement actually reads._",
    "",
  ].join("\n");

  await writeFile(file, body, "utf8");
  return file;
}

/** Read back any completed work packages an agent has marked done. */
export async function collectCompleted(engagementId: string): Promise<string[]> {
  try {
    const manifestPath = path.join(AGENT_INBOX, engagementId, "manifest.json");
    const raw = await readFile(manifestPath, "utf8");
    const manifest = JSON.parse(raw) as { packages: Array<{ id: string; stage: string; agent: string }> };
    return manifest.packages.map((p) => `${p.stage}:${p.agent}`);
  } catch {
    return [];
  }
}
