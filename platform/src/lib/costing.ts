/**
 * The costing engine.
 *
 * Every financial agent computes through this module, so a budget estimate, a
 * quote and an invoice all derive from the same arithmetic. There is exactly
 * one place where a number can be wrong.
 *
 * TAX NOTE — this implements GST/HST as it applies to services supplied by an
 * Ontario-resident supplier:
 *  • Place of supply for services is generally the recipient's business address
 *    obtained in the ordinary course of business (ETA, New Harmonized Value-added
 *    Tax System Regulations).
 *  • Registration is mandatory once worldwide taxable supplies exceed $30,000
 *    over four consecutive calendar quarters (the small-supplier threshold).
 *    Below that you may register voluntarily — usually worth it, because it
 *    lets you claim input tax credits.
 *  • Provincial retail sales taxes (BC PST, SK PST, MB RST, QC QST) are NOT
 *    computed here. Consulting services are commonly out of scope, but the
 *    treatment is province- and service-specific. Confirm with an accountant
 *    before invoicing into those provinces.
 *
 * Rates below are current as at 2026. Verify annually — Nova Scotia moved from
 * 15% to 14% on 1 April 2025, and these do change.
 */

export type ProvinceCode =
  | "AB" | "BC" | "MB" | "NB" | "NL" | "NS" | "NT"
  | "NU" | "ON" | "PE" | "QC" | "SK" | "YT";

export interface TaxTreatment {
  code: ProvinceCode;
  name: string;
  /** Combined GST/HST rate applied by this engine. */
  gstHstRate: number;
  label: string;
  /** A separate provincial tax exists that this engine does not compute. */
  separateProvincialTax?: string;
}

export const TAX_TABLE: Record<ProvinceCode, TaxTreatment> = {
  AB: { code: "AB", name: "Alberta", gstHstRate: 0.05, label: "GST 5%" },
  BC: { code: "BC", name: "British Columbia", gstHstRate: 0.05, label: "GST 5%", separateProvincialTax: "BC PST 7% may apply to certain software and telecom supplies" },
  MB: { code: "MB", name: "Manitoba", gstHstRate: 0.05, label: "GST 5%", separateProvincialTax: "Manitoba RST 7% may apply" },
  NB: { code: "NB", name: "New Brunswick", gstHstRate: 0.15, label: "HST 15%" },
  NL: { code: "NL", name: "Newfoundland and Labrador", gstHstRate: 0.15, label: "HST 15%" },
  NS: { code: "NS", name: "Nova Scotia", gstHstRate: 0.14, label: "HST 14%" },
  NT: { code: "NT", name: "Northwest Territories", gstHstRate: 0.05, label: "GST 5%" },
  NU: { code: "NU", name: "Nunavut", gstHstRate: 0.05, label: "GST 5%" },
  ON: { code: "ON", name: "Ontario", gstHstRate: 0.13, label: "HST 13%" },
  PE: { code: "PE", name: "Prince Edward Island", gstHstRate: 0.15, label: "HST 15%" },
  QC: { code: "QC", name: "Quebec", gstHstRate: 0.05, label: "GST 5%", separateProvincialTax: "QST 9.975% applies and is not computed here" },
  SK: { code: "SK", name: "Saskatchewan", gstHstRate: 0.05, label: "GST 5%", separateProvincialTax: "Saskatchewan PST 6% may apply" },
  YT: { code: "YT", name: "Yukon", gstHstRate: 0.05, label: "GST 5%" },
};

/** CRA small-supplier threshold for mandatory GST/HST registration. */
export const SMALL_SUPPLIER_THRESHOLD = 30_000;

// ---------------------------------------------------------------------------
// Roles: what a person costs us, and what we charge for them
// ---------------------------------------------------------------------------

export interface Role {
  key: string;
  title: string;
  /** What this person costs the company per productive hour, fully loaded:
   *  salary or contractor rate, employer payroll contributions, benefits,
   *  tooling, and an allowance for non-billable time. */
  internalCostPerHour: number;
  /** Published client rate range, per hour. */
  billLow: number;
  billHigh: number;
  seniority: "principal" | "senior" | "mid" | "support";
}

/**
 * Internal cost figures assume an Ontario employer and include the employer
 * side of CPP and EI, plus vacation accrual, benefits, hardware, software and
 * an assumption of roughly 70% billable utilization. Replace with your real
 * numbers once you have payroll running — these are planning defaults.
 */
export const ROLES: Role[] = [
  { key: "principal-architect", title: "Principal Architect", internalCostPerHour: 118, billLow: 210, billHigh: 260, seniority: "principal" },
  { key: "senior-devops", title: "Senior DevOps / SRE / Platform Engineer", internalCostPerHour: 86, billLow: 155, billHigh: 195, seniority: "senior" },
  { key: "cloud-security", title: "Cloud Security / DevSecOps Engineer", internalCostPerHour: 92, billLow: 165, billHigh: 205, seniority: "senior" },
  { key: "senior-data", title: "Senior Data Engineer", internalCostPerHour: 84, billLow: 150, billHigh: 190, seniority: "senior" },
  { key: "dbre", title: "Database Reliability Engineer", internalCostPerHour: 89, billLow: 160, billHigh: 200, seniority: "senior" },
  { key: "data-analyst", title: "Data Analyst / BI Engineer", internalCostPerHour: 58, billLow: 105, billHigh: 140, seniority: "mid" },
  { key: "delivery-manager", title: "Delivery / Engagement Manager", internalCostPerHour: 72, billLow: 130, billHigh: 165, seniority: "support" },
];

export const roleByKey = (key: string) => ROLES.find((r) => r.key === key);

// ---------------------------------------------------------------------------
// Effort model
// ---------------------------------------------------------------------------

export interface EffortLine {
  roleKey: string;
  hours: number;
  /** Multiplier for the published rate, 1.0 = list. Below 1.0 needs approval. */
  rateFactor?: number;
}

export interface EffortResult {
  lines: Array<{
    roleKey: string;
    title: string;
    hours: number;
    rateLow: number;
    rateHigh: number;
    internalCost: number;
    revenueLow: number;
    revenueHigh: number;
  }>;
  totalHours: number;
  internalCost: number;
  revenueLow: number;
  revenueHigh: number;
  grossMarginLowPct: number;
  grossMarginHighPct: number;
}

export function computeEffort(lines: EffortLine[]): EffortResult {
  const resolved = lines
    .map((l) => {
      const role = roleByKey(l.roleKey);
      if (!role) return null;
      const factor = l.rateFactor ?? 1;
      const rateLow = role.billLow * factor;
      const rateHigh = role.billHigh * factor;
      return {
        roleKey: role.key,
        title: role.title,
        hours: l.hours,
        rateLow,
        rateHigh,
        internalCost: role.internalCostPerHour * l.hours,
        revenueLow: rateLow * l.hours,
        revenueHigh: rateHigh * l.hours,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const totalHours = resolved.reduce((a, l) => a + l.hours, 0);
  const internalCost = resolved.reduce((a, l) => a + l.internalCost, 0);
  const revenueLow = resolved.reduce((a, l) => a + l.revenueLow, 0);
  const revenueHigh = resolved.reduce((a, l) => a + l.revenueHigh, 0);

  return {
    lines: resolved,
    totalHours,
    internalCost,
    revenueLow,
    revenueHigh,
    grossMarginLowPct: revenueLow > 0 ? ((revenueLow - internalCost) / revenueLow) * 100 : 0,
    grossMarginHighPct: revenueHigh > 0 ? ((revenueHigh - internalCost) / revenueHigh) * 100 : 0,
  };
}

/** Below this, an engagement is not worth taking at the quoted price. */
export const MIN_ACCEPTABLE_MARGIN_PCT = 35;

// ---------------------------------------------------------------------------
// Cloud run-rate estimation
// ---------------------------------------------------------------------------

export type CloudProvider = "aws" | "azure" | "gcp";
export type WorkloadSize = "small" | "medium" | "large" | "xlarge";

export interface CloudEstimateInput {
  provider: CloudProvider;
  size: WorkloadSize;
  environments: number;
  /** Managed Kubernetes control plane(s). */
  kubernetes?: boolean;
  /** Managed relational database with a standby. */
  managedDatabase?: boolean;
  /** Self-hosted metrics, logs and traces retention. */
  observability?: boolean;
  /** Multi-AZ or zone-redundant everything. */
  highAvailability?: boolean;
  /** Apply a commitment discount (Savings Plans / Reserved / CUD). */
  commitmentTermYears?: 0 | 1 | 3;
}

export interface CloudEstimate {
  monthlyLow: number;
  monthlyHigh: number;
  annualLow: number;
  annualHigh: number;
  breakdown: Array<{ item: string; low: number; high: number }>;
  notes: string[];
}

/**
 * Planning-grade estimate, not a bill. Public list pricing across the three
 * providers lands within roughly 15% of each other for equivalent compute, so
 * the provider mainly shifts the notes rather than the arithmetic.
 */
export function estimateCloud(input: CloudEstimateInput): CloudEstimate {
  const sizeBand: Record<WorkloadSize, [number, number]> = {
    small: [400, 900],
    medium: [1200, 2800],
    large: [3500, 8000],
    xlarge: [9000, 22000],
  };

  const breakdown: CloudEstimate["breakdown"] = [];
  const notes: string[] = [];

  const [cLow, cHigh] = sizeBand[input.size];
  breakdown.push({ item: "Compute and networking", low: cLow, high: cHigh });

  if (input.kubernetes) {
    const perCluster = input.provider === "gcp" ? 74 : 73; // managed control plane
    breakdown.push({
      item: `Managed Kubernetes control plane × ${input.environments}`,
      low: perCluster * input.environments,
      high: perCluster * input.environments,
    });
    notes.push("Control-plane charges are per cluster per environment and are easy to forget in a first budget.");
  }

  if (input.managedDatabase) {
    const [dLow, dHigh] =
      input.size === "small" ? [180, 420] : input.size === "medium" ? [520, 1400] : input.size === "large" ? [1600, 4200] : [4500, 11000];
    breakdown.push({ item: "Managed database with standby", low: dLow, high: dHigh });
  }

  if (input.observability) {
    const [oLow, oHigh] =
      input.size === "small" ? [90, 240] : input.size === "medium" ? [260, 700] : input.size === "large" ? [800, 2100] : [2200, 5500];
    breakdown.push({ item: "Metrics, logs and trace retention", low: oLow, high: oHigh });
    notes.push("Log volume is the usual source of budget overrun. Set retention and sampling on day one, not after the first invoice.");
  }

  // Non-production environments are cheaper than production.
  const extraEnvs = Math.max(0, input.environments - 1);
  if (extraEnvs > 0) {
    const factor = 0.45 * extraEnvs;
    breakdown.push({
      item: `Non-production environments × ${extraEnvs}`,
      low: Math.round(cLow * factor),
      high: Math.round(cHigh * factor),
    });
    notes.push("Non-production is costed at roughly 45% of production, assuming it is scaled down or switched off out of hours.");
  }

  let low = breakdown.reduce((a, b) => a + b.low, 0);
  let high = breakdown.reduce((a, b) => a + b.high, 0);

  if (input.highAvailability) {
    low = Math.round(low * 1.55);
    high = Math.round(high * 1.75);
    notes.push("Multi-zone redundancy typically adds 55–75%, mostly in duplicated compute and cross-zone data transfer.");
  }

  const term = input.commitmentTermYears ?? 0;
  if (term === 1) {
    low = Math.round(low * 0.75);
    high = Math.round(high * 0.8);
    notes.push("Assumes a 1-year commitment on steady-state compute, around 20–25% off list.");
  } else if (term === 3) {
    low = Math.round(low * 0.58);
    high = Math.round(high * 0.65);
    notes.push("Assumes a 3-year commitment, around 35–42% off list. Only commit to a baseline you are confident in.");
  } else {
    notes.push("Priced at on-demand list. A 1-year commitment on the steady-state baseline usually removes 20–25% immediately.");
  }

  notes.push("Planning estimate only. Real spend depends on traffic, data transfer and retention, and should be validated against a month of actual usage.");

  return {
    monthlyLow: low,
    monthlyHigh: high,
    annualLow: low * 12,
    annualHigh: high * 12,
    breakdown,
    notes,
  };
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface TimelineInput {
  totalHours: number;
  /** Concurrent engineers actually assignable. */
  teamSize: number;
  /** Billable hours per engineer per week. 30 is realistic; 40 is fiction. */
  hoursPerWeek?: number;
  /** Client-side review, security sign-off, change windows. */
  clientDependencyWeeks?: number;
  accelerated?: boolean;
}

export interface TimelineResult {
  workingWeeks: number;
  elapsedWeeks: number;
  elapsedWeeksOptimistic: number;
  elapsedWeeksPessimistic: number;
  startableFrom: string;
  notes: string[];
}

export function computeTimeline(input: TimelineInput): TimelineResult {
  const hoursPerWeek = input.hoursPerWeek ?? 30;
  const team = Math.max(1, input.teamSize);

  // Brooks tax: coordination overhead grows with team size.
  const coordination = 1 + Math.max(0, team - 1) * 0.08;
  const effectiveCapacity = (team * hoursPerWeek) / coordination;

  const workingWeeks = Math.ceil(input.totalHours / effectiveCapacity);
  const dependency = input.clientDependencyWeeks ?? Math.ceil(workingWeeks * 0.2);

  let elapsed = workingWeeks + dependency;
  const notes: string[] = [];

  if (input.accelerated) {
    elapsed = Math.max(2, Math.ceil(elapsed * 0.75));
    notes.push("Accelerated delivery compresses elapsed time by about 25% and carries a rate uplift, because it means overtime and parallel work with more rework risk.");
  }

  notes.push(`Assumes ${hoursPerWeek} billable hours per engineer per week. Quoting 40 is how timelines slip.`);
  notes.push(`Includes ${dependency} week(s) for client-side review, security sign-off and change windows.`);
  if (team > 4) {
    notes.push("Above four concurrent engineers, coordination overhead outweighs added capacity on most platform work.");
  }

  const start = new Date();
  start.setDate(start.getDate() + 14);

  return {
    workingWeeks,
    elapsedWeeks: elapsed,
    elapsedWeeksOptimistic: Math.max(1, Math.round(elapsed * 0.85)),
    elapsedWeeksPessimistic: Math.round(elapsed * 1.35),
    startableFrom: start.toISOString().slice(0, 10),
    notes,
  };
}

// ---------------------------------------------------------------------------
// Quote and invoice arithmetic
// ---------------------------------------------------------------------------

export interface LineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxable?: boolean;
}

export interface Totals {
  subtotal: number;
  taxableSubtotal: number;
  taxRate: number;
  taxLabel: string;
  tax: number;
  total: number;
  separateProvincialTaxNote?: string;
}

export function computeTotals(items: LineItem[], province: ProvinceCode, registered: boolean): Totals {
  const round2 = (n: number) => Math.round(n * 100) / 100;

  const subtotal = round2(items.reduce((a, i) => a + i.quantity * i.unitPrice, 0));
  const taxableSubtotal = round2(
    items.filter((i) => i.taxable !== false).reduce((a, i) => a + i.quantity * i.unitPrice, 0),
  );

  const treatment = TAX_TABLE[province];

  // An unregistered supplier must not charge GST/HST.
  const rate = registered ? treatment.gstHstRate : 0;
  const tax = round2(taxableSubtotal * rate);

  return {
    subtotal,
    taxableSubtotal,
    taxRate: rate,
    taxLabel: registered ? treatment.label : "Not registered for GST/HST",
    tax,
    total: round2(subtotal + tax),
    separateProvincialTaxNote: treatment.separateProvincialTax,
  };
}

/**
 * Everything the Excise Tax Act requires on an invoice where the buyer will
 * claim an input tax credit. For supplies of $150 or more the supplier's
 * GST/HST registration number and the tax amount (or the rate) are mandatory.
 */
export function invoiceRequiredFields(total: number): string[] {
  const base = [
    "Supplier's legal business name",
    "Invoice date",
    "Total amount payable",
  ];
  if (total >= 30) {
    base.push("Supplier's GST/HST registration number", "Total GST/HST charged, or a statement that it is included");
  }
  if (total >= 150) {
    base.push(
      "Recipient's name or trading name",
      "Terms of payment",
      "A description sufficient to identify each supply",
    );
  }
  return base;
}
