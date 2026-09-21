/**
 * Retrieval over the catalogue. Deliberately simple and deterministic: the
 * assistant must never invent a price, so every figure it quotes is read
 * straight out of `catalogue.ts` rather than generated.
 */

import { services, retainers, rateCard, caseStudies, faq, auditOffer } from "./catalogue";
import { company, currencyFromDollars as money } from "./company";
import { displayClient, PRIOR_WORK_DISCLAIMER_SHORT } from "./attribution";

export interface KnowledgeEntry {
  key: string;
  title: string;
  terms: string;
  answer: string;
  /** Agent best placed to continue this line of conversation. */
  route?: string;
  /**
   * Tie-breaker. A hand-written entry answers a question better than a service
   * description or a generic FAQ that happens to share a word, so it outranks
   * them when scores are close. Service entries 1.0, FAQ 0.85, curated 1.2.
   */
  weight?: number;
}

function serviceEntry(s: (typeof services)[number]): KnowledgeEntry {
  const price =
    s.priceLow === s.priceHigh
      ? `${money(s.priceLow)}${s.priceNote ? ` ${s.priceNote}` : ""}`
      : `${money(s.priceLow)} to ${money(s.priceHigh)}${s.priceNote ? ` ${s.priceNote}` : ""}`;

  return {
    key: s.id,
    title: s.name,
    terms: [s.name, s.blurb, s.stack.join(" "), s.includes.join(" "), s.category]
      .join(" ")
      .toLowerCase(),
    route: "pricing",
    answer: [
      `**${s.name}**`,
      s.blurb,
      "",
      `**Typical price:** ${price} CAD, excluding applicable GST/HST.`,
      `**Typical duration:** ${s.durationLabel}`,
      "",
      "That normally includes:",
      ...s.includes.slice(0, 4).map((i) => `• ${i}`),
    ].join("\n"),
  };
}

export const knowledge: KnowledgeEntry[] = [
  ...services.map(serviceEntry),

  ...faq.map((f, i) => ({
    key: `faq-${i}`,
    title: f.q,
    terms: `${f.q} ${f.a}`.toLowerCase(),
    answer: f.a,
    weight: 0.85,
  })),

  ...caseStudies.map((c) => ({
    key: `case-${c.slug}`,
    title: displayClient(c),
    terms: [c.client, c.sector, c.headline, c.problem, c.stack.join(" ")].join(" ").toLowerCase(),
    route: "delivery",
    answer: [
      `**${displayClient(c)}** — ${c.sector}, ${c.period}`,
      "",
      c.headline,
      "",
      ...c.results.map(([v, l]) => `• **${v}** — ${l}`),
    ].join("\n"),
  })),

  {
    key: "audit",
    title: "Fixed-price infrastructure audit",
    terms:
      "audit assessment review health check small start pilot cheap first step try you out low risk trial",
    route: "qualifier",
    answer: [
      `The smallest way to start is a **fixed-price infrastructure audit — ${money(
        auditOffer.price,
      )} CAD, ${auditOffer.durationLabel}**.`,
      "",
      auditOffer.blurb,
      "",
      ...auditOffer.includes.map((i) => `• ${i}`),
    ].join("\n"),
    weight: 1.2,
  },

  {
    key: "retainers",
    title: "Ongoing support",
    terms:
      "retainer support ongoing monthly managed maintenance on-call sla 24/7 aftercare after delivery keep running",
    route: "pricing",
    answer: [
      "Three ongoing support tiers, all CAD per month excluding tax:",
      "",
      ...retainers.map((r) => `• **${r.name}** — ${money(r.price)}${r.unit}. ${r.blurb}`),
    ].join("\n"),
    weight: 1.2,
  },

  {
    key: "rates",
    title: "Hourly rate card",
    terms:
      "hourly rate rates day rate price list pricing prices published price sheet quote card time and materials staff augmentation contractor cost per hour how much per hour",
    route: "pricing",
    answer: [
      "For open-ended or advisory work we bill time-and-materials against this rate card (CAD per hour, excluding tax):",
      "",
      ...rateCard.slice(0, 5).map((r) => `• **${r.role}** — ${r.rate}`),
      "",
      "Wherever the scope can be pinned down we prefer a fixed price, so the delivery risk sits with us rather than you.",
    ].join("\n"),
    weight: 1.2,
  },

  {
    key: "process",
    title: "Our process — how engagements run",
    terms:
      "process how do you work engagement steps onboarding what happens methodology start kickoff delivery approach",
    route: "delivery",
    answer: [
      "Five steps, always the same:",
      "",
      "• **1 · Scoping call** — 30 minutes, free.",
      "• **2 · Discovery** — we read the actual repository and infrastructure before proposing anything.",
      "• **3 · Fixed proposal** — scope, price, timeline, named engineers, written acceptance criteria.",
      "• **4 · Delivery** — in your repositories, in weekly increments you can see.",
      "• **5 · Handover** — documentation and recorded sessions. A retainer afterwards is optional, never required.",
    ].join("\n"),
    weight: 1.2,
  },

  {
    key: "clients",
    title: "Who we have worked with",
    terms:
      "clients worked with who have you customers references referees portfolio track record past work previous experience logos case studies examples proof",
    route: "delivery",
    answer: [
      "Production work delivered across four sectors:",
      "",
      ...caseStudies.map((c) => `• **${displayClient(c)}** (${c.sector}, ${c.period}) — ${c.headline}`),
      "",
      PRIOR_WORK_DISCLAIMER_SHORT,
      "",
      "Public repositories are also open to read, and client references can be arranged once we are past a first call.",
    ].join("\n"),
    weight: 1.2,
  },

  {
    key: "team",
    title: "Team and capacity",
    terms:
      "team size how many people capacity strength engineers staffing pod squad resources bench seniority company big small large headcount employees staff firm organization organization",
    route: "delivery",
    answer: [
      "Engagements are staffed as a pod sized to the work, from a single senior engineer up to a full delivery team of architect, engineers and a delivery manager.",
      "",
      "The named engineers on your proposal are the engineers who do the work. We do not bid with senior people and then staff with juniors, and you meet the team before you sign anything.",
      "",
      "Founding experience covers eight-plus years of production infrastructure across banking, aviation, insurance and AI research — including leading a four-engineer team through a 180-service AWS migration and an eight-person analytics and engineering team.",
    ].join("\n"),
    weight: 1.2,
  },

  {
    key: "security",
    title: "How we secure your infrastructure",
    terms:
      "security secure vulnerability vulnerabilities protect hardening breach hack attack threat iam least privilege secrets encryption scanning pentest exposure risk safe",
    route: "delivery",
    answer: [
      "Two separate things, and most suppliers only answer the first.",
      "",
      "**What we build in:** least-privilege identity with no long-lived keys, private-by-default networking with deny-first network policies, nothing confidential in a repository, pinned dependencies with SBOMs and image signing, SAST/DAST/IaC scanning as blocking pipeline gates, tested and timed restores, and policy-as-code so a control cannot quietly decay.",
      "",
      "**How we behave while we have access:** access through your identity provider with MFA and time-boxed to the engagement, no agent ever applies a change to your environment, nothing destructive without written sign-off, and a mutual NDA before discovery.",
      "",
      "Full detail on the security page, including the list of things we will not do at any price.",
    ].join("\n"),
    weight: 1.2,
  },

  {
    key: "clouds",
    title: "Which clouds we work with",
    terms:
      "aws amazon azure microsoft gcp google cloud platform provider multi-cloud hybrid which cloud do you support work with oracle cloud alibaba digitalocean",
    route: "delivery",
    weight: 1.2,
    answer: [
      "All three major providers, in production:",
      "",
      "• **AWS** — EC2, EKS, S3, RDS, Lambda, Glue, Athena, SageMaker, MSK, EMR, Lake Formation, EventBridge, CodeDeploy, ECR, IAM and SCPs",
      "• **Azure** — AKS, Entra ID, Azure Monitor, Key Vault, Application Gateway, Virtual WAN",
      "• **GCP** — GKE and the equivalent networking, identity and data services",
      "",
      "We do not push a preferred provider. Which cloud you run on is your decision, and we will give you the trade-offs rather than a recommendation dressed up as a fact.",
    ].join("\n"),
  },

  {
    key: "kubernetes-distros",
    title: "Which Kubernetes distributions we support",
    terms:
      "kubernetes distribution eks aks gke openshift rosa okd kubeadm kind k3s rancher tanzu self-managed managed cluster flavour vanilla upstream",
    route: "delivery",
    weight: 1.2,
    answer: [
      "Managed and self-managed, both:",
      "",
      "• **Managed** — EKS, AKS, GKE, and Red Hat OpenShift including ROSA",
      "• **Self-managed** — kubeadm for full control, KIND for local and pre-production validation",
      "",
      "Around them: Helm and Kustomize, Karpenter and Cluster Autoscaler, KEDA for event-driven scaling, Istio or Cilium for the mesh, and cert-manager for TLS.",
      "",
      "A Kubernetes platform build is $25,000–$55,000 CAD over 4–8 weeks, whichever distribution you choose.",
    ].join("\n"),
  },

  {
    key: "compliance",
    title: "Compliance frameworks we map to",
    terms:
      "compliance framework soc2 soc 2 iso 27001 pci dss pci-dss hipaa nist cis benchmark audit auditor evidence certification attestation regulated regulator control mapping pipeda privacy law",
    route: "delivery",
    weight: 1.2,
    answer: [
      "We map controls to whichever framework you are held to, and produce evidence an assessor will accept:",
      "",
      "• **CIS Benchmarks** — hardening baselines for cloud accounts, Kubernetes and operating systems",
      "• **SOC 2** — control mapping and evidence collection for Type I then Type II readiness",
      "• **ISO 27001** — Annex A coverage, with the technical controls implemented rather than described",
      "• **PCI-DSS** — segmentation, key management, logging and access control for in-scope environments",
      "• **PIPEDA** — safeguards proportionate to sensitivity, enforced retention, breach records",
      "",
      "Stated plainly: we are not ourselves SOC 2 or ISO 27001 certified yet. We implement and evidence those controls for clients, and our own certification is on the roadmap.",
    ].join("\n"),
  },

  {
    key: "insurance",
    title: "Insurance, procurement and vendor onboarding",
    terms:
      "insurance insured liability coverage certificate indemnity errors omissions e&o professional cyber commercial general msa paperwork procurement procure vendor vendors supplier suppliers approved vendor list approval process onboarding process preferred supplier onboarding due diligence questionnaire prequalification compliance pack accreditation registration process",
    route: "delivery",
    weight: 1.2,
    answer: [
      "We carry commercial general liability, professional liability (errors and omissions) and cyber coverage, at levels appropriate to the engagement. **Certificates are provided on request** — we will send them without being chased.",
      "",
      "On paperwork: we sign client master services agreements, non-disclosure agreements and data processing agreements, and we are comfortable with standard Canadian procurement terms. Your paper or ours — we have no preference.",
    ].join("\n"),
  },

  {
    key: "billing-terms",
    title: "Payment terms and billing",
    terms:
      "payment terms billing invoice invoicing pay deposit milestone net 30 net30 net 60 upfront schedule purchase order po number currency eft cheque wire how do we pay when do we pay instalment",
    route: "billing",
    weight: 1.2,
    answer: [
      "**Fixed-scope engagements:** 40% on signature, 30% at the midpoint milestone, 30% on acceptance. Each invoice names the milestone and its acceptance criteria.",
      "",
      "**Time-and-materials:** invoiced monthly in arrears against a timesheet you can inspect, with a not-to-exceed cap agreed up front that we stop at.",
      "",
      "**Retainers:** invoiced monthly in advance.",
      "",
      "Terms are net 30 days, 18% per annum on overdue amounts, EFT or cheque in Canadian dollars. We carry a purchase order number on the invoice where your procurement requires it.",
      "",
      "_Our banking details appear only on an issued invoice and do not change mid-engagement. If you ever receive a message claiming they have, telephone us before acting on it._",
    ].join("\n"),
  },

  {
    key: "contact-details",
    title: "Phone number and email address",
    terms:
      "phone number telephone call ring email address mail reach contact details how do i contact get in touch speak book a call schedule meeting appointment consultation",
    route: "sales",
    weight: 1.25,
    answer: [
      `**Phone:** ${company.phone}`,
      `**Email:** ${company.email}`,
      `**Hours:** ${company.hours}, with ${company.onCall}`,
      `**Based in:** ${company.city}, ${company.regionName}`,
      "",
      "The free 30-minute scoping call is the usual starting point — no charge, no obligation, and you leave with an indicative range either way. The contact form takes about thirty seconds and someone replies within one business day.",
    ].join("\n"),
  },

  {
    key: "faster",
    title: "Accelerated delivery",
    terms:
      "faster quicker sooner accelerate accelerated rush urgent asap speed up expedite crash deadline tight timeline hurry emergency immediately",
    route: "delivery",
    weight: 1.2,
    answer: [
      "Usually yes, with a trade-off stated honestly.",
      "",
      "Accelerated delivery compresses elapsed time by roughly 25% and carries a rate uplift, because it means more engineers working in parallel, some overtime, and a higher rework risk. We will tell you when compressing further would simply increase the chance of a failed cutover rather than the speed of a successful one.",
      "",
      "What genuinely speeds things up at no extra cost: fast turnaround on your side for access requests, reviews and change-window approvals. Client-side dependencies are the most common cause of a slipped date.",
    ].join("\n"),
  },

  {
    key: "in-house",
    title: "Doing it in-house instead",
    terms:
      "in-house internally ourselves own team hire someone recruit permanent employee instead of consultant why not do it build internally diy",
    route: "sales",
    weight: 1.2,
    answer: [
      "Often you can, and if that is true we would rather say so than sell you something.",
      "",
      "Hiring makes more sense when the work is permanent and ongoing. We make more sense when it is a bounded project your team does not do often enough to be fast at — a migration, a first Kubernetes platform, an observability build — or when you need it done while your team keeps the current thing running.",
      "",
      "A useful test: if you would have to hire someone to do this and then find work for them afterwards, it is probably a project rather than a role.",
      "",
      "A middle path we do regularly: we design and review, your engineers build. Slower and cheaper, and your team ends up genuinely owning it.",
    ].join("\n"),
  },

  {
    key: "why-trust",
    title: "How do we know we can trust you",
    terms:
      "trust trustworthy credible proof evidence reference referee testimonial reputation new firm startup risky how do we know why should we verify check guarantee",
    route: "delivery",
    weight: 1.25,
    answer: [
      "A fair question for any new supplier, so here is how to check rather than take our word:",
      "",
      "• **Read the code.** Public repositories covering CI/CD reference architectures, Grafana dashboards, Terraform modules and Kubernetes operators. Original work, not course projects.",
      "• **Verify the certifications.** CKA, AZ-203 and AZ-900 are independently checkable — ask for the credential IDs.",
      "• **Check the track record.** Greater Toronto Airports Authority, Citibank, RSA Insurance, Rugby Canada. References arranged once we are past a first call.",
      "• **Test us cheaply.** The $4,500 audit needs read-only access and five business days. You keep the report whether or not you continue.",
      "",
      "We are a new firm with experienced people, and we would rather say that plainly than pretend to be ten years old.",
    ].join("\n"),
  },

  {
    key: "ai-safety",
    title: "Will an AI agent touch our systems",
    terms:
      "ai agent automation bot touch our production apply changes autonomous unsupervised robot llm gpt claude safe control oversight human in the loop approve",
    route: "delivery",
    weight: 1.25,
    answer: [
      "**No. No agent applies a change to your environment.** That is enforced in our tooling, not just promised.",
      "",
      "Agents do the reading, drafting, decomposition and documentation — architecture options, Terraform, manifests, pipeline definitions, runbooks. They produce plans and diffs.",
      "",
      "A named human executes every mutating change, and every outward-facing action is queued for explicit approval with who decided, when, and why recorded against it. We will show you the actual approval screen, not a diagram of it.",
      "",
      "The rule, stated the way we state it internally: **agents propose, humans dispose, the system executes.**",
    ].join("\n"),
  },

  {
    key: "tax",
    title: "GST HST and sales tax",
    terms:
      "gst hst pst qst sales tax taxes taxable charge do you charge vat invoice tax registration number cra revenue agency exempt",
    route: "billing",
    weight: 1.25,
    answer: [
      "Yes, once registered — and we will show the registration number on every invoice.",
      "",
      "• **Ontario clients:** 13% HST",
      "• **Other provinces:** the rate is set by the place-of-supply rules for your business address — 5% GST in Alberta, British Columbia and the territories, 15% HST in New Brunswick, Newfoundland and PEI, 14% in Nova Scotia",
      "• **Quebec:** GST plus QST, assessed case by case",
      "",
      "All published prices exclude tax. Registration is in progress; until the number is issued we do not charge GST/HST, because charging tax you are not registered to collect is an offence.",
    ].join("\n"),
  },

  {
    key: "clearance",
    title: "Security clearance and public sector",
    terms:
      "clearance cleared reliability status secret confidential security screening vetting government public sector federal provincial municipal crown corporation rcmp psc",
    route: "delivery",
    weight: 1.25,
    answer: [
      "The founder is **eligible for Canadian Reliability Status**, which is the screening level most federal and provincial engagements require.",
      "",
      "Eligible means the screening can be initiated by a sponsoring department — clearance is granted to a person for a specific engagement, not held in advance by a supplier. If your procurement needs it, say so early: the process takes time and is worth starting before the contract is signed.",
      "",
      "Prior delivery includes critical aviation infrastructure and banking under regulated change control, both of which involved comparable vetting.",
    ].join("\n"),
  },

  {
    key: "subcontracting",
    title: "Subcontracting and where the work is done",
    terms:
      "subcontract subcontracting subcontractor outsource outsourcing offshore nearshore third party who does the work where is the work done onshore local",
    route: "delivery",
    weight: 1.25,
    answer: [
      "The named engineers on your proposal are the engineers who do the work, and you meet them before you sign. We do not bid with senior people and staff with juniors.",
      "",
      "Where we bring in a specialist subcontractor for a particular workstream, we tell you before it happens, they are bound by the same confidentiality and IP terms, and the accountability stays with us.",
      "",
      "Delivery is from **Toronto, Ontario**. If your procurement requires all work performed in Canada, or by Canadian residents, we can commit to that in the agreement.",
    ].join("\n"),
  },

  {
    key: "change-control",
    title: "Change control and maintenance windows",
    terms:
      "change control window freeze blackout cab change advisory board approval itil ticket servicenow release window maintenance window regulated change out of hours weekend cutover",
    route: "delivery",
    weight: 1.25,
    answer: [
      "We work inside your change process rather than around it. That is normal for us — the aviation and banking work was all delivered under formal change control.",
      "",
      "• Every change comes with a written plan, a rollback that has been tested, and a defined blast radius",
      "• We attend your change advisory board and provide the evidence it asks for",
      "• Out-of-hours and weekend cutovers are expected on migration work and priced in, not treated as an extra",
      "• Freeze periods are planned around from the start, not discovered in week six",
      "",
      "If your windows are narrow, tell us at scoping — it changes the sequencing more than it changes the price.",
    ].join("\n"),
  },

  {
    key: "getting-started",
    title: "How to start and what happens next",
    terms:
      "start started begin begin kick off kickoff next step next steps what do we do how do we proceed move forward engage onboard sign up get going proposal send me a proposal ready",
    route: "sales",
    weight: 1.25,
    answer: [
      "Three steps, and the first two cost you nothing:",
      "",
      "• **1 · Scoping call, 30 minutes, free.** You describe the problem. We tell you the honest size of it and give you an indicative range before the call ends.",
      "• **2 · Short discovery.** We read the actual repository, cloud accounts and pipeline. Available as a standalone fixed-price audit at $4,500 if you want the findings without committing further.",
      "• **3 · Fixed proposal, within five business days.** Scope, price, timeline, named engineers and written acceptance criteria. You know what 'done' means before anyone starts.",
      "",
      `We can normally start two to three weeks after a signed proposal. To book: use the contact form, or email ${company.email} / call ${company.phone}.`,
    ].join("\n"),
  },

  {
    key: "slo",
    title: "SLOs error budgets and on-call",
    terms:
      "slo slos sli sla service level objective indicator agreement error budget burn rate uptime availability nines on-call oncall rotation paging pager escalation incident response postmortem post-incident mttr mttd",
    route: "delivery",
    weight: 1.25,
    answer: [
      "We define SLIs and SLOs per service, with an error budget policy agreed with the business rather than invented by engineering.",
      "",
      "• **Alerting on burn rate**, not on CPU. A page should mean users are affected.",
      "• **Every alert names a runbook.** An alert without one is noise that trains people to ignore alerts.",
      "• **On-call that people can survive** — rotation, escalation and paging hygiene in PagerDuty or Opsgenie.",
      "• **Blameless post-incident review**, introduced and facilitated, so incidents produce changes rather than blame.",
      "• **Load tested against the SLO targets** with k6 or Gatling before you rely on them.",
      "",
      "The SRE and production readiness engagement is $15,000–$34,000 CAD over 3–6 weeks.",
    ].join("\n"),
  },

  {
    key: "agent-access",
    title: "Access to your accounts",
    terms:
      "access our account aws account azure subscription credentials login give you access permissions admin root fix it now remote hands direct access production access",
    route: "delivery",
    weight: 1.3,
    answer: [
      "Not immediately, and deliberately so.",
      "",
      "Access is granted through **your** identity provider, to a **named individual**, with multi-factor authentication, scoped to the narrowest permissions the work needs and time-boxed to the engagement. We will ask you to revoke it at the end, and remind you if you forget.",
      "",
      "**We never accept credentials by email or chat.** If you receive a message asking for a key, it is not us — telephone the number on this site and check.",
      "",
      "And no automated agent applies a change to your environment. Agents read and draft; a named human executes every mutating change.",
    ].join("\n"),
  },

  {
    key: "lockin",
    title: "Ownership and lock-in",
    terms:
      "lock locked lockin lock-in tied trapped ownership owns code intellectual property leave leaves leaving exit exits vendor handover hand over handoff proprietary source code rights dependent stuck after the project ends finish finished finishes complete completed done delivery ends afterwards",
    route: "delivery",
    answer: [
      "Everything we build lives in **your** repositories and **your** cloud accounts, with documentation and recorded handover sessions. No proprietary wrapper, and nothing only we can operate.",
      "",
      "The test we hold ourselves to: your team should be able to run the platform the day we leave.",
    ].join("\n"),
    weight: 1.2,
  },

  {
    key: "contact",
    title: "Getting in touch",
    terms:
      "contact reach speak talk person human representative someone salesperson",
    route: "sales",
    answer: [
      "The easiest route is the free 30-minute scoping call — no charge, no obligation, and you leave with an indicative range either way.",
      "",
      `• Email: ${company.email}`,
      `• Phone: ${company.phone}`,
      `• ${company.hours}`,
    ].join("\n"),
    weight: 1.2,
  },

  {
    key: "location",
    title: "Canadian, based in Toronto Ontario",
    terms:
      "where based located location canada canadian canadians toronto ontario remote onsite on-site timezone time zone office headquarters incorporated domestic local gta greater toronto area north america",
    route: "concierge",
    answer: [
      "Toronto, Ontario. Most delivery is remote across North American time zones, with on-site available in the Greater Toronto Area for workshops, cutovers and discovery.",
      "",
      "Canadian-incorporated, comfortable with standard Canadian procurement terms, and eligible for Reliability Status clearance work.",
    ].join("\n"),
    weight: 1.2,
  },

  {
    key: "careers",
    title: "Working here",
    terms:
      "job jobs career careers hiring hire vacancy vacancies apply application role roles recruit recruiting employment opening openings position resume cv internship intern interns co-op coop graduate junior",
    route: "hr",
    answer: [
      "We hire senior platform, cloud, data and security engineers in the Greater Toronto Area and remotely across Canada.",
      "",
      "Send a CV and a short note about the most interesting production system you have run. We reply to every application, and we will tell you honestly if there is nothing open.",
    ].join("\n"),
    weight: 1.2,
  },
];

/**
 * Light suffix stripping so "locked", "locking" and "lock" all match, and
 * "migrations" finds "migration". Deliberately not a real stemmer — Porter
 * would collapse words we want kept distinct, and this is matching against a
 * hand-written vocabulary rather than an open corpus.
 */
function stem(word: string): string {
  if (word.length <= 4) return word;
  for (const suffix of ["ing", "ed", "es", "s"]) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 3) {
      return word.slice(0, word.length - suffix.length);
    }
  }
  return word;
}

/**
 * Stopwords. Beyond the usual function words this drops low-signal verbs and
 * placeholder nouns — "get", "thing", "stuff" — which otherwise dominate a
 * short query and drag in whichever entry happens to use them in prose.
 */
const STOPWORDS = new Set(
  (
    // Function words
    "a an the is are am was were be been being do does did can could will would " +
    "should shall may might must have has had of for to in on at by with and or " +
    "but if then than that this these those it its as from about into over under " +
    "i me my we our us you your they them their he she his her who whom whose " +
    "what when where which why how " +
    // Low-signal verbs and placeholders
    "get gets got give gives gave make makes made take takes took put puts go goes " +
    "going come comes want wants need needs like likes use uses using used know " +
    "knows think thinks say says tell tells thing things stuff lot lots way ways " +
    "really just also very much many more most some any all one two please thanks " +
    "hello hi hey ok okay yes no not handle handles offer offers offering provide provides support supports deal deals cover covers help helps looking interested able possible available list"
  ).split(" "),
);

export interface Retrieved {
  entry: KnowledgeEntry;
  score: number;
}

/**
 * Pre-tokenized index.
 *
 * Built once, because substring matching against raw term strings produces
 * false positives that are hard to see and easy to ship: "get" matches inside
 * "budget", "ci" matches inside "specific". Matching whole tokens, plus stems
 * and adjacent pairs, removes that entirely.
 */
interface IndexedEntry {
  entry: KnowledgeEntry;
  tokens: Set<string>;
  stems: Set<string>;
  bigrams: Set<string>;
  titleTokens: Set<string>;
  titleStems: Set<string>;
  titleBigrams: Set<string>;
  /**
   * Words from the title with generic connectors removed. A query word that
   * matches the distinctive part of an entry's name ("observability",
   * "kubernetes") is a much stronger signal than the same word appearing
   * somewhere in a blurb — which is how a Datadog entry was winning a question
   * about the observability platform.
   */
  nameTokens: Set<string>;
}

function tokenize(text: string): string[] {
  const lower = text.toLowerCase();

  // Compound technical tokens would otherwise be destroyed: "ci/cd" becomes
  // "ci" and "cd", both of which are then dropped as too short. Emit the
  // joined form as well so the term survives.
  const joined = lower.replace(/([a-z0-9])[\/.]([a-z0-9])/g, "$1$2");

  const out = new Set<string>();
  for (const src of [lower, joined]) {
    for (const w of src.replace(/[^a-z0-9+\s-]/g, " ").split(/\s+/)) {
      if (w.length > 1) out.add(w);
    }
  }
  return [...out];
}

function bigramsOf(words: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < words.length - 1; i++) out.push(`${words[i]} ${words[i + 1]}`);
  return out;
}

/**
 * Words that appear in many entry titles and therefore carry no distinguishing
 * power, even though they are long enough to look significant. Without this,
 * a question about observability cost matched the Datadog entry purely because
 * "Cost" is in its title.
 */
const NAME_CONNECTORS = new Set(
  (
    "and or the a an of for with from into our your their " +
    "build setup rollout control platform service services solution solutions " +
    "how we do does you which what when where why who that this " +
    "cost costs pricing price prices rate rates fee fees " +
    "management managed engineering reliability hardening optimization optimization"
  ).split(" "),
);

const INDEX: IndexedEntry[] = knowledge.map((entry) => {
  const termWords = tokenize(entry.terms);
  const titleWords = tokenize(entry.title);
  return {
    entry,
    tokens: new Set(termWords),
    stems: new Set(termWords.map(stem)),
    bigrams: new Set(bigramsOf(termWords)),
    titleTokens: new Set(titleWords),
    titleStems: new Set(titleWords.map(stem)),
    titleBigrams: new Set(bigramsOf(titleWords)),
    nameTokens: new Set(titleWords.filter((w) => !NAME_CONNECTORS.has(w) && w.length > 3)),
  };
});

export function retrieve(query: string, limit = 3): Retrieved[] {
  const all = tokenize(query);
  const words = all.filter((w) => w.length > 2 && !STOPWORDS.has(w));
  if (words.length === 0) return [];

  // Bigrams are taken before stopword removal so "worked with" survives, but a
  // pair made entirely of stopwords ("how do", "do you") carries no meaning and
  // would otherwise swamp a short query.
  const queryBigrams = bigramsOf(all).filter((b) =>
    b.split(" ").some((w) => w.length > 2 && !STOPWORDS.has(w)),
  );

  return INDEX.map((ix) => {
    let score = 0;

    for (const w of words) {
      const root = stem(w);

      if (ix.nameTokens.has(w)) score += 3.5;
      else if (ix.titleTokens.has(w)) score += 1.6;
      else if (ix.titleStems.has(root)) score += 1.3;

      if (ix.tokens.has(w)) score += 1;
      else if (ix.stems.has(root)) score += 0.85;
    }

    for (const b of queryBigrams) {
      if (ix.titleBigrams.has(b)) score += 2.2;
      else if (ix.bigrams.has(b)) score += 1.4;
    }

    const denominator = words.length + queryBigrams.length * 0.5;
    return { entry: ix.entry, score: (score / denominator) * (ix.entry.weight ?? 1) };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
