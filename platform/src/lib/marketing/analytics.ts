/**
 * WHAT ACTUALLY WORKED
 *
 * The question "what are people engaging with?" has two possible answers, and
 * only one of them is legitimate.
 *
 * The illegitimate one is scraping — reading other people's feeds, posts and
 * reactions with an automated client. LinkedIn's User Agreement prohibits it
 * in terms, and the data it collects is personal information about named
 * individuals who never consented to being in our dataset. A firm whose
 * entire pitch is that it handles other people's data properly cannot be
 * running a scraper. It is also the single most reliably detected violation,
 * and detection costs the page.
 *
 * The legitimate one is this file. As page admin you can export your own
 * analytics from LinkedIn whenever you like, which gives you impressions,
 * reactions, comments and click-through for every post you published. That is
 * better data than scraping would produce anyway: it is yours, it is
 * complete, and it is about your own content rather than inferred from
 * someone else's.
 *
 * HOW TO GET THE FILE
 * -------------------
 *   LinkedIn page -> Analytics -> Content -> Export, choose a date range.
 *   Save the download as `platform/data/linkedin-analytics.csv` (git-ignored).
 *
 * Then `npm run marketing:analytics` reports which pillars earned attention
 * and which did not, so the rotation can be weighted by evidence rather than
 * by what we found most interesting to write.
 */

import { readFileSync, existsSync } from "node:fs";
import { ALL_ANGLES, pillarOf } from "./pillars";

export const EXPORT_PATH = "data/linkedin-analytics.csv";

export interface PostStat {
  /** The angle this post came from, recovered from its utm_content tag. */
  angleId?: string;
  pillar?: string;
  url: string;
  impressions: number;
  engagements: number;
  /** Engagements per impression. The only number worth ranking on. */
  rate: number;
}

export interface Report {
  available: boolean;
  reason?: string;
  posts: PostStat[];
  /** Pillars ordered by median engagement rate, best first. */
  byPillar: { pillar: string; posts: number; medianRate: number }[];
}

/**
 * A minimal CSV reader. LinkedIn's export quotes fields containing commas and
 * escapes a literal quote by doubling it; that is the whole dialect, and a
 * dependency to parse it would be a dependency to audit.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];

    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; }
        else quoted = false;
      } else field += c;
      continue;
    }

    if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }

  return rows.filter((r) => r.some((cell) => cell.trim().length));
}

const num = (s: string | undefined) => {
  const n = Number((s ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/**
 * LinkedIn has renamed these columns more than once and localises some of
 * them, so match on a substring of the lowercased header rather than on an
 * exact string that will break the next time they adjust the wording.
 */
function columnIndex(header: string[], ...candidates: string[]): number {
  const lower = header.map((h) => h.toLowerCase().trim());
  for (const candidate of candidates) {
    const i = lower.findIndex((h) => h.includes(candidate));
    if (i >= 0) return i;
  }
  return -1;
}

export function readReport(path = EXPORT_PATH): Report {
  if (!existsSync(path)) {
    return {
      available: false,
      reason:
        `no export at ${path}. On the LinkedIn page: Analytics > Content > Export, ` +
        `then save the file there. Nothing is scraped and nothing is fetched on your behalf.`,
      posts: [],
      byPillar: [],
    };
  }

  const rows = parseCsv(readFileSync(path, "utf8"));
  if (rows.length < 2) {
    return { available: false, reason: `${path} has no data rows`, posts: [], byPillar: [] };
  }

  // The export carries a title block above the real header on some ranges, so
  // find the row that actually looks like column names.
  const headerRow = rows.findIndex((r) => columnIndex(r, "impression") >= 0);
  if (headerRow < 0) {
    return {
      available: false,
      reason: `${path} has no impressions column - is this the Content export rather than Followers?`,
      posts: [],
      byPillar: [],
    };
  }

  const header = rows[headerRow];
  const iUrl = columnIndex(header, "post url", "post link", "url");
  const iImp = columnIndex(header, "impression");
  const iEng = columnIndex(header, "engagement", "reaction", "click");

  const posts: PostStat[] = [];
  for (const row of rows.slice(headerRow + 1)) {
    const url = (iUrl >= 0 ? row[iUrl] : "")?.trim() ?? "";
    const impressions = num(row[iImp]);
    const engagements = num(row[iEng]);
    if (!impressions) continue;

    // Recover which angle produced the post from the campaign tag the writer
    // attached. Posts published before this system existed simply have none.
    const tagged = /utm_content=([A-Za-z0-9_-]+)/.exec(url)?.[1];
    const angleId = ALL_ANGLES.some((a) => a.id === tagged) ? tagged : undefined;

    posts.push({
      angleId,
      pillar: angleId ? pillarOf(angleId)?.name : undefined,
      url,
      impressions,
      engagements,
      rate: engagements / impressions,
    });
  }

  const groups = new Map<string, number[]>();
  for (const p of posts) {
    if (!p.pillar) continue;
    groups.set(p.pillar, [...(groups.get(p.pillar) ?? []), p.rate]);
  }

  const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  };

  const byPillar = [...groups.entries()]
    .map(([pillar, rates]) => ({ pillar, posts: rates.length, medianRate: median(rates) }))
    .sort((a, b) => b.medianRate - a.medianRate);

  return { available: true, posts, byPillar };
}
