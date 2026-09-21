/**
 * Suggested questions for the assistant panel.
 *
 * Kept out of the component so a test can import them. Every chip here is an
 * advertisement: putting a question in front of a visitor is a promise that
 * we answer it well. `scripts/chip-test.ts` fires all of them at the live
 * router and fails if any lands on the "I am not certain" fallback, so a chip
 * can never quietly start advertising a question the assistant fumbles.
 *
 * Chosen for the page the visitor is standing on. A generic set wastes the
 * most valuable real estate in the panel: someone on /security wants to know
 * about access and evidence, someone on /pricing wants to know what a number
 * buys, and the same three questions serve neither.
 */

export const OPENERS = [
  "What does a Kubernetes build cost?",
  "Can you migrate us off on-premises?",
  "How do you price?",
  "What is the smallest way to start?",
  "How do you secure our infrastructure?",
  "Do we get locked in?",
  "Can you migrate our database?",
  "Why should we trust a new firm?",
];

export const PAGE_CHIPS: Record<string, string[]> = {
  "/": [
    "What is the smallest way to start?",
    "What does a Kubernetes build cost?",
    "Why should we trust a new firm?",
  ],
  "/services": [
    "Can you migrate us off on-premises?",
    "Do you use ArgoCD or Flux for gitops?",
    "Can you migrate our database?",
  ],
  "/pricing": [
    "What does an audit cost?",
    "Can we spread the payments?",
    "Do you charge GST?",
  ],
  "/security": [
    "How do you manage secrets in Kubernetes?",
    "Our data must stay in Canada",
    "Can you complete our security questionnaire?",
  ],
  "/trust": [
    "What happens if you go out of business?",
    "What are your insurance limits?",
    "Do we get locked in?",
  ],
  "/work": [
    "Have you worked in financial services?",
    "Do you subcontract any work offshore?",
    "How are you different from a large consultancy?",
  ],
  "/about": [
    "Who would actually do the work?",
    "How do you secure our infrastructure?",
    "Why should we trust a new firm?",
  ],
  "/story": [
    "Why should we trust a new firm?",
    "What is the smallest way to start?",
    "How are you different from a large consultancy?",
  ],
  "/contact": [
    "What happens on the first call?",
    "How do you price?",
    "When could you start?",
  ],
};

/**
 * Questions to offer after a topic has come up, so the next chip follows the
 * thread instead of changing the subject.
 *
 * Order matters: the first pattern that matches wins, so the narrow technical
 * subjects sit above the broad commercial ones.
 */
export const FOLLOW_UPS: { match: RegExp; chips: string[] }[] = [
  {
    match: /kubernetes|k8s|eks|aks|gke|openshift|cluster/i,
    chips: [
      "How long would a Kubernetes build take?",
      "Do you use ArgoCD or Flux for gitops?",
      "How do you manage secrets in Kubernetes?",
    ],
  },
  {
    match: /terraform|terragrunt|\biac\b|infrastructure as code|ansible/i,
    chips: [
      "Do you use terraform modules or terragrunt?",
      "How do you handle terraform state locking?",
      "Do you write the terraform or do we?",
    ],
  },
  {
    match: /observab|monitor|prometheus|grafana|datadog|\bslo\b|alert/i,
    chips: [
      "What is your approach to SLOs?",
      "Prometheus or Datadog?",
      "What does observability cost?",
    ],
  },
  {
    match: /migrat|on-?prem|lift and shift|move to (aws|azure|gcp)/i,
    chips: [
      "How much is a migration?",
      "Can you migrate our database?",
      "How long does a migration take?",
    ],
  },
  {
    match: /secur|vulnerab|complian|soc ?2|pentest|breach|pipeda/i,
    chips: [
      "Can you complete our security questionnaire?",
      "How do you manage secrets in Kubernetes?",
      "Our data must stay in Canada",
    ],
  },
  {
    match: /contract|\bnda\b|\bmsa\b|legal|sign|procure|insur/i,
    chips: [
      "What are your insurance limits?",
      "We need net 60 payment terms",
      "What happens if you go out of business?",
    ],
  },
  {
    // "What is your hourly rate?" is a money question that contains none of
    // the obvious money words, so rate/hourly/retainer/discount are here too.
    match: /cost|price|pricing|budget|\$|quote|\bfees?\b|invoice|\bpay\b|\brates?\b|hourly|per hour|retainer|discount|expensive|cheap/i,
    chips: [
      "Can we spread the payments?",
      "What does an audit cost?",
      "Will our cloud bill go up or down?",
    ],
  },
  {
    match: /team|who would|people|engineer|resource|staff|offshore/i,
    chips: [
      "Who would actually do the work?",
      "Do you subcontract any work offshore?",
      "How are you different from a large consultancy?",
    ],
  },
];

/** The three best chips for where we are and what was just said. */
export function chipsFor(pathname: string | null, lastMessage?: string): string[] {
  if (lastMessage) {
    const hit = FOLLOW_UPS.find((f) => f.match.test(lastMessage));
    if (hit) return hit.chips;
  }
  return PAGE_CHIPS[pathname ?? "/"] ?? OPENERS.slice(0, 3);
}

/**
 * Chips that should *do* something rather than ask something.
 *
 * Agents suggest follow-ups like "Book a scoping call" and "Send us an NDA".
 * Sending those as chat messages makes the assistant describe the thing the
 * visitor just asked to do — an extra turn, and a small betrayal of intent.
 * When a suggestion matches one of these, the chip runs the action instead.
 */
export const CHIP_ACTIONS: { match: RegExp; action: "call" | "nda" | "audit" }[] = [
  { match: /^(book|schedule|arrange).*(call|meeting)|have a human call me|talk to a person|speak to (someone|a human)/i, action: "call" },
  { match: /\bnda\b|non-disclosure/i, action: "nda" },
  { match: /^book the audit$|^request the audit$/i, action: "audit" },
];

/** The action a chip should run, or null if it is an ordinary question. */
export function actionForChip(label: string): "call" | "nda" | "audit" | null {
  return CHIP_ACTIONS.find((a) => a.match.test(label.trim()))?.action ?? null;
}

/** Every distinct chip the panel can show. The test iterates this. */
export function allChips(): string[] {
  return [
    ...new Set([...OPENERS, ...Object.values(PAGE_CHIPS).flat(), ...FOLLOW_UPS.flatMap((f) => f.chips)]),
  ];
}
