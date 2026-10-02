/**
 * THE MARKETING TEAM
 *
 * Six specialists, each with one job, run in a fixed order. They are separate
 * for the same reason people on a real team are: whoever writes a thing is
 * the worst person to judge it, and a compliance officer who also writes the
 * copy is not a compliance officer.
 *
 * Each agent takes the draft, does its one job, and hands it on. Any of them
 * may reject, and a rejection stops the line — nothing reaches the queue by
 * accumulating enough partial approvals.
 *
 *   strategist  chooses the subject for the slot, and refuses to repeat
 *   writer      drafts the post from the angle and its source
 *   editor      cuts, and removes the tells of generated prose
 *   designer    decides whether a visual earns its place, and builds it
 *   officer     the compliance gate; blocks, never advises
 *   reviewer    holds it to LinkedIn's published rules
 *
 * The rule from `agents/ops/types.ts` holds here without exception: agents
 * propose, humans dispose. Nothing in this file publishes anything.
 */

import { company } from "../company";
import { ALL_ANGLES, PILLARS, pillarOf, type Angle } from "./pillars";
import { checkPost, errorsOf, passes, type Issue, type PostShape } from "./guidelines";
import { screen, type Violation } from "./compliance";
import { diagramFor, quoteCard, type Visual } from "./cards";

export interface Slot {
  /** ISO date this post is for. */
  date: string;
  /** Angle ids already used, so the strategist does not repeat one. */
  used: string[];
}

export interface Draft {
  slot: Slot;
  angle: Angle;
  pillar: string;
  hook: string;
  body: string;
  hashtags: string[];
  link: string;
  visual?: Visual;
  /** Appended by each agent as it works, so a draft explains itself. */
  trail: string[];
}

export interface Verdict {
  ok: boolean;
  /** Why it was refused. Empty when ok. */
  reasons: string[];
}

export interface TeamAgent<In, Out> {
  role: string;
  name: string;
  /** What this agent alone is responsible for. */
  charter: string;
  run: (input: In) => { output?: Out; verdict: Verdict };
}

// ---------------------------------------------------------------------------
//  1. Strategist
// ---------------------------------------------------------------------------

export const strategist: TeamAgent<Slot, Draft> = {
  role: "strategist",
  name: "Content strategist",
  charter:
    "Chooses which question this slot answers, and refuses to answer one that has been answered recently.",

  run(slot) {
    const unused = ALL_ANGLES.filter((a) => !slot.used.includes(a.id));
    if (unused.length === 0) {
      return {
        verdict: {
          ok: false,
          reasons: [
            `every one of ${ALL_ANGLES.length} angles has been used - add angles to pillars.ts rather than repeating one`,
          ],
        },
      };
    }

    // Rotate by pillar rather than taking the first unused angle, so a week is
    // never three posts from the same pillar. Recency is how lately that
    // pillar appeared in `used`, counted from the end.
    const lastSeen = (key: string) => {
      const ids = PILLARS.find((p) => p.key === key)?.angles.map((a) => a.id) ?? [];
      for (let i = slot.used.length - 1; i >= 0; i -= 1) {
        if (ids.includes(slot.used[i])) return slot.used.length - i;
      }
      return Number.MAX_SAFE_INTEGER;
    };

    const chosen = unused
      .slice()
      .sort((a, b) => lastSeen(pillarOf(b.id)!.key) - lastSeen(pillarOf(a.id)!.key))[0];

    const pillar = pillarOf(chosen.id)!;
    return {
      verdict: { ok: true, reasons: [] },
      output: {
        slot,
        angle: chosen,
        pillar: pillar.name,
        hook: "",
        body: "",
        hashtags: [],
        link: "",
        trail: [`strategist: ${pillar.name} - "${chosen.question}"`],
      },
    };
  },
};

// ---------------------------------------------------------------------------
//  2. Writer
// ---------------------------------------------------------------------------

/** Campaign parameters, so this post's traffic is attributable in analytics. */
function trackedLink(path: string, angleId: string): string {
  const base = company.siteUrl.replace(/\/$/, "");
  const params = new URLSearchParams({
    utm_source: "linkedin",
    utm_medium: "social",
    utm_campaign: "pillars",
    utm_content: angleId,
  });
  return `${base}${path}?${params.toString()}`;
}

export const writer: TeamAgent<Draft, Draft> = {
  role: "writer",
  name: "Post writer",
  charter: "Turns the angle into a post that answers its question and nothing else.",

  run(draft) {
    const { angle } = draft;

    // The opening has one job: earn the second line. It states the problem as
    // the reader meets it, not as we would prefer to frame it. The blank line
    // after it matters — the feed collapses the post around here, and a hook
    // that runs into a wall of text is a hook nobody reaches the end of.
    const body = [
      angle.question,
      "",
      angle.takeaway,
      "",
      angle.evidence,
      "",
      "Written up in full on the site:",
    ].join("\n");

    return {
      verdict: { ok: true, reasons: [] },
      output: {
        ...draft,
        hook: angle.question,
        body,
        hashtags: tagsFor(draft.pillar),
        link: trackedLink(angle.source, angle.id),
        trail: [...draft.trail, `writer: drafted ${body.length} characters`],
      },
    };
  },
};

/**
 * Hashtags are capped at four and capitalised per word. Four because past
 * about five it reads as reach-chasing; capitalised because a screen reader
 * spells out a lowercase run and says a camel-cased one.
 */
function tagsFor(pillarName: string): string[] {
  const common = ["#PlatformEngineering", "#DevOps"];
  const byPillar: Record<string, string[]> = {
    "How we work": ["#Consulting"],
    "Why we are different": ["#Consulting"],
    Governance: ["#Governance", "#Compliance"],
    "How we deliver": ["#ContinuousDelivery"],
    "Secure by default": ["#DevSecOps"],
    "Scalable and robust": ["#SRE"],
    "AI in the pipeline": ["#AIEngineering"],
    "Proof and milestones": ["#Toronto"],
  };
  return [...common, ...(byPillar[pillarName] ?? [])];
}

// ---------------------------------------------------------------------------
//  3. Editor
// ---------------------------------------------------------------------------

/**
 * Words that mark a post as machine-written to anyone who reads a lot of
 * LinkedIn. Cutting them is not fussiness — it is the difference between a
 * post that reads as a person and one that gets scrolled past.
 */
const TELLS: { pattern: RegExp; to: string; label: string }[] = [
  { pattern: /\bdelve into\b/gi, to: "look at", label: "delve into" },
  { pattern: /\bleverage(s|d)?\b/gi, to: "use", label: "leverage" },
  { pattern: /\butili[sz]e(s|d)?\b/gi, to: "use", label: "utilise" },
  { pattern: /\brobust and scalable\b/gi, to: "durable", label: "robust and scalable" },
  { pattern: /\bseamless(ly)?\b/gi, to: "clean", label: "seamless" },
  { pattern: /\bgame[- ]chang(er|ing)\b/gi, to: "significant", label: "game-changing" },
  { pattern: /\bcutting[- ]edge\b/gi, to: "current", label: "cutting-edge" },
  { pattern: /\bempower(s|ing|ed)?\b/gi, to: "let", label: "empower" },
  { pattern: /\bunlock(s|ing|ed)?\b/gi, to: "open", label: "unlock" },
  { pattern: /\bsupercharge(s|d)?\b/gi, to: "speed up", label: "supercharge" },
];

export const editor: TeamAgent<Draft, Draft> = {
  role: "editor",
  name: "Editor",
  charter: "Cuts what does not earn its place, and removes the tells of generated prose.",

  run(draft) {
    let body = draft.body;
    const removed: string[] = [];

    for (const { pattern, to, label } of TELLS) {
      if (pattern.test(body)) {
        removed.push(label);
        body = body.replace(pattern, to);
      }
    }

    // Em-dash density. About one per hundred words reads as a writer with
    // range; four reads as a model with a habit. The cap came out of auditing
    // this firm's own copy, where the homepage sat at nearly two per hundred.
    const words = body.split(/\s+/).filter(Boolean).length;
    const dashes = (body.match(/—/g) ?? []).length;
    const allowed = Math.max(1, Math.floor(words / 100));
    if (dashes > allowed) {
      let over = dashes - allowed;
      body = body.replace(/—/g, (m) => (over-- > 0 ? "," : m));
      removed.push(`${dashes - allowed} em-dash(es)`);
    }

    // Trailing spaces show up as ragged blanks in the feed.
    body = body
      .split("\n")
      .map((line) => line.replace(/\s+$/, ""))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return {
      verdict: { ok: true, reasons: [] },
      output: {
        ...draft,
        body,
        trail: [
          ...draft.trail,
          removed.length ? `editor: removed ${removed.join(", ")}` : "editor: nothing to cut",
        ],
      },
    };
  },
};

// ---------------------------------------------------------------------------
//  4. Designer
// ---------------------------------------------------------------------------

export const designer: TeamAgent<Draft, Draft> = {
  role: "designer",
  name: "Designer",
  charter:
    "Decides whether a visual adds anything, builds it to brand, and writes its alt text. Adds no decoration.",

  run(draft) {
    if (draft.angle.visual === "none") {
      return {
        verdict: { ok: true, reasons: [] },
        output: { ...draft, trail: [...draft.trail, "designer: text carries this one, no image"] },
      };
    }

    const visual =
      draft.angle.visual === "diagram"
        ? diagramFor(draft.angle)
        : quoteCard(draft.angle.takeaway, draft.pillar);

    // An image with no alt text is not a style problem, it is an inaccessible
    // post from a firm that sells accessibility work.
    if (!visual.alt.trim()) {
      return { verdict: { ok: false, reasons: ["produced an image with no alt text"] } };
    }

    return {
      verdict: { ok: true, reasons: [] },
      output: {
        ...draft,
        visual,
        trail: [...draft.trail, `designer: ${draft.angle.visual} ${visual.width}x${visual.height}`],
      },
    };
  },
};


/** The words an SVG actually renders: text, tspan, title and desc content. */
function visibleText(svg?: string): string {
  if (!svg) return "";
  const parts = [...svg.matchAll(/<(?:text|tspan|title|desc)\b[^>]*>([\s\S]*?)<\/(?:text|tspan|title|desc)>/g)]
    .map((m) => m[1].replace(/<[^>]*>/g, " "));
  return parts
    .join(" ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
//  5. Compliance officer
// ---------------------------------------------------------------------------

export const officer: TeamAgent<Draft, Draft> = {
  role: "officer",
  name: "Compliance officer",
  charter:
    "Blocks anything naming a client, inventing a number, or carrying personal information. Advises on nothing.",

  run(draft) {
    // Everything that will be published, the alt text and the words inside the
    // image included — a client name in a diagram label is still a published
    // client name, and the image is the surface people forget to check.
    //
    // The image is screened by its rendered text, not its markup. Screening
    // the raw SVG meant path coordinates like "0 0 1200 1200" were read as a
    // phone number, which is the kind of false positive that teaches people
    // to ignore the gate.
    const surfaces = [
      draft.body,
      draft.hashtags.join(" "),
      draft.visual?.alt ?? "",
      visibleText(draft.visual?.svg),
    ];
    const violations: Violation[] = surfaces.flatMap((s) => screen(s));

    if (violations.length) {
      return {
        verdict: {
          ok: false,
          reasons: violations.map((v) => `${v.rule}: ${v.detail} ("${v.found}")`),
        },
      };
    }
    return {
      verdict: { ok: true, reasons: [] },
      output: { ...draft, trail: [...draft.trail, "officer: clear"] },
    };
  },
};

// ---------------------------------------------------------------------------
//  6. Reviewer
// ---------------------------------------------------------------------------

export const reviewer: TeamAgent<Draft, Draft> = {
  role: "reviewer",
  name: "Reviewer",
  charter: "Holds the post to LinkedIn's published rules, and refuses on any of them.",

  run(draft) {
    const shape: PostShape = {
      text: `${draft.body}\n\n${draft.link}`,
      hashtags: draft.hashtags,
      alt: draft.visual?.alt,
      hasImage: Boolean(draft.visual),
      link: draft.link,
    };
    const issues: Issue[] = checkPost(shape);

    if (!passes(issues)) {
      return {
        verdict: {
          ok: false,
          reasons: errorsOf(issues).map((i) => `${i.rule} (${i.basis}): ${i.detail}`),
        },
      };
    }

    const warnings = issues.filter((i) => i.severity === "warning");
    return {
      verdict: { ok: true, reasons: [] },
      output: {
        ...draft,
        trail: [
          ...draft.trail,
          warnings.length
            ? `reviewer: passed with ${warnings.length} warning(s) - ${warnings.map((w) => w.rule).join(", ")}`
            : "reviewer: passed clean",
        ],
      },
    };
  },
};

/** The line, in order. Exported so `marketing:team` can print the charters. */
export const TEAM = [strategist, writer, editor, designer, officer, reviewer];
