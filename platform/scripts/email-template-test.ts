/**
 * EMAIL TEMPLATE TESTS
 *
 * Auto-replies go out unattended to strangers, which makes them the highest-
 * risk text in the codebase: nobody reads them before they send. These checks
 * cover the two failure modes that matter.
 *
 *  1. ROUTING — the right template fires for the right enquiry. Sending the
 *     rate card to someone whose production is down is worse than sending
 *     nothing.
 *  2. CONTENT — no template promises something the business cannot do, quotes
 *     a price the pricing page contradicts, claims to be hand-written, or
 *     strays into commercial territory that CASL would require consent for.
 *
 * Run:  npm run test:emails
 */

import { renderEnquiryReply, referenceFor, ALL_TEMPLATE_KEYS, type LeadLike } from "../src/lib/email-templates";
import { auditOffer, services, retainers } from "../src/lib/catalogue";
import { company } from "../src/lib/company";

let passed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = "") {
  if (ok) passed += 1;
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

function lead(over: Partial<LeadLike> = {}): LeadLike {
  return { name: "Dana Okafor", company: "Northwind Logistics", ...over };
}

function heading(text: string) {
  console.log(`\n${text}`);
}

// ---------------------------------------------------------------------------
//  Routing
// ---------------------------------------------------------------------------
heading("Routing");

const routes: [string, LeadLike, string][] = [
  ["production outage", lead({ message: "Our production API is down and we cannot deploy a fix." }), "incident"],
  ["the word urgent", lead({ message: "We need help urgently with our Kubernetes cluster please." }), "incident"],
  ["a breach", lead({ message: "We think we have been hacked and need someone today." }), "incident"],
  ["audit by source", lead({ source: "audit", message: "Tell me about the audit" }), "audit-request"],
  ["audit by service id", lead({ serviceIds: auditOffer.id, message: "interested in this" }), "audit-request"],
  ["NDA by source", lead({ source: "nda", message: "Please send the NDA" }), "nda-request"],
  ["small budget", lead({ budgetBand: "under-25k", message: "We want to move to AWS this year." }), "small-budget"],
  ["named service", lead({ serviceIds: "k8s-platform", message: "We need a Kubernetes platform built." }), "service-interest"],
  ["just exploring", lead({ timeline: "exploring", message: "Having a look at what is out there for us." }), "exploring"],
  ["needs to start now", lead({ timeline: "immediate", message: "We would like to begin a migration project soon." }), "urgent-timeline"],
  ["one-line enquiry", lead({ message: "hi" }), "needs-detail"],
  ["no message at all", lead({}), "needs-detail"],
  ["ordinary enquiry", lead({ message: "We are a logistics company looking at modernising how we deploy software across our two datacentres." }), "general"],
];

for (const [label, l, want] of routes) {
  const got = renderEnquiryReply(l);
  check(`${label} -> ${want}`, got.templateKey === want, `got ${got.templateKey}`);
}

// Priority: an incident beats every other signal.
const incidentWins = renderEnquiryReply(
  lead({ message: "Production is down.", budgetBand: "under-25k", timeline: "exploring", serviceIds: "k8s-platform" }),
);
check("an incident outranks budget, timeline and service", incidentWins.templateKey === "incident", incidentWins.templateKey);

// ---------------------------------------------------------------------------
//  Content rules — applied to every template
// ---------------------------------------------------------------------------
heading("Content rules");

const samples = routes.map(([label, l]) => ({ label, email: renderEnquiryReply(l) }));
check("every declared template is reachable", new Set(samples.map((s) => s.email.templateKey)).size === ALL_TEMPLATE_KEYS.length,
  `${new Set(samples.map((s) => s.email.templateKey)).size} of ${ALL_TEMPLATE_KEYS.length}`);

/** Language no automated email from this company may contain. */
const FORBIDDEN: [RegExp, string][] = [
  [/\bwe guarantee\b|\bguaranteed\b|100% uptime/i, "an unqualified guarantee"],
  [/\bthis (is|constitutes) (a|an) (offer|contract|agreement)\b/i, "language that could form a contract"],
  [/\bbinding\b/i, "the word binding"],
  [/\bfinal price\b|\bfixed quote\b/i, "a price presented as final"],
  [/\bDear (Sir|Madam)\b/i, "a form-letter salutation"],
  // A signature is expected in business email. What is forbidden is one that
  // signs off as a named individual, because no individual wrote this.
  [/\n\s*(Best regards|Kind regards|Sincerely|Warm regards|Yours truly|Cheers),/i, "a sign-off implying a person typed it"],
  [/unsubscribe/i, "an unsubscribe line (added by the mailer, not the template)"],
  [/\b(act now|limited time|special offer|don't miss|exclusive deal)\b/i, "promotional urgency"],
  [/\bundefined\b|\bnull\b|\bNaN\b|\[object/i, "an unrendered value"],
  [/\{\{|\}\}|\$\{/, "an unsubstituted placeholder"],
];

for (const { label, email } of samples) {
  for (const [pattern, why] of FORBIDDEN) {
    check(`${email.templateKey}: no ${why}`, !pattern.test(email.bodyText), `in "${label}"`);
  }

  check(`${email.templateKey}: greets by first name`, /^Hello Dana,/m.test(email.bodyText));
  check(`${email.templateKey}: says it is automated`, /generated automatically/i.test(email.bodyText));

  // Signature: the firm, what it does, and two ways to reach a person.
  check(`${email.templateKey}: signed with the company name`, email.bodyText.includes(company.shortName));
  check(`${email.templateKey}: signature states what the firm does`, email.bodyText.includes(company.tagline));
  check(`${email.templateKey}: signature carries the website`, email.bodyText.includes(company.siteUrl));
  check(`${email.templateKey}: signature carries the location`, email.bodyText.includes(company.city));
  check(`${email.templateKey}: signature carries the hours`, email.bodyText.includes(company.hours));
  check(`${email.templateKey}: signature is at the end`, email.bodyText.lastIndexOf(company.siteUrl) > email.bodyText.length * 0.5);
  check(`${email.templateKey}: says a person will reply`, /a person (is reading|has your enquiry|will reply)|replies in person/i.test(email.bodyText));
  check(`${email.templateKey}: gives a way to reach a human`, email.bodyText.includes(company.phone) || email.bodyText.includes(company.email));
  check(`${email.templateKey}: has a subject`, email.subject.length > 5 && email.subject.length < 90, email.subject);
  check(`${email.templateKey}: subject is not all caps`, email.subject !== email.subject.toUpperCase());
  check(`${email.templateKey}: subject has no spam punctuation`, !/[!]{1,}|\$\$|FREE/.test(email.subject), email.subject);
  check(`${email.templateKey}: is substantial`, email.bodyText.length > 300, `${email.bodyText.length} chars`);
  check(`${email.templateKey}: is not a wall of text`, email.bodyText.length < 3000, `${email.bodyText.length} chars`);
}

// Distinct per TEMPLATE, not per sample: several samples deliberately route
// to the same template (three different incident phrasings, for instance) and
// those must of course share a subject.
const byTemplate = new Map(samples.map((s) => [s.email.templateKey, s.email.subject]));
check(
  "every template has a distinct subject",
  new Set(byTemplate.values()).size === byTemplate.size,
  [...byTemplate.values()].filter((x, i, a) => a.indexOf(x) !== i).join(" | "),
);
check("no two templates share a key with different subjects", samples.every((s) => byTemplate.get(s.email.templateKey) === s.email.subject));

// ---------------------------------------------------------------------------
//  Context block
// ---------------------------------------------------------------------------
heading("Context");

const ctx = renderEnquiryReply(lead({
  message: "We run 40 EC2 instances with no Terraform whatsoever.",
  budgetBand: "75-150k",
  timeline: "1-3-months",
  reference: "RRR-4K2P9X",
}));
check("context shows the company", ctx.bodyText.includes("Northwind Logistics"));
check("context shows the budget", ctx.bodyText.includes("$75,000 to $150,000"));
check("context shows the timeline", ctx.bodyText.includes("one to three months"));
check("context invites correction", /reply and we will correct it/i.test(ctx.bodyText));
check("reference appears in the signature", ctx.bodyText.includes("RRR-4K2P9X"));

// ---------------------------------------------------------------------------
//  Numbers must match the catalogue
// ---------------------------------------------------------------------------
heading("Figures");

const auditEmail = renderEnquiryReply(lead({ source: "audit" }));
check("audit reply quotes the catalogue price", auditEmail.bodyText.includes("$4,500") && auditOffer.price === 4500);
check("audit reply quotes the catalogue duration", auditEmail.bodyText.includes(auditOffer.durationLabel), auditOffer.durationLabel);
check("audit reply lists what is included", auditOffer.includes.every((i) => auditEmail.bodyText.includes(i)));
check("audit reply requires an NDA first", /NDA/.test(auditEmail.bodyText));
check("audit reply promises read-only access", /read-only/i.test(auditEmail.bodyText));

const k8s = services.find((s) => s.id === "k8s-platform")!;
const svcEmail = renderEnquiryReply(lead({ serviceIds: k8s.id, message: "We need a Kubernetes platform built for us." }));
check("service reply quotes the catalogue range", svcEmail.bodyText.includes(k8s.durationLabel), k8s.durationLabel);
check("service reply marks figures indicative", /indicative, not an|not an offer/i.test(svcEmail.bodyText));

const budgetEmail = renderEnquiryReply(lead({ budgetBand: "under-25k", message: "We want to move to the cloud." }));
check("small-budget reply quotes the retainer price", budgetEmail.bodyText.includes(retainers[0]!.name));
check("small-budget reply is honest about what is out of reach", /does not stretch|cannot act on/i.test(budgetEmail.bodyText));

const incidentEmail = renderEnquiryReply(lead({ message: "Production is down right now." }));
check("incident reply leads with the phone number", incidentEmail.bodyText.indexOf(company.phone) < 400);
check("incident reply does not claim 24/7 cover", !/we are available 24\/7|24\/7 for (you|everyone)/i.test(incidentEmail.bodyText));
check("incident reply admits the limitation", /not going to pretend|retainer clients/i.test(incidentEmail.bodyText));
check("incident reply points elsewhere when faster", /cloud provider's support/i.test(incidentEmail.bodyText));

// ---------------------------------------------------------------------------
//  Their words come back
// ---------------------------------------------------------------------------
heading("Echo");

const echoed = renderEnquiryReply(lead({ message: "We run 40 EC2 instances with no Terraform whatsoever." }));
check("quotes the enquiry back", echoed.bodyText.includes("40 EC2 instances"));

const long = "x".repeat(2000);
const clipped = renderEnquiryReply(lead({ message: long }));
check("clips an over-long enquiry", !clipped.bodyText.includes("x".repeat(700)));
check("marks the clip", clipped.bodyText.includes("…"));

check("reference is short and quotable", /^RRR-[A-Z0-9]{6}$/.test(referenceFor("cmuaiwqs80003v9og0pozz81i")), referenceFor("cmuaiwqs80003v9og0pozz81i"));

const empty = renderEnquiryReply(lead({ message: "" }));
check("no empty quote block when nothing was written", !empty.bodyText.includes("What you sent us:"));

// A single-word name must not produce "Hello ,"
const oneWord = renderEnquiryReply({ name: "Cher", message: "Hello there, we need some help with our cloud setup." });
check("handles a single-word name", oneWord.bodyText.startsWith("Hello Cher,"));
const spacey = renderEnquiryReply({ name: "   ", message: "Some reasonably long message about our infrastructure." });
check("handles a blank name", spacey.bodyText.startsWith("Hello there,"));

// ---------------------------------------------------------------------------
console.log(`\n${"=".repeat(40)}`);
console.log(` ${passed} passed, ${failures.length} failed`);
console.log("=".repeat(40));
if (failures.length) {
  console.log("\nFAILURES:");
  for (const f of failures) console.log(`  - ${f}`);
  console.log("");
}
process.exit(failures.length === 0 ? 0 : 1);
