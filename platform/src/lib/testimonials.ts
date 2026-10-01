/**
 * TESTIMONIALS
 *
 * THIS ARRAY IS EMPTY ON PURPOSE AND MUST STAY HONEST.
 * =====================================================
 * A testimonial is a statement of fact about what a named person said. Writing
 * a plausible-sounding one is not marketing copy, it is a fabricated record —
 * and on a site whose entire argument is "we tell you the truth, including
 * when you don't need us", a single invented quote destroys the only asset
 * this firm currently has.
 *
 * It is also illegal to fake one. Canada's Competition Act prohibits
 * materially false or misleading representations to promote a business
 * interest, and the 2022 and 2024 amendments raised the penalties sharply.
 * The United States FTC's Rule on Consumer Reviews and Testimonials (effective
 * October 2024) bans fake reviews outright with per-violation civil penalties.
 *
 * So the section renders nothing until a real person has really said
 * something. Until then `<Reviews />` shows what a prospect can verify for
 * themselves instead, which is a better answer than a quote they have no way
 * to check.
 *
 * HOW TO ADD A REAL ONE
 * ---------------------
 *  1. Ask. The two engagements that are this company's own — Rugby Canada and
 *     Digitalogy LLC — are the only ones to ask; the rest were delivered under
 *     prior employment and are not ours to solicit on.
 *  2. Get it in writing, from the person, and keep the email. Under PIPEDA
 *     their name, title and employer are personal information, and publishing
 *     them needs their consent. "Yes, you can use that quote and my name" in
 *     an email is enough. Keep it.
 *  3. Paste it below, verbatim. Do not improve their English, do not tighten
 *     their phrasing, do not merge two sentences they said separately. An
 *     edited quote attributed to a named person is still a fabrication.
 *  4. If they will only speak anonymously, that is fine — use the role and
 *     sector and leave `name` empty. An honest anonymous quote beats a named
 *     one they did not write.
 *
 * `docs/LINKEDIN.md` has the wording to ask with.
 */

export interface Testimonial {
  /** Verbatim. Never edited, never composited from several messages. */
  quote: string;
  /** Empty when they agreed to be quoted but not named. */
  name: string;
  role: string;
  organization: string;
  /** Where the consent is recorded, for our own audit trail. Never rendered. */
  consentNote: string;
}

export const testimonials: Testimonial[] = [
  // Nothing here yet. See the header before adding anything.
];

/**
 * What a prospect can check without talking to us.
 *
 * This is what the reviews section shows while there are no reviews. It is
 * deliberately not an apology for having none — for a firm this young, "here
 * is the actual work, go and read it" is a stronger claim than a testimonial
 * a stranger has no way to verify.
 */
export interface Verifiable {
  label: string;
  detail: string;
  href: string;
  cta: string;
}

export const verifiable: Verifiable[] = [
  {
    label: "Read our code before you hire us",
    detail:
      "Twenty-five production Grafana dashboards and over 150 classified PromQL and LogQL queries, published in full. Judge the naming, the structure and whether it would survive your cluster.",
    href: "https://github.com/vidhya101/grafana-observability-toolkit",
    cta: "Open the repository",
  },
  {
    label: "Check the price before you call",
    detail:
      "Every service carries a range in Canadian dollars and a realistic duration. No quote request, no discovery call before a number.",
    href: "/pricing",
    cta: "See pricing and durations",
  },
  {
    label: "Test us for five days",
    detail:
      "A fixed-price infrastructure audit on read-only access. You keep the written report whether or not you ever engage us, and taking it to another firm is a perfectly reasonable outcome.",
    href: "/trust",
    cta: "Other ways to test us",
  },
];
