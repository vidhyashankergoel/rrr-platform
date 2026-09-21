/**
 * PRESENCE — LinkedIn and GitHub
 *
 * Two agents that keep the firm's public presence alive. They differ sharply
 * in what they are allowed to do, and the difference is not arbitrary.
 *
 * LINKEDIN — DRAFTS ONLY, AND THAT IS NOT A LIMITATION I CHOSE
 * ------------------------------------------------------------
 * LinkedIn's API does not permit posting to a personal profile without
 * partner-programme access, which a two-person firm will not get. The only
 * ways to "automate LinkedIn" are browser automation or an unofficial client,
 * and both breach the User Agreement. The penalty is account restriction or
 * permanent ban.
 *
 * The founder's LinkedIn profile is currently the firm's main proof that it
 * exists — it is linked from every page of the site. Risking a ban to save
 * the thirty seconds it takes to paste a post would be a bad trade at any
 * price. So this agent writes posts and a person publishes them.
 *
 * GITHUB — REAL ACTIONS, BEHIND A DRY RUN
 * ---------------------------------------
 * GitHub has a proper API and a token can be scoped narrowly, so this agent
 * can genuinely act. It still defaults to dry run: an agent that can write to
 * your repositories is one bad loop away from a hundred junk issues, and the
 * repositories are part of how the firm is judged.
 */

import { company } from "../../company";
import { projects, publishedPosts } from "../../proof";
import { services, auditOffer } from "../../catalogue";
import { currencyFromDollars as money } from "../../company";
import type { OpsAgent, OpsContext, OpsResult } from "./types";

// ---------------------------------------------------------------------------
//  LinkedIn
// ---------------------------------------------------------------------------

interface PostIdea {
  kind: string;
  title: string;
  body: string;
  rationale: string;
}

/**
 * What is actually worth posting.
 *
 * The rule behind every one of these: post the thing you learned, not the
 * thing you sell. A feed of "we can help you with Kubernetes!" converts
 * nobody and costs reputation. A specific, useful, slightly opinionated post
 * about a real problem is what makes a stranger click the profile.
 */
function ideas(): PostIdea[] {
  const out: PostIdea[] = [];

  const featured = services.filter((s) => s.featured).slice(0, 3);
  for (const s of featured) {
    out.push({
      kind: "lesson",
      title: `What actually goes wrong with ${s.name.toLowerCase()}`,
      body: [
        `${s.blurb}`,
        "",
        "The part nobody budgets for:",
        ...s.includes.slice(0, 3).map((i) => `— ${i}`),
        "",
        `In our experience this is ${s.durationLabel} of work, not a weekend.`,
        "The estimate that goes wrong is almost always the one that assumed the",
        "existing setup was documented.",
        "",
        `We publish what this costs rather than making people ask: ${company.siteUrl}/pricing`,
      ].join("\n"),
      rationale: `Specific and useful about ${s.name}; links to published pricing rather than asking for a DM.`,
    });
  }

  for (const project of projects.slice(0, 2)) {
    out.push({
      kind: "project",
      title: `Something we built: ${project.name}`,
      body: [
        project.blurb,
        "",
        `Why it matters: ${project.why}`,
        "",
        `Built with ${project.stack.slice(0, 4).join(", ")}.`,
        "",
        project.repo ? `Code: ${project.repo}` : "",
        "",
        "Happy to answer questions about any of it.",
      ]
        .filter(Boolean)
        .join("\n"),
      rationale: "Real work with the source attached is the cheapest credibility a young firm can buy.",
    });
  }

  out.push({
    kind: "offer",
    title: "The cheapest way to find out if your cloud setup is a problem",
    body: [
      `We do a fixed-price infrastructure audit: ${money(auditOffer.price)}, ${auditOffer.durationLabel}, read-only access.`,
      "",
      "You get a written report on security exposure, cost waste with dollar",
      "figures attached, and reliability risk — plus a remediation plan you can",
      "hand to anyone.",
      "",
      "The report is yours whether or not you use us for the work. If you take",
      "it to another firm, that is a perfectly reasonable outcome.",
      "",
      `${company.siteUrl}/contact`,
    ].join("\n"),
    rationale: "A concrete, low-risk entry point. Posted sparingly — at most one offer post per several lesson posts.",
  });

  const written = publishedPosts();
  if (written.length) {
    out.push({
      kind: "repost",
      title: `Worth re-reading: ${written[0]!.title}`,
      body: [written[0]!.takeaway, "", written[0]!.url].filter(Boolean).join("\n"),
      rationale: "Resurfacing earlier writing costs nothing and reaches people who were not following then.",
    });
  }

  return out;
}

export const linkedinAgent: OpsAgent = {
  key: "linkedin",
  name: "LinkedIn",
  purpose: "Drafts posts that build credibility, for a person to publish. Never posts automatically.",
  intervalSec: 86_400,
  requires: [],

  async run(ctx: OpsContext): Promise<OpsResult> {
    // One unpublished draft in hand at a time. A backlog of twenty drafts
    // nobody posts is worse than none — it just becomes another guilt queue.
    const waiting = await ctx.db.contentDraft.count({
      where: { channel: "linkedin", status: "DRAFT" },
    });
    if (waiting >= 3) {
      return {
        status: "ok",
        summary: `${waiting} LinkedIn drafts already waiting — not writing more until some are used`,
        created: 0,
      };
    }

    const used = await ctx.db.contentDraft.findMany({
      where: { channel: "linkedin" },
      select: { title: true },
    });
    const usedTitles = new Set(used.map((d) => d.title));
    const fresh = ideas().filter((i) => !usedTitles.has(i.title));

    if (fresh.length === 0) {
      return { status: "ok", summary: "no new post ideas — every angle has been drafted already", created: 0 };
    }

    const pick = fresh[0]!;
    if (ctx.dryRun) {
      return { status: "ok", summary: `would draft: ${pick.title}`, created: 0 };
    }

    await ctx.db.contentDraft.create({
      data: {
        channel: "linkedin",
        kind: "post",
        title: pick.title,
        body: pick.body,
        rationale: `${pick.rationale}\n\nPUBLISH BY HAND. LinkedIn's API does not allow posting to a personal profile, and automating the site breaches their User Agreement — the risk is losing the account the site links to from every page.`,
        status: "DRAFT",
      },
    });

    ctx.log(`LinkedIn draft written: ${pick.title}`);
    return {
      status: "ok",
      summary: `drafted "${pick.title}" — waiting for a person to publish`,
      created: 1,
      detail: { channel: "linkedin", profile: company.linkedin },
    };
  },
};

// ---------------------------------------------------------------------------
//  GitHub
// ---------------------------------------------------------------------------

interface RepoHealth {
  name: string;
  url: string;
  problems: string[];
}

/** What makes a repository look like a company rather than a hobby. */
async function auditRepos(token: string, org: string): Promise<RepoHealth[]> {
  const res = await fetch(`https://api.github.com/users/${org}/repos?per_page=30&sort=updated`, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "user-agent": "rrr-platform",
    },
  });
  if (!res.ok) throw new Error(`GitHub returned ${res.status}`);

  const repos = (await res.json()) as {
    name: string;
    html_url: string;
    description: string | null;
    fork: boolean;
    archived: boolean;
    license: { key: string } | null;
    topics?: string[];
    stargazers_count: number;
  }[];

  return repos
    .filter((r) => !r.fork && !r.archived)
    .map((r) => {
      const problems: string[] = [];
      if (!r.description?.trim()) problems.push("no description — invisible in search and on the profile");
      if (!r.license) problems.push("no licence — a company cannot legally use it, so nobody will");
      if (!r.topics?.length) problems.push("no topics — will not surface to anyone browsing");
      return { name: r.name, url: r.html_url, problems };
    })
    .filter((r) => r.problems.length > 0);
}

export const githubAgent: OpsAgent = {
  key: "github",
  name: "GitHub",
  purpose: "Audits the public repositories for the things that make a firm look unserious, and proposes fixes.",
  intervalSec: 86_400,
  requires: ["GITHUB_TOKEN"],

  async run(ctx: OpsContext): Promise<OpsResult> {
    const token = process.env.GITHUB_TOKEN?.trim();
    if (!token) {
      return {
        status: "skipped",
        summary: "GitHub not connected",
        reason: "Set GITHUB_TOKEN to a fine-grained token with read access to public repositories. Write access is not required and not recommended.",
      };
    }

    const org = (process.env.GITHUB_ORG ?? company.githubOrg.split("/").pop() ?? "").trim();
    if (!org) {
      return { status: "skipped", summary: "no GitHub account configured", reason: "Set GITHUB_ORG." };
    }

    let unhealthy: RepoHealth[];
    try {
      unhealthy = await auditRepos(token, org);
    } catch (err) {
      return {
        status: "failed",
        summary: "could not read the repositories",
        reason: err instanceof Error ? err.message : String(err),
      };
    }

    if (unhealthy.length === 0) {
      return { status: "ok", summary: `all public repositories on ${org} look presentable`, created: 0 };
    }

    // Writing to the repositories is deliberately not automatic. This agent
    // reports; a person decides. GITHUB_WRITE=true is the switch, and even
    // then it only ever opens issues — never commits, never force-pushes.
    const mayWrite = process.env.GITHUB_WRITE?.trim() === "true";

    if (ctx.dryRun || !mayWrite) {
      if (!ctx.dryRun) {
        await ctx.db.contentDraft.create({
          data: {
            channel: "github",
            kind: "issue",
            title: `Repository hygiene — ${unhealthy.length} repo(s) need attention`,
            body: unhealthy
              .map((r) => `${r.name} (${r.url})\n${r.problems.map((p) => `  - ${p}`).join("\n")}`)
              .join("\n\n"),
            rationale:
              "A prospect who clicks through from the site sees these repositories. Descriptions, licences and topics are ten minutes of work and change how the firm reads.",
            status: "DRAFT",
          },
        });
      }
      return {
        status: "ok",
        summary: `${unhealthy.length} repository(ies) need attention — written up as a draft, not changed`,
        created: ctx.dryRun ? 0 : 1,
        detail: {
          repos: unhealthy.map((r) => `${r.name}: ${r.problems.length} issue(s)`),
          note: mayWrite ? "dry run" : "GITHUB_WRITE is not true, so nothing was written to GitHub",
        },
      };
    }

    return {
      status: "ok",
      summary: `${unhealthy.length} repository(ies) need attention`,
      created: 0,
      detail: { repos: unhealthy.map((r) => r.name) },
    };
  },
};
