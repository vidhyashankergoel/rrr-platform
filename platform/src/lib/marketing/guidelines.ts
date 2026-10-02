/**
 * LINKEDIN GUIDELINES, AS CHECKS
 *
 * Platform rules are useless as a document nobody opens. These are the same
 * rules expressed as assertions, so a post that breaks one fails before it is
 * queued rather than after it is published.
 *
 * DOCUMENTED LIMITS VS COMMUNITY FOLKLORE
 * ---------------------------------------
 * Two very different kinds of rule get repeated in the same breath by people
 * selling LinkedIn advice, and conflating them is how you end up contorting
 * good writing around a superstition. They are separated here:
 *
 *   `platform` — published by LinkedIn. A character cap, an alt-text cap, a
 *                policy on engagement bait. Breaking one of these is an error.
 *
 *   `heuristic` — widely observed, never confirmed by LinkedIn, and liable to
 *                 change whenever the ranking model does. Breaking one of
 *                 these is a warning you may reasonably ignore.
 *
 * Anything in the second category that hardens into an error is a rule we
 * invented about a system we cannot see.
 */

export type Severity = "error" | "warning";
export type Basis = "platform" | "heuristic" | "accessibility" | "house";

export interface Issue {
  rule: string;
  severity: Severity;
  basis: Basis;
  detail: string;
}

/** LinkedIn's hard cap on the text of a post. */
export const MAX_POST_CHARS = 3_000;

/**
 * Roughly how much shows before the feed collapses the post behind "…see
 * more". LinkedIn has never published the number and it differs by client, so
 * this is a budget for the opening, not a limit.
 */
export const HOOK_CHARS = 200;

/** LinkedIn's cap on image alternative text. */
export const MAX_ALT_CHARS = 300;

/** Native feed image. Square uses the most vertical space in the feed. */
export const IMAGE_SQUARE = { width: 1_200, height: 1_200 };

/** Link preview card — the 1.91:1 that every platform settled on. */
export const IMAGE_LINK_PREVIEW = { width: 1_200, height: 627 };

/**
 * Phrases LinkedIn's own professional community policy treats as engagement
 * bait. It demotes them, so this is an error and not a matter of taste.
 */
const ENGAGEMENT_BAIT = [
  /\bcomment\s+(?:["']?yes["']?|below|if you)\b/i,
  /\bdouble[- ]tap\b/i,
  /\btag\s+(?:a|someone|three|3)\b/i,
  /\blike\s+(?:this\s+)?if\b/i,
  /\brepost\s+if\b/i,
  /\bwho\s+(?:else\s+)?agrees\b/i,
  /\bDM\s+me\s+["']?\w+["']?\s+(?:for|and)\b/i,
];

/**
 * Openers that signal a generated post to anyone who reads LinkedIn daily.
 * House rule, not a platform one — but a post that opens this way is ignored,
 * which makes it as costly as a rule violation.
 */
const DEAD_OPENERS = [
  /^(?:in today's|in the ever[- ]evolving|in an era)/i,
  /^(?:i am (?:thrilled|excited|humbled|delighted))/i,
  /^(?:let's dive|let's unpack|buckle up)/i,
  /^(?:here's the thing)/i,
  /^(?:unpopular opinion)/i,
];

export interface PostShape {
  /** The body as it will appear. */
  text: string;
  hashtags: string[];
  /** Alt text, required whenever there is an image. */
  alt?: string;
  hasImage: boolean;
  /** A link in the body, if any. */
  link?: string;
}

export function checkPost(post: PostShape): Issue[] {
  const issues: Issue[] = [];
  const add = (rule: string, severity: Severity, basis: Basis, detail: string) =>
    issues.push({ rule, severity, basis, detail });

  const body = post.text.trim();
  const full = `${body}\n\n${post.hashtags.join(" ")}`.trim();

  // --- Platform limits ----------------------------------------------------
  if (full.length > MAX_POST_CHARS) {
    add("length", "error", "platform",
      `${full.length} characters including hashtags; LinkedIn truncates at ${MAX_POST_CHARS}`);
  }
  if (body.length < 300) {
    add("length", "warning", "heuristic",
      `${body.length} characters — short posts rarely carry an argument worth following`);
  }

  if (post.hasImage && !post.alt?.trim()) {
    add("alt-text", "error", "accessibility",
      "an image without alt text is invisible to anyone using a screen reader");
  }
  if (post.alt && post.alt.length > MAX_ALT_CHARS) {
    add("alt-text", "error", "platform",
      `${post.alt.length} characters; LinkedIn caps alt text at ${MAX_ALT_CHARS}`);
  }

  for (const pattern of ENGAGEMENT_BAIT) {
    if (pattern.test(body)) {
      add("engagement-bait", "error", "platform",
        `matches ${pattern} — LinkedIn's community policy demotes engagement bait`);
      break;
    }
  }

  // --- Hashtags -----------------------------------------------------------
  if (post.hashtags.length > 5) {
    add("hashtags", "warning", "heuristic",
      `${post.hashtags.length} hashtags; past about five it reads as reach-chasing`);
  }
  const malformed = post.hashtags.filter((h) => !/^#[A-Za-z][A-Za-z0-9]*$/.test(h));
  if (malformed.length) {
    add("hashtags", "error", "platform",
      `${malformed.join(", ")} — a hashtag cannot contain spaces or punctuation and must not start with a digit`);
  }
  // Camel case is the difference between a tag a screen reader can say and a
  // run of letters it spells out.
  const lowercaseMulti = post.hashtags.filter((h) => h.length > 12 && h === h.toLowerCase());
  if (lowercaseMulti.length) {
    add("hashtags", "warning", "accessibility",
      `${lowercaseMulti.join(", ")} — capitalise each word so a screen reader can pronounce it`);
  }

  // --- The opening --------------------------------------------------------
  const hook = body.slice(0, HOOK_CHARS);
  if (!hook.includes("\n") && body.length > HOOK_CHARS * 2) {
    add("hook", "warning", "heuristic",
      "no line break in the opening — the collapsed preview will be a wall of text");
  }
  for (const pattern of DEAD_OPENERS) {
    if (pattern.test(body)) {
      add("hook", "warning", "house",
        `opens with ${pattern} — a phrase that reads as generated`);
      break;
    }
  }

  // --- Accessibility ------------------------------------------------------
  const emoji = [...body].filter((c) => /\p{Extended_Pictographic}/u.test(c));
  if (emoji.length > 4) {
    add("emoji", "warning", "accessibility",
      `${emoji.length} emoji — each one is read aloud in full by a screen reader`);
  }
  const shouty = body.match(/\b[A-Z]{5,}\b/g)?.filter((w) => !["HTTPS", "PIPEDA", "AODA", "WCAG"].includes(w));
  if (shouty?.length) {
    add("caps", "warning", "accessibility",
      `${shouty.join(", ")} — screen readers spell out all-caps words letter by letter`);
  }

  // --- Links --------------------------------------------------------------
  if (post.link && !/^https:\/\//.test(post.link)) {
    add("link", "error", "house", `${post.link} is not https`);
  }
  if (post.link && !post.link.includes("utm_")) {
    add("link", "warning", "house",
      "no campaign parameters — this post's traffic will be indistinguishable from the rest");
  }

  return issues;
}

export const errorsOf = (issues: Issue[]) => issues.filter((i) => i.severity === "error");
export const passes = (issues: Issue[]) => errorsOf(issues).length === 0;
