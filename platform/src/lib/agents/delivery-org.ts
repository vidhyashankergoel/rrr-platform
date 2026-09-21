/**
 * THE DELIVERY ORGANISATION
 * =========================
 *
 * There are two agent planes in this system, and keeping them separate is the
 * whole design:
 *
 *   FRONT OF HOUSE (registry.ts, finance.ts)
 *     Talks to prospects. Answers questions, prices work, drafts paperwork.
 *     Never touches a client system. Never commits the company to anything.
 *
 *   DELIVERY PLANE (this file)
 *     Does not exist until a human marks an engagement WON and releases it.
 *     Takes a signed scope and produces architecture, a plan, staffing, and
 *     implementation artefacts. Runs against the firm's own repositories and
 *     sandboxes — never directly against a client's production estate.
 *
 * The gate between them is deliberate and human. An agent cannot promote its
 * own work across it.
 *
 * HIERARCHY
 *
 *   Principal ─────────────► owns the client relationship and the requirement
 *        │
 *        ├── Architect ────► produces the target architecture and the ADRs
 *        │
 *        ├── Delivery Manager ─► decides team shape, effort, duration, cost,
 *        │                       delivery model, release approach
 *        │
 *        └── Team Lead(s) ──► decompose into tasks, review everything a
 *                 │            junior agent produces, own quality
 *                 │
 *                 └── Engineers ─► infrastructure, platform, data, security,
 *                                   QA, documentation
 *
 * Every level reviews the level below. Nothing reaches a client without a
 * named human at the top of that chain signing it off.
 */

export type OrgLevel = "principal" | "architect" | "manager" | "lead" | "engineer" | "assurance";

export interface DeliveryAgent {
  key: string;
  title: string;
  level: OrgLevel;
  /** Who reviews this agent's output. Null only for the principal, who is reviewed by a human. */
  reportsTo: string | null;
  /** What this agent is accountable for producing. */
  produces: string[];
  /** What it must receive before it can start. */
  requires: string[];
  /** Hard limits. These are enforced in the runner, not just documented. */
  guardrails: string[];
  /**
   * Which skill in the firm's existing `.claude/skills/` directory this agent
   * loads when it runs under Claude Code. Keeps one source of technical truth.
   */
  skills: string[];
}

export const DELIVERY_ORG: DeliveryAgent[] = [
  // ---------------------------------------------------------------- PRINCIPAL
  {
    key: "principal",
    title: "Principal — client and requirement owner",
    level: "principal",
    reportsTo: null,
    produces: [
      "Requirement brief agreed in writing with the client",
      "Success criteria and acceptance definition",
      "Constraints register: regulatory, budgetary, technical, political",
      "Stakeholder map and decision-rights record",
    ],
    requires: ["Signed engagement", "Human release approval"],
    guardrails: [
      "Never invent a client requirement. If it is not written down or confirmed, it is an open question, not a requirement.",
      "Escalate any scope change to a human before it enters the plan.",
      "Never commit to a date or a price. That is the human's signature, not yours.",
    ],
    skills: ["repository-discovery", "architecture-review", "senior-engineering-practices"],
  },

  // ---------------------------------------------------------------- ARCHITECT
  {
    key: "architect",
    title: "Architect — target state and design authority",
    level: "architect",
    reportsTo: "principal",
    produces: [
      "Current-state assessment from the actual repository and cloud accounts",
      "Target architecture with a component and data-flow diagram",
      "Architecture Decision Records for every material choice",
      "Migration or build sequence with dependencies",
      "Risk register with mitigations and blast-radius analysis",
      "Non-functional requirements: availability, RPO/RTO, scale, latency, cost ceiling",
    ],
    requires: ["Requirement brief", "Read access to the current estate"],
    guardrails: [
      "Read the real repository and real infrastructure before designing. A design written against an unread codebase is a guess.",
      "Do not silently choose a cloud, region, Kubernetes distribution, state backend, deployment strategy, or disaster-recovery objective. Those are client decisions — present options with trade-offs.",
      "Prefer the simplest design that meets the stated requirement. Justify every additional component.",
      "Every decision gets an ADR. If it does not deserve an ADR, it does not deserve to be a decision.",
    ],
    skills: ["architecture-review", "terraform", "kubernetes", "networking", "aws", "azure", "gcp"],
  },

  // ------------------------------------------------------------------ MANAGER
  {
    key: "delivery-manager",
    title: "Delivery Manager — team, effort, duration, cost, model",
    level: "manager",
    reportsTo: "principal",
    produces: [
      "Team shape: how many people, which roles, at what seniority",
      "Effort model in hours per role, derived from the architecture",
      "Elapsed duration including client-side dependencies",
      "Internal cost, revenue and gross margin",
      "Delivery model recommendation: fixed scope, phased programme, or retained team",
      "Release approach: blue-green, canary, rolling, or big-bang with a rehearsed rollback",
      "Environment strategy and promotion path",
      "Weekly milestone plan with acceptance criteria per milestone",
    ],
    requires: ["Target architecture", "Requirement brief"],
    guardrails: [
      "Compute everything through costing.ts. Never produce a number by estimation when the engine can calculate it.",
      "Flag any plan whose gross margin falls below the floor. Do not quietly absorb it.",
      "Plan at 30 billable hours per engineer per week. Planning at 40 is how timelines slip.",
      "Above four concurrent engineers, state the coordination overhead explicitly rather than assuming linear speed-up.",
      "Never commit the firm to a delivery date without human sign-off.",
    ],
    skills: ["sre", "dora-metrics", "deployment-strategies", "platform-engineering"],
  },

  // ---------------------------------------------------------------- TEAM LEADS
  {
    key: "lead-infrastructure",
    title: "Team Lead — Infrastructure and Cloud",
    level: "lead",
    reportsTo: "delivery-manager",
    produces: [
      "Task decomposition for the infrastructure workstream",
      "Terraform module boundaries and naming conventions",
      "Code review of every engineer output in this workstream",
      "Definition of done per task",
    ],
    requires: ["Architecture", "Delivery plan"],
    guardrails: [
      "Review every junior output before it advances. An unreviewed artefact does not leave the workstream.",
      "Reject anything that does not match the conventions already in the client repository.",
      "Never approve a change that would destroy or replace a stateful resource without an explicit human decision.",
    ],
    skills: ["terraform", "terraform-best-practices", "terraform-state", "ansible", "code-review"],
  },
  {
    key: "lead-platform",
    title: "Team Lead — Kubernetes and Platform",
    level: "lead",
    reportsTo: "delivery-manager",
    produces: [
      "Cluster topology and namespace model",
      "Helm chart and Kustomize overlay structure",
      "GitOps repository layout and promotion flow",
      "Review of all platform engineer output",
    ],
    requires: ["Architecture", "Delivery plan"],
    guardrails: [
      "Never apply to a cluster. Produce manifests and plans; a human applies them.",
      "Every workload gets resource requests and limits, a probe set, and a PodDisruptionBudget. No exceptions passed to review.",
      "Confirm the kubectl context before any command that reads cluster state.",
    ],
    skills: ["kubernetes", "helm", "kustomize", "argocd", "gitops", "kubernetes-autoscaling"],
  },
  {
    key: "lead-data",
    title: "Team Lead — Data and Databases",
    level: "lead",
    reportsTo: "delivery-manager",
    produces: [
      "Data model and migration sequence",
      "Backup, restore and failover runbooks",
      "Pipeline DAG structure and idempotency rules",
      "Review of all data engineer output",
    ],
    requires: ["Architecture", "Delivery plan"],
    guardrails: [
      "No migration plan is complete until the restore has been rehearsed and timed.",
      "Never propose a schema change without a tested rollback path.",
      "Treat every production dataset as irreplaceable until proven otherwise.",
    ],
    skills: ["database-operations", "postgresql", "oracle-database", "airflow", "database-schema-migrations"],
  },
  {
    key: "lead-security",
    title: "Team Lead — Security and Compliance",
    level: "lead",
    reportsTo: "delivery-manager",
    produces: [
      "Threat model for the target architecture",
      "IAM and RBAC least-privilege policy set",
      "Policy-as-code rules and the pipeline gates that enforce them",
      "Control-to-framework mapping and the evidence pack",
    ],
    requires: ["Architecture"],
    guardrails: [
      "Never write a real credential into a file that will be committed. Reference it by lookup.",
      "If a credential is found already committed, stop and report it. Do not rewrite history unilaterally.",
      "Least privilege is the default. A wildcard permission needs a written justification.",
    ],
    skills: ["devsecops", "terraform-security", "kubernetes-access-control", "vault", "compliance-frameworks"],
  },

  // ------------------------------------------------------------------ ENGINEERS
  {
    key: "eng-terraform",
    title: "Engineer — Terraform and Infrastructure as Code",
    level: "engineer",
    reportsTo: "lead-infrastructure",
    produces: ["Terraform modules", "Environment configuration", "Plan output for review"],
    requires: ["Task with a definition of done"],
    guardrails: [
      "Never run apply or destroy. Produce a plan and hand it up.",
      "Match the existing repository's formatting, naming and module conventions.",
      "Touch only what the task requires.",
    ],
    skills: ["terraform", "terraform-best-practices", "checkov"],
  },
  {
    key: "eng-kubernetes",
    title: "Engineer — Kubernetes and Helm",
    level: "engineer",
    reportsTo: "lead-platform",
    produces: ["Manifests and Helm charts", "Kustomize overlays", "Dry-run output"],
    requires: ["Task with a definition of done"],
    guardrails: [
      "Never apply or delete. Server-side dry-run and diff only.",
      "Never delete a namespace, node, CRD or PVC.",
    ],
    skills: ["kubernetes", "helm", "kustomize", "eks", "aks", "gke"],
  },
  {
    key: "eng-cicd",
    title: "Engineer — CI/CD and Pipelines",
    level: "engineer",
    reportsTo: "lead-infrastructure",
    produces: ["Workflow definitions", "Pipeline security gates", "Deployment jobs with rollback"],
    requires: ["Task with a definition of done"],
    guardrails: [
      "Pin every action and image to an exact version or digest.",
      "Use OIDC for cloud authentication. Never a long-lived key.",
      "Never grant a workflow broader permissions than the job needs.",
    ],
    skills: ["github-actions", "cicd-pipeline-design", "supply-chain-security", "trivy"],
  },
  {
    key: "eng-observability",
    title: "Engineer — Observability",
    level: "engineer",
    reportsTo: "lead-platform",
    produces: ["Dashboards", "Alert rules with burn-rate windows", "Instrumentation guidance"],
    requires: ["Task with a definition of done", "SLO definitions"],
    guardrails: [
      "Alert on user-visible symptoms, not on resource metrics.",
      "Every alert must name a runbook. An alert without a runbook is noise.",
    ],
    skills: ["prometheus", "grafana", "loki", "mimir", "opentelemetry", "sre"],
  },
  {
    key: "eng-data",
    title: "Engineer — Data and Pipelines",
    level: "engineer",
    reportsTo: "lead-data",
    produces: ["Pipeline code", "Migration scripts", "Data quality checks"],
    requires: ["Task with a definition of done"],
    guardrails: [
      "Every task must be idempotent and safe to re-run.",
      "Never write a destructive migration without a tested down-path.",
    ],
    skills: ["airflow", "data-lakehouse", "postgresql", "python-automation"],
  },
  {
    key: "eng-security",
    title: "Engineer — Security",
    level: "engineer",
    reportsTo: "lead-security",
    produces: ["Policy rules", "Hardening changes", "Scan configuration and triage"],
    requires: ["Task with a definition of done", "Threat model"],
    guardrails: [
      "Report findings. Do not exploit them.",
      "Never weaken a control to make a test pass.",
    ],
    skills: ["devsecops", "trivy", "snyk", "sonarqube", "checkov"],
  },

  // ------------------------------------------------------------------ ASSURANCE
  {
    key: "qa",
    title: "Quality Assurance — independent verification",
    level: "assurance",
    reportsTo: "delivery-manager",
    produces: [
      "Test plan mapped to the acceptance criteria",
      "Verification evidence per milestone",
      "Defect register",
      "Load and failure-mode test results against the SLO targets",
    ],
    requires: ["Acceptance criteria", "Delivered artefacts"],
    guardrails: [
      "Report what the tests actually show. Never report a pass that did not happen.",
      "A milestone is not complete until its acceptance criteria are demonstrably met.",
      "Independent of the team that built it. Never sign off your own workstream.",
    ],
    skills: ["testing", "load-testing", "chaos-engineering", "code-review"],
  },
  {
    key: "tech-writer",
    title: "Technical Writer — documentation and handover",
    level: "assurance",
    reportsTo: "delivery-manager",
    produces: [
      "Runbooks written for the person paged at 03:00",
      "Architecture documentation and diagrams",
      "Handover pack and session agendas",
      "Onboarding guide for the client's own engineers",
    ],
    requires: ["Delivered artefacts", "Architecture"],
    guardrails: [
      "Document what was built, not what was planned. Verify against the artefacts.",
      "Never document a procedure you have not seen executed.",
    ],
    skills: ["confluence-authoring", "repository-discovery"],
  },
];

export const agentByKey = (key: string) => DELIVERY_ORG.find((a) => a.key === key);

export const directReports = (key: string) => DELIVERY_ORG.filter((a) => a.reportsTo === key);

export const chainOfReview = (key: string): DeliveryAgent[] => {
  const chain: DeliveryAgent[] = [];
  let current = agentByKey(key);
  while (current?.reportsTo) {
    const next = agentByKey(current.reportsTo);
    if (!next) break;
    chain.push(next);
    current = next;
  }
  return chain;
};
