/**
 * CARDS
 *
 * Every image the firm posts is built here, from the same grid, in the same
 * palette, with the logo and the company name in the same place. That
 * consistency is the entire point: a feed is a stream of strangers' content,
 * and the only cheap way to be recognised in it is to look identical to
 * yourself every single time.
 *
 * THE GRID
 * --------
 * One unit of padding is 64px on a 1200px canvas, and nothing is placed off
 * that grid. Type sizes step 1.25x apart rather than being picked by eye, so
 * a heading and a caption are always in a deliberate relationship.
 *
 * TEXT IS LAID OUT BY HAND
 * ------------------------
 * SVG has no text wrapping. `wrap()` below breaks lines on a measured
 * character budget rather than a guess, because a statement that overflows
 * its card is worse than no card at all — and nobody is going to eyeball 156
 * of these a year.
 *
 * CONTRAST IS CHECKED, NOT ASSUMED
 * --------------------------------
 * The palette here is the site's, and the foreground/background pairs used on
 * these cards are the pairs already measured against WCAG 2.1 AA by
 * `contrast-test`. A marketing image is not legally required to meet AA, but
 * a firm that sells accessibility work posting unreadable graphics is a
 * credibility problem rather than a compliance one.
 */

import { company } from "../company";
import type { Angle } from "./pillars";

export interface Visual {
  kind: "quote" | "diagram";
  svg: string;
  /** Required. LinkedIn caps alt text at 300 characters. */
  alt: string;
  width: number;
  height: number;
}

// --- The grid ---------------------------------------------------------------

const SIZE = 1_200;
const PAD = 64;
const INNER = SIZE - PAD * 2;

/** 1.25 steps. Sizes are picked from here, never invented at the call site. */
const TYPE = {
  statement: 68,
  heading: 54,
  body: 34,
  caption: 27,
  micro: 22,
} as const;

// --- The palette ------------------------------------------------------------
// Lifted from globals.css so a brand change happens in one place and shows up
// here too. Dark ground throughout: it is what the site's systems section
// uses, and it stands out against a feed that is overwhelmingly white.

const INK = "#05121F";
const INK_SOFT = "#0C1E2E";
const TEAL = "#2AD3BF";
const TEAL_DEEP = "#0E8C9B";
const AMBER = "#FFC25C";
const PAPER = "#F4F7FA";
const MUTED = "#8FA8BE";

/** One stack, used by every text node on every card. */
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** XML-escape. Any text reaching an SVG must go through this. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Break text into lines that fit `width` at `fontSize`.
 *
 * The 0.52 is the average advance width of this sans stack as a fraction of
 * the point size, measured rather than guessed. It is deliberately slightly
 * generous: a line that stops short looks considered, and a line that runs
 * off the canvas looks broken.
 */
function wrap(text: string, fontSize: number, width: number): string[] {
  const perLine = Math.floor(width / (fontSize * 0.52));
  const lines: string[] = [];
  let line = "";

  for (const word of text.split(/\s+/)) {
    if (!line.length) {
      line = word;
    } else if (line.length + 1 + word.length <= perLine) {
      line += ` ${word}`;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * The lockup: mark, company name, and the domain. Bottom-left on every card,
 * identical every time. The mark is redrawn rather than referenced, because
 * an <image href> to a local file does not survive rasterisation on a build
 * machine that has no idea where `public/` is.
 */
function lockup(y: number): string {
  return `
  <g transform="translate(${PAD} ${y})">
    <rect width="56" height="56" rx="13" fill="${INK_SOFT}"/>
    <!--
      A nested <svg> with a viewBox tight to the mark's own bounding box. The
      earlier translate+scale left it cramped and off-centre in the tile,
      because the mark does not fill its 96-unit canvas - it occupies roughly
      x 22-74, y 21-73, and scaling the canvas scales the empty margin too.
      Letting the viewBox do the fitting removes the arithmetic entirely.
    -->
    <svg x="9" y="9" width="38" height="38" viewBox="22 21 52 52" overflow="visible">
      <g fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M27 67V47h7.5a6 6 0 0 1 0 12H27l9 8" stroke="${AMBER}" stroke-width="5" opacity="0.55"/>
        <path d="M41 62V38h9a7 7 0 0 1 0 14h-9l11 10" stroke="${TEAL_DEEP}" stroke-width="5.5" opacity="0.9"/>
        <path d="M56 56V26h10.5a8 8 0 0 1 0 16H56l13 14" stroke="${TEAL}" stroke-width="6.5"/>
      </g>
    </svg>
    <text x="74" y="24" font-size="${TYPE.caption}" font-weight="650" fill="${PAPER}"
          font-family="${FONT}">${esc(company.shortName)}</text>
    <text x="74" y="50" font-size="${TYPE.micro}" fill="${MUTED}"
          font-family="${FONT}">${esc(
            company.siteUrl.replace(/^https?:\/\//, ""),
          )} &#183; ${esc(company.city)}, ${esc(company.region)}</text>
  </g>`;
}

function frame(body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" role="img">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${TEAL}"/><stop offset="1" stop-color="${TEAL_DEEP}"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="${INK}"/>
  <rect x="0" y="0" width="${SIZE}" height="8" fill="url(#g)"/>
${body}
</svg>`;
}

// --- Quote card -------------------------------------------------------------

/** A single statement, set large. For angles whose takeaway is the content. */
export function quoteCard(statement: string, pillar: string): Visual {
  const lines = wrap(statement, TYPE.statement, INNER);
  const lineHeight = Math.round(TYPE.statement * 1.22);

  // A long statement is hung from the top; a short one is centred in the
  // space it has. Centring everything left a four-line statement floating
  // with a band of dead canvas above it, which reads as a mistake rather
  // than as breathing room.
  const top = 236;
  const bottom = SIZE - PAD - 110;
  const blockHeight = lines.length * lineHeight;
  const slack = bottom - top - blockHeight;
  const startY = top + (lines.length >= 4 ? 0 : Math.max(0, slack / 2)) + TYPE.statement;

  const text = lines
    .map((l, i) => `    <tspan x="${PAD}" y="${startY + i * lineHeight}">${esc(l)}</tspan>`)
    .join("\n");

  const body = `
  <text x="${PAD}" y="${PAD + 100}" font-size="${TYPE.caption}" font-weight="650" fill="${TEAL}"
        letter-spacing="2.5" font-family="${FONT}">${esc(
          pillar.toUpperCase(),
        )}</text>
  <text font-size="${TYPE.statement}" font-weight="680" fill="${PAPER}" letter-spacing="-1"
        font-family="${FONT}">
${text}
  </text>
${lockup(SIZE - PAD - 56)}`;

  return {
    kind: "quote",
    svg: frame(body),
    alt: altFor(`${pillar}. ${statement}`),
    width: SIZE,
    height: SIZE,
  };
}

// --- Diagram card -----------------------------------------------------------

/**
 * A four-stage flow. Deliberately not a general diagramming engine: four
 * labelled stages with an arrow between them covers every angle in
 * `pillars.ts` that asked for a diagram, and a general engine would be a lot
 * of code in service of drawings nobody has asked for yet.
 */
export function diagramFor(angle: Angle): Visual {
  const stages = STAGES[angle.id] ?? ["Commit", "Verify", "Stage", "Production"];
  const title = wrap(angle.question, TYPE.heading, INNER).slice(0, 2);

  const boxH = 108;
  const gap = 28;

  // Centre the stack between the heading and the lockup. A fixed top left it
  // ending two hundred pixels above the lockup with eighty above it, which
  // reads as the diagram having slipped rather than as a margin.
  const stackHeight = stages.length * boxH + (stages.length - 1) * gap;
  const region = { from: PAD + 150 + title.length * Math.round(TYPE.heading * 1.2), to: SIZE - PAD - 110 };
  const top = Math.round(region.from + Math.max(0, (region.to - region.from - stackHeight) / 2));

  const rows = stages
    .map((stage, i) => {
      const y = top + i * (boxH + gap);
      const arrow =
        i < stages.length - 1
          ? `  <path d="M${PAD + 44} ${y + boxH + 4} L${PAD + 44} ${y + boxH + gap - 4}"
          stroke="${TEAL_DEEP}" stroke-width="3" stroke-linecap="round"/>`
          : "";
      return `  <g>
    <rect x="${PAD}" y="${y}" width="${INNER}" height="${boxH}" rx="16" fill="${INK_SOFT}" stroke="${TEAL_DEEP}" stroke-opacity="0.45"/>
    <circle cx="${PAD + 44}" cy="${y + boxH / 2}" r="15" fill="${TEAL}"/>
    <text x="${PAD + 44}" y="${y + boxH / 2 + 8}" font-size="${TYPE.micro}" font-weight="700" fill="${INK}"
          text-anchor="middle" font-family="${FONT}">${i + 1}</text>
    <text x="${PAD + 84}" y="${y + boxH / 2 + 11}" font-size="${TYPE.body}" fill="${PAPER}"
          font-family="${FONT}">${esc(stage)}</text>
  </g>
${arrow}`;
    })
    .join("\n");

  const heading = title
    .map((l, i) => `    <tspan x="${PAD}" y="${PAD + 150 + i * Math.round(TYPE.heading * 1.2)}">${esc(l)}</tspan>`)
    .join("\n");

  const body = `
  <text x="${PAD}" y="${PAD + 72}" font-size="${TYPE.caption}" font-weight="650" fill="${TEAL}"
        letter-spacing="2.5" font-family="${FONT}">HOW IT WORKS</text>
  <text font-size="${TYPE.heading}" font-weight="680" fill="${PAPER}" letter-spacing="-0.8"
        font-family="${FONT}">
${heading}
  </text>
${rows}
${lockup(SIZE - PAD - 56)}`;

  return {
    kind: "diagram",
    svg: frame(body),
    alt: altFor(`Diagram. ${angle.question} Four stages: ${stages.join(", then ")}.`),
    width: SIZE,
    height: SIZE,
  };
}

/** The stages each diagram angle actually describes. */
const STAGES: Record<string, string[]> = {
  "work-first-two-weeks": ["Assessment", "Written findings", "Costed plan", "You decide"],
  "gov-pipeda": ["Collect only what is needed", "Record the consent", "Set a retention date", "Delete on schedule"],
  "gov-access": ["Request", "Time-bound grant", "Logged use", "Scheduled review"],
  "del-progressive": ["Deploy to a slice", "Watch the SLO", "Widen or roll back", "Full traffic"],
  "del-ephemeral": ["Open a pull request", "Environment built", "Reviewed running", "Destroyed on merge"],
  "sec-no-long-lived-creds": ["Workflow requests a token", "Identity provider attests", "Short-lived credential", "Expires by itself"],
  "scale-autoscaling": ["Find the real bottleneck", "Scale on that signal", "Load test the limit", "Set the ceiling"],
  "ai-agentic-containers": ["Agent drafts a change", "Pipeline tests it", "Human approves", "Normal deploy path"],
  "ai-rag-grounding": ["Retrieve", "Check the ground truth", "Answer with citations", "Refuse when unsure"],
};

/**
 * LinkedIn truncates alt text at 300 characters. Truncating mid-sentence is
 * worse than a shorter complete one, so cut at the last sentence that fits.
 */
function altFor(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= 300) return clean;
  const cut = clean.slice(0, 300);
  const lastStop = cut.lastIndexOf(". ");
  return lastStop > 120 ? cut.slice(0, lastStop + 1) : `${cut.slice(0, 297).trimEnd()}...`;
}


// --- Results card -----------------------------------------------------------

/**
 * A card of outcomes, with the full contact block rather than just the domain.
 *
 * This is the one card format meant to be read on its own, detached from the
 * post that carried it — somebody screenshots it, or it turns up in a feed
 * with the text collapsed. So it carries the mark, the legal name, the site,
 * the email and the phone, because a card that makes somebody want to call
 * and does not say how is a wasted impression.
 *
 * Every figure passed in must already be published on the site. Nothing here
 * invents a number, and `screen()` in compliance.ts will refuse the post that
 * carries it if one appears from nowhere.
 */
export function resultsCard(
  eyebrow: string,
  lines: { value: string; label: string }[],
): Visual {
  const rowH = 132;
  const top = 330;

  const rows = lines
    .map((row, i) => {
      const y = top + i * rowH;
      const label = wrap(row.label, TYPE.caption, INNER - 40);
      return `  <g>
    <line x1="${PAD}" y1="${y - 26}" x2="${SIZE - PAD}" y2="${y - 26}" stroke="${TEAL_DEEP}" stroke-opacity="0.28"/>
    <text x="${PAD}" y="${y + 24}" font-size="${TYPE.heading}" font-weight="700" fill="${TEAL}"
          letter-spacing="-0.6" font-family="${FONT}">${esc(row.value)}</text>
    <text x="${PAD}" y="${y + 60}" font-size="${TYPE.caption}" fill="${MUTED}"
          font-family="${FONT}">${esc(label[0] ?? "")}</text>
  </g>`;
    })
    .join("\n");

  const body = `
  <text x="${PAD}" y="${PAD + 92}" font-size="${TYPE.caption}" font-weight="650" fill="${TEAL}"
        letter-spacing="2.5" font-family="${FONT}">${esc(eyebrow.toUpperCase())}</text>
  <text x="${PAD}" y="${PAD + 164}" font-size="${TYPE.heading}" font-weight="690" fill="${PAPER}"
        letter-spacing="-0.8" font-family="${FONT}">What we delivered</text>
${rows}
${contactBlock(SIZE - PAD - 104)}`;

  return {
    kind: "quote",
    svg: frame(body),
    alt: altFor(
      `${eyebrow}. What we delivered: ` +
        lines.map((l) => `${l.value} ${l.label}`).join("; ") + ".",
    ),
    width: SIZE,
    height: SIZE,
  };
}

/** The lockup plus how to actually reach the firm. */
function contactBlock(y: number): string {
  const site = company.siteUrl.replace(/^https?:\/\//, "");
  return `
  <g transform="translate(${PAD} ${y})">
    <rect width="72" height="72" rx="17" fill="${INK_SOFT}"/>
    <svg x="11" y="11" width="50" height="50" viewBox="22 21 52 52" overflow="visible">
      <g fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M27 67V47h7.5a6 6 0 0 1 0 12H27l9 8" stroke="${AMBER}" stroke-width="5" opacity="0.55"/>
        <path d="M41 62V38h9a7 7 0 0 1 0 14h-9l11 10" stroke="${TEAL_DEEP}" stroke-width="5.5" opacity="0.9"/>
        <path d="M56 56V26h10.5a8 8 0 0 1 0 16H56l13 14" stroke="${TEAL}" stroke-width="6.5"/>
      </g>
    </svg>
    <text x="92" y="27" font-size="${TYPE.body}" font-weight="700" fill="${PAPER}"
          font-family="${FONT}">${esc(company.legalName)}</text>
    <text x="92" y="55" font-size="${TYPE.micro}" fill="${TEAL}"
          font-family="${FONT}">${esc(site)}</text>
    <text x="92" y="79" font-size="${TYPE.micro}" fill="${MUTED}"
          font-family="${FONT}">${esc(company.email)} &#183; ${esc(company.phone)} &#183; ${esc(company.city)}, ${esc(company.region)}</text>
  </g>`;
}

/**
 * The site's own link-preview image, built from the same parts. A LinkedIn
 * post that links to the site renders this card, so it is the most-seen image
 * the firm has — and until now there was none, which meant every post
 * rendered a blank grey preview.
 */
export function ogCard(): { svg: string; width: number; height: number } {
  const W = 1_200;
  const H = 630;
  const lines = wrap(company.tagline, 52, W - PAD * 2);

  const text = lines
    .map((l, i) => `    <tspan x="${PAD}" y="${300 + i * 64}">${esc(l)}</tspan>`)
    .join("\n");

  return {
    width: W,
    height: H,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">
  <defs>
    <linearGradient id="og" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${TEAL}"/><stop offset="1" stop-color="${TEAL_DEEP}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${INK}"/>
  <rect width="${W}" height="8" fill="url(#og)"/>
  <text x="${PAD}" y="${PAD + 112}" font-size="60" font-weight="700" fill="${PAPER}" letter-spacing="-1.2"
        font-family="${FONT}">${esc(company.shortName)}</text>
  <text font-size="52" fill="${TEAL}" font-weight="600" letter-spacing="-0.6"
        font-family="${FONT}">
${text}
  </text>
  <text x="${PAD}" y="${H - PAD}" font-size="28" fill="${MUTED}"
        font-family="${FONT}">${esc(
          company.siteUrl.replace(/^https?:\/\//, ""),
        )} &#183; ${esc(company.city)}, ${esc(company.regionName)}</text>
</svg>`,
  };
}
