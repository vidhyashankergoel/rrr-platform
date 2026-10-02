/**
 * THE COMPLIANCE GATE
 *
 * Everything else in this directory is advice. This is the part that refuses.
 *
 * A post is published under the company name, to an audience of exactly the
 * people whose trust the firm is selling. The failure modes are not
 * embarrassing, they are expensive:
 *
 *   • Naming a client, or anything only their team would recognise, breaks
 *     confidence with the one group whose word carries weight. Most prior
 *     engagements were delivered under employment with another firm, on that
 *     firm's accounts — those are not ours to talk about at all.
 *
 *   • An invented metric is a materially false representation made to promote
 *     a business. The Competition Act does not require that anyone was harmed,
 *     and administrative monetary penalties are set against revenue.
 *
 *   • Fabricated testimonials and follower counts are prohibited outright by
 *     the FTC's 2026 rule on consumer reviews, and the equivalent Canadian
 *     exposure is the same Competition Act provision. A page with nine
 *     followers claiming fifty thousand is also self-refuting to anybody who
 *     clicks it.
 *
 *   • Personal information in a public post is a PIPEDA disclosure without
 *     consent.
 *
 * No part of this is a matter of taste, so none of it is a warning. Every
 * finding here blocks the post. The list of forbidden names is derived at
 * runtime from the catalogue rather than written out, so that this file never
 * becomes the place a real client name leaks into.
 */

import { caseStudies } from "../catalogue";
import { company } from "../company";

export interface Violation {
  rule: string;
  detail: string;
  /** The offending fragment, for the report. Never the full post. */
  found: string;
}

/**
 * Names that must never appear: every real client, and every employer the
 * work was delivered under. Read from the catalogue so this list cannot fall
 * out of step with it, and so no name is written down twice.
 */
function forbiddenNames(): string[] {
  const names = new Set<string>();
  for (const study of caseStudies) {
    if (study.client?.trim()) names.add(study.client.trim());
    if (study.employer?.trim()) names.add(study.employer.trim());
  }
  return [...names];
}

/**
 * Significant words from each forbidden name, so that a partial mention is
 * caught too — "the Airports Authority rollout" names the client as surely as
 * the full legal name does. Short and generic words are dropped, or every
 * post mentioning "Canada" would fail.
 */
const GENERIC = new Set([
  "the", "and", "of", "inc", "ltd", "limited", "corp", "corporation", "company",
  "group", "canada", "canadian", "technologies", "technology", "services",
  "solutions", "systems", "international", "national", "authority", "insurance",
]);

/**
 * Words the firm already says about itself in public. A token cannot be a
 * client tell if it is on our own contact page: the city is Toronto, and one
 * former client's legal name also contains "Toronto", which would otherwise
 * make every post mentioning where we are into a confidentiality breach.
 */
const OURS = new Set(
  [company.legalName, company.shortName, company.displayName, company.city,
   company.regionName, company.country, company.tagline]
    .join(" ")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase()),
);

function distinctiveTokens(name: string): string[] {
  return name
    .split(/[^A-Za-z0-9]+/)
    .filter((w) => w.length >= 4)
    .filter((w) => !GENERIC.has(w.toLowerCase()))
    .filter((w) => !OURS.has(w.toLowerCase()));
}

/** Claims of scale or rating that we have no evidence for. */
const FABRICATED_SOCIAL_PROOF = [
  /\b\d[\d,.]*\s*k?\+?\s*(?:followers|subscribers|members)\b/i,
  /\b\d[\d,.]*\s*\+?\s*(?:reviews|ratings|testimonials)\b/i,
  /\b(?:five|5)[\s-]star\b/i,
  /\b\d[\d,.]*\s*\+?\s*(?:happy|satisfied)\s+(?:clients|customers)\b/i,
  /\btrusted by\s+\d/i,
  /\b(?:award[- ]winning|industry[- ]leading|world[- ]class|best[- ]in[- ]class)\b/i,
  /\b(?:#1|number one)\b/i,
];

/**
 * Performance claims expressed as a number. Not inherently false — but a
 * number is the thing a regulator asks you to substantiate, and a post is the
 * worst place to discover you cannot. Anything matching has to be approved by
 * a person who knows where the figure came from.
 */
const QUANTIFIED_CLAIM = [
  /\b(?:reduced|cut|improved|increased|boosted|saved|slashed)\b[^.]{0,40}\b\d+\s*%/i,
  /\b\d+\s*%\s*(?:faster|cheaper|fewer|less|more|reduction|improvement)\b/i,
  /\b\d+(?:\.\d+)?\s*x\s+(?:faster|cheaper|better|more)\b/i,
  /\bzero\s+(?:downtime|incidents|outages)\b/i,
  /\b99(?:\.9+)?\s*%\s*uptime\b/i,
];

/** Things that look like credentials. A post is a public place. */
const SECRET_SHAPED = [
  /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/,
  /\bghp_[A-Za-z0-9]{36}\b/,
  /\bsk-[A-Za-z0-9]{20,}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./,
];

export function screen(text: string): Violation[] {
  const found: Violation[] = [];
  const add = (rule: string, detail: string, fragment: string) =>
    found.push({ rule, detail, found: fragment });

  // --- Client and employer identity --------------------------------------
  for (const name of forbiddenNames()) {
    if (text.toLowerCase().includes(name.toLowerCase())) {
      add("client-identity", "names a real client or a prior employer", name);
      continue;
    }
    for (const token of distinctiveTokens(name)) {
      const pattern = new RegExp(`\\b${token}\\b`, "i");
      if (pattern.test(text)) {
        add("client-identity",
          "contains a distinctive word from a real client or employer name",
          token);
        break;
      }
    }
  }

  // --- Invented social proof ---------------------------------------------
  for (const pattern of FABRICATED_SOCIAL_PROOF) {
    const m = text.match(pattern);
    if (m) {
      add("social-proof",
        "claims reach, ratings or standing the firm cannot evidence — Competition Act s.74.01 and the FTC rule on reviews",
        m[0]);
    }
  }

  // --- Numbers that would have to be substantiated ------------------------
  for (const pattern of QUANTIFIED_CLAIM) {
    const m = text.match(pattern);
    if (m) {
      add("unsubstantiated-metric",
        "a quantified performance claim — publish only with a named engagement behind it and permission to cite it",
        m[0]);
    }
  }

  // --- Personal information ----------------------------------------------
  const emails = text.match(/\b[\w.+-]+@[\w-]+\.[\w.]+\b/g) ?? [];
  for (const email of emails) {
    if (email.toLowerCase() !== company.email.toLowerCase()) {
      add("pii", "a third party's email address", email);
    }
  }
  // Shaped like a phone number people actually write: an optional country
  // code, then 10 to 15 digits broken by at most a few separators. The loose
  // version of this matched SVG path coordinates, which is how a diagram got
  // reported as leaking somebody's phone number.
  const phones = text.match(/\+?\d(?:[ .-]?\(?\d{2,4}\)?){2,5}[ .-]?\d{2,4}/g) ?? [];
  for (const phone of phones) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) continue;
    if (!company.phoneHref.replace(/\D/g, "").endsWith(digits.slice(-10))) {
      add("pii", "a phone number that is not the company's own", phone);
    }
  }

  // --- Credentials --------------------------------------------------------
  for (const pattern of SECRET_SHAPED) {
    const m = text.match(pattern);
    if (m) add("secret", "something shaped like a credential", m[0].slice(0, 12) + "…");
  }

  return found;
}

export const clear = (text: string) => screen(text).length === 0;
