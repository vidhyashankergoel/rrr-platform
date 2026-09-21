/**
 * The service catalogue. This is the single source of truth for what the
 * company sells, what it costs and how long it takes — the marketing pages,
 * the estimator, the AI assistant and the pricing agent all read from here,
 * so a published price can never drift from a quoted one.
 *
 * All money is CAD dollars, excluding applicable GST/HST.
 */

export type ServiceCategory =
  | "cloud"
  | "kubernetes"
  | "iac"
  | "cicd"
  | "observability"
  | "data"
  | "security";

export type EngagementTerm = "short" | "long";

export interface Service {
  id: string;
  category: ServiceCategory;
  icon: string;
  name: string;
  blurb: string;
  includes: string[];
  outcomes: string[];
  priceLow: number;
  priceHigh: number;
  priceNote?: string;
  durationLabel: string;
  durationWeeks: number;
  term: EngagementTerm;
  stack: string[];
  featured?: boolean;
}

export const services: Service[] = [
  {
    id: "landing-zone",
    category: "cloud",
    icon: "cloud",
    name: "Cloud Landing Zone — build from scratch",
    blurb:
      "A production-ready AWS, Azure or GCP foundation: account structure, network topology, identity, guardrails, logging and cost controls — in Terraform from day one.",
    includes: [
      "Multi-account or multi-subscription structure with SCPs or Azure Policy",
      "VPC / VNet design: public, private and data subnets, NAT, transit or Virtual WAN",
      "Single sign-on and a least-privilege IAM or Entra ID role model",
      "Centralized logging, audit trail and budget alerting",
      "Terraform modules with remote state and locking, handed to your repository",
    ],
    outcomes: [
      "A new workload can be deployed into a compliant account the same day it is requested",
      "Every account is created from the same reviewed template, not by hand",
    ],
    priceLow: 18000,
    priceHigh: 35000,
    durationLabel: "3–5 weeks",
    durationWeeks: 4,
    term: "short",
    stack: ["AWS", "Azure", "GCP", "Terraform", "IAM", "SCP"],
  },
  {
    id: "migration",
    category: "cloud",
    icon: "move",
    name: "On-Premises to Cloud Migration",
    blurb:
      "Move running workloads off local servers or a legacy datacentre, in waves, without a big-bang cutover. Discovery, dependency mapping, wave planning, cutover and rehearsed rollback.",
    includes: [
      "Application and dependency discovery, grouped into migration waves",
      "Landing zone plus connectivity (VPN, Direct Connect or ExpressRoute)",
      "Re-host, re-platform or containerize per workload — decided with you, not for you",
      "Rehearsed cutover runbook with a tested rollback path",
      "Parallel-run and validation window before anything is decommissioned",
    ],
    outcomes: [
      "Workloads run in the cloud with the old estate still available until you sign off",
      "A documented, repeatable process for the waves that follow",
    ],
    priceLow: 45000,
    priceHigh: 150000,
    priceNote: "per migration wave",
    durationLabel: "8–20 weeks per wave",
    durationWeeks: 12,
    term: "long",
    stack: ["AWS", "Azure", "Terraform", "Ansible", "EKS", "RDS"],
    featured: true,
  },
  {
    id: "k8s-platform",
    category: "kubernetes",
    icon: "k8s",
    name: "Kubernetes Platform Build",
    blurb:
      "A cluster your team can actually operate. EKS, AKS, GKE, OpenShift/ROSA or self-managed kubeadm — with ingress, autoscaling, RBAC, secrets, backup and a documented upgrade path.",
    includes: [
      "Cluster provisioning in Terraform (EKS, AKS, GKE, ROSA or kubeadm)",
      "Ingress (NGINX, ALB, AGIC or Gateway API) with cert-manager TLS automation",
      "Cluster and workload autoscaling (Karpenter, Cluster Autoscaler, KEDA)",
      "Namespace, RBAC and network-policy model; external secrets wiring",
      "Velero backup, a documented upgrade runbook, and team handover sessions",
    ],
    outcomes: [
      "Teams deploy to the cluster without filing a ticket",
      "An upgrade is a scheduled, rehearsed task rather than an annual crisis",
    ],
    priceLow: 25000,
    priceHigh: 55000,
    durationLabel: "4–8 weeks",
    durationWeeks: 6,
    term: "short",
    stack: ["EKS", "AKS", "GKE", "OpenShift", "ROSA", "kubeadm", "Helm", "Karpenter"],
    featured: true,
  },
  {
    id: "service-mesh",
    category: "kubernetes",
    icon: "mesh",
    name: "Service Mesh and Traffic Management",
    blurb:
      "Istio or Cilium rollout for mTLS, retries, circuit breaking and canary routing — with Kiali topology and Jaeger tracing so you can see what the mesh is actually doing.",
    includes: [
      "Istio control plane and Envoy sidecar rollout, namespace by namespace",
      "VirtualService and DestinationRule traffic policy with canary routing",
      "Cluster-wide mTLS, migrated without breaking running traffic",
      "Kiali topology dashboards and Jaeger distributed tracing",
      "Load-test validated rollout plus a mesh-off rollback plan",
    ],
    outcomes: [
      "Service-to-service traffic is encrypted and observable by default",
      "A release can be shifted 5% at a time and reversed in seconds",
    ],
    priceLow: 22000,
    priceHigh: 48000,
    durationLabel: "4–7 weeks",
    durationWeeks: 5,
    term: "short",
    stack: ["Istio", "Envoy", "Cilium", "Kiali", "Jaeger"],
  },
  {
    id: "iac",
    category: "iac",
    icon: "code",
    name: "Infrastructure as Code — Terraform and Ansible",
    blurb:
      "Turn click-ops into reviewable code. Modular Terraform with remote state and multi-environment separation, plus Ansible for fleet configuration across dozens or hundreds of servers.",
    includes: [
      "Reusable Terraform module library with versioning and a test harness",
      "Remote state (S3 + DynamoDB, Azure Storage or GCS) with locking and encryption",
      "dev / staging / prod separation — no shared state, no copy-paste drift",
      "Ansible roles and dynamic inventory for OS, patching and agent rollout",
      "Checkov and tfsec policy gates wired into continuous integration",
    ],
    outcomes: [
      "Infrastructure changes arrive as pull requests with a visible plan",
      "A destroyed environment can be rebuilt from code in under an hour",
    ],
    priceLow: 14000,
    priceHigh: 30000,
    durationLabel: "2–5 weeks",
    durationWeeks: 3,
    term: "short",
    stack: ["Terraform", "Terragrunt", "Ansible", "Checkov"],
  },
  {
    id: "iac-retrofit",
    category: "iac",
    icon: "wrench",
    name: "IaC Retrofit — reverse-engineer existing infrastructure",
    blurb:
      "Production is running and nobody knows how it was built. We import it into version-controlled Terraform, close the drift, and leave you with a plan that comes back clean.",
    includes: [
      "Full inventory of live resources across accounts and regions",
      "Terraformer-assisted import into modular, reviewable code",
      "Drift reconciliation until `terraform plan` shows no unexpected changes",
      "Documentation of every undocumented decision we uncover",
      "Handover so your team owns it, not us",
    ],
    outcomes: [
      "The estate is reproducible and reviewable for the first time",
      "Key-person risk around 'the one person who knows' is removed",
    ],
    priceLow: 14000,
    priceHigh: 32000,
    durationLabel: "3–6 weeks",
    durationWeeks: 4,
    term: "short",
    stack: ["Terraform", "Terraformer", "AWS", "Azure"],
  },
  {
    id: "cicd",
    category: "cicd",
    icon: "pipeline",
    name: "CI/CD Pipeline Build",
    blurb:
      "Code to production without a human running commands. Build, test, scan, sign and deploy — with keyless cloud authentication and a rollback that has been tested.",
    includes: [
      "Branch strategy, protection rules, CODEOWNERS and pull-request gates",
      "Build and test stages with caching that genuinely saves time",
      "Security gates: SonarQube SAST, Trivy, GitLeaks, OWASP ZAP DAST",
      "Keyless cloud authentication via OIDC — no long-lived credentials in CI",
      "Blue-green or canary deployment with automatic rollback on failed health checks",
    ],
    outcomes: [
      "Deployment stops being an event and becomes a merge",
      "Every artefact reaching production has been scanned and is traceable to a commit",
    ],
    priceLow: 12000,
    priceHigh: 28000,
    durationLabel: "2–4 weeks",
    durationWeeks: 3,
    term: "short",
    stack: ["GitHub Actions", "Jenkins", "Azure DevOps", "OIDC", "Trivy", "SonarQube"],
    featured: true,
  },
  {
    id: "gitops",
    category: "cicd",
    icon: "git",
    name: "GitOps with ArgoCD or Flux",
    blurb:
      "Git becomes the only way anything reaches the cluster. Automatic sync, drift detection, self-heal and progressive delivery.",
    includes: [
      "Repository structure for app-of-apps or ApplicationSets across environments",
      "Sync policy, pruning, self-heal and drift alerting",
      "Environment promotion (dev to staging to prod) with approval gates",
      "Progressive delivery — canary and blue-green via Argo Rollouts",
      "Secrets handled through External Secrets Operator or Sealed Secrets",
    ],
    outcomes: [
      "Cluster state always matches the repository, and drift is alerted on",
      "A rollback is a git revert",
    ],
    priceLow: 11000,
    priceHigh: 24000,
    durationLabel: "2–4 weeks",
    durationWeeks: 3,
    term: "short",
    stack: ["ArgoCD", "Flux", "Helm", "Kustomize", "Argo Rollouts"],
  },
  {
    id: "observability",
    category: "observability",
    icon: "chart",
    name: "Observability Platform",
    blurb:
      "Stop finding out from customers. Metrics, logs, traces and alerts that route to the right person, with dashboards built around your services rather than generic templates.",
    includes: [
      "Prometheus and Grafana, or Grafana Cloud — your call on managed versus self-hosted",
      "Loki for logs, Mimir for long-term multi-tenant metric retention",
      "OpenTelemetry instrumentation guidance and trace pipeline",
      "SLO definitions with burn-rate alerting, not CPU-threshold noise",
      "Alertmanager routing into PagerDuty, Opsgenie or Slack with escalation",
    ],
    outcomes: [
      "Mean time to detect measured in minutes rather than customer complaints",
      "On-call engineers get pages that correspond to real user impact",
    ],
    priceLow: 15000,
    priceHigh: 32000,
    durationLabel: "3–5 weeks",
    durationWeeks: 4,
    term: "short",
    stack: ["Prometheus", "Grafana", "Loki", "Mimir", "Alertmanager", "OpenTelemetry"],
    featured: true,
  },
  {
    id: "apm",
    category: "observability",
    icon: "pulse",
    name: "Datadog or Dynatrace Rollout and Cost Control",
    blurb:
      "Commercial APM deployed properly — agent coverage, meaningful monitors, and ingest volume kept under control so the invoice does not become the incident.",
    includes: [
      "Agent or OneAgent rollout across hosts, containers and serverless",
      "Monitor and SLO configuration mapped to real user-facing symptoms",
      "Log ingest filtering and index tiering to control spend",
      "Dashboards per service owner, not one dashboard for everyone",
      "A documented migration path off the tool if you ever want one",
    ],
    outcomes: [
      "Full-fidelity APM without an unpredictable bill",
      "Monitors that page on symptoms rather than on every metric spike",
    ],
    priceLow: 12000,
    priceHigh: 26000,
    durationLabel: "2–4 weeks",
    durationWeeks: 3,
    term: "short",
    stack: ["Datadog", "Dynatrace", "OpenTelemetry"],
  },
  {
    id: "databases",
    category: "data",
    icon: "db",
    name: "Database Setup, Migration and Reliability",
    blurb:
      "We set up, migrate and operate your data tier: PostgreSQL, MySQL, Oracle, SQL Server, RDS and Aurora, DynamoDB, Redis, Neo4j — including the part everyone skips, testing the restore.",
    includes: [
      "Greenfield setup or lift into managed services (RDS, Aurora, Azure SQL, Cloud SQL)",
      "Heterogeneous migration with DMS or logical replication and a minimal-downtime cutover",
      "A backup strategy with a rehearsed restore and an RPO/RTO you have signed off",
      "Replication, failover and connection pooling (PgBouncer or ProxySQL)",
      "Versioned schema migrations via Liquibase or Flyway, wired into CI",
    ],
    outcomes: [
      "A restore that has been performed, timed and documented — not assumed",
      "Planned failover that completes inside the agreed RTO",
    ],
    priceLow: 20000,
    priceHigh: 60000,
    durationLabel: "4–10 weeks",
    durationWeeks: 7,
    term: "long",
    stack: ["PostgreSQL", "MySQL", "Oracle", "RDS", "Aurora", "DynamoDB", "Neo4j", "Redis"],
  },
  {
    id: "data-platform",
    category: "data",
    icon: "layers",
    name: "Data Platform and Pipeline Engineering",
    blurb:
      "Ingestion, transformation and serving layers built to be re-run safely: Airflow or Glue orchestration, Iceberg or Delta table formats, Athena or warehouse serving.",
    includes: [
      "Airflow, MWAA or AWS Glue orchestration with idempotent, retry-safe tasks",
      "Lakehouse storage on S3 or ADLS with Iceberg or Delta Lake",
      "Athena, Redshift, BigQuery or Snowflake serving layer",
      "Data quality checks and lineage, so failures surface before dashboards lie",
      "Cost guardrails on scan volume and cluster runtime",
    ],
    outcomes: [
      "A failed pipeline run can be replayed without corrupting downstream tables",
      "Analysts query a serving layer with predictable cost",
    ],
    priceLow: 28000,
    priceHigh: 85000,
    durationLabel: "6–14 weeks",
    durationWeeks: 10,
    term: "long",
    stack: ["Airflow", "Glue", "Athena", "EMR", "Iceberg", "Snowflake", "BigQuery"],
  },
  {
    id: "mlops",
    category: "data",
    icon: "brain",
    name: "MLOps — model deployment and serving",
    blurb:
      "Get models off a laptop and into production: versioned data, tracked experiments, and a serving layer on Kubernetes with the same delivery discipline as any other service.",
    includes: [
      "KServe or SageMaker endpoints with autoscaling and canary model rollout",
      "DVC for dataset versioning, MLflow for experiment and model registry",
      "Retraining pipeline triggered on schedule or on drift",
      "Model and feature monitoring wired into the same observability stack",
      "GitOps promotion of model versions through environments",
    ],
    outcomes: [
      "A new model version reaches production through review, not a manual copy",
      "Drift is detected and alerted on before the business notices",
    ],
    priceLow: 24000,
    priceHigh: 65000,
    durationLabel: "5–12 weeks",
    durationWeeks: 8,
    term: "long",
    stack: ["KServe", "MLflow", "DVC", "SageMaker", "Kubeflow", "Feast"],
  },
  {
    id: "security",
    category: "security",
    icon: "shield",
    name: "Security and Compliance Hardening",
    blurb:
      "Close the findings before an auditor or an attacker does. Least-privilege identity, policy-as-code, supply-chain controls, and evidence mapped to the framework you are held to.",
    includes: [
      "IAM and RBAC least-privilege review and remediation across cloud and cluster",
      "Policy-as-code with OPA, Gatekeeper or Azure Policy, enforced in CI and in-cluster",
      "Supply chain: image signing, SBOM generation, Trivy and Snyk gates",
      "Confidential values migrated out of code into Vault, Secrets Manager or Key Vault",
      "Control mapping to CIS Benchmarks, SOC 2, ISO 27001 or PCI-DSS as required",
    ],
    outcomes: [
      "A defensible control set with evidence an assessor will accept",
      "Misconfiguration blocked at the pipeline rather than found in production",
    ],
    priceLow: 16000,
    priceHigh: 38000,
    durationLabel: "3–6 weeks",
    durationWeeks: 4,
    term: "short",
    stack: ["OPA", "Trivy", "Snyk", "Vault", "GitLeaks", "OWASP ZAP", "CIS"],
  },
  {
    id: "finops",
    category: "cloud",
    icon: "coins",
    name: "Cloud Cost Optimization",
    blurb:
      "We find the waste and prove the saving. Rightsizing, commitment strategy, storage tiering and idle-resource elimination — with tooling left behind so it does not creep back.",
    includes: [
      "Full spend breakdown by account, service, team and environment",
      "Rightsizing and idle-resource findings with dollar figures attached",
      "Savings Plans, Reserved Instance or CUD commitment modelling",
      "Storage lifecycle tiering and egress reduction",
      "Kubecost or native cost allocation with per-team showback",
    ],
    outcomes: [
      "A verified, measurable reduction in the monthly bill",
      "Per-team cost visibility so the saving holds after we leave",
    ],
    priceLow: 9500,
    priceHigh: 9500,
    priceNote: "plus 20% of verified 12-month savings",
    durationLabel: "2–3 weeks",
    durationWeeks: 2,
    term: "short",
    stack: ["Kubecost", "Cost Explorer", "Azure Cost Management"],
  },
  {
    id: "sre",
    category: "observability",
    icon: "alert",
    name: "SRE and Production Readiness",
    blurb:
      "Error budgets, an on-call rotation people can survive, incident response with real post-incident review, and load testing that finds the breaking point before your customers do.",
    includes: [
      "SLI and SLO definition per service, with an error budget policy",
      "On-call rotation, escalation policy and paging hygiene in PagerDuty or Opsgenie",
      "Runbooks written for the person paged at 03:00, not for the author",
      "k6 or Gatling load testing against the SLO targets",
      "A blameless post-incident review process, introduced and facilitated",
    ],
    outcomes: [
      "Reliability becomes a number the business agrees on, not an argument",
      "Incidents produce changes rather than blame",
    ],
    priceLow: 15000,
    priceHigh: 34000,
    durationLabel: "3–6 weeks",
    durationWeeks: 4,
    term: "short",
    stack: ["PagerDuty", "Opsgenie", "k6", "Grafana", "Chaos Mesh"],
  },
];

export const serviceById = (id: string) => services.find((s) => s.id === id);

/** The deliberately small, low-risk entry point. */
export const auditOffer = {
  id: "audit",
  name: "Fixed-Price Infrastructure Audit",
  price: 4500,
  durationLabel: "5 business days",
  blurb:
    "The smallest way to start. A written report covering security exposure, cost waste with dollar figures attached, reliability risk, and a prioritized remediation plan. No obligation to continue — the report is yours either way.",
  includes: [
    "Read-only review of cloud accounts, repositories and pipeline",
    "Security and least-privilege findings, ranked by exploitability",
    "Cost waste identified with the annualized dollar figure for each item",
    "Reliability and single-point-of-failure analysis",
    "A prioritized remediation plan you can execute yourselves",
  ],
} as const;

export interface Retainer {
  key: string;
  name: string;
  price: number;
  unit: string;
  blurb: string;
  items: string[];
  term: string;
  featured?: boolean;
}

export const retainers: Retainer[] = [
  {
    key: "essential",
    name: "Essential",
    price: 3500,
    unit: "/ month",
    blurb: "Keeps a healthy platform healthy. Best once a build is delivered and running.",
    items: [
      "Up to 20 engineering hours per month",
      "Business hours support, Mon–Fri 09:00–18:00 ET",
      "Next-business-day response target",
      "Patching, upgrades and dependency maintenance",
      "Monthly health and cost report",
    ],
    term: "3-month minimum, 30 days' notice",
  },
  {
    key: "growth",
    name: "Growth",
    price: 8500,
    unit: "/ month",
    featured: true,
    blurb: "For teams shipping continuously who need a platform partner, not a ticket queue.",
    items: [
      "Up to 50 engineering hours per month",
      "Extended hours 07:00–20:00 ET plus 12×5 on-call",
      "4-hour response target, 1 hour for Severity 1",
      "Quarterly architecture and cost review",
      "Named lead engineer and a direct Slack or Teams channel",
      "Roadmap input and capacity planning",
    ],
    term: "6-month minimum, 60 days' notice",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: 18000,
    unit: "/ month, from",
    blurb: "Round-the-clock ownership of a production platform, with a contractual SLA behind it.",
    items: [
      "Dedicated pod — engineer, architect and delivery manager",
      "24/7/365 on-call with 15-minute Severity 1 acknowledgement",
      "Contractual uptime SLA with service credits",
      "Change advisory participation and audit evidence support",
      "Disaster recovery testing twice a year",
      "Eligible for Reliability Status clearance work",
    ],
    term: "12-month term, 90 days' notice",
  },
];

export const rateCard = [
  {
    role: "Principal Architect / Fractional Head of Platform",
    rate: "$210 – $260",
    note: "Architecture, cloud strategy, vendor and cost decisions",
  },
  {
    role: "Senior DevOps / SRE / Platform Engineer",
    rate: "$155 – $195",
    note: "Hands-on build, migration, Kubernetes, IaC, CI/CD",
  },
  {
    role: "Cloud Security / DevSecOps Engineer",
    rate: "$165 – $205",
    note: "Hardening, policy-as-code, compliance evidence",
  },
  {
    role: "Senior Data Engineer",
    rate: "$150 – $190",
    note: "Pipelines, lakehouse, warehouse, migrations",
  },
  {
    role: "Database Reliability Engineer",
    rate: "$160 – $200",
    note: "Migration, replication, performance, disaster recovery",
  },
  {
    role: "Data Analyst / BI Engineer",
    rate: "$105 – $140",
    note: "Reporting, dashboards, analytics enablement",
  },
  {
    role: "Delivery / Engagement Manager",
    rate: "$130 – $165",
    note: "Included at no charge on fixed-scope engagements",
  },
] as const;

export interface CaseStudy {
  slug: string;
  /** Real client name. Rendered only when ATTRIBUTION_MODE is "named". */
  client: string;
  /** Anonymized alternative, used in "descriptive" mode. */
  clientDescriptive: string;
  /** Sector-only alternative, used in "minimal" mode. */
  clientMinimal: string;
  /** Employer the work was delivered under, or null for our own engagement. */
  employer: string | null;
  sector: string;
  via: string;
  period: string;
  headline: string;
  problem: string;
  work: string[];
  results: Array<[string, string]>;
  stack: string[];
}

export const caseStudies: CaseStudy[] = [
  {
    slug: "gtaa",
    client: "Greater Toronto Airports Authority",
    clientDescriptive: "A major Canadian international airport authority",
    clientMinimal: "Aviation sector, Canada",
    employer: "Wipro Technologies",
    sector: "Aviation",
    via: "Delivered while at Wipro Technologies, on the client account",
    period: "2020 – 2023",
    headline: "180+ microservices moved from on-premises to AWS with zero service disruption",
    problem:
      "A safety-critical aviation estate running on-premises, with 27 separate load balancers, manual deployments across more than 500 production hosts, and no consistent way to observe service-to-service traffic.",
    work: [
      "Provisioned EKS, RDS, S3, EC2, VPCs with public and private subnets, security groups, bastion hosts and Route 53 entirely through Terraform and Ansible",
      "Released through GitHub Actions using blue-green and canary strategies",
      "Implemented Istio across all 180+ services — VirtualServices and DestinationRules for traffic policy, Envoy sidecars for mTLS, retries and circuit breaking",
      "Used Kiali for mesh topology and Jaeger for distributed tracing to resolve latency during rollouts",
      "Consolidated 27 load balancers into a unified ALB/NLB design with automated scaling",
      "Built the secure pipeline: SonarQube, GitLeaks, Trivy, OWASP ZAP, k6 SLO tests and ArgoCD canary releases",
    ],
    results: [
      ["Zero", "service disruption during migration"],
      ["99.9%", "uptime sustained over 12 months"],
      ["~40%", "reduction in cloud infrastructure cost"],
      ["3×", "peak-season traffic absorbed without incident"],
    ],
    stack: ["AWS", "EKS", "Terraform", "Ansible", "Istio", "ArgoCD", "GitHub Actions", "Kiali", "Jaeger"],
  },
  {
    slug: "rsa",
    client: "RSA Insurance Group",
    clientDescriptive: "A multinational general insurance group",
    clientMinimal: "Insurance sector",
    employer: "Wipro Technologies",
    sector: "Insurance",
    via: "Delivered while at Wipro Technologies, on the client account",
    period: "2019",
    headline: "14 fragmented network connections consolidated into a single Azure Virtual WAN hub",
    problem:
      "Network sprawl across an insurance estate, with fragmented connectivity, inconsistent monitoring, and compliance obligations the existing topology made difficult to evidence.",
    work: [
      "Consolidated 14 separate network connections into one Azure Virtual WAN hub with centralized monitoring",
      "Designed a secure Azure foundation: VNet, private subnets and least-privilege access controls",
      "Instrumented Kubernetes workloads with Azure Monitor",
      "Documented topology and controls against insurance-sector compliance requirements",
    ],
    results: [
      ["40%", "cloud infrastructure cost reduction"],
      ["14 → 1", "network connections consolidated"],
      ["Centralized", "monitoring across the estate"],
    ],
    stack: ["Azure", "Virtual WAN", "AKS", "Azure Monitor", "Key Vault"],
  },
  {
    slug: "citibank",
    client: "Citibank",
    clientDescriptive: "A global retail and investment bank",
    clientMinimal: "Banking sector",
    employer: "Wipro Technologies",
    sector: "Banking",
    via: "Delivered while at Wipro Technologies, on the client account",
    period: "2018",
    headline: "10 TB+ of Oracle financial data automated for backup, patching and recovery",
    problem:
      "Round-the-clock mission-critical banking operations under regulated change windows, where manual database maintenance created both downtime risk and audit exposure.",
    work: [
      "Automated backup, patching and recovery for more than 10 TB of critical Oracle financial data",
      "Standardized rollback runbooks used during regulated change windows",
      "Built foundational cloud networking and container infrastructure",
      "Automated deployment pipelines with defined incident response",
    ],
    results: [
      ["10 TB+", "Oracle estate under automated protection"],
      ["24/7", "mission-critical operation supported"],
      ["Reduced", "error rate in regulated change windows"],
    ],
    stack: ["Oracle RAC", "Linux", "Shell", "Container infrastructure"],
  },
  {
    slug: "rugby-canada",
    client: "Rugby Canada",
    clientDescriptive: "Rugby Canada",
    clientMinimal: "Rugby Canada",
    employer: null,
    sector: "Sport and non-profit",
    via: "Platform engineering engagement",
    period: "2025 – 2026",
    headline: "Detection and resolution time cut from hours to minutes, and a churn model put into production",
    problem:
      "No enterprise monitoring at all, and seven years of membership data the organization could not act on.",
    work: [
      "Built Prometheus, Loki and Grafana monitoring from the ground up across four data sources",
      "Deployed Mimir across both monolithic and distributed Kubernetes architectures for long-term, multi-tenant metric retention",
      "Deployed a churn prediction model with KServe on Kubernetes, with DVC versioning seven years of membership data",
      "Automated the model deployment pipeline with GitHub Actions and ArgoCD GitOps",
      "Built and operate an Amazon EKS MCP Server integrated with Amazon Q Developer for AI-assisted infrastructure diagnostics",
    ],
    results: [
      ["Hours → minutes", "mean time to detect and resolve"],
      ["4", "data sources unified into Grafana"],
      ["7 years", "of membership data versioned and served"],
      ["Zero", "data loss on long-term metric retention"],
    ],
    stack: ["Kubernetes", "Prometheus", "Loki", "Grafana", "Mimir", "KServe", "DVC", "ArgoCD"],
  },
  {
    slug: "digitalogy",
    client: "Digitalogy LLC",
    clientDescriptive: "Digitalogy LLC",
    clientMinimal: "Digitalogy LLC",
    employer: null,
    sector: "AI research",
    via: "Infrastructure automation engagement",
    period: "2025",
    headline: "Undocumented AWS production infrastructure reverse-engineered into version-controlled Terraform",
    problem:
      "Production infrastructure with no documentation and growing configuration drift, and a developer environment that took multiple days to stand up.",
    work: [
      "Reverse-engineered undocumented AWS production infrastructure into modular Terraform",
      "Built reusable Terraform modules and GitHub Actions pipelines preserving IAM controls and peer review gates",
      "Created a self-service KIND Kubernetes and ArgoCD pre-production validation environment",
    ],
    results: [
      ["~30%", "reduction in early-stage cloud cost"],
      ["Days → <1 hour", "developer environment setup"],
      ["100%", "of production infrastructure under version control"],
    ],
    stack: ["AWS", "Terraform", "GitHub Actions", "KIND", "ArgoCD"],
  },
];

export const faq = [
  {
    q: "Do you take short engagements, or only long programmes?",
    a: "Both. The smallest thing we do is a fixed-price infrastructure audit — five business days, one written report, no obligation. The largest are multi-wave cloud migrations running over six to twelve months. Most clients start small and expand once they have seen the work.",
  },
  {
    q: "How do you price — hourly or fixed?",
    a: "Fixed price wherever the scope can be pinned down, because that puts the delivery risk on us rather than you. Time-and-materials at the published rate card for open-ended or advisory work. Cost optimization is priced as a small fixed fee plus a share of verified savings, so we only do well if you do.",
  },
  {
    q: "Who actually does the work?",
    a: "Named engineers, assigned at proposal stage, and you meet them before you sign. We do not bid with senior people and staff with juniors. Team size scales from a single engineer to a full pod depending on the engagement.",
  },
  {
    q: "What happens at the end of an engagement?",
    a: "Everything we build is in your repositories, under your cloud accounts, with documentation and recorded handover sessions. No proprietary wrapper and no lock-in to us. A retainer afterwards is an option, never a requirement.",
  },
  {
    q: "Can you work with our existing team and tooling?",
    a: "Yes — that is the normal case. We adopt the conventions already in your repository rather than imposing ours, and we would rather improve the pipeline you have than replace it for the sake of it.",
  },
  {
    q: "Do you handle regulated or public-sector work?",
    a: "Yes. Prior delivery includes banking, insurance and critical aviation infrastructure, all under regulated change control. The founder is eligible for Canadian Reliability Status clearance.",
  },
  {
    q: "Are you insured, and can you sign our MSA?",
    a: "Commercial general liability, professional liability and cyber coverage are carried at levels appropriate to the engagement, with certificates provided on request. We sign client master services agreements, non-disclosure agreements and data processing agreements, and we are comfortable with standard Canadian procurement terms.",
  },
  {
    q: "How do you handle our data and our privacy obligations?",
    a: "We operate under PIPEDA. We collect only what an engagement requires, state the purpose at the point of collection, hold it no longer than needed, and will delete it on request. Where we process personal information on your behalf we sign a data processing agreement setting out exactly that.",
  },
];
