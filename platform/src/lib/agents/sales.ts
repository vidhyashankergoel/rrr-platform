/**
 * THE SALES AGENT
 *
 * A full-parameter selling agent: it runs a structured discovery, explains the
 * catalogue in terms of the visitor's problem rather than our service names,
 * handles the standard objections honestly, and hands to a human at the point
 * where a human is actually better than it is.
 *
 * It is deliberately a *consultative* seller, not a pushy one. The firm's whole
 * positioning is "we tell you when you don't need us" — an agent that hard-sells
 * would contradict the pitch on the same page it appears.
 *
 * It never: quotes a number not in the catalogue, offers a discount, promises a
 * date, or claims capability the case studies do not support.
 */

import type { Agent, AgentInput, AgentResult } from "./types";
import { services, retainers, auditOffer, caseStudies } from "../catalogue";
import { company, currencyFromDollars as money } from "../company";
import { complete } from "../llm";
import { retrieve } from "../knowledge";
import { displayClient } from "../attribution";

// ---------------------------------------------------------------------------
// Discovery framework
// ---------------------------------------------------------------------------

/**
 * What we need to know before anyone can give a real number. Ordered by how
 * much each answer narrows the estimate, so the most valuable question is
 * asked first and a visitor who drops out after two turns still left us
 * something useful.
 */
export const DISCOVERY = [
  {
    key: "situation",
    question: "What is running today, and where is it running?",
    why: "Determines whether this is a build, a migration, or a rescue — which changes the number by an order of magnitude.",
    signals: ["on-prem", "on prem", "datacentre", "data center", "aws", "azure", "gcp", "vmware", "bare metal", "heroku", "kubernetes"],
  },
  {
    key: "pain",
    question: "What made you start looking now, rather than six months ago?",
    why: "A trigger event tells you whether there is real urgency or whether this is research.",
    signals: ["outage", "incident", "down", "breach", "audit", "compliance", "cost", "bill", "slow", "scaling", "hiring", "left", "funding"],
  },
  {
    key: "scale",
    question: "Roughly how many services or applications are involved, and how many engineers do you have?",
    why: "Scale drives effort more than any other single variable.",
    signals: ["services", "applications", "engineers", "developers", "team", "microservices", "monolith"],
  },
  {
    key: "constraints",
    question: "Anything that constrains the answer — regulatory obligations, a deadline, data residency, an existing vendor?",
    why: "Constraints eliminate whole solution classes. Finding them late is expensive.",
    signals: ["pipeda", "soc", "iso", "pci", "hipaa", "residency", "sovereign", "deadline", "contract", "vendor", "government"],
  },
  {
    key: "budget",
    question: "Is there a budget envelope already, or are you trying to find out what this should cost?",
    why: "Both answers are fine. Pretending not to ask wastes a call.",
    signals: ["budget", "approved", "funded", "allocated", "afford", "$", "k ", "thousand"],
  },
  {
    key: "decision",
    question: "Who else needs to be comfortable with this before it can go ahead?",
    why: "Deals stall on an unnamed stakeholder more often than on price.",
    signals: ["cto", "cio", "board", "procurement", "finance", "legal", "security", "manager", "director"],
  },
] as const;

export type DiscoveryKey = (typeof DISCOVERY)[number]["key"];

/** Which discovery slots the conversation has plausibly already filled. */
export function assessDiscovery(history: string[]): {
  answered: DiscoveryKey[];
  missing: DiscoveryKey[];
  completeness: number;
} {
  const corpus = history.join(" ").toLowerCase();
  const answered: DiscoveryKey[] = [];

  for (const d of DISCOVERY) {
    if (d.signals.some((s) => corpus.includes(s))) answered.push(d.key);
  }

  const missing = DISCOVERY.map((d) => d.key).filter((k) => !answered.includes(k));
  return { answered, missing, completeness: answered.length / DISCOVERY.length };
}

// ---------------------------------------------------------------------------
// Objection handling — honest answers, not deflections
// ---------------------------------------------------------------------------

export const OBJECTIONS: Array<{ match: RegExp; response: string }> = [
  {
    match: /too expensive|cost too much|out of (our )?budget|cheaper|price is high/i,
    response: [
      "That is a fair thing to say, and I would rather address it than talk around it.",
      "",
      "I cannot discount published pricing — only a person here can decide that. What I can do is show you the three honest ways to spend less:",
      "",
      `• **Start with the audit.** ${money(auditOffer.price)}, ${auditOffer.durationLabel}. You find out what actually needs doing before committing to a build, and frequently the answer is less than you feared.`,
      "• **Phase it.** Take the slice that removes the most risk, defer the rest to next quarter.",
      "• **Split the work.** We design and review; your engineers build. Slower, cheaper, and your team ends up owning it properly.",
    ].join("\n"),
  },
  {
    match: /\b(we|i) (can|could|might)\b[^.?!]{0,24}\b(do|build|handle) (this|it|that)\b[^.?!]{0,24}\b(ourselves|in.?house|internally|in house)\b|already have a team|why not.*in.?house|do (this|it) (ourselves|in.?house|internally)/i,
    response: [
      "Often you can, and if that is true I would rather say so than sell you something.",
      "",
      "Hiring makes more sense when the work is permanent and ongoing. We make more sense when it is a bounded project your team does not do often enough to be fast at — a migration, a first Kubernetes platform, an observability build — or when you need it done while your team keeps the current thing running.",
      "",
      "A useful test: if you would have to hire someone to do this and then find work for them afterwards, it is probably a project rather than a role.",
    ].join("\n"),
  },
  {
    match: /how do (i|we) know|trust|prove|references?|track record|never heard of/i,
    response: [
      "Reasonable question for any new supplier. Three concrete things:",
      "",
      ...caseStudies.slice(0, 3).map((c) => `• **${displayClient(c)}** (${c.sector}, ${c.period}) — ${c.headline}`),
      "",
      `Beyond that: the ${auditOffer.name} exists precisely so you can test us at low cost. Five business days, ${money(auditOffer.price)}, and you keep the report whether or not you continue. Most clients start there.`,
      "",
      "Client references are available on request once we are past an initial call.",
    ].join("\n"),
  },
  {
    match: /lock.?in|proprietary|what if (you|we) (leave|stop)|dependent on you|hostage/i,
    response: [
      "This is the objection I most want to answer, because it is the one most consultancies deserve.",
      "",
      "Everything we build lives in **your** repositories and **your** cloud accounts. No proprietary wrapper, no licensed component only we can renew, nothing that requires us to operate it.",
      "",
      "The test we hold ourselves to: your team should be able to run the platform the day we leave. Handover includes runbooks and recorded sessions, and it is part of the fixed price rather than an upsell.",
    ].join("\n"),
  },
  {
    match: /how (big|large|small) (are|is) (you|your|the (company|team|firm))|how many (people|employees|staff)/i,
    response: [
      "Small and deliberately so. A pod is assembled per engagement — one senior engineer for a focused build, up to an architect, several engineers and a delivery manager for a programme.",
      "",
      "What that means for you: the named engineers on the proposal are the ones who do the work, and you meet them before you sign. No bench, no pyramid, no handing your project to whoever is available.",
      "",
      "What it also means: we take on a limited number of concurrent engagements, so start dates can be a few weeks out. I would rather tell you that now than after you have signed.",
    ].join("\n"),
  },
  {
    match: /just (looking|researching|browsing)|not ready|early stages|exploring/i,
    response: [
      "Entirely fine — no pressure from me.",
      "",
      "If it helps while you are looking: our full price list and durations are published on the pricing page, so you can build a budget without speaking to anyone. That is deliberate.",
      "",
      "Ask me anything you like. If you want a number for a business case, tell me roughly what you are running and I will give you a range.",
    ].join("\n"),
  },
  {
    match: /(other|another) (vendor|consultanc|supplier|company|firm)|competitor|comparing|rfp|bids?/i,
    response: [
      "Sensible. Three things worth comparing us on, because they are where proposals usually differ:",
      "",
      "• **Is the price fixed, and who carries the overrun?** Ours is fixed where scope allows, and the overrun is ours.",
      "• **Who actually does the work?** Ask for named engineers at proposal stage, and ask to meet them.",
      "• **What happens at the end?** Ask what you own, and whether handover is included or extra.",
      "",
      "If another firm answers those better than we do, take them. Genuinely.",
    ].join("\n"),
  },
];

function matchObjection(text: string) {
  return OBJECTIONS.find((o) => o.match.test(text));
}

// ---------------------------------------------------------------------------
// Pitch construction — frame the catalogue around the visitor's problem
// ---------------------------------------------------------------------------

const PROBLEM_MAP: Array<{ match: RegExp; serviceIds: string[]; frame: string }> = [
  {
    match: /on.?prem|datacent|data cent|server room|physical server|vmware|move to (the )?cloud|migrat/i,
    serviceIds: ["migration", "landing-zone", "iac"],
    frame: "Moving off your own hardware is mostly a sequencing problem, not a technology one. The technology is well understood; what goes wrong is cutover order and the rollback nobody rehearsed.",
  },
  {
    match: /deploy|release|ship|pipeline|ci.?cd|jenkins|manual.*deploy|friday/i,
    serviceIds: ["cicd", "gitops", "k8s-platform"],
    frame: "If deployment is a ritual a person performs, the fix is to make it a merge. That means a pipeline with real gates and a rollback that has actually been tested.",
  },
  {
    match: /outage|incident|down|reliab|uptime|sla|paging|on.?call|firefight|3am|alert fatigue/i,
    serviceIds: ["observability", "sre", "k8s-platform"],
    frame: "Reliability problems are usually visibility problems first. You cannot fix what you find out about from a customer.",
  },
  {
    match: /cost|bill|spend|expensive|budget|overspend|finops|waste/i,
    serviceIds: ["finops", "iac", "observability"],
    frame: "Cloud bills grow because nothing is allocated and nothing is measured. The waste is almost always in idle resources, oversized instances and untiered storage.",
  },
  {
    match: /kubernetes|k8s|eks|aks|gke|container|docker|openshift|orchestrat/i,
    serviceIds: ["k8s-platform", "gitops", "service-mesh"],
    frame: "Standing a cluster up is the easy part. What determines whether it works is ingress, autoscaling, RBAC, secrets, backup and having an upgrade path your team is not afraid of.",
  },
  {
    match: /security|compliance|audit|soc ?2|iso ?27001|pci|breach|pen.?test|vulnerab/i,
    serviceIds: ["security", "iac", "cicd"],
    frame: "Most findings are configuration, not code. The durable fix is policy-as-code enforced in the pipeline, so misconfiguration is blocked rather than discovered.",
  },
  {
    match: /database|postgres|mysql|oracle|sql server|rds|data loss|backup|restore|replicat/i,
    serviceIds: ["databases", "data-platform"],
    frame: "The question that separates a real backup strategy from a theoretical one is when the restore was last actually performed and timed.",
  },
  {
    match: /terraform|infrastructure as code|iac|drift|undocumented|nobody knows|click.?ops|ansible/i,
    serviceIds: ["iac", "iac-retrofit"],
    frame: "Undocumented infrastructure is key-person risk with a cloud bill attached. Importing it into reviewable code is usually the highest-value fortnight you can buy.",
  },
  {
    match: /machine learning|ml|model|ai|mlops|inference|training|kserve|sagemaker/i,
    serviceIds: ["mlops", "data-platform"],
    frame: "Getting a model into production is a deployment problem wearing a data-science hat. It needs the same versioning, review and rollback discipline as any other service.",
  },
  {
    match: /data pipeline|etl|airflow|warehouse|lakehouse|analytics|reporting|dashboard/i,
    serviceIds: ["data-platform", "databases"],
    frame: "The measure of a data pipeline is whether a failed run can be replayed safely. Most cannot, which is why the numbers quietly drift.",
  },
];

const HOUSE_RULES = [
  `You are the sales assistant for ${company.legalName}, a Canadian cloud and platform engineering firm.`,
  "",
  "HOW TO SELL HERE:",
  "- Consultative, never pushy. The firm’s own positioning is that it tells clients when they do not need it. Contradicting that on the website would be self-defeating.",
  "- Lead with the visitor’s problem, not with service names.",
  "- Ask at most two questions per turn, and say why you are asking.",
  "- Be specific. A number, a duration or a named prior engagement beats any adjective.",
  "",
  "HARD LIMITS:",
  "- Only quote figures present in the supplied context. Never interpolate, round, or estimate a price yourself.",
  "- Never offer a discount, vary payment terms, or promise a start date. Those require a human.",
  "- Never claim a capability, certification, client or team size not in the context.",
  "- Never state that anything you say is an offer, a quote, or legal advice.",
  "- Never ask for banking details, card numbers, government identifiers or credentials.",
  "- If you do not know, say so and offer the call.",
  "",
  "STYLE: clear Canadian English, three short paragraphs at most, no exclamation marks, no hype.",
].join("\n");

// ---------------------------------------------------------------------------
// The agent
// ---------------------------------------------------------------------------

export const salesAgent: Agent = {
  key: "sales",
  displayName: "Ada · sales",
  purpose:
    "Runs structured discovery, explains the catalogue against the visitor’s problem, handles objections honestly, and hands to a human at the right moment.",
  triggers: [
    "talk to someone", "human", "call me", "book", "meeting", "speak to", "sales", "contact me",
    "interested", "we need", "looking for", "can you help", "do you do", "what do you offer",
    "services", "quote", "proposal", "rfp", "tender",
  ],
  guardrails: [
    "Consultative, never pushy.",
    "Quote only catalogue figures.",
    "No discounts, no dates, no promises. Those are human decisions.",
    "Capture contact details only with an explicit, unticked consent choice, and state the purpose first.",
  ],

  async run(input: AgentInput): Promise<AgentResult> {
    const text = input.message;
    const corpus = [...input.context.history.map((h) => h.content), text];
    const discovery = assessDiscovery(corpus);

    // --- 1. Objection? Answer it directly, from a written position. --------
    const objection = matchObjection(text);
    if (objection) {
      return {
        reply: objection.response,
        confidence: 0.9,
        escalate: /too expensive|cheaper|discount|rfp|tender/i.test(text),
        suggestions: ["What would the audit cover?", "Can we phase the work?", "Book a call"],
        ...(/(too expensive|cheaper|discount)/i.test(text)
          ? {
              actions: [
                {
                  kind: "PRICE_CONCESSION" as const,
                  title: "Price objection raised in chat",
                  summary: text.slice(0, 280),
                  payload: { verbatim: text, leadId: input.context.leadId },
                  requiresApproval: true,
                  riskNote:
                    "No concession was offered to the visitor. A human decides whether to vary published pricing.",
                },
              ],
            }
          : {}),
      };
    }

    // --- 2. Map the stated problem onto services ---------------------------
    const mapped = PROBLEM_MAP.find((p) => p.match.test(text));
    const relevant = mapped
      ? services.filter((s) => mapped.serviceIds.includes(s.id))
      : services.filter((s) => retrieve(text, 3).some((h) => h.entry.key === s.id));

    // --- 3. Build the context the model (or the fallback) works from -------
    const contextBlock = [
      "## Relevant services (CAD, excluding GST/HST)",
      ...(relevant.length ? relevant : services.filter((s) => s.featured)).map(
        (s) =>
          `### ${s.name}\n${s.blurb}\nPrice: ${money(s.priceLow)}${
            s.priceLow === s.priceHigh ? "" : `–${money(s.priceHigh)}`
          }${s.priceNote ? ` (${s.priceNote})` : ""}. Duration: ${s.durationLabel}.\nIncludes: ${s.includes.join("; ")}`,
      ),
      "",
      "## Entry offer",
      `${auditOffer.name}: ${money(auditOffer.price)} CAD, ${auditOffer.durationLabel}. ${auditOffer.blurb}`,
      "",
      "## Ongoing support",
      retainers.map((r) => `${r.name}: ${money(r.price)}${r.unit} — ${r.blurb}`).join("\n"),
      "",
      "## Evidence",
      caseStudies.map((c) => `${displayClient(c)} (${c.sector}, ${c.period}): ${c.headline}`).join("\n"),
      "",
      "## Discovery still needed",
      discovery.missing.length
        ? DISCOVERY.filter((d) => discovery.missing.includes(d.key))
            .slice(0, 2)
            .map((d) => `- ${d.question} (why: ${d.why})`)
            .join("\n")
        : "Discovery is sufficiently complete. Offer the call.",
      "",
      mapped ? `## Framing to use\n${mapped.frame}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const llm = await complete({
      system: HOUSE_RULES,
      context: contextBlock,
      history: input.context.history,
      message: text,
    });

    if (llm) {
      return {
        reply: llm,
        confidence: 0.85,
        leadPatch: {
          serviceIds: relevant.map((s) => s.id).join(","),
          score: Math.round(30 + discovery.completeness * 60),
          stage: discovery.completeness > 0.5 ? "SCOPING" : "QUALIFYING",
        },
        escalate: discovery.completeness > 0.66,
        suggestions: nextSuggestions(discovery.missing, relevant),
      };
    }

    // --- 4. Before falling back to a generic pitch, check whether the
    //        catalogue simply answers the question. A visitor who asks for a
    //        phone number wants the phone number, not a discovery question.
    const direct = retrieve(text, 1)[0];
    if (direct && direct.score >= 0.7) {
      return {
        reply: direct.entry.answer,
        confidence: Math.min(0.95, 0.5 + direct.score),
        leadPatch: {
          serviceIds: relevant.map((s) => s.id).join(","),
          score: Math.round(30 + discovery.completeness * 60),
        },
        suggestions: nextSuggestions(discovery.missing, relevant),
      };
    }

    // --- 5. Deterministic fallback -----------------------------------------
    const lines: string[] = [];

    if (mapped) lines.push(mapped.frame, "");

    if (relevant.length) {
      lines.push("Based on what you have described, this is where we would normally start:", "");
      for (const s of relevant.slice(0, 3)) {
        lines.push(
          `• **${s.name}** — ${money(s.priceLow)}${s.priceLow === s.priceHigh ? "" : `–${money(s.priceHigh)}`}, ${s.durationLabel}`,
          `  ${s.blurb}`,
        );
      }
      lines.push("");
    } else {
      lines.push(
        `We build, migrate and operate cloud platforms — AWS, Azure and GCP, Kubernetes, Terraform, CI/CD, observability, databases and security. ${services.length} defined services, each with a published price range.`,
        "",
      );
    }

    const ask = DISCOVERY.filter((d) => discovery.missing.includes(d.key)).slice(0, 2);
    if (ask.length) {
      lines.push("To give you a real number rather than a generic one:", "");
      for (const q of ask) lines.push(`• ${q.question}`);
      lines.push("");
    }

    lines.push(
      discovery.completeness > 0.5
        ? `That is probably enough to be useful on a call. The scoping call is 30 minutes, free, and you leave with an indicative range either way — ${company.email} or ${company.phone}.`
        : `If you would rather skip ahead, the ${auditOffer.name} at ${money(auditOffer.price)} tells you what actually needs doing in ${auditOffer.durationLabel}.`,
    );

    return {
      reply: lines.join("\n"),
      confidence: 0.72,
      leadPatch: {
        serviceIds: relevant.map((s) => s.id).join(","),
        score: Math.round(30 + discovery.completeness * 60),
        stage: discovery.completeness > 0.5 ? "SCOPING" : "QUALIFYING",
      },
      escalate: discovery.completeness > 0.66,
      suggestions: nextSuggestions(discovery.missing, relevant),
      ...(discovery.completeness > 0.66
        ? {
            actions: [
              {
                kind: "SALES_HANDOFF" as const,
                title: "Qualified conversation ready for a human",
                summary: `Discovery ${Math.round(discovery.completeness * 100)}% complete. Interested in: ${
                  relevant.map((s) => s.name).join(", ") || "not yet specific"
                }`,
                payload: {
                  conversationId: input.context.conversationId,
                  answered: discovery.answered,
                  missing: discovery.missing,
                  services: relevant.map((s) => s.id),
                },
                requiresApproval: true,
                riskNote: "Contact only if a consent record exists against the lead.",
              },
            ],
          }
        : {}),
    };
  },
};

function nextSuggestions(missing: DiscoveryKey[], relevant: typeof services): string[] {
  const out: string[] = [];
  if (relevant[0]) out.push(`How long would ${relevant[0].name.split("—")[0]?.trim()} take?`);
  if (missing.includes("budget")) out.push("What should this cost?");
  out.push("Can I talk to a person?");
  return out.slice(0, 3);
}
