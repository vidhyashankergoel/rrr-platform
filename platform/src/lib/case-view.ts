/**
 * CLIENT-SAFE CASE STUDY VIEW
 *
 * The shape a case study takes when it crosses into a client component, and
 * the only place that conversion happens.
 *
 * WHY THIS EXISTS. `<CaseCard study={c} />` originally took the whole
 * `CaseStudy`. Next serialises every prop of a client component into the page
 * payload, so the `client` field — the real, named client of a prior employer
 * — was shipped to every visitor and readable in view-source, on a page that
 * renders only the descriptive label. `displayClient()` was working correctly
 * the whole time; the raw name travelled through a door it cannot see.
 *
 * (The names are deliberately not quoted anywhere in this file. The test that
 * guards this scans source for them, and an exception carved out for the very
 * module that explains the problem is how an allowlist starts growing.)
 *
 * WHY IT IS ITS OWN FILE. This started out beside the component in
 * `Expand.tsx`, which carries "use client". The build refused it:
 *
 *     Attempted to call toCaseView() from the server but toCaseView is on
 *     the client.
 *
 * — correctly, because a module marked "use client" cannot export a function
 * the server calls. The conversion has to live outside that boundary, which
 * is also the right place for it on its own merits: resolving attribution is
 * server work, and the component should not be able to do it even by mistake.
 *
 * The test suite asserts that the object this produces carries neither the
 * real client name nor the employer, in any field.
 */

import type { CaseStudy } from "./catalogue";
import { displayClient, attributionLine } from "./attribution";

export interface CaseView {
  slug: string;
  sector: string;
  period: string;
  /** Already resolved through displayClient(). Never the raw name. */
  client: string;
  headline: string;
  problem: string;
  work: readonly string[];
  results: ReadonlyArray<readonly [string, string]>;
  stack: readonly string[];
  /** Already resolved through attributionLine(). */
  attribution: string;
}

/**
 * Resolve a case study into the only fields a client component needs.
 *
 * Every field is copied explicitly rather than spread. A spread would silently
 * carry `client` and `employer` across the moment anyone added them back, and
 * the whole point of this function is that the omission is deliberate and
 * visible.
 */
export function toCaseView(study: CaseStudy): CaseView {
  return {
    slug: study.slug,
    sector: study.sector,
    period: study.period,
    client: displayClient(study),
    headline: study.headline,
    problem: study.problem,
    work: study.work,
    results: study.results,
    stack: study.stack,
    attribution: attributionLine(study),
  };
}
