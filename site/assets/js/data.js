/* =============================================================================
   data.js — SINGLE SOURCE OF TRUTH for services, pricing and people.
   Edit this file to change the site. Nothing else needs touching.
   All prices in CAD, excluding applicable GST/HST.
   ============================================================================= */

window.NP = window.NP || {};

/* ---------- Company constants ------------------------------------------- */
NP.company = {
  legalName : "Northpath Cloud Inc.",       // <-- change after NUANS + incorporation
  shortName : "Northpath Cloud",
  tagline   : "Cloud, Kubernetes and platform engineering for Canadian teams",
  email     : "rrrsolutionprovider@gmail.com",
  phone     : "+1 (437) 366-4623",
  phoneHref : "+14373664623",
  city      : "Toronto",
  region    : "ON",
  country   : "CA",
  linkedin  : "https://www.linkedin.com/in/vidhyashankergoel/",
  githubOrg : "https://github.com/vidhyashankergoel",
  github2   : "https://github.com/vidhya101",
  dockerhub : "https://hub.docker.com/u/vidhya101",
  hours     : "Mon–Fri 09:00–18:00 ET · 24/7 on-call for retainer clients",
  // Set this to a Formspree / Web3Forms endpoint to make the contact form live.
  formEndpoint: ""
};

/* ---------- Service catalogue -------------------------------------------- */
/* category: cloud | kubernetes | iac | cicd | observability | data | security  */
NP.services = [
  {
    id: "landing-zone", cat: "cloud", icon: "cloud",
    name: "Cloud Landing Zone — build from scratch",
    blurb: "A production-ready AWS, Azure or GCP foundation: account/subscription structure, network topology, identity, guardrails, logging and cost controls — all in Terraform from day one.",
    includes: [
      "Multi-account / multi-subscription structure with SCPs or Azure Policy",
      "VPC / VNet design: public–private–data subnets, NAT, transit or Virtual WAN",
      "SSO and least-privilege IAM or Entra ID role model",
      "Centralised logging, audit trail and budget alerting",
      "Terraform modules + remote state with locking, handed to your repo"
    ],
    from: 18000, to: 35000, unit: "fixed", duration: "3–5 weeks", term: "short",
    stack: ["AWS","Azure","GCP","Terraform","IAM","SCP"]
  },
  {
    id: "migration", cat: "cloud", icon: "move",
    name: "On-Premises → Cloud Migration",
    blurb: "Move running workloads off local servers or a legacy datacentre into the cloud, in waves, without a big-bang cutover. Discovery, dependency mapping, wave planning, cutover and rollback rehearsal.",
    includes: [
      "Application and dependency discovery, wave grouping",
      "Landing zone + network connectivity (VPN / Direct Connect / ExpressRoute)",
      "Re-host, re-platform or containerise per workload — decided with you, not for you",
      "Rehearsed cutover runbook with a tested rollback path",
      "Parallel-run and validation window before decommissioning"
    ],
    from: 45000, to: 150000, unit: "wave", duration: "8–20 weeks per wave", term: "long",
    stack: ["AWS","Azure","Terraform","Ansible","EKS","RDS"],
    featured: true
  },
  {
    id: "k8s-platform", cat: "kubernetes", icon: "k8s",
    name: "Kubernetes Platform Build",
    blurb: "A cluster your team can actually operate. EKS, AKS, GKE, OpenShift/ROSA, or self-managed kubeadm — with ingress, autoscaling, RBAC, secrets, backup and an upgrade path documented.",
    includes: [
      "Cluster provisioning in Terraform (EKS / AKS / GKE / ROSA / kubeadm)",
      "Ingress (NGINX, ALB, AGIC or Gateway API) + cert-manager TLS automation",
      "Cluster and workload autoscaling (Karpenter / Cluster Autoscaler / KEDA)",
      "Namespace, RBAC and network-policy model; external secrets wiring",
      "Velero backup, documented upgrade runbook, and team handover sessions"
    ],
    from: 25000, to: 55000, unit: "fixed", duration: "4–8 weeks", term: "short",
    stack: ["EKS","AKS","GKE","OpenShift","ROSA","kubeadm","KIND","Helm","Karpenter"],
    featured: true
  },
  {
    id: "service-mesh", cat: "kubernetes", icon: "mesh",
    name: "Service Mesh & Traffic Management",
    blurb: "Istio or Cilium rollout for mTLS, retries, circuit breaking and canary routing across your services — with Kiali topology and Jaeger tracing so you can see what the mesh is actually doing.",
    includes: [
      "Istio control plane + Envoy sidecar rollout, namespace by namespace",
      "VirtualService / DestinationRule traffic policy and canary routing",
      "Cluster-wide mTLS with a migration path that does not break running traffic",
      "Kiali topology dashboards and Jaeger distributed tracing",
      "Load-test validated rollout, plus a mesh-off rollback plan"
    ],
    from: 22000, to: 48000, unit: "fixed", duration: "4–7 weeks", term: "short",
    stack: ["Istio","Envoy","Cilium","Kiali","Jaeger"]
  },
  {
    id: "iac", cat: "iac", icon: "code",
    name: "Infrastructure as Code — Terraform & Ansible",
    blurb: "Turn click-ops into reviewable code. Modular Terraform with remote state and multi-environment workspaces, plus Ansible for fleet configuration across dozens or hundreds of servers.",
    includes: [
      "Reusable Terraform module library with versioning and a test harness",
      "Remote state (S3+DynamoDB / Azure Storage / GCS) with locking and encryption",
      "dev / staging / prod separation — no shared state, no copy-paste drift",
      "Ansible roles + dynamic inventory for OS, patching and agent rollout",
      "Checkov / tfsec policy gates wired into CI"
    ],
    from: 14000, to: 30000, unit: "fixed", duration: "2–5 weeks", term: "short",
    stack: ["Terraform","Terragrunt","Ansible","Checkov","Terraformer"]
  },
  {
    id: "iac-retrofit", cat: "iac", icon: "wrench",
    name: "IaC Retrofit — reverse-engineer existing infrastructure",
    blurb: "You have production running and nobody knows how it was built. We import it into version-controlled Terraform, close the drift, and give you a plan that comes back clean.",
    includes: [
      "Full inventory of live resources across accounts and regions",
      "Terraformer-assisted import into modular, reviewable code",
      "Drift reconciliation until `terraform plan` shows no unexpected changes",
      "Documentation of every undocumented decision we uncover",
      "Handover so your team owns it, not us"
    ],
    from: 14000, to: 32000, unit: "fixed", duration: "3–6 weeks", term: "short",
    stack: ["Terraform","Terraformer","AWS","Azure"]
  },
  {
    id: "cicd", cat: "cicd", icon: "pipeline",
    name: "CI/CD Pipeline Build — GitHub Actions, Jenkins, Azure DevOps",
    blurb: "Code to production without a human running commands. Build, test, scan, sign, deploy — with OIDC to your cloud instead of long-lived keys, and a rollback that works.",
    includes: [
      "Branch strategy, protection rules, CODEOWNERS and PR gates",
      "Build + unit/integration test stages with caching that actually saves time",
      "Security gates: SonarQube SAST, Trivy, GitLeaks, OWASP ZAP DAST",
      "Keyless cloud auth via OIDC — no static credentials in CI",
      "Blue-green or canary deploy with automated rollback on failed health checks"
    ],
    from: 12000, to: 28000, unit: "fixed", duration: "2–4 weeks", term: "short",
    stack: ["GitHub Actions","Jenkins","Azure DevOps","OIDC","Trivy","SonarQube"],
    featured: true
  },
  {
    id: "gitops", cat: "cicd", icon: "git",
    name: "GitOps with ArgoCD or Flux",
    blurb: "Git becomes the only way anything reaches the cluster. Automatic sync, drift detection, self-heal, and progressive delivery with Argo Rollouts.",
    includes: [
      "Repository structure for app-of-apps or ApplicationSets across environments",
      "Sync policy, pruning, self-heal and drift alerting",
      "Environment promotion flow (dev → staging → prod) with approval gates",
      "Progressive delivery: canary / blue-green via Argo Rollouts",
      "Secrets handled through External Secrets Operator or Sealed Secrets"
    ],
    from: 11000, to: 24000, unit: "fixed", duration: "2–4 weeks", term: "short",
    stack: ["ArgoCD","Flux","Helm","Kustomize","Argo Rollouts"]
  },
  {
    id: "observability", cat: "observability", icon: "chart",
    name: "Observability Platform — Grafana, Prometheus, Loki, Mimir",
    blurb: "Stop finding out from customers. Metrics, logs, traces and alerts that route to the right person, with dashboards built around your services rather than generic templates.",
    includes: [
      "Prometheus + Grafana, or Grafana Cloud — your call on managed vs self-hosted",
      "Loki for logs, Mimir for long-term multi-tenant metric retention",
      "OpenTelemetry instrumentation guidance and trace pipeline",
      "SLO definitions with burn-rate alerting — not CPU-threshold noise",
      "Alertmanager routing into PagerDuty / Opsgenie / Slack with escalation"
    ],
    from: 15000, to: 32000, unit: "fixed", duration: "3–5 weeks", term: "short",
    stack: ["Prometheus","Grafana","Loki","Mimir","Alertmanager","OpenTelemetry"],
    featured: true
  },
  {
    id: "apm", cat: "observability", icon: "pulse",
    name: "Datadog / Dynatrace Rollout & Cost Control",
    blurb: "Commercial APM deployed properly — agent coverage, meaningful monitors, and ingest volume kept under control so the invoice doesn't become the incident.",
    includes: [
      "Agent / OneAgent rollout across hosts, containers and serverless",
      "Monitor and SLO configuration mapped to real user-facing symptoms",
      "Log ingest filtering and index tiering to control spend",
      "Dashboards per service owner, not one dashboard for everyone",
      "Migration path off the tool if you ever want one"
    ],
    from: 12000, to: 26000, unit: "fixed", duration: "2–4 weeks", term: "short",
    stack: ["Datadog","Dynatrace","OpenTelemetry"]
  },
  {
    id: "databases", cat: "data", icon: "db",
    name: "Database Setup, Migration & Reliability",
    blurb: "We set up, migrate and operate your data tier: PostgreSQL, MySQL, Oracle, SQL Server, RDS/Aurora, DynamoDB, Redis, Neo4j. Including the part everyone skips — testing the restore.",
    includes: [
      "Greenfield setup or lift into managed services (RDS, Aurora, Azure SQL, Cloud SQL)",
      "Heterogeneous migration with DMS or logical replication, minimal-downtime cutover",
      "Backup strategy with a restore that is actually rehearsed, and an RPO/RTO you signed off",
      "Replication, failover and connection pooling (PgBouncer / ProxySQL)",
      "Versioned schema migrations via Liquibase or Flyway wired into CI"
    ],
    from: 20000, to: 60000, unit: "fixed", duration: "4–10 weeks", term: "long",
    stack: ["PostgreSQL","MySQL","Oracle","RDS","Aurora","DynamoDB","Neo4j","Redis"]
  },
  {
    id: "data-platform", cat: "data", icon: "layers",
    name: "Data Platform & Pipeline Engineering",
    blurb: "Ingestion, transformation and serving layers built to be re-run safely: Airflow or Glue orchestration, Iceberg/Delta table formats, Athena or warehouse serving.",
    includes: [
      "Airflow / MWAA or AWS Glue orchestration with idempotent, retry-safe tasks",
      "Lakehouse storage on S3/ADLS with Iceberg or Delta Lake",
      "Athena, Redshift, BigQuery or Snowflake serving layer",
      "Data quality checks and lineage so failures are caught before dashboards lie",
      "Cost guardrails on scan volume and cluster runtime"
    ],
    from: 28000, to: 85000, unit: "fixed", duration: "6–14 weeks", term: "long",
    stack: ["Airflow","Glue","Athena","EMR","Iceberg","Delta Lake","Snowflake","BigQuery"]
  },
  {
    id: "mlops", cat: "data", icon: "brain",
    name: "MLOps — model deployment & serving",
    blurb: "Get models off a laptop and into production: versioned data, tracked experiments, and a serving layer on Kubernetes with the same CI/CD discipline as any other service.",
    includes: [
      "KServe or SageMaker endpoints with autoscaling and canary model rollout",
      "DVC for dataset versioning, MLflow for experiment and model registry",
      "Retraining pipeline triggered on schedule or on drift",
      "Model and feature monitoring wired into the same observability stack",
      "GitOps promotion of model versions through environments"
    ],
    from: 24000, to: 65000, unit: "fixed", duration: "5–12 weeks", term: "long",
    stack: ["KServe","MLflow","DVC","SageMaker","Kubeflow","Feast"]
  },
  {
    id: "security", cat: "security", icon: "shield",
    name: "Security & Compliance Hardening",
    blurb: "Close the findings before an auditor or an attacker does. IAM least-privilege, policy-as-code, supply-chain controls, and evidence mapped to the framework you're being held to.",
    includes: [
      "IAM / RBAC least-privilege review and remediation across cloud and cluster",
      "Policy-as-code with OPA / Gatekeeper / Azure Policy enforced in CI and cluster",
      "Supply chain: image signing, SBOM generation, Trivy and Snyk gates",
      "Secrets migrated out of code into Vault / Secrets Manager / Key Vault",
      "Control mapping to CIS Benchmarks, SOC 2, ISO 27001 or PCI-DSS as required"
    ],
    from: 16000, to: 38000, unit: "fixed", duration: "3–6 weeks", term: "short",
    stack: ["OPA","Trivy","Snyk","Vault","GitLeaks","OWASP ZAP","CIS"]
  },
  {
    id: "finops", cat: "cloud", icon: "coins",
    name: "Cloud Cost Optimization (shared-savings)",
    blurb: "We find the waste and prove the saving. Rightsizing, commitment strategy, storage tiering, idle-resource elimination — with Kubecost or native tooling left behind so it doesn't creep back.",
    includes: [
      "Full spend breakdown by account, service, team and environment",
      "Rightsizing and idle-resource findings with dollar figures attached",
      "Savings Plans / Reserved Instance / CUD commitment modelling",
      "Storage lifecycle tiering and egress reduction",
      "Kubecost or native cost allocation with per-team showback"
    ],
    from: 9500, to: 9500, unit: "fixed + 20% of verified 12-month savings",
    duration: "2–3 weeks", term: "short",
    stack: ["Kubecost","Cost Explorer","Azure Cost Management"]
  },
  {
    id: "sre", cat: "observability", icon: "alert",
    name: "SRE & Production Readiness",
    blurb: "Error budgets, on-call that people can survive, incident response with real post-incident review, and load testing that tells you where it breaks before your customers do.",
    includes: [
      "SLI/SLO definition per service with error budget policy",
      "On-call rotation, escalation policy and paging hygiene in PagerDuty / Opsgenie",
      "Runbooks written for the person paged at 03:00, not for the author",
      "k6 or Gatling load testing against SLO targets",
      "Blameless post-incident review process, introduced and facilitated"
    ],
    from: 15000, to: 34000, unit: "fixed", duration: "3–6 weeks", term: "short",
    stack: ["PagerDuty","Opsgenie","k6","Grafana","Chaos Mesh"]
  }
];

/* ---------- Retainers ---------------------------------------------------- */
NP.retainers = [
  {
    name: "Essential", price: 3500, unit: "/ month",
    blurb: "Keeps a healthy platform healthy. Best once a build is delivered and running.",
    items: [
      "Up to 20 engineering hours per month",
      "Business hours support, Mon–Fri 09:00–18:00 ET",
      "Next-business-day response target",
      "Patching, upgrades and dependency maintenance",
      "Monthly health and cost report"
    ],
    term: "3-month minimum, 30 days' notice"
  },
  {
    name: "Growth", price: 8500, unit: "/ month", featured: true,
    blurb: "For teams shipping continuously who need a platform partner, not a ticket queue.",
    items: [
      "Up to 50 engineering hours per month",
      "Extended hours 07:00–20:00 ET + 12×5 on-call",
      "4-hour response target, 1 hour for Severity 1",
      "Quarterly architecture and cost review",
      "Named lead engineer, direct Slack or Teams channel",
      "Roadmap input and capacity planning"
    ],
    term: "6-month minimum, 60 days' notice"
  },
  {
    name: "Enterprise", price: 18000, unit: "/ month, from",
    blurb: "24/7 ownership of a production platform, with a contractual SLA behind it.",
    items: [
      "Dedicated pod — engineer, architect and delivery manager",
      "24/7/365 on-call with 15-minute Severity 1 acknowledgement",
      "Contractual uptime SLA with service credits",
      "Change advisory participation and audit evidence support",
      "Disaster recovery testing twice a year",
      "Eligible for Reliability Status clearance work"
    ],
    term: "12-month term, 90 days' notice"
  }
];

/* ---------- Rate card ---------------------------------------------------- */
NP.rates = [
  { role: "Principal Architect / Fractional Head of Platform", rate: "$210 – $260", note: "Architecture, cloud strategy, vendor and cost decisions" },
  { role: "Senior DevOps / SRE / Platform Engineer",           rate: "$155 – $195", note: "Hands-on build, migration, Kubernetes, IaC, CI/CD" },
  { role: "Cloud Security / DevSecOps Engineer",               rate: "$165 – $205", note: "Hardening, policy-as-code, compliance evidence" },
  { role: "Senior Data Engineer",                              rate: "$150 – $190", note: "Pipelines, lakehouse, warehouse, migrations" },
  { role: "Database Reliability Engineer",                     rate: "$160 – $200", note: "Migration, replication, performance, DR" },
  { role: "Data Analyst / BI Engineer",                        rate: "$105 – $140", note: "Reporting, dashboards, analytics enablement" },
  { role: "Delivery / Engagement Manager",                     rate: "$130 – $165", note: "Included at no charge on fixed-scope engagements" }
];

/* ---------- Estimator line items ---------------------------------------- */
NP.estimatorItems = [
  { id:"lz",   label:"Cloud landing zone (new account/subscription structure)", low:18000, high:35000, weeks:4 },
  { id:"mig",  label:"Migrate existing workloads from on-prem or another cloud", low:45000, high:110000, weeks:12 },
  { id:"k8s",  label:"Kubernetes cluster + ingress + autoscaling",              low:25000, high:55000, weeks:6 },
  { id:"mesh", label:"Service mesh (Istio/Cilium) with mTLS and canary routing", low:22000, high:48000, weeks:5 },
  { id:"iac",  label:"Terraform + Ansible infrastructure as code",              low:14000, high:30000, weeks:3 },
  { id:"ci",   label:"CI/CD pipeline with security gates",                      low:12000, high:28000, weeks:3 },
  { id:"gops", label:"GitOps deployment (ArgoCD or Flux)",                      low:11000, high:24000, weeks:3 },
  { id:"obs",  label:"Observability stack (Prometheus/Grafana/Loki/Mimir)",     low:15000, high:32000, weeks:4 },
  { id:"db",   label:"Database setup or migration",                            low:20000, high:60000, weeks:7 },
  { id:"sec",  label:"Security hardening and compliance mapping",               low:16000, high:38000, weeks:4 },
  { id:"finops",label:"Cloud cost optimization engagement",                     low:9500,  high:9500,  weeks:2 },
  { id:"sre",  label:"SRE readiness: SLOs, on-call, runbooks, load testing",    low:15000, high:34000, weeks:4 }
];

/* ---------- Case studies -------------------------------------------------- */
NP.cases = [
  {
    client: "Greater Toronto Airports Authority", sector: "Aviation",
    via: "Delivered while at Wipro Technologies (client account)",
    period: "2020 – 2023",
    headline: "180+ microservices moved from on-premises to AWS with zero service disruption",
    problem: "A safety-critical aviation estate running on-premises, with 27 separate load balancers, manual deployments across 500+ production hosts, and no consistent way to observe service-to-service traffic.",
    work: [
      "Provisioned EKS, RDS, S3, EC2, VPCs with public/private subnets, security groups, bastion hosts and Route 53 entirely through Terraform and Ansible",
      "Released through GitHub Actions using blue-green and canary strategies",
      "Implemented Istio across all 180+ services — VirtualServices and DestinationRules for traffic policy, Envoy sidecars for mTLS, retries and circuit breaking",
      "Used Kiali for mesh topology and Jaeger for distributed tracing to resolve latency during rollouts",
      "Consolidated 27 load balancers into a unified ALB/NLB design with automated scaling",
      "Built the secure pipeline: SonarQube, GitLeaks, Trivy, OWASP ZAP, k6 SLO tests, ArgoCD canary releases"
    ],
    results: [
      ["Zero", "service disruption during migration"],
      ["99.9%", "uptime sustained over 12 months"],
      ["~40%", "reduction in cloud infrastructure cost"],
      ["3×", "peak-season traffic absorbed without incident"]
    ],
    stack: ["AWS","EKS","Terraform","Ansible","Istio","ArgoCD","GitHub Actions","Kiali","Jaeger"]
  },
  {
    client: "RSA Insurance Group", sector: "Insurance",
    via: "Delivered while at Wipro Technologies (client account)",
    period: "2019",
    headline: "14 fragmented network connections consolidated into a single Azure Virtual WAN hub",
    problem: "Network sprawl across an insurance estate, with fragmented connectivity, inconsistent monitoring and compliance obligations that the existing topology made difficult to evidence.",
    work: [
      "Consolidated 14 separate network connections into one Azure Virtual WAN hub with centralised monitoring",
      "Designed a secure Azure foundation: VNet, private subnets, least-privilege access controls",
      "Kubernetes workloads instrumented with Azure Monitor",
      "Topology and controls documented against insurance-sector compliance requirements"
    ],
    results: [
      ["40%", "cloud infrastructure cost reduction"],
      ["14 → 1", "network connections consolidated"],
      ["Centralised", "monitoring across the estate"]
    ],
    stack: ["Azure","Virtual WAN","AKS","Azure Monitor","Key Vault"]
  },
  {
    client: "Citibank", sector: "Banking",
    via: "Delivered while at Wipro Technologies (client account)",
    period: "2018",
    headline: "10 TB+ of Oracle financial data automated for backup, patching and recovery",
    problem: "24/7 mission-critical banking operations with regulated change windows, where manual database maintenance created both downtime risk and audit exposure.",
    work: [
      "Automated backup, patching and recovery for 10 TB+ of critical Oracle financial data",
      "Standardised rollback runbooks used during regulated change windows",
      "Built foundational cloud networking and container infrastructure",
      "Automated deployment pipelines with defined incident response"
    ],
    results: [
      ["10 TB+", "Oracle estate under automated protection"],
      ["24/7", "mission-critical operation supported"],
      ["Reduced", "error rate in regulated change windows"]
    ],
    stack: ["Oracle RAC","Linux","Shell","Container infrastructure"]
  },
  {
    client: "Rugby Canada", sector: "Sport / Non-profit",
    via: "Platform engineering engagement",
    period: "2025 – 2026",
    headline: "MTTD and MTTR cut from hours to minutes, and a churn model put into production",
    problem: "No enterprise monitoring at all, and seven years of membership data that the organisation could not act on.",
    work: [
      "Built Prometheus, Loki and Grafana monitoring from the ground up across 4 data sources",
      "Deployed Mimir across both monolithic and distributed Kubernetes architectures for long-term, multi-tenant metric retention",
      "Deployed a churn prediction model with KServe on Kubernetes, with DVC versioning 7 years of membership data",
      "Automated the model deployment pipeline with GitHub Actions and ArgoCD GitOps",
      "Built and operate an Amazon EKS MCP Server integrated with Amazon Q Developer for AI-assisted infrastructure diagnostics"
    ],
    results: [
      ["Hours → minutes", "MTTD and MTTR"],
      ["4", "data sources unified into Grafana"],
      ["7 years", "of membership data versioned and served"],
      ["Zero", "data loss on Mimir long-term retention"]
    ],
    stack: ["Kubernetes","Prometheus","Loki","Grafana","Mimir","KServe","DVC","ArgoCD","Amazon Q"]
  },
  {
    client: "Digitalogy LLC", sector: "AI Research",
    via: "Infrastructure automation engagement",
    period: "2025",
    headline: "Undocumented AWS production infrastructure reverse-engineered into version-controlled Terraform",
    problem: "Production infrastructure with no documentation and growing configuration drift, and a developer environment that took multiple days to stand up.",
    work: [
      "Reverse-engineered undocumented AWS production infrastructure into modular Terraform",
      "Built reusable Terraform modules and GitHub Actions pipelines preserving IAM controls and peer review gates",
      "Created a self-service KIND Kubernetes and ArgoCD pre-production validation environment"
    ],
    results: [
      ["~30%", "reduction in early-stage cloud cost"],
      ["Days → <1 hour", "developer environment setup"],
      ["100%", "of production infrastructure under version control"]
    ],
    stack: ["AWS","Terraform","GitHub Actions","KIND","ArgoCD"]
  }
];

/* ---------- People ---------------------------------------------------------
   IMPORTANT — LEGAL / PRIVACY:
   Do NOT set published:true for anyone until that person has given you WRITTEN
   consent to appear on this site as part of the company. Publishing a real
   person's name and role without consent creates exposure under PIPEDA and can
   amount to misrepresentation to prospective clients.
   --------------------------------------------------------------------------- */
NP.people = [
  {
    published: true,
    name: "Vidhya Shanker Goel",
    role: "Founder & Principal Platform Engineer",
    location: "Toronto, ON",
    bio: "Eight-plus years of production infrastructure across banking, aviation, insurance and AI research. Led the migration of 180+ microservices to AWS for the Greater Toronto Airports Authority with zero service disruption, and has led teams of four and eight engineers. Certified Kubernetes Administrator; Microsoft Certified Azure Developer Associate; 20+ Oracle certifications.",
    certs: ["CKA","AZ-203","AZ-900","Oracle OCP"],
    links: { linkedin: "https://www.linkedin.com/in/vidhyashankergoel/", github: "https://github.com/vidhya101" }
  },
  { published: false, name: "Kaustubh Deshmukh", role: "Senior Data Engineer", location: "Toronto, ON",
    bio: "Big-data engineering across AWS and Azure.", certs: [], links: {} },
  { published: false, name: "Ananya Aswal", role: "Data Analytics & BI", location: "Toronto, ON",
    bio: "Microsoft Certified Data Analyst (PL-300). SQL, Power BI, Python.", certs: ["PL-300"], links: {} },
  { published: false, name: "Manish Dua", role: "Senior Data Engineer", location: "Toronto, ON",
    bio: "", certs: [], links: {} },
  { published: false, name: "Himalay Dwivedi", role: "Data Analyst", location: "Toronto, ON",
    bio: "Power BI, SQL, Python.", certs: [], links: {} },
  { published: false, name: "Mohammad Haris Rasheed", role: "Data / Business Analyst", location: "Toronto, ON",
    bio: "SQL, Python, R, Databricks, Power BI.", certs: [], links: {} }
];

/* ---------- FAQ ---------------------------------------------------------- */
NP.faq = [
  { q: "Do you take short engagements, or only long programmes?",
    a: "Both. The smallest thing we do is a fixed-price infrastructure audit — five business days, one written report, no obligation. The largest are multi-wave cloud migrations running over six to twelve months. Most clients start small and expand once they've seen the work." },
  { q: "How do you price — hourly or fixed?",
    a: "Fixed price wherever the scope can be pinned down, because that puts the delivery risk on us rather than you. Time-and-materials at the published rate card for open-ended or advisory work. Cost optimization is priced as a small fixed fee plus a share of verified savings, so we only do well if you do." },
  { q: "Who actually does the work?",
    a: "Named engineers, assigned at proposal stage, and you meet them before you sign. We do not bid with senior people and staff with juniors. Team size scales from a single engineer to a full pod depending on the engagement." },
  { q: "What happens at the end of an engagement?",
    a: "Everything we build is in your repositories, under your cloud accounts, with documentation and recorded handover sessions. No proprietary wrapper, no lock-in to us. A retainer afterwards is an option, never a requirement." },
  { q: "Can you work with our existing team and tooling?",
    a: "Yes — that is the normal case. We adopt the conventions already in your repo rather than imposing ours, and we would rather improve the pipeline you have than replace it for the sake of it." },
  { q: "Do you handle regulated or public-sector work?",
    a: "Yes. Prior delivery includes banking (Citibank), insurance (RSA) and critical aviation infrastructure (GTAA), all under regulated change control. The founder is eligible for Canadian Reliability Status clearance." },
  { q: "Are you insured, and can you sign our MSA?",
    a: "Commercial general liability, professional liability (E&O) and cyber coverage are carried at levels appropriate to the engagement — certificates provided on request. We sign client MSAs, NDAs and DPAs, and we are comfortable with standard Canadian procurement terms." },
  { q: "Where are you based, and do you work remotely?",
    a: "Toronto, Ontario. Most delivery is remote across North American time zones; on-site in the Greater Toronto Area is available for workshops, cutovers and discovery, and further afield with travel costs agreed in advance." }
];
