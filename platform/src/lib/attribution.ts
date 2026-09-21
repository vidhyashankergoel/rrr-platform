/**
 * PRIOR-WORK ATTRIBUTION
 * ======================
 *
 * How the site describes work the founder delivered while employed elsewhere.
 *
 * THE RISK, stated plainly. Describing a former employer's clients on your own
 * company's website can touch four things at once:
 *
 *  1. **Confidentiality.** Most IT services employment agreements have a
 *     confidentiality clause covering client identity, engagement detail and
 *     methodology. The clause usually survives termination.
 *  2. **Non-solicitation.** Naming clients is not soliciting them, but the two
 *     get conflated fast if the naming appears on a page selling services.
 *  3. **Implied endorsement.** Listing a client logo or name can suggest the
 *     client endorses the new firm. It does not, and saying so matters.
 *  4. **Accuracy.** Claiming the work as the *company's* track record when it
 *     was the founder's employment is a misrepresentation to a buyer.
 *
 * THE MITIGATION. Three levels, switchable with one constant:
 *
 *  - `named`       — names the client, with an explicit no-endorsement note.
 *                    Appropriate where the engagement is already public on
 *                    your own LinkedIn profile and has been for years.
 *  - `descriptive` — describes the client by sector and scale, never by name.
 *                    "A major Canadian international airport authority."
 *                    Keeps almost all the persuasive value, removes the name.
 *  - `minimal`     — sector only, no scale detail. Maximum caution.
 *
 * WHAT TO DO. Read your Wipro employment agreement and look for:
 *
 *  - a confidentiality or non-disclosure clause, and whether "client identity"
 *    or "client information" is inside its definition
 *  - a survival clause saying how long confidentiality outlives employment
 *  - a non-solicitation clause and its duration
 *  - anything about use of the employer's name or client names post-employment
 *
 * If any of those are broad, switch `ATTRIBUTION_MODE` to `"descriptive"`.
 * It is one word, and every page, the assistant, the structured data and the
 * knowledge index follow it automatically.
 *
 * This is not legal advice. Have the agreement reviewed — it is a thirty-minute
 * question for a Canadian employment lawyer and far cheaper than the argument.
 */

export type AttributionMode = "named" | "descriptive" | "minimal";

/**
 * Change this one value to re-frame every prior-employment reference on the
 * site. No other file needs editing.
 */
export const ATTRIBUTION_MODE: AttributionMode = "descriptive";
//                                                ^^^^^^^^^^^^^
// Set to "descriptive" until the Wipro employment agreement has been read.
// The clause that decides it is whether *client identity* falls inside the
// confidentiality definition. See docs/TRADEMARK-AND-PRIOR-WORK.md.
// Switch back to "named" once you know it is safe — every surface follows.

/**
 * Structural shape shared with CaseStudy in catalogue.ts. Kept as its own
 * interface so the attribution rules do not depend on the whole case-study
 * record, and so anything else that references prior work can reuse them.
 */
export interface PriorEngagement {
  /** Real client name. Shown only in `named` mode. */
  client: string;
  /** Anonymized description. Shown in `descriptive` mode. */
  clientDescriptive: string;
  /** Sector-only label. Shown in `minimal` mode. */
  clientMinimal: string;
  /** The employer the work was performed for, or null for our own engagements. */
  employer: string | null;
}

export function displayClient(e: PriorEngagement, mode: AttributionMode = ATTRIBUTION_MODE): string {
  if (!e.employer) return e.client; // Direct engagement — our own client.
  switch (mode) {
    case "named":
      return e.client;
    case "descriptive":
      return e.clientDescriptive;
    case "minimal":
      return e.clientMinimal;
  }
}

/**
 * The attribution line shown under the client name. Deliberately explicit:
 * a buyer reading this should be in no doubt that the work was delivered in
 * the course of employment and that nobody is endorsing anybody.
 */
export function attributionLine(
  e: PriorEngagement,
  mode: AttributionMode = ATTRIBUTION_MODE,
): string {
  if (!e.employer) return "Engagement delivered by this firm";

  if (mode === "named") {
    return `Delivered by our founder in the course of employment with ${e.employer}, on that firm’s client account`;
  }
  return `Delivered by our founder in the course of employment with a global IT services firm`;
}

/**
 * The disclaimer that must appear wherever prior-employment work is listed.
 * Covers the endorsement point and the "whose track record is this" point,
 * which are the two a procurement reviewer actually cares about.
 */
export const PRIOR_WORK_DISCLAIMER =
  "Engagements above were delivered by our founder in the course of employment with a prior employer, on that employer’s client accounts. They are presented as evidence of hands-on capability, not as this company’s corporate track record, and they do not imply that any client or former employer endorses, sponsors or is affiliated with this firm. No confidential information, proprietary methodology or client data is disclosed. All third-party names and marks belong to their owners.";

/** Shorter form, for places where the full paragraph will not fit. */
export const PRIOR_WORK_DISCLAIMER_SHORT =
  "Delivered in the course of prior employment. Evidence of capability, not a claim of endorsement or of this company’s corporate track record.";
