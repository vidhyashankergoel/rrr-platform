/**
 * REPLY COMPOSER
 *
 * Writes a reply that belongs to one customer and nobody else.
 *
 * The templates in `email-templates.ts` go out in seconds and are deliberately
 * the same every time — that is what makes them safe to send unattended. This
 * agent does the opposite job: it reads everything known about one person and
 * writes them a single reply that could not be sent to anyone else.
 *
 * HOW IT UNDERSTANDS A CUSTOMER
 * -----------------------------
 * It assembles a brief from four sources before writing a word:
 *
 *   1. The enquiry itself — their words, budget, timeline, services ticked.
 *   2. The chat transcript, if they spoke to the assistant first. This is
 *      usually the richest source and the one a human would forget to read.
 *   3. Their history — earlier enquiries, bookings, what we already sent.
 *   4. The catalogue and knowledge index, for the figures the reply needs.
 *
 * From that it extracts the *specifics*: the technologies they named, the
 * problem in their own words, the objection they have not said out loud.
 * A reply that mentions their 40 EC2 instances is worth twenty that say
 * "thank you for your interest in our services".
 *
 * WITH AND WITHOUT A MODEL
 * ------------------------
 * If an LLM gateway is configured it writes the prose. If not, the composer
 * still produces a genuinely tailored draft from the brief — shorter and
 * plainer, but specific to that customer and safe to send. The firm's stated
 * constraint is to stay cheap, so working well with no model is a requirement
 * rather than a fallback.
 *
 * WHAT IT NEVER DOES
 * ------------------
 * Send. The draft becomes an Approval row with the exact text that would go
 * out. A person reads it, edits if needed, and approves — see ops/types.ts
 * for why that gate exists.
 */

import { complete } from "../../llm";
import { retrieve } from "../../knowledge";
import { services, auditOffer, rateCard } from "../../catalogue";
import { company, currencyFromDollars as money } from "../../company";
import { referenceFor } from "../../email-templates";
import type { OpsAgent, OpsContext, OpsResult } from "./types";
import { autoSendPolicy } from "./types";

// ---------------------------------------------------------------------------
//  Understanding
// ---------------------------------------------------------------------------

export interface CustomerBrief {
  leadId: string;
  name: string;
  firstName: string;
  email: string;
  company: string | null;
  role: string | null;
  /** Their own words — the enquiry plus anything said in chat. */
  saidVerbatim: string[];
  /** Technologies and platforms they named. */
  technologies: string[];
  /** The problem, as best we can state it back to them. */
  problem: string | null;
  budget: string | null;
  timeline: string | null;
  interests: string[];
  /** Has this person contacted us before? */
  returning: boolean;
  priorContactCount: number;
  hasBooking: boolean;
  bookingWhen: string | null;
  /** The unspoken question this reply has to answer. */
  likelyObjection: string | null;
  /** Catalogue figures this reply is allowed to quote. */
  figures: string[];
}

/** Technologies worth noticing, and the shape they appear in. */
const TECH: [RegExp, string][] = [
  [/\bkubernetes\b|\bk8s\b|\beks\b|\baks\b|\bgke\b|openshift|\brosa\b/i, "Kubernetes"],
  [/\bterraform\b|terragrunt/i, "Terraform"],
  [/\bansible\b/i, "Ansible"],
  [/\baws\b|amazon web services|\bec2\b|\bs3\b|\brds\b/i, "AWS"],
  [/\bazure\b/i, "Azure"],
  [/\bgcp\b|google cloud/i, "GCP"],
  [/\bargo ?cd\b|\bflux\b|gitops/i, "GitOps"],
  [/prometheus|grafana|\bloki\b|mimir/i, "Prometheus / Grafana"],
  [/datadog|dynatrace|new relic/i, "commercial APM"],
  [/postgres(ql)?|oracle|mysql|neo4j|mongo/i, "databases"],
  [/jenkins|github actions|gitlab ci|circleci|\bci\/cd\b/i, "CI/CD"],
  [/docker|container/i, "containers"],
  [/on-?prem(ises)?|data ?cent(re|er)|bare metal|vmware/i, "on-premises estate"],
  [/\bsoc ?2\b|iso ?27001|pci|hipaa|pipeda/i, "compliance"],
];

/** Objections people rarely state but always have. */
const OBJECTIONS: [RegExp, string][] = [
  [/\bnew\b.*\bcompany\b|how long have you|who else|reference|track record/i,
   "whether a young firm can be trusted with this"],
  [/lock ?-?in|proprietary|own the code|hand ?over|what if you/i,
   "whether they end up dependent on us"],
  [/expensive|cheaper|budget|afford|cost too much|quote/i,
   "whether this is worth the money"],
  [/how long|when can|timeline|deadline|by (q[1-4]|january|march|june)/i,
   "whether it can be done in their timeframe"],
  [/secur|access|credential|permission|audit|complian/i,
   "what we can see and do inside their systems"],
  [/team|who will|offshore|subcontract|juniors?/i,
   "who actually does the work"],
];

/** "a, b and c" — how a person writes a list, not how an array joins one. */
function list(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function extract(text: string, table: [RegExp, string][]): string[] {
  return [...new Set(table.filter(([re]) => re.test(text)).map(([, label]) => label))];
}

const BUDGET_TEXT: Record<string, string> = {
  "under-25k": "under $25,000",
  "25-75k": "$25,000–$75,000",
  "75-150k": "$75,000–$150,000",
  "150k-plus": "over $150,000",
  unsure: "not yet decided",
};
const TIMELINE_TEXT: Record<string, string> = {
  immediate: "as soon as possible",
  "1-3-months": "one to three months",
  "3-6-months": "three to six months",
  exploring: "still exploring",
};

/**
 * Build the brief. This is the "understanding" step, and it is deliberately
 * separate from the writing step so it can be tested on its own — a reply is
 * only as good as what preceded it.
 */
export async function buildBrief(db: OpsContext["db"], leadId: string): Promise<CustomerBrief | null> {
  const lead = await db.lead.findUnique({
    where: { id: leadId },
    include: {
      conversations: { include: { messages: { orderBy: { createdAt: "asc" } } } },
      bookings: { where: { status: { in: ["REQUESTED", "CONFIRMED"] } }, orderBy: { startsAt: "asc" } },
    },
  });
  if (!lead) return null;

  // Everything the person actually said, enquiry first then chat.
  const said: string[] = [];
  if (lead.message?.trim()) said.push(lead.message.trim());
  for (const convo of lead.conversations) {
    for (const m of convo.messages) {
      if (m.role === "USER" && m.content.trim().length > 12) said.push(m.content.trim());
    }
  }

  const corpus = said.join("\n");
  const interests = services
    .filter((s) => (lead.serviceIds ?? "").split(",").map((x) => x.trim()).includes(s.id))
    .map((s) => s.name);

  // Figures the reply may quote, pulled from the catalogue so the composer
  // cannot invent a price.
  const figures: string[] = [];
  for (const s of services) {
    if (interests.includes(s.name)) {
      figures.push(`${s.name}: ${money(s.priceLow)}–${money(s.priceHigh)}, ${s.durationLabel}`);
    }
  }
  figures.push(`${auditOffer.name}: ${money(auditOffer.price)}, ${auditOffer.durationLabel}`);
  if (rateCard[0]) figures.push(`${rateCard[0].role}: ${rateCard[0].rate} per hour`);

  const priorLeads = await db.lead.count({ where: { email: lead.email } });

  return {
    leadId: lead.id,
    name: lead.name,
    firstName: lead.name.trim().split(/\s+/)[0] || "there",
    email: lead.email,
    company: lead.company,
    role: lead.jobTitle,
    saidVerbatim: said.slice(0, 8),
    technologies: extract(corpus, TECH),
    problem: said[0]?.slice(0, 400) ?? null,
    budget: lead.budgetBand ? (BUDGET_TEXT[lead.budgetBand] ?? lead.budgetBand) : null,
    timeline: lead.timeline ? (TIMELINE_TEXT[lead.timeline] ?? lead.timeline) : null,
    interests,
    returning: priorLeads > 1,
    priorContactCount: priorLeads - 1,
    hasBooking: lead.bookings.length > 0,
    bookingWhen: lead.bookings[0]?.startsAt.toISOString() ?? null,
    likelyObjection: extract(corpus, OBJECTIONS)[0] ?? null,
    figures,
  };
}

// ---------------------------------------------------------------------------
//  Writing
// ---------------------------------------------------------------------------

/**
 * House style, stated as rules a model must follow.
 *
 * The constraints are the point. Left alone a model writes enthusiastic
 * marketing prose, invents a discount, and promises a delivery date — all
 * three of which are worse than a plain reply.
 */
function systemPrompt(): string {
  return [
    "You write replies to business enquiries for a small Canadian cloud and platform engineering firm.",
    "",
    "HOUSE STYLE",
    "- Plain, direct, Canadian English. -our endings (colour), -ize endings (organize).",
    "- Short paragraphs. No bullet lists unless comparing three or more things.",
    "- Never use: 'reach out', 'leverage', 'solutions', 'passionate', 'excited', 'synergy',",
    "  'game-changer', 'best-in-class', 'seamless', 'delighted', 'touch base'.",
    "- Reference something specific the person actually said. If you cannot, the reply is too generic.",
    "- Say the uncomfortable thing if it is true. If their budget will not cover what they asked for,",
    "  say so. If they may not need us, say that.",
    "",
    "HARD RULES — breaking any of these is a failure",
    "- Quote ONLY figures from the FIGURES list supplied. Never invent or adjust a price.",
    "- Always describe prices as indicative, never as an offer or a quote.",
    "- Never promise a delivery date, a guarantee, or an uptime figure.",
    "- Never offer a discount or any commercial concession.",
    "- Never claim experience, clients or certifications not present in the brief.",
    "- Do not mention prior employers or the names of past clients.",
    "- No subject line, no signature, no greeting. Body paragraphs only — those are added.",
    "- 120 to 220 words.",
  ].join("\n");
}

function userPrompt(brief: CustomerBrief): string {
  return [
    `NAME: ${brief.firstName}`,
    brief.company ? `COMPANY: ${brief.company}` : "",
    brief.role ? `ROLE: ${brief.role}` : "",
    "",
    "WHAT THEY SAID, VERBATIM:",
    ...brief.saidVerbatim.map((s) => `  "${s}"`),
    "",
    brief.technologies.length ? `TECHNOLOGIES THEY NAMED: ${brief.technologies.join(", ")}` : "",
    brief.interests.length ? `SERVICES THEY TICKED: ${brief.interests.join(", ")}` : "",
    brief.budget ? `BUDGET: ${brief.budget}` : "",
    brief.timeline ? `TIMELINE: ${brief.timeline}` : "",
    brief.returning ? `RETURNING CONTACT: yes, ${brief.priorContactCount} earlier enquiry(ies)` : "",
    brief.hasBooking ? `ALREADY BOOKED A CALL: yes` : "",
    brief.likelyObjection ? `UNSPOKEN CONCERN TO ADDRESS: ${brief.likelyObjection}` : "",
    "",
    "FIGURES YOU MAY QUOTE (and no others):",
    ...brief.figures.map((f) => `  ${f}`),
    "",
    "Write the body of a reply to this person.",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Written without a model: still specific, just plainer.
 *
 * This is not a stub. With no LLM configured it is what every customer
 * receives, so it has to be a reply a person would be content to send.
 */
function composeWithoutModel(brief: CustomerBrief): string {
  const paras: string[] = [];

  const opener = brief.returning
    ? `Thanks for coming back to us — I can see this is not your first message, so I will not make you repeat yourself.`
    : `Thanks for getting in touch.`;
  paras.push(opener);

  // Prove we read it. Their words stay their words — quoted, not paraphrased
  // into a sentence that mixes our voice with theirs.
  if (brief.problem) {
    paras.push(`What I have taken from your message:\n\n  "${brief.problem.replace(/\s+/g, " ").trim()}"`);
    if (brief.technologies.length) {
      paras.push(
        `${list(brief.technologies.slice(0, 3))} ${brief.technologies.length === 1 ? "looks" : "look"} like the centre of it.`,
      );
    }
  }

  // Answer the money question with a real figure.
  if (brief.interests.length && brief.figures.length) {
    paras.push(
      `On cost, so you are not waiting on a call for it — ${brief.figures[0]}. ` +
        `That is the published range and it is indicative, not an offer; the honest number for your estate depends on things we have not seen yet.`,
    );
  } else {
    paras.push(
      `If you want a number before speaking to anyone, everything we do is priced publicly at ${company.siteUrl}/pricing. ` +
        `The cheapest way to find out what your situation actually needs is the ${auditOffer.name} — ${money(auditOffer.price)}, ${auditOffer.durationLabel}, and the report is yours whether or not you continue with us.`,
    );
  }

  // Address the thing they did not say.
  if (brief.likelyObjection) {
    const answers: Record<string, string> = {
      "whether a young firm can be trusted with this":
        "We are a young firm and I would rather say that than have you find out later. What we can offer instead of a long client list is a small paid audit first, published prices, and work that lives in your repositories from day one.",
      "whether they end up dependent on us":
        "Everything we build lives in your repositories, in your cloud accounts, under your control. If you stop working with us you keep all of it, documented well enough for someone else to pick up.",
      "whether this is worth the money":
        "If the numbers do not work, say so and we will tell you honestly whether a smaller piece of work would help or whether you would be better off spending it elsewhere.",
      "whether it can be done in their timeframe":
        "Tell us the date you are working to. Sometimes a timeline can be compressed and sometimes it genuinely cannot — we will tell you which before you commit to anything.",
      "what we can see and do inside their systems":
        "Read-only to start, with credentials you issue and can revoke, and a mutual NDA before any access at all. Nothing is touched without that.",
      "who actually does the work":
        "The engineers who would do your work are named in the proposal, and none of it is subcontracted.",
    };
    paras.push(answers[brief.likelyObjection] ?? "");
  }

  // Next step.
  paras.push(
    brief.hasBooking
      ? `You already have a call booked, so I will keep this short — bring whatever detail you have and we will use the time properly.`
      : `The next step, if you want one, is a 30-minute call: no charge, no pitch, and you leave with an honest read on the size of the problem. You can pick a time at ${company.siteUrl}/contact.`,
  );

  return paras.filter(Boolean).join("\n\n");
}

/** Assemble the sendable email around the composed body. */
function assemble(brief: CustomerBrief, body: string): { subject: string; bodyText: string } {
  const subjectBase = brief.interests[0]
    ? `Your ${brief.interests[0]} enquiry`
    : brief.technologies[0]
      ? `Your ${brief.technologies[0]} enquiry`
      : "Your enquiry";

  return {
    subject: `${subjectBase} — ${company.shortName}`,
    bodyText: [
      `Hello ${brief.firstName},`,
      "",
      body,
      "",
      "—",
      company.shortName,
      company.tagline,
      "",
      `${company.email} · ${company.phone}`,
      company.siteUrl,
      `${company.city}, ${company.regionName} · ${company.hours}`,
      "",
      `Your reference: ${referenceFor(brief.leadId)}`,
    ].join("\n"),
  };
}

/** Rules the composed text must satisfy before a human is even shown it. */
export function validateDraft(text: string, brief: CustomerBrief): string[] {
  const problems: string[] = [];

  const banned = /\b(reach out|leverage|synergy|game-?changer|best-in-class|seamless|delighted|touch base|passionate)\b/i;
  if (banned.test(text)) problems.push(`house-style violation: ${banned.exec(text)?.[0]}`);

  if (/\bwe guarantee\b|\bguaranteed\b|100% uptime/i.test(text)) problems.push("contains a guarantee");
  if (/\b\d+%\s*(off|discount)\b|\bdiscount\b/i.test(text)) problems.push("offers a discount");
  if (/\bthis is an offer\b|\bbinding\b/i.test(text)) problems.push("contract-forming language");

  // Any dollar figure must come from the approved list.
  const quoted = text.match(/\$[\d,]+/g) ?? [];
  const allowed = brief.figures.join(" ");
  const invented = quoted.filter((q) => !allowed.includes(q));
  if (invented.length) problems.push(`invented figures: ${invented.join(", ")}`);

  // Generic-reply detector: it must reference something they said.
  const mentionsSomething =
    brief.technologies.some((t) => text.toLowerCase().includes(t.toLowerCase().split(" ")[0]!)) ||
    (brief.company ? text.includes(brief.company) : false) ||
    brief.interests.some((i) => text.includes(i)) ||
    (brief.problem ? text.includes(brief.problem.slice(0, 25)) : false);
  if (!mentionsSomething) problems.push("too generic — references nothing the customer said");

  if (text.length < 200) problems.push(`too short (${text.length} chars)`);
  if (text.length > 2200) problems.push(`too long (${text.length} chars)`);

  return problems;
}

/** Compose one reply. Exported so a test can drive it without the scheduler. */
export async function composeReply(
  db: OpsContext["db"],
  leadId: string,
): Promise<{ brief: CustomerBrief; subject: string; bodyText: string; source: "model" | "composer"; problems: string[] } | null> {
  const brief = await buildBrief(db, leadId);
  if (!brief) return null;

  let body: string | null = null;
  let source: "model" | "composer" = "composer";

  const modelText = await complete({
    system: systemPrompt(),
    context: retrieve(brief.saidVerbatim.join(" "))
      .slice(0, 3)
      .map((r) => r.entry.answer)
      .join("\n\n")
      .slice(0, 3000),
    history: [],
    message: userPrompt(brief),
    tier: "quality",
    maxTokens: 420,
    // Never cache. A cached completion would hand the next customer a letter
    // written about somebody else's infrastructure.
    noCache: true,
  }).catch(() => null);

  if (modelText && modelText.trim().length > 150) {
    const problems = validateDraft(modelText, brief);
    if (problems.length === 0) {
      body = modelText.trim();
      source = "model";
    }
    // A model draft that breaks the rules is discarded silently in favour of
    // the deterministic one. Sending it for a human to "just fix" trains the
    // reviewer to skim, which is how a bad figure eventually gets through.
  }

  if (!body) body = composeWithoutModel(brief);

  const { subject, bodyText } = assemble(brief, body);
  return { brief, subject, bodyText, source, problems: validateDraft(body, brief) };
}

// ---------------------------------------------------------------------------
//  The agent
// ---------------------------------------------------------------------------

export const replyComposer: OpsAgent = {
  key: "reply-composer",
  name: "Reply composer",
  purpose: "Reads everything known about a new enquiry and drafts a reply unique to that customer.",
  intervalSec: 120,
  requires: [],

  async run(ctx: OpsContext): Promise<OpsResult> {
    // Leads that have had the instant acknowledgement but no considered reply.
    const candidates = await ctx.db.lead.findMany({
      where: {
        stage: { in: ["NEW", "QUALIFYING"] },
        consentContact: true,
        unsubscribedAt: null,
        approvals: { none: { kind: "OUTBOUND_EMAIL" } },
      },
      orderBy: { createdAt: "asc" },
      take: 10,
    });

    if (candidates.length === 0) {
      return { status: "ok", summary: "no enquiries awaiting a considered reply", created: 0, proposed: 0 };
    }

    const policy = autoSendPolicy();
    let proposed = 0;
    const notes: string[] = [];

    for (const lead of candidates) {
      const drafted = await composeReply(ctx.db, lead.id);
      if (!drafted) continue;

      if (ctx.dryRun) {
        notes.push(`${lead.email}: would draft (${drafted.source})`);
        continue;
      }

      await ctx.db.approval.create({
        data: {
          kind: "OUTBOUND_EMAIL",
          title: `Reply to ${lead.company || lead.name}`,
          summary: drafted.subject,
          payloadJson: JSON.stringify({
            leadId: lead.id,
            toEmail: lead.email,
            subject: drafted.subject,
            bodyText: drafted.bodyText,
            composedBy: drafted.source,
            brief: {
              technologies: drafted.brief.technologies,
              objection: drafted.brief.likelyObjection,
              budget: drafted.brief.budget,
              returning: drafted.brief.returning,
            },
          }),
          riskNote: drafted.problems.length
            ? `Review carefully — ${drafted.problems.join("; ")}`
            : `Drafted by the ${drafted.source === "model" ? "model" : "composer"}. ${policy.note}`,
          leadId: lead.id,
        },
      });

      await ctx.db.lead.update({ where: { id: lead.id }, data: { stage: "QUALIFYING" } });
      proposed += 1;
      notes.push(`${lead.email}: drafted (${drafted.source})`);
      ctx.log(`drafted reply for ${lead.email} via ${drafted.source}`);
    }

    return {
      status: "ok",
      summary: ctx.dryRun
        ? `${candidates.length} enquiry(ies) would get a tailored draft`
        : `${proposed} tailored reply(ies) drafted and waiting for approval`,
      proposed,
      detail: { notes },
    };
  },
};
