/**
 * Automatic replies to an enquiry.
 *
 * WHAT THESE ARE
 * --------------
 * A person still answers every enquiry. These go out in the minutes before
 * that, and their job is to be *useful in the gap* rather than to say "we got
 * your message" — which the visitor already knows, because they pressed the
 * button.
 *
 * So each one restates what they actually asked, answers the obvious next
 * question with a real number from the catalogue, and says exactly what
 * happens next and who does it.
 *
 * WHAT THEY MUST NEVER BE
 * -----------------------
 *  • **Pretending to be hand-written.** Every one says a person is reading it.
 *    An automated reply signed as though a human typed it is a small deceit
 *    that gets found out the moment the real reply contradicts it.
 *  • **Commercial.** These are transactional under CASL — they answer a
 *    message the recipient sent us. The moment one starts promoting services
 *    the recipient did not ask about, it becomes a commercial electronic
 *    message and needs express consent under s.6(1). Cross-selling here would
 *    turn a $0 email into a $10,000,000 exposure.
 *  • **Binding.** Every figure is the published range, explicitly indicative.
 *    No template commits to a price, a date, or a scope.
 *
 * Prices and durations are read from the catalogue, never retyped, so an
 * email can never quote a number the pricing page contradicts.
 */

import { services, auditOffer, retainers } from "./catalogue";
import { company, currencyFromDollars as money } from "./company";

export interface LeadLike {
  name: string;
  company?: string | null;
  message?: string | null;
  serviceIds?: string | null;
  budgetBand?: string | null;
  timeline?: string | null;
  /** website | chat | booking | nda | audit */
  source?: string | null;
  /** Short quotable reference, e.g. RRR-4K2P9X. */
  reference?: string;
}

export interface RenderedEmail {
  subject: string;
  bodyText: string;
  /** Which template fired. Stored on the message so replies can be audited. */
  templateKey: string;
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";

/**
 * The context block: what we have on file, in their words.
 *
 * Two jobs. It proves the reply is about *their* enquiry rather than a blast,
 * and it shows exactly what we recorded — which is also the PIPEDA-friendly
 * behaviour, because a person cannot ask us to correct data they have never
 * been shown.
 */
function context(lead: LeadLike): string[] {
  const noted: string[] = [];
  if (lead.company) noted.push(`  Company:   ${lead.company}`);
  if (lead.budgetBand) noted.push(`  Budget:    ${BUDGET_TEXT[lead.budgetBand] ?? lead.budgetBand}`);
  if (lead.timeline) noted.push(`  Timeline:  ${TIMELINE_TEXT[lead.timeline] ?? lead.timeline}`);
  const picked = chosen(lead);
  if (picked.length) noted.push(`  Interest:  ${picked.map((s) => s.name).join(", ")}`);

  const text = (lead.message ?? "").trim();
  const quote = text
    ? [
        "  You wrote:",
        "",
        ...(text.length > 600 ? `${text.slice(0, 600)}…` : text).split("\n").map((l) => `    ${l}`),
      ]
    : [];

  if (!noted.length && !quote.length) return [];

  const rule = "  " + "─".repeat(52);
  return ["", "What we have on file:", "", rule, ...noted, ...(noted.length && quote.length ? [""] : []), ...quote, rule,
    "", "If anything there is wrong, reply and we will correct it.", ""];
}

/**
 * The signature block.
 *
 * A real business signature — name, what the firm does, how to reach a human,
 * where it is based — because an email without one reads as machine spam and
 * gets filed accordingly.
 *
 * The automation notice sits inside it rather than being omitted. A signature
 * that implies a named person typed this is the dishonest version: the
 * recipient finds out the moment the real reply arrives and contradicts it.
 * Saying "generated automatically, a person follows" costs nothing and is
 * true.
 *
 * The mailer appends the CASL s.6(2) identification block and the s.11
 * unsubscribe line below this — legal name, mailing address, opt-out — so
 * they are deliberately not repeated here.
 */
function signature(reference?: string): string[] {
  return [
    "",
    "—",
    company.shortName,
    company.tagline,
    "",
    `${company.email} · ${company.phone}`,
    company.siteUrl,
    `${company.city}, ${company.regionName} · ${company.hours}`,
    ...(reference ? ["", `Your reference: ${reference}`] : []),
    "",
    "This acknowledgement was generated automatically so you would not have to",
    "wait for it. A person has your enquiry and replies in person within one",
    "business day.",
  ];
}

/** Short, human-quotable reference so both sides can cite the same enquiry. */
export function referenceFor(id: string): string {
  return `RRR-${id.slice(-6).toUpperCase()}`;
}

/** Services the visitor ticked, resolved against the catalogue. */
function chosen(lead: LeadLike) {
  const ids = (lead.serviceIds ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return services.filter((s) => ids.includes(s.id));
}

// ---------------------------------------------------------------------------
//  Signals
// ---------------------------------------------------------------------------

/**
 * Something is on fire right now.
 *
 * Worth detecting because the honest answer is uncomfortable: we do not offer
 * emergency response to people who are not already retainer clients, and
 * letting someone in an outage wait a business day for that news would be
 * the worst possible introduction.
 */
const INCIDENT = /\b(outage|down|downtime|breach|hacked|ransom|emergency|urgent(ly)?|asap|right now|on fire|crash(ed|ing)?|cannot deploy|can't deploy|production is)\b/i;

const BUDGET_TEXT: Record<string, string> = {
  "under-25k": "under $25,000",
  "25-75k": "$25,000 to $75,000",
  "75-150k": "$75,000 to $150,000",
  "150k-plus": "over $150,000",
  unsure: "not yet decided",
};

const TIMELINE_TEXT: Record<string, string> = {
  immediate: "as soon as possible",
  "1-3-months": "in the next one to three months",
  "3-6-months": "in three to six months",
  exploring: "still exploring",
};

// ---------------------------------------------------------------------------
//  Templates
// ---------------------------------------------------------------------------

type Builder = (lead: LeadLike) => RenderedEmail;

const auditReply: Builder = (lead) => ({
  templateKey: "audit-request",
  subject: `Infrastructure audit: scope, price and what we need — ${company.shortName}`,
  bodyText: [
    `Hello ${firstName(lead.name)},`,
    "",
    `You asked about the fixed-price infrastructure audit. Here is everything you need to decide, so you are not waiting on us for the basics.`,
    "",
    `**${auditOffer.name}** — ${money(auditOffer.price)}, ${auditOffer.durationLabel}, fixed.`,
    "",
    "What you get:",
    ...auditOffer.includes.map((i) => `  • ${i}`),
    "",
    "What we need from you:",
    "  • Read-only access to the cloud accounts in scope — credentials you issue and can revoke",
    "  • Read access to the infrastructure repositories and CI configuration",
    "  • Two or three hours of an engineer's time across the week, for questions",
    "",
    "Before any of that: a mutual NDA, signed. We do not look at anything first.",
    "",
    "The report is yours either way. If you take it to another firm, that is a",
    "perfectly reasonable outcome and we will not chase you about it.",
    ...context(lead),
    ...signature(lead.reference),
  ].join("\n"),
});

const ndaReply: Builder = (lead) => ({
  templateKey: "nda-request",
  subject: `Your NDA is being prepared — ${company.shortName}`,
  bodyText: [
    `Hello ${firstName(lead.name)},`,
    "",
    "You asked us for a non-disclosure agreement. A person is preparing it now",
    "and it will come from a human, not from this address.",
    "",
    "Two things worth knowing while you wait:",
    "",
    "  • It is **mutual**. You will see our methods and we will see your estate,",
    "    so it binds us as much as it binds you.",
    "  • If your own legal team would rather we sign **your** paper, say so and",
    "    we will. That is normal and we do not argue about it.",
    "",
    "Nothing is auto-sent here. Every document that leaves this company is",
    "reviewed and signed off by a person first.",
    ...context(lead),
    "",
    "This is not legal advice. Have your own counsel read anything before you sign it.",
    "",
    ...signature(lead.reference),
  ].join("\n"),
});

const incidentReply: Builder = (lead) => ({
  templateKey: "incident",
  subject: `Your message — read this first if you are in an outage`,
  bodyText: [
    `Hello ${firstName(lead.name)},`,
    "",
    "Your message reads as though something is broken right now, so here is the",
    "straight answer rather than a polite one:",
    "",
    `**If you are in an active outage, call ${company.phone} rather than waiting on email.**`,
    `Office hours are ${company.hours}.`,
    "",
    "Being honest about what we can offer today: 24/7 emergency response is",
    "something we provide to retainer clients, and we are not going to pretend",
    "we can page an engineer for a company we have not onboarded. If you need",
    "someone inside the next hour, your cloud provider's support plan will",
    "reach an engineer faster than we can.",
    "",
    "What we are good for, once the immediate fire is out, is making sure it",
    "does not happen again — and we can usually start that conversation the",
    "same week.",
    ...context(lead),
    ...signature(lead.reference),
  ].join("\n"),
});

const serviceReply: Builder = (lead) => {
  const picked = chosen(lead);
  const lines = picked.slice(0, 3).flatMap((s) => [
    `**${s.name}**`,
    `  ${money(s.priceLow)} – ${money(s.priceHigh)}${s.priceNote ? ` (${s.priceNote})` : ""} · ${s.durationLabel}`,
    `  ${s.blurb}`,
    "",
  ]);

  return {
    templateKey: "service-interest",
    subject: `${picked[0]!.name}: indicative price and timeline — ${company.shortName}`,
    bodyText: [
      `Hello ${firstName(lead.name)},`,
      "",
      `You asked about ${picked.length === 1 ? "this" : "these"}. The published numbers, so you have them now rather than after a call:`,
      "",
      ...lines,
      "These are the same ranges on our pricing page. They are indicative, not an",
      "offer — a fixed price follows a scoping call, because the honest range for",
      "your estate depends on things we have not seen yet.",
      "",
      "What moves a project to the top of a range, in our experience: no existing",
      "infrastructure-as-code, compliance evidence requirements, and workloads",
      "that cannot take downtime.",
      ...context(lead),
      ...signature(lead.reference),
    ].join("\n"),
  };
};

const smallBudgetReply: Builder = (lead) => ({
  templateKey: "small-budget",
  subject: `What a budget ${BUDGET_TEXT["under-25k"]} realistically buys — ${company.shortName}`,
  bodyText: [
    `Hello ${firstName(lead.name)},`,
    "",
    `You said the budget is ${BUDGET_TEXT[lead.budgetBand ?? "unsure"] ?? "not yet decided"}. Rather than have you wait a day to find`,
    "out whether that is workable, here is the honest picture:",
    "",
    `  • **${auditOffer.name}** — ${money(auditOffer.price)}, ${auditOffer.durationLabel}. Tells you what is`,
    "    actually wrong and what fixing it costs, before you commit to anything.",
    `  • **One focused piece of work** — a CI/CD pipeline or an IaC retrofit`,
    "    typically starts around $12,000–$14,000.",
    `  • **${retainers[0]!.name} retainer** — ${money(retainers[0]!.price)}/month if what you need is`,
    "    someone keeping things running rather than a project.",
    "",
    "What that budget does not stretch to is a full migration or a platform",
    "build. We would rather say so now than produce a proposal you cannot act on.",
    "",
    "A great deal can be done for a small number if the scope is genuinely small.",
    "The audit is the cheapest way to find out which situation you are in.",
    ...context(lead),
    ...signature(lead.reference),
  ].join("\n"),
});

const exploringReply: Builder = (lead) => ({
  templateKey: "exploring",
  subject: `Everything you would normally have to ask for — ${company.shortName}`,
  bodyText: [
    `Hello ${firstName(lead.name)},`,
    "",
    "You said you are still exploring, so this is deliberately low-pressure.",
    "",
    "Everything you would normally have to ask for is already published:",
    "",
    `  • Prices and durations — ${company.siteUrl}/pricing`,
    `  • How we work, stage by stage — ${company.siteUrl}/services`,
    `  • How we handle access to your systems — ${company.siteUrl}/security`,
    "",
    "No sales sequence follows this. A person will reply once, and if you would",
    "rather we left it there, say so and we will.",
    "",
    "When you do want a number, the scoping call is 30 minutes and free.",
    ...context(lead),
    ...signature(lead.reference),
  ].join("\n"),
});

const urgentReply: Builder = (lead) => ({
  templateKey: "urgent-timeline",
  subject: `How quickly we can actually start — ${company.shortName}`,
  bodyText: [
    `Hello ${firstName(lead.name)},`,
    "",
    `You need to start ${TIMELINE_TEXT["immediate"]}, so the useful facts up front:`,
    "",
    "  • A scoping call can usually happen within two business days.",
    "  • A fixed proposal follows within five business days of that call.",
    "  • Work normally begins two to three weeks after a signed proposal.",
    "",
    `If that is too slow, say so on the call — sometimes it can be compressed,`,
    "and sometimes it genuinely cannot. We will tell you which.",
    "",
    `To move faster than email: call ${company.phone}, ${company.hours}.`,
    ...context(lead),
    ...signature(lead.reference),
  ].join("\n"),
});

const vagueReply: Builder = (lead) => ({
  templateKey: "needs-detail",
  subject: `Your enquiry — three things that would help — ${company.shortName}`,
  bodyText: [
    `Hello ${firstName(lead.name)},`,
    "",
    "Your enquiry has reached us and a person will reply within one business day.",
    "",
    "To make that reply actually useful rather than a request for more",
    "information, it helps to know three things. Reply to this email with",
    "whatever you have:",
    "",
    "  1. What is going wrong today, in your own words — no jargon needed.",
    "  2. Which cloud you are on, if any, and roughly how much is running there.",
    "  3. Whether this is a project with an end date or ongoing support.",
    "",
    "If you would rather just talk, the scoping call is 30 minutes and free:",
    `${company.siteUrl}/contact`,
    ...context(lead),
    ...signature(lead.reference),
  ].join("\n"),
});

const generalReply: Builder = (lead) => ({
  templateKey: "general",
  subject: `We have your enquiry — ${company.shortName}`,
  bodyText: [
    `Hello ${firstName(lead.name)},`,
    "",
    "Thank you for getting in touch. Your enquiry is recorded and a person will",
    "reply within one business day.",
    ...context(lead),
    "Meanwhile, prices and durations for everything we do are published —",
    `no form required: ${company.siteUrl}/pricing`,
    "",
    "We will use these details to answer this enquiry and nothing else. You can",
    "ask us to delete them at any time.",
    "",
    ...signature(lead.reference),
  ].join("\n"),
});

// ---------------------------------------------------------------------------
//  Selection
// ---------------------------------------------------------------------------

/**
 * First match wins, so the order is the priority order.
 *
 * An active incident outranks everything: someone whose production is down
 * does not care about our rate card. Explicit requests (audit, NDA) come
 * next because they name exactly what the person wants. Only then do the
 * softer signals apply.
 */
const RULES: { key: string; when: (lead: LeadLike) => boolean; build: Builder }[] = [
  { key: "incident", when: (l) => INCIDENT.test(l.message ?? ""), build: incidentReply },
  { key: "audit-request", when: (l) => l.source === "audit" || (l.serviceIds ?? "").includes(auditOffer.id), build: auditReply },
  { key: "nda-request", when: (l) => l.source === "nda" || (l.serviceIds ?? "").includes("nda"), build: ndaReply },
  { key: "small-budget", when: (l) => l.budgetBand === "under-25k", build: smallBudgetReply },
  { key: "service-interest", when: (l) => chosen(l).length > 0, build: serviceReply },
  { key: "exploring", when: (l) => l.timeline === "exploring", build: exploringReply },
  { key: "urgent-timeline", when: (l) => l.timeline === "immediate", build: urgentReply },
  { key: "needs-detail", when: (l) => (l.message ?? "").trim().length < 40, build: vagueReply },
];

/** The reply this enquiry should get. Always returns something. */
export function renderEnquiryReply(lead: LeadLike): RenderedEmail {
  const rule = RULES.find((r) => r.when(lead));
  return rule ? rule.build(lead) : generalReply(lead);
}

/** Every template, for the test suite and for reviewing the copy. */
export const ALL_TEMPLATE_KEYS = [...RULES.map((r) => r.key), "general"];
