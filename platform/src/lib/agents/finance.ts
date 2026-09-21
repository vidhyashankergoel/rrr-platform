/**
 * The financial agent suite — eight agents, all computing through costing.ts
 * so a budget conversation, a quote and an invoice can never disagree.
 *
 * Same rule as everywhere else: these agents produce numbers and drafts.
 * A human approves anything that reaches a customer, and every discount,
 * every quote and every invoice passes through the Approval table first.
 */

import type { Agent, AgentInput, AgentResult } from "./types";
import {
  ROLES,
  computeEffort,
  computeTimeline,
  estimateCloud,
  computeTotals,
  invoiceRequiredFields,
  MIN_ACCEPTABLE_MARGIN_PCT,
  TAX_TABLE,
  SMALL_SUPPLIER_THRESHOLD,
  type CloudProvider,
  type WorkloadSize,
  type ProvinceCode,
  type EffortLine,
} from "../costing";
import { services, auditOffer, retainers } from "../catalogue";
import { company, currencyFromDollars as money, currencyExact } from "../company";
import { retrieve } from "../knowledge";

const pct = (n: number) => `${n.toFixed(0)}%`;

/** Pull service ids the visitor's message plausibly refers to. */
function matchServices(text: string) {
  const lower = text.toLowerCase();
  const direct = services.filter(
    (s) =>
      lower.includes(s.id.replace(/-/g, " ")) ||
      s.stack.some((t) => t.length > 3 && lower.includes(t.toLowerCase())),
  );
  if (direct.length) return direct;
  const hits = retrieve(text, 2);
  return services.filter((s) => hits.some((h) => h.entry.key === s.id));
}

/** Convert a service to a default staffing shape. */
function effortFor(serviceId: string, weeks: number): EffortLine[] {
  const seniorHours = weeks * 30;
  const heavyArchitecture = ["migration", "k8s-platform", "data-platform", "service-mesh"].includes(serviceId);
  const dataHeavy = ["databases", "data-platform", "mlops"].includes(serviceId);
  const securityHeavy = ["security"].includes(serviceId);

  const lines: EffortLine[] = [{ roleKey: "senior-devops", hours: Math.round(seniorHours) }];
  if (heavyArchitecture) lines.push({ roleKey: "principal-architect", hours: Math.round(weeks * 8) });
  if (dataHeavy) lines.push({ roleKey: "senior-data", hours: Math.round(weeks * 18) });
  if (serviceId === "databases") lines.push({ roleKey: "dbre", hours: Math.round(weeks * 20) });
  if (securityHeavy) lines.push({ roleKey: "cloud-security", hours: Math.round(weeks * 24) });
  lines.push({ roleKey: "delivery-manager", hours: Math.round(weeks * 4) });
  return lines;
}

// ---------------------------------------------------------------------------
// 10 · BUDGET — "we have $X, what does that buy?"
// ---------------------------------------------------------------------------
export const budgetAgent: Agent = {
  key: "pricing", // routes under the pricing family
  displayName: "Ada · budget",
  purpose: "Works backwards from a stated budget to what it realistically buys.",
  triggers: [
    "budget", "afford", "ballpark", "allocated", "approved for",
    "we have about", "we have around", "we have roughly", "we have a budget",
    "price range", "how much can", "what can we get",
  ],
  guardrails: [
    "Never claim a budget is sufficient when the catalogue says otherwise.",
    "Recommend reducing scope rather than quietly reducing quality.",
  ],
  async run(input): Promise<AgentResult> {
    const numbers = input.message.replace(/,/g, "").match(/\$?\s?(\d{4,7})\s?(k|K)?/g) ?? [];
    let budget = 0;
    for (const raw of numbers) {
      const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
      budget = Math.max(budget, /k/i.test(raw) ? n * 1000 : n);
    }

    if (!budget) {
      return {
        reply: [
          "Tell me the number you have to work with and I will tell you honestly what it buys — including when the answer is 'not this'.",
          "",
          `For scale: the ${auditOffer.name} is ${money(auditOffer.price)}, a CI/CD build starts around ${money(12000)}, a Kubernetes platform around ${money(25000)}, and a migration wave starts around ${money(45000)}.`,
        ].join("\n"),
        confidence: 0.6,
        suggestions: ["We have about $30,000", "We have about $75,000", "What does the audit cover?"],
      };
    }

    const affordable = services.filter((s) => s.priceLow <= budget).sort((a, b) => b.priceLow - a.priceLow);
    const stretch = services.filter((s) => s.priceLow > budget && s.priceLow <= budget * 1.4);

    const lines: string[] = [`With **${money(budget)}** (excluding GST/HST), here is what is realistically in range:`, ""];

    if (affordable.length === 0) {
      lines.push(
        `That is below our smallest fixed-scope engagement. The honest recommendation is the **${auditOffer.name} at ${money(auditOffer.price)}** — five business days, a written report, and you keep it whether or not you use us afterwards.`,
      );
    } else {
      for (const s of affordable.slice(0, 4)) {
        const fits = s.priceHigh <= budget;
        lines.push(
          `• **${s.name}** — ${money(s.priceLow)}–${money(s.priceHigh)}, ${s.durationLabel}${
            fits ? "" : " _(fits at the lower end of scope only)_"
          }`,
        );
      }
    }

    if (stretch.length) {
      lines.push("", "Just out of reach, and worth knowing about:");
      for (const s of stretch.slice(0, 2)) {
        lines.push(`• ${s.name} — from ${money(s.priceLow)}. Phasing it over two quarters usually works.`);
      }
    }

    lines.push(
      "",
      "_Indicative only, and not an offer. A firm fixed price follows a free scoping call._",
    );

    return {
      reply: lines.join("\n"),
      confidence: 0.85,
      leadPatch: {
        budgetBand:
          budget < 25000 ? "under-25k" : budget < 75000 ? "25-75k" : budget < 150000 ? "75-150k" : "150k-plus",
      },
      suggestions: ["How long would that take?", "What would the cloud bill be?", "Can we phase it?"],
    };
  },
};

// ---------------------------------------------------------------------------
// 11 · TIMELINE — elapsed time, honestly
// ---------------------------------------------------------------------------
export const timelineAgent: Agent = {
  key: "delivery",
  displayName: "Ada · timeline",
  purpose: "Estimates elapsed delivery time including client-side dependencies.",
  triggers: ["how long", "timeline", "when can", "duration", "deadline", "by when", "weeks", "start date"],
  guardrails: [
    "Quote elapsed time, never just working time. Client review and change windows are real.",
    "Never commit to a date. Give a range and say what it depends on.",
  ],
  async run(input): Promise<AgentResult> {
    const matched = matchServices(input.message);
    const target = matched[0];

    if (!target) {
      return {
        reply: [
          "Which piece of work do you mean? Rough elapsed times, including your side of the review:",
          "",
          `• Infrastructure audit — ${auditOffer.durationLabel}`,
          "• CI/CD pipeline — 2–4 weeks",
          "• Kubernetes platform — 4–8 weeks",
          "• Observability stack — 3–5 weeks",
          "• Migration wave — 8–20 weeks",
        ].join("\n"),
        confidence: 0.55,
        suggestions: ["Kubernetes platform", "A migration", "Observability"],
      };
    }

    const effort = computeEffort(effortFor(target.id, target.durationWeeks));
    const normal = computeTimeline({ totalHours: effort.totalHours, teamSize: 2 });
    const fast = computeTimeline({ totalHours: effort.totalHours, teamSize: 3, accelerated: true });

    return {
      reply: [
        `**${target.name}** — published duration ${target.durationLabel}.`,
        "",
        `Modelled from the actual staffing shape (${effort.totalHours} engineering hours across ${effort.lines.length} roles):`,
        "",
        `• **Standard, 2 engineers:** ${normal.elapsedWeeks} weeks elapsed (${normal.elapsedWeeksOptimistic}–${normal.elapsedWeeksPessimistic} depending on how fast reviews come back)`,
        `• **Accelerated, 3 engineers:** ${fast.elapsedWeeks} weeks elapsed, at a rate uplift`,
        `• **Earliest realistic start:** ${normal.startableFrom}`,
        "",
        ...normal.notes.map((n) => `_${n}_`),
      ].join("\n"),
      confidence: 0.86,
      suggestions: ["What would it cost?", "Can you start sooner?", "What do you need from us?"],
    };
  },
};

// ---------------------------------------------------------------------------
// 12 · COST — internal cost and margin. Never shown to customers.
// ---------------------------------------------------------------------------
export const costAgent: Agent = {
  key: "pricing",
  displayName: "Internal · cost",
  purpose: "INTERNAL ONLY. Computes what an engagement costs us to deliver and the resulting margin.",
  triggers: ["__internal_cost__"],
  guardrails: [
    "INTERNAL ONLY. Output must never be returned to a customer-facing chat turn.",
    "Flag any engagement below the minimum acceptable margin.",
  ],
  async run(input): Promise<AgentResult> {
    const matched = matchServices(input.message);
    const target = matched[0] ?? services[0]!;
    const effort = computeEffort(effortFor(target.id, target.durationWeeks));

    const belowFloor = effort.grossMarginLowPct < MIN_ACCEPTABLE_MARGIN_PCT;

    return {
      reply: [
        `**Internal cost model — ${target.name}**`,
        "",
        ...effort.lines.map(
          (l) =>
            `• ${l.title}: ${l.hours}h · cost ${currencyExact(l.internalCost)} · revenue ${money(l.revenueLow)}–${money(l.revenueHigh)}`,
        ),
        "",
        `Total effort: **${effort.totalHours}h**`,
        `Delivery cost: **${currencyExact(effort.internalCost)}**`,
        `Revenue at list: **${money(effort.revenueLow)}–${money(effort.revenueHigh)}**`,
        `Gross margin: **${pct(effort.grossMarginLowPct)}–${pct(effort.grossMarginHighPct)}**`,
        "",
        belowFloor
          ? `⚠️ Below the ${MIN_ACCEPTABLE_MARGIN_PCT}% floor at the bottom of the range. Do not discount this engagement.`
          : `✓ Above the ${MIN_ACCEPTABLE_MARGIN_PCT}% floor across the range.`,
      ].join("\n"),
      confidence: 0.95,
    };
  },
};

// ---------------------------------------------------------------------------
// 13 · CLOUD COST — what the infrastructure itself will cost to run
// ---------------------------------------------------------------------------
export const cloudCostAgent: Agent = {
  key: "pricing",
  displayName: "Ada · cloud spend",
  purpose: "Estimates the client’s ongoing cloud run-rate, separate from our fees.",
  triggers: ["cloud cost", "aws cost", "azure cost", "gcp cost", "monthly bill", "run rate", "infrastructure cost", "hosting cost", "cloud bill"],
  guardrails: [
    "Always separate our fees from the client’s cloud spend. Conflating them is the single most common source of budget surprise.",
    "State that the estimate is planning-grade and must be validated against a month of real usage.",
  ],
  async run(input): Promise<AgentResult> {
    const text = input.message.toLowerCase();

    const provider: CloudProvider = text.includes("azure") ? "azure" : text.includes("gcp") || text.includes("google") ? "gcp" : "aws";
    const size: WorkloadSize = /\b(enterprise|xlarge|very large|huge)\b/.test(text)
      ? "xlarge"
      : /\b(large|big|high traffic)\b/.test(text)
        ? "large"
        : /\b(small|startup|tiny|mvp|pilot)\b/.test(text)
          ? "small"
          : "medium";

    const est = estimateCloud({
      provider,
      size,
      environments: /\b(three|3) environments?\b/.test(text) ? 3 : 2,
      kubernetes: /kubernetes|k8s|eks|aks|gke|container/.test(text),
      managedDatabase: /database|postgres|mysql|rds|sql/.test(text) || true,
      observability: /observability|monitoring|logs|grafana|prometheus/.test(text),
      highAvailability: /ha\b|high availability|multi.?az|redundan|failover/.test(text),
      commitmentTermYears: 0,
    });

    const committed = estimateCloud({
      provider,
      size,
      environments: 2,
      kubernetes: /kubernetes|k8s|eks|aks|gke/.test(text),
      managedDatabase: true,
      observability: /observability|monitoring|logs/.test(text),
      highAvailability: /ha\b|high availability|multi.?az/.test(text),
      commitmentTermYears: 1,
    });

    return {
      reply: [
        `**Estimated ${provider.toUpperCase()} run-rate — ${size} workload**`,
        "",
        "_This is your cloud bill, paid directly to the provider. It is separate from our fees._",
        "",
        ...est.breakdown.map((b) => `• ${b.item}: ${money(b.low)}–${money(b.high)} / month`),
        "",
        `**On-demand: ${money(est.monthlyLow)}–${money(est.monthlyHigh)} per month** (${money(est.annualLow)}–${money(est.annualHigh)} per year)`,
        `**With a 1-year commitment: ${money(committed.monthlyLow)}–${money(committed.monthlyHigh)} per month**`,
        "",
        ...est.notes.slice(0, 3).map((n) => `_${n}_`),
        "",
        `Our cost optimization engagement is ${money(9500)} plus 20% of verified twelve-month savings — on a bill this size it normally pays for itself.`,
      ].join("\n"),
      confidence: 0.82,
      suggestions: ["How do we reduce that?", "What about a 3-year commitment?", "What would you charge to build it?"],
    };
  },
};

// ---------------------------------------------------------------------------
// 14 · EFFORT — who is needed, for how many hours, at what rate
// ---------------------------------------------------------------------------
export const effortAgent: Agent = {
  key: "delivery",
  displayName: "Ada · staffing",
  purpose: "Breaks an engagement into roles, hours and per-hour rates.",
  triggers: ["effort", "how many people", "team size", "hours", "per hour", "rate card", "who would work", "staffing", "resource"],
  guardrails: [
    "Publish client-facing rates only. Never disclose internal cost or margin.",
    "Never name an individual as assigned without human confirmation.",
  ],
  async run(input): Promise<AgentResult> {
    const matched = matchServices(input.message);
    const target = matched[0];

    if (!target) {
      return {
        reply: [
          "Our published rate card, in Canadian dollars per hour excluding GST/HST:",
          "",
          ...ROLES.map((r) => `• **${r.title}** — ${money(r.billLow)}–${money(r.billHigh)} / hr`),
          "",
          "_Delivery management is included at no charge on fixed-scope engagements._",
          "",
          "Tell me which piece of work you mean and I will break it into roles and hours.",
        ].join("\n"),
        confidence: 0.75,
        suggestions: ["Staffing for a Kubernetes build", "Staffing for a migration", "What does that total?"],
      };
    }

    const effort = computeEffort(effortFor(target.id, target.durationWeeks));
    const timeline = computeTimeline({ totalHours: effort.totalHours, teamSize: 2 });

    return {
      reply: [
        `**${target.name} — staffing breakdown**`,
        "",
        ...effort.lines.map(
          (l) => `• **${l.title}** — ${l.hours} hours at ${money(l.rateLow)}–${money(l.rateHigh)} / hr`,
        ),
        "",
        `Total effort: **${effort.totalHours} engineering hours**`,
        `At rate card: **${money(effort.revenueLow)}–${money(effort.revenueHigh)}**`,
        `Published fixed price: **${money(target.priceLow)}–${money(target.priceHigh)}**`,
        `Elapsed time with 2 engineers: **${timeline.elapsedWeeks} weeks**`,
        "",
        "_On a fixed-price engagement you pay the fixed price regardless of hours. The breakdown is shown so you can see what you are buying, and the overrun risk sits with us._",
      ].join("\n"),
      confidence: 0.88,
      suggestions: ["Why fixed price rather than hourly?", "Can we use fewer people?", "What is the timeline?"],
    };
  },
};

// ---------------------------------------------------------------------------
// 15 · COST BUILDER — assemble a full multi-service quote
// ---------------------------------------------------------------------------
export const costBuilderAgent: Agent = {
  key: "pricing",
  displayName: "Ada · quote builder",
  purpose: "Assembles a multi-service engagement into one priced, scheduled quote.",
  triggers: ["build a quote", "put together", "package", "bundle", "everything", "end to end", "full programme", "all of it", "total cost"],
  guardrails: [
    "Only combine services that exist in the catalogue.",
    "Any multi-service discount is a concession and requires human approval.",
    "Present the result as indicative, never as an offer capable of acceptance.",
  ],
  async run(input): Promise<AgentResult> {
    const matched = matchServices(input.message);
    const chosen = matched.length ? matched : services.filter((s) => s.featured);

    const totalLow = chosen.reduce((a, s) => a + s.priceLow, 0);
    const totalHigh = chosen.reduce((a, s) => a + s.priceHigh, 0);

    const allEffort = chosen.flatMap((s) => effortFor(s.id, s.durationWeeks));
    const effort = computeEffort(allEffort);
    const timeline = computeTimeline({ totalHours: effort.totalHours, teamSize: 3 });

    const province: ProvinceCode = "ON";
    const registered = company.gstHstNumber.length > 0;
    const totals = computeTotals(
      chosen.map((s) => ({
        description: s.name,
        quantity: 1,
        unit: "engagement",
        unitPrice: (s.priceLow + s.priceHigh) / 2,
      })),
      province,
      registered,
    );

    return {
      reply: [
        "**Indicative programme quote**",
        "",
        ...chosen.map((s) => `• **${s.name}** — ${money(s.priceLow)}–${money(s.priceHigh)}, ${s.durationLabel}`),
        "",
        `Subtotal: **${money(totalLow)}–${money(totalHigh)}** CAD`,
        registered
          ? `Plus ${TAX_TABLE[province].label}: ${currencyExact(totals.tax)} (midpoint)`
          : "_GST/HST not shown — registration is pending._",
        "",
        `Total engineering effort: **${effort.totalHours} hours**`,
        `Elapsed time with a 3-person pod: **${timeline.elapsedWeeks} weeks** (${timeline.elapsedWeeksOptimistic}–${timeline.elapsedWeeksPessimistic})`,
        "",
        `Ongoing support afterwards from **${money(retainers[0]!.price)}/month**.`,
        "",
        "_Indicative only. Not an offer. A firm fixed price follows a scoping call and a short discovery._",
      ].join("\n"),
      confidence: 0.84,
      leadPatch: { estimateLow: totalLow * 100, estimateHigh: totalHigh * 100, stage: "SCOPING" },
      actions: [
        {
          kind: "PROPOSAL",
          title: `Programme quote requested — ${money(totalLow)}–${money(totalHigh)}`,
          summary: chosen.map((s) => s.name).join(", "),
          payload: {
            serviceIds: chosen.map((s) => s.id),
            totalLow,
            totalHigh,
            effortHours: effort.totalHours,
            elapsedWeeks: timeline.elapsedWeeks,
          },
          requiresApproval: true,
          riskNote: "Verify margin with the internal cost agent before issuing a formal proposal.",
        },
      ],
      suggestions: ["Can we phase this?", "What is the cloud spend on top?", "Send me a formal proposal"],
    };
  },
};

// ---------------------------------------------------------------------------
// 16 · BILLING — terms, schedules, how invoicing works
// ---------------------------------------------------------------------------
export const billingAgent: Agent = {
  key: "pricing",
  displayName: "Ada · billing",
  purpose: "Explains payment terms, billing schedules and invoicing mechanics.",
  triggers: [
    "invoice", "invoicing", "billing", "payment term", "payment schedule",
    "net 30", "net 60", "deposit", "milestone", "how do we pay",
    "when do we pay", "purchase order", "po number", "instalment", "installment",
    "terms of payment",
  ],
  guardrails: [
    "Never vary payment terms. That is a concession requiring approval.",
    "Never request banking details in chat. Banking details appear only on an approved invoice.",
  ],
  async run(): Promise<AgentResult> {
    const registered = company.gstHstNumber.length > 0;

    return {
      reply: [
        "**How billing works**",
        "",
        "**Fixed-scope engagements**",
        "• 40% on signature, 30% at the midpoint milestone, 30% on acceptance",
        "• Each invoice lists the milestone and its acceptance criteria",
        "",
        "**Time-and-materials**",
        "• Invoiced monthly in arrears against a timesheet you can inspect",
        "• A not-to-exceed cap is agreed up front and we stop at it rather than sailing past",
        "",
        "**Retainers**",
        "• Invoiced monthly in advance",
        "• Unused hours roll one month forward, then lapse",
        "",
        "**Terms**",
        `• Net ${company.paymentTermsDays} days from invoice date`,
        `• ${company.lateInterestAnnualPct}% per annum on overdue amounts`,
        "• Payment by EFT or cheque in Canadian dollars",
        "• We accept a purchase order number on the invoice if your procurement requires it",
        registered
          ? `• ${TAX_TABLE.ON.label} applied per the place-of-supply rules for your province`
          : "• GST/HST registration is in progress; invoices will show it once issued",
        "",
        "_Banking details appear only on an issued invoice, never in chat or email. If you ever receive a message claiming our banking details have changed, phone us on the number on our website before acting on it._",
      ].join("\n"),
      confidence: 0.92,
      suggestions: ["Can we do net 60?", "Do you take a deposit?", "Can we pay by milestone?"],
    };
  },
};

// ---------------------------------------------------------------------------
// 17 · INVOICE GENERATOR — drafts a compliant invoice for approval
// ---------------------------------------------------------------------------
export const invoiceAgent: Agent = {
  key: "pricing",
  displayName: "Internal · invoice",
  purpose: "Generates a draft invoice meeting Excise Tax Act requirements. Never issued without approval.",
  triggers: ["__generate_invoice__"],
  guardrails: [
    "An invoice is a financial document. It is never sent without human approval.",
    "Never charge GST/HST while the company is unregistered — doing so is an offence.",
    "Tax is determined by the recipient’s province under the place-of-supply rules.",
  ],
  async run(input): Promise<AgentResult> {
    const registered = company.gstHstNumber.length > 0;
    const province: ProvinceCode = "ON";

    const items = [
      { description: "Platform engineering services — milestone 1", quantity: 1, unit: "milestone", unitPrice: 12000 },
    ];
    const totals = computeTotals(items, province, registered);
    const required = invoiceRequiredFields(totals.total);

    const missing: string[] = [];
    if (!company.legalName) missing.push("legal business name");
    if (registered && !company.gstHstNumber) missing.push("GST/HST registration number");
    if (!company.addressLine) missing.push("business address");

    return {
      reply: [
        "**Draft invoice prepared**",
        "",
        ...items.map((i) => `• ${i.description} — ${currencyExact(i.quantity * i.unitPrice)}`),
        "",
        `Subtotal: ${currencyExact(totals.subtotal)}`,
        `${totals.taxLabel}: ${currencyExact(totals.tax)}`,
        `**Total: ${currencyExact(totals.total)} CAD**`,
        "",
        `Terms: net ${company.paymentTermsDays} days`,
        "",
        "Required fields on this invoice:",
        ...required.map((r) => `• ${r}`),
        "",
        missing.length
          ? `⚠️ Cannot issue — missing: ${missing.join(", ")}. Complete these in company.ts first.`
          : "✓ All required fields present.",
        "",
        !registered
          ? `⚠️ Not registered for GST/HST, so no tax is being charged. Registration becomes mandatory once taxable supplies exceed ${money(SMALL_SUPPLIER_THRESHOLD)} over four consecutive calendar quarters.`
          : "",
        totals.separateProvincialTaxNote ? `⚠️ ${totals.separateProvincialTaxNote}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      confidence: 0.94,
      actions: [
        {
          kind: "PROPOSAL",
          title: `Invoice draft — ${currencyExact(totals.total)}`,
          summary: items.map((i) => i.description).join("; "),
          payload: { items, totals, province, registered },
          requiresApproval: true,
          riskNote:
            "Financial document. Verify the recipient’s province, the milestone acceptance, and the GST/HST treatment before issuing.",
        },
      ],
    };
  },
};

export const financeAgents = {
  budget: budgetAgent,
  timeline: timelineAgent,
  cost: costAgent,
  cloudCost: cloudCostAgent,
  effort: effortAgent,
  costBuilder: costBuilderAgent,
  billing: billingAgent,
  invoice: invoiceAgent,
};
