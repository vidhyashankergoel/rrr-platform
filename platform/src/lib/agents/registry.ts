/**
 * The agent registry.
 *
 * Nine agents, one front door. The visitor talks to the chat widget; the
 * orchestrator routes each turn to whichever agent owns that subject, and the
 * whole exchange is written to the database.
 *
 * Every agent obeys the same rule from ./types.ts:
 *   Agents propose. Humans dispose. The system executes.
 */

import type { Agent, AgentInput, AgentResult } from "./types";
import { retrieve } from "../knowledge";
import { services, retainers, auditOffer, caseStudies } from "../catalogue";
import { company, currencyFromDollars as money } from "../company";
import { complete, shouldSkipModel } from "../llm";
import { salesAgent } from "./sales";
import { financeAgents } from "./finance";
import { displayClient } from "../attribution";

/** Shared instructions prepended to every model call when one is configured. */
const HOUSE_RULES = [
  "You represent " + company.legalName + ", a Canadian cloud and platform engineering firm.",
  "Answer only from the supplied context. If the context does not contain the answer, say so plainly and offer a call with a human. Never invent a price, a duration, a client name, a certification or a team size.",
  "Never state or imply that anything you say is a binding offer, a quote, or legal advice.",
  "Write in clear Canadian English. Be concise: three short paragraphs at most.",
  "Do not ask for financial details, government identifiers, passwords or credentials at any point.",
].join("\n");

/** Fallback used whenever no model is configured — deterministic retrieval. */
function retrievalReply(message: string, fallback: string): { reply: string; confidence: number } {
  const hits = retrieve(message, 2);
  const top = hits[0];
  if (!top || top.score < 0.34) return { reply: fallback, confidence: 0.2 };
  let reply = top.entry.answer;
  const second = hits[1];
  if (second && second.score > 0.45) {
    reply += `\n\n_Also relevant: **${second.entry.title}** — just ask._`;
  }
  return { reply, confidence: Math.min(0.95, 0.45 + top.score) };
}

async function answer(
  input: AgentInput,
  opts: {
    persona: string;
    context: string;
    fallback: string;
    tier?: "fast" | "quality";
    /**
     * Set on agents whose fallback copy is a deliberate commercial or legal
     * position — negotiation, legal, HR. For those, a high-scoring FAQ entry
     * must NOT be allowed to answer in the agent's place: the retrieval index
     * does not know it is standing in the middle of a price objection.
     */
    ownVoice?: boolean;
  },
): Promise<{ reply: string; confidence: number }> {
  // Cost control 1: when the catalogue answers it confidently, never call a
  // model. Skipped for agents that must speak in their own voice.
  if (!opts.ownVoice) {
    const top = retrieve(input.message, 1)[0];
    if (top && shouldSkipModel(top.score)) {
      return { reply: top.entry.answer, confidence: Math.min(0.95, 0.45 + top.score) };
    }
  }

  const llm = await complete({
    system: `${HOUSE_RULES}\n\nYour role: ${opts.persona}`,
    context: opts.context,
    history: input.context.history,
    message: input.message,
    tier: opts.tier ?? "fast",
  });
  if (llm) return { reply: llm, confidence: 0.8 };
  if (opts.ownVoice) return { reply: opts.fallback, confidence: 0.85 };
  return retrievalReply(input.message, opts.fallback);
}

// ---------------------------------------------------------------------------
// 1 · CONCIERGE — the front door. Greets, answers general questions, routes.
// ---------------------------------------------------------------------------
const concierge: Agent = {
  key: "concierge",
  displayName: "Ada",
  purpose: "Front door. Answers general questions and routes to the right specialist agent.",
  triggers: ["hello", "hi", "help", "what do you do", "who are you", "services", "about"],
  guardrails: [
    "Never quote a price directly — route to the pricing agent.",
    "Never make a commitment about dates, scope or availability.",
  ],
  async run(input): Promise<AgentResult> {
    // A greeting is a greeting. Everything else gets a real answer or an
    // honest "I do not know" — never the welcome message as a catch-all.
    const isGreeting = /^\s*(hi|hey|hello|good (morning|afternoon|evening)|yo)\b[\s!.?]*$/i.test(
      input.message,
    );
    // "who are you", "what are you" — every word is a stopword, so retrieval
    // can never answer these. They have to be handled here.
    const isIdentity =
      /\b(who|what)\s+(are|r)\s+(you|u)\b|\bare you (an?\s+)?(real\s+)?(bot|robot|human|person|ai|machine|chatbot)\b|\bwhat is (this|ada)\b|\b(human|robot|bot) or (a )?(bot|human|robot)\b/i.test(
        input.message,
      );

    if (isIdentity) {
      return {
        reply: [
          `I am **Ada**, the automated assistant for **${company.shortName}** — software, not a person, and I will say so whenever it matters.`,
          "",
          "I answer from our published service catalogue, pricing and case studies, so the numbers I give you are the real published ones rather than something I made up.",
          "",
          `What I cannot do: commit us to a price or a date, send you anything, or give legal advice. For any of that, a person takes over — **${company.email}** or **${company.phone}**.`,
        ].join("\n"),
        confidence: 0.95,
        suggestions: [
          "What do you actually do?",
          "What does a Kubernetes build cost?",
          "Can I talk to a person?",
        ],
      };
    }

    if (isGreeting) {
      return {
        reply: [
          `Hello — I am Ada, the automated assistant for **${company.shortName}**.`,
          "",
          "I can tell you what we build, what it typically costs in Canadian dollars, how long it takes, how we secure it, and who we have done it for.",
          "",
          "What are you trying to solve?",
        ].join("\n"),
        confidence: 0.95,
        suggestions: [
          "What does a Kubernetes build cost?",
          "Can you migrate us off on-premises?",
          "How do you secure our infrastructure?",
        ],
      };
    }

    const hits = retrieve(input.message, 3);
    const routeTo = hits[0]?.entry.route as AgentResult["routeTo"] | undefined;

    const { reply, confidence } = await answer(input, {
      persona:
        "A knowledgeable first point of contact. Understand what the visitor needs and answer it, or say which colleague handles it.",
      context: hits.map((h) => `## ${h.entry.title}\n${h.entry.answer}`).join("\n\n"),
      fallback: [
        "I am not certain I have that one. I answer from our published service catalogue, pricing and case studies, so I would rather say so than guess.",
        "",
        "Things I can answer properly:",
        "",
        "• What a specific piece of work costs, and how long it takes",
        "• Which clouds, Kubernetes distributions and tools we work with",
        "• How we secure infrastructure, and what we will not do",
        "• Who we have worked with, and how to verify it",
        "• Payment terms, NDAs, insurance and how engagements run",
        "",
        `Or go straight to a person: **${company.email}** / **${company.phone}**.`,
      ].join("\n"),
    });

    return {
      reply,
      routeTo: routeTo && routeTo !== "concierge" ? routeTo : undefined,
      confidence,
      suggestions: [
        "What does a Kubernetes build cost?",
        "Can you migrate us off on-premises?",
        "What is the smallest way to start?",
      ],
    };
  },
};

// ---------------------------------------------------------------------------
// 2 · QUALIFIER — turns a conversation into a scored lead.
// ---------------------------------------------------------------------------
const qualifier: Agent = {
  key: "qualifier",
  displayName: "Ada · qualification",
  purpose: "Collects the minimum needed to scope work and scores the opportunity.",
  triggers: ["quote", "proposal", "interested", "we need", "looking for", "project", "budget"],
  guardrails: [
    "Collect only name, work email, company, and the problem. Nothing else.",
    "State the purpose of collection before asking (PIPEDA Principle 2).",
    "Never ask for financial account details or government identifiers.",
  ],
  async run(input): Promise<AgentResult> {
    const text = input.message.toLowerCase();

    // Deterministic signal extraction. No model needed, no hallucination risk.
    const matched = services.filter((s) =>
      s.stack.concat(s.name.split(" ")).some((t) => t.length > 3 && text.includes(t.toLowerCase())),
    );

    let score = 20;
    if (matched.length) score += 25;
    if (/\b(budget|approved|funded|allocated)\b/.test(text)) score += 20;
    if (/\b(urgent|asap|immediately|this month|this quarter)\b/.test(text)) score += 15;
    if (/\b(production|prod|live|customers)\b/.test(text)) score += 10;
    if (/\b(just looking|curious|researching|student|learning)\b/.test(text)) score -= 25;
    score = Math.max(0, Math.min(100, score));

    const { reply, confidence } = await answer(input, {
      persona:
        "Qualify the opportunity. Ask at most two questions at a time, and explain why you need each answer before asking.",
      context: matched.length
        ? matched
            .map(
              (s) =>
                `## ${s.name}\n${s.blurb}\nPrice ${money(s.priceLow)}–${money(s.priceHigh)} CAD. Duration ${s.durationLabel}.`,
            )
            .join("\n\n")
        : `## Entry point\n${auditOffer.blurb} ${money(auditOffer.price)} CAD, ${auditOffer.durationLabel}.`,
      fallback: [
        "To point you at the right thing, two quick questions — I ask so we can give you a realistic range rather than a generic one:",
        "",
        "• What is running today, and where is it running?",
        "• Is this a specific problem to fix, or a platform to build?",
        "",
        "If you would rather skip ahead, the free 30-minute scoping call gets you a human and an indicative number.",
      ].join("\n"),
    });

    return {
      reply,
      confidence,
      leadPatch: {
        score,
        serviceIds: matched.map((s) => s.id).join(","),
        stage: score >= 55 ? "SCOPING" : "QUALIFYING",
      },
      routeTo: score >= 55 ? "pricing" : undefined,
      suggestions: ["What would that cost?", "How long would it take?", "Can I talk to a person?"],
    };
  },
};

// ---------------------------------------------------------------------------
// 3 · PRICING — quotes only from the published catalogue.
// ---------------------------------------------------------------------------
const pricing: Agent = {
  key: "pricing",
  displayName: "Ada · pricing",
  purpose: "Explains published pricing, durations and engagement models. Never improvises a figure.",
  triggers: ["cost", "price", "pricing", "how much", "budget", "rate", "quote", "expensive", "cheap"],
  guardrails: [
    "Only quote numbers that exist in the catalogue. Never interpolate or round to a nicer figure.",
    "Always state that figures are indicative and exclude GST/HST.",
    "Never present a figure as an offer capable of acceptance.",
  ],
  async run(input): Promise<AgentResult> {
    const hits = retrieve(input.message, 3);
    const relevant = services.filter((s) => hits.some((h) => h.entry.key === s.id));

    const table = (relevant.length ? relevant : services.filter((s) => s.featured))
      .map(
        (s) =>
          `${s.name}: ${money(s.priceLow)}${s.priceLow === s.priceHigh ? "" : `–${money(s.priceHigh)}`} CAD${
            s.priceNote ? ` (${s.priceNote})` : ""
          }, ${s.durationLabel}`,
      )
      .join("\n");

    const { reply, confidence } = await answer(input, {
      persona:
        "Explain pricing honestly. Give the range, say what moves a project to the top or bottom of it, and be explicit that a firm number needs a scoping call.",
      context: [
        "## Published fixed-scope pricing (CAD, excluding GST/HST)",
        table,
        "",
        "## Entry point",
        `${auditOffer.name}: ${money(auditOffer.price)} CAD, ${auditOffer.durationLabel}.`,
        "",
        "## Ongoing support",
        retainers.map((r) => `${r.name}: ${money(r.price)}${r.unit}`).join("\n"),
      ].join("\n"),
      fallback: [
        "Here is what is published, in Canadian dollars and excluding GST/HST:",
        "",
        table,
        "",
        `The smallest starting point is the ${auditOffer.name} at ${money(auditOffer.price)} over ${auditOffer.durationLabel}.`,
        "",
        "_These are indicative ranges, not an offer. A firm fixed price follows a free 30-minute scoping call._",
      ].join("\n"),
    });

    return {
      reply,
      confidence,
      leadPatch: relevant.length
        ? {
            estimateLow: relevant.reduce((a, s) => a + s.priceLow, 0) * 100,
            estimateHigh: relevant.reduce((a, s) => a + s.priceHigh, 0) * 100,
          }
        : undefined,
      suggestions: ["What moves it to the top of that range?", "Can we phase it?", "Book a scoping call"],
    };
  },
};

// ---------------------------------------------------------------------------
// 4 · DELIVERY — how we build, team strength, what handover looks like.
// ---------------------------------------------------------------------------
const delivery: Agent = {
  key: "delivery",
  displayName: "Ada · delivery",
  purpose: "Explains how work is delivered, how teams are staffed, and what handover involves.",
  triggers: [
    "how do you", "team", "process", "deliver", "methodology", "handover", "who does",
    "experience", "case study", "worked with", "reference", "capacity", "staffing",
  ],
  guardrails: [
    "Describe only delivered work that exists in the case studies.",
    "Never name a specific individual as available without that being confirmed by a human.",
    "Never overstate years of experience or team size.",
  ],
  async run(input): Promise<AgentResult> {
    const hits = retrieve(input.message, 3);

    const { reply, confidence } = await answer(input, {
      persona:
        "Explain the delivery model concretely, using real prior engagements as evidence. Prefer specifics over adjectives.",
      context: [
        ...hits.map((h) => `## ${h.entry.title}\n${h.entry.answer}`),
        "## Evidence",
        caseStudies
          .map((c) => `${displayClient(c)} (${c.sector}, ${c.period}): ${c.headline}`)
          .join("\n"),
      ].join("\n\n"),
      fallback: [
        "**How we deliver**",
        "",
        "Work lands in your repositories through pull requests, in weekly increments, with a demo of something working rather than a status deck. Scope changes are re-quoted rather than absorbed quietly and billed later.",
        "",
        "**How we staff it**",
        "",
        "A pod sized to the work, from a single senior engineer to an architect, engineers and a delivery manager. The named engineers on the proposal are the ones who do the work, and you meet them before signing.",
        "",
        "**What you are left with**",
        "",
        "Everything in your accounts and repositories, with runbooks and recorded handover sessions. The test we hold ourselves to is that your team can run it the day we leave.",
      ].join("\n"),
    });

    return {
      reply,
      confidence,
      suggestions: ["Show me a similar project", "Who would be on the team?", "What does handover include?"],
    };
  },
};

// ---------------------------------------------------------------------------
// 5 · NEGOTIATION — proposes, never concedes on its own authority.
// ---------------------------------------------------------------------------
const negotiation: Agent = {
  key: "negotiation",
  displayName: "Ada · commercial",
  purpose: "Handles pushback on price and terms. Proposes structures; concessions need a human.",
  triggers: [
    "discount", "too expensive", "cheaper", "negotiate", "reduce", "lower", "match",
    "competitor", "beat", "deal", "payment terms", "instalments",
  ],
  guardrails: [
    "NEVER grant a discount, extend payment terms, or vary published pricing. Only a human may do that.",
    "Offer scope reduction or phasing as the honest alternative to a discount.",
    "Any concession is queued as PRICE_CONCESSION for human approval and described to the visitor as something to be confirmed.",
  ],
  async run(input): Promise<AgentResult> {
    const { reply, confidence } = await answer(input, {
      ownVoice: true,
      persona:
        "You hold the line on published pricing while being genuinely helpful. Offer smaller scope, phasing, or the audit as ways to reduce spend. Be honest that you cannot approve a discount yourself.",
      context: [
        "## Levers that are available without a discount",
        "- Reduce scope to the highest-value slice and phase the rest",
        `- Start with the ${auditOffer.name} at ${money(auditOffer.price)} to de-risk before committing`,
        "- Move some delivery in-house with us reviewing rather than building",
        "- Longer timeline at lower monthly burn",
        "",
        "## Rule",
        "Published prices are held. Any variation requires approval from a named human at the firm.",
      ].join("\n"),
      fallback: [
        "I cannot vary published pricing myself — that needs a person here to approve, and I would rather tell you that than pretend otherwise.",
        "",
        "What I can do is show you the honest levers:",
        "",
        `• **Start smaller.** The ${auditOffer.name} at ${money(auditOffer.price)} tells you what actually needs doing before you commit to a build.`,
        "• **Phase it.** Take the highest-value slice first and defer the rest to a second engagement.",
        "• **Split the work.** We design and review; your team builds. Lower cost, slower, and your team learns it.",
        "",
        "If you want a commercial conversation with a human, I can flag this for the team now.",
      ].join("\n"),
    });

    return {
      reply,
      confidence,
      escalate: true,
      actions: [
        {
          kind: "PRICE_CONCESSION",
          title: "Commercial pushback received",
          summary: `Visitor raised price or terms: "${input.message.slice(0, 280)}"`,
          payload: { verbatim: input.message, leadId: input.context.leadId },
          requiresApproval: true,
          riskNote:
            "No concession has been offered to the visitor. A human must decide whether to vary published pricing and communicate it.",
        },
      ],
      suggestions: ["Can we phase the work?", "What would the audit cover?", "Have a human call me"],
    };
  },
};

// ---------------------------------------------------------------------------
// 7 · FOLLOW-UP — drafts sequenced follow-up email. Sends nothing itself.
// ---------------------------------------------------------------------------
const followup: Agent = {
  key: "followup",
  displayName: "Follow-up",
  purpose: "Drafts follow-up email after an enquiry goes quiet. Queued for approval, never auto-sent.",
  triggers: ["follow up", "chase", "any update", "checking in"],
  guardrails: [
    "A follow-up to an enquiry the person started is transactional. Anything promotional is a commercial electronic message and requires express consent under CASL.",
    "Maximum three follow-ups, then the lead goes dormant. No indefinite chasing.",
    "Every message carries sender identification, a mailing address and a working unsubscribe link.",
    "Stop immediately on any reply or unsubscribe.",
  ],
  async run(input): Promise<AgentResult> {
    const step = Number((input.context as { step?: number }).step ?? 1);

    const drafts: Record<number, { subject: string; body: string }> = {
      1: {
        subject: `Following up on your enquiry — ${company.shortName}`,
        body: [
          "Hello,",
          "",
          "You got in touch about your infrastructure recently and I wanted to make sure it did not fall through a gap.",
          "",
          "If it would help, the free 30-minute scoping call gets you an honest read on the size of the problem — including when the answer is that you do not need us.",
          "",
          "If the timing is wrong, just say so and I will leave it there.",
        ].join("\n"),
      },
      2: {
        subject: "One useful thing, then I will stop",
        body: [
          "Hello,",
          "",
          "I will not keep chasing. Before I close this off, one thing that is usually worth doing regardless of who does it:",
          "",
          "Take the single most important workload you run and ask when its restore was last actually tested — not the backup, the restore. In most estates we review, the answer is never.",
          "",
          "If you would like us to look properly, the fixed-price audit is five business days and you keep the report either way.",
        ].join("\n"),
      },
      3: {
        subject: "Closing this off",
        body: [
          "Hello,",
          "",
          "I am closing this enquiry so it stops sitting in your inbox. No action needed.",
          "",
          "If the timing changes, reply to this message and we will pick it straight back up.",
        ].join("\n"),
      },
    };

    const draft = drafts[Math.min(step, 3)]!;

    return {
      reply: `Drafted follow-up ${step} of 3, queued for approval.`,
      confidence: 0.9,
      actions: [
        {
          kind: "OUTBOUND_EMAIL",
          title: `Follow-up ${step} of 3`,
          summary: draft.subject,
          payload: {
            subject: draft.subject,
            bodyText: draft.body,
            category: "TRANSACTIONAL",
            sequenceKey: "enquiry-followup",
            sequenceStep: step,
          },
          requiresApproval: true,
          riskNote:
            "Transactional reply to an enquiry the recipient initiated. Confirm the consent record and that no reply has been received before sending.",
        },
      ],
    };
  },
};

// ---------------------------------------------------------------------------
// 8 · LEGAL — drafts from reviewed templates only. Never advises, never sends.
// ---------------------------------------------------------------------------
const legal: Agent = {
  key: "legal",
  displayName: "Ada · documents",
  purpose:
    "Prepares proposals, statements of work and agreement drafts from lawyer-reviewed templates for internal review.",
  triggers: [
    " contract", "contract to", "contract with", "the contract",
    "agreement", "msa", "statement of work", "nda",
    "non-disclosure", "legal terms", "terms and conditions",
    "paperwork", "master services", "sign an nda", "sign a contract",
  ],
  guardrails: [
    "NEVER give legal advice. Say explicitly that you cannot.",
    "NEVER transmit a document to a customer. Drafts go to internal review only.",
    "Only populate templates that carry a recorded lawyer review (see docs/LEGAL-REVIEW.md).",
    "Never alter a liability, indemnity, limitation, governing-law or termination clause.",
  ],
  async run(input): Promise<AgentResult> {
    return {
      reply: [
        "I can get paperwork moving, with one honest caveat: **I cannot give legal advice, and I do not send documents to clients.** I prepare a draft from our reviewed templates and a person here checks and sends it.",
        "",
        "What we work with:",
        "",
        "• **Proposal and statement of work** — scope, price, timeline, acceptance criteria",
        "• **Master services agreement** — or we sign yours",
        "• **Mutual non-disclosure agreement** — usually before discovery",
        "• **Data processing agreement** — where we handle personal information on your behalf",
        "",
        "Which of those do you need, and do you want to use your paper or ours?",
      ].join("\n"),
      confidence: 0.88,
      actions: [
        {
          kind: "LEGAL_DOCUMENT",
          title: "Document request raised in chat",
          summary: input.message.slice(0, 280),
          payload: { verbatim: input.message, leadId: input.context.leadId },
          requiresApproval: true,
          riskNote:
            "Contractual. A named human must review every clause before this reaches a customer. Template must have a recorded Canadian legal review.",
        },
      ],
      suggestions: ["Send us an NDA", "Can you sign our MSA?", "What is in the statement of work?"],
    };
  },
};

// ---------------------------------------------------------------------------
// 9 · HR — candidate enquiries, inside Ontario employment-law boundaries.
// ---------------------------------------------------------------------------
const hr: Agent = {
  key: "hr",
  displayName: "Ada · careers",
  purpose: "Handles candidate enquiries and routes applications to a human.",
  triggers: ["job", "career", "hiring", "apply", "vacancy", "role", "recruit", "resume", "cv", "internship"],
  guardrails: [
    "Never ask about or record age, marital or family status, citizenship, ethnicity, religion, disability, or any other ground protected by the Ontario Human Rights Code.",
    "Work authorization may be asked only as a yes/no eligibility question.",
    "Never make an offer, quote a salary band, or promise an interview.",
    "Never evaluate or reject a candidate — a human does that.",
  ],
  async run(input): Promise<AgentResult> {
    return {
      reply: [
        "Good to hear from you.",
        "",
        `We hire senior platform, cloud, data and security engineers in the Greater Toronto Area and remotely across Canada. Send a CV to **${company.email}** with a short note about the most interesting production system you have actually run — that tells us more than a list of tools.`,
        "",
        "We reply to every application, including when there is nothing open.",
        "",
        "_A person reviews every application. I do not screen or assess candidates, and I do not record anything beyond your name, contact details and the role you are interested in._",
      ].join("\n"),
      confidence: 0.9,
      actions: [
        {
          kind: "HR_RESPONSE",
          title: "Candidate enquiry",
          summary: input.message.slice(0, 280),
          payload: { verbatim: input.message },
          requiresApproval: true,
          riskNote: "Applicant data. Handle under PIPEDA and the Ontario Human Rights Code.",
        },
      ],
      suggestions: ["What roles are open?", "Do you take interns?", "Is it remote?"],
    };
  },
};

export const agents: Record<string, Agent> = {
  concierge,
  qualifier,
  pricing,
  delivery,
  negotiation,
  sales: salesAgent,
  followup,
  legal,
  hr,

  // Financial suite — see ./finance.ts
  budget: financeAgents.budget,
  timeline: financeAgents.timeline,
  cloudcost: financeAgents.cloudCost,
  effort: financeAgents.effort,
  quote: financeAgents.costBuilder,
  billing: financeAgents.billing,

  // Internal only. Never reachable from the public router below.
  "internal-cost": financeAgents.cost,
  "internal-invoice": financeAgents.invoice,
};

export const agentList = Object.values(agents);

/** Agents the public chat router is allowed to reach. */
const PUBLIC_ROUTES = [
  "billing",
  "legal",
  "hr",
  "negotiation",
  "cloudcost",
  "budget",
  "timeline",
  "effort",
  "quote",
  "sales",
  "pricing",
  "delivery",
  "qualifier",
] as const;

/**
 * Explicit, inspectable routing. A learned router would be shorter and much
 * harder to defend when someone asks why the negotiation agent answered a
 * question about backups.
 *
 * Order matters: the earliest match wins, so the highest-risk subjects are
 * checked first and cannot be swallowed by a general pricing question.
 */
/**
 * Questions about what Ada *is* must reach the concierge, which is the only
 * agent that can answer them. Retrieval cannot: every word in "who are you"
 * is a stopword, and "are you a real person" otherwise matches a service
 * blurb that happens to contain the word "person".
 */
const IDENTITY =
  /\b(who|what)\s+(are|r)\s+(you|u)\b|\bare you (an?\s+)?(real\s+)?(bot|robot|human|person|ai|machine|chatbot)\b|\bwhat is (this|ada)\b|\b(human|robot|bot) or (a )?(bot|human|robot)\b|\bam i talking to\b/i;

export function route(message: string, current: string): string {
  const text = message.toLowerCase();

  if (IDENTITY.test(message)) return "concierge";

  for (const key of PUBLIC_ROUTES) {
    const agent = agents[key];
    if (agent && agent.triggers.some((t) => !t.startsWith("__") && text.includes(t))) return key;
  }

  const hit = retrieve(message, 1)[0];
  if (hit?.entry.route && PUBLIC_ROUTES.includes(hit.entry.route as never)) return hit.entry.route;

  return PUBLIC_ROUTES.includes(current as never) ? current : "concierge";
}
