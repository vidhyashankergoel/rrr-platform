/**
 * PUBLIC PROOF
 *
 * Things a prospect can verify without talking to us. For a new firm this is
 * the most valuable asset on the site: not claims, but artefacts they can open
 * in another tab and judge for themselves.
 *
 * SELECTION RULE: original work only. Tutorial follow-alongs and course
 * projects are excluded even though they are public — a prospect who
 * recognizes a well-known training repository learns nothing good about us.
 * Every entry below is a non-fork repository with real content.
 *
 * ADDING A LINKEDIN POST: paste the permalink from the post's "..." menu →
 * "Copy link to post". Keep `takeaway` honest — what a reader actually learns,
 * not a sales line. Entries with an empty `url` are filtered out and never
 * render, so an unfinished one can sit here safely.
 */

import { company } from "./company";

export const portfolioUrl = "https://vidhya101.github.io/my-portfolio-1/";

export interface ProofProject {
  name: string;
  category:
    | "CI/CD"
    | "Observability"
    | "Kubernetes"
    | "Infrastructure as code"
    | "Automation"
    | "AI-assisted engineering";
  blurb: string;
  stack: string[];
  repo: string;
  /** Why this is worth a prospect's attention, in one line. */
  why: string;
}

const GH = "https://github.com/vidhya101";

export const projects: ProofProject[] = [
  {
    name: "Azure CI/CD reference architecture",
    category: "CI/CD",
    blurb:
      "A reusable end-to-end pipeline on GitHub Actions: SonarQube quality gates, JFrog and Nexus artifact management, and Azure OIDC federation so no long-lived credentials exist anywhere in the pipeline.",
    stack: ["GitHub Actions", "Azure", "OIDC", "SonarQube", "JFrog", "Nexus"],
    repo: `${GH}/azure-cicd-reference`,
    why: "This is the pipeline pattern we would build for you, published in full before you engage us.",
  },
  {
    name: "Grafana observability toolkit",
    category: "Observability",
    blurb:
      "Twenty-five production-grade Grafana dashboards with a searchable PromQL and LogQL query reference alongside them, designed to drop into any Prometheus and Loki stack.",
    stack: ["Grafana", "Prometheus", "Loki", "PromQL", "LogQL"],
    repo: `${GH}/grafana-observability-toolkit`,
    why: "Dashboards are where observability engagements are actually judged. Here are ours.",
  },
  {
    name: "PromQL and LogQL query reference",
    category: "Observability",
    blurb:
      "Over 150 classified queries for SRE and DevOps troubleshooting, in a single self-contained HTML page with no dependencies.",
    stack: ["PromQL", "LogQL", "Prometheus", "Loki", "SRE"],
    repo: `${GH}/promql-logql-query-reference`,
    why: "The queries you reach for at 03:00. Useful to you whether or not you ever hire us.",
  },
  {
    name: "In-cluster Kubernetes AI operator",
    category: "AI-assisted engineering",
    blurb:
      "An agentic Kubernetes operator running against a local Ollama model, packaged with a full DevSecOps Claude Code configuration — the same controlled-agent approach described on our security page.",
    stack: ["Kubernetes", "Python", "Ollama", "Operators", "DevSecOps"],
    repo: `${GH}/k8s-ai-operator`,
    why: "Our AI-assisted engineering claims, as running code you can read rather than a slide.",
  },
  {
    name: "Isolated agent execution containers",
    category: "Kubernetes",
    blurb:
      "Per-task Docker and Kubernetes containers that sandbox automated agents, so an agent cannot reach anything outside the task it was given.",
    stack: ["Docker", "Kubernetes", "Sandboxing", "Ollama"],
    repo: `${GH}/hive-k8s-agents`,
    why: "The containment boundary behind 'no agent touches your environment'.",
  },
  {
    name: "Terraform AWS VPC module",
    category: "Infrastructure as code",
    blurb:
      "A reusable VPC module — subnet topology, routing, gateways — of the kind that forms the network layer of every landing zone we build.",
    stack: ["Terraform", "AWS", "VPC", "HCL"],
    repo: `${GH}/terraform-aws-module-vpc`,
    why: "Module structure and naming conventions, so you can judge the code before you buy it.",
  },
  {
    name: "GitHub Actions reference template",
    category: "CI/CD",
    blurb:
      "A comprehensive workflow template with a small Go demonstration application, covering build, test, scan and deploy stages with pinned actions throughout.",
    stack: ["GitHub Actions", "Go", "CI/CD"],
    repo: `${GH}/githubaction`,
    why: "Every action pinned to a version. A small detail that separates a safe pipeline from a supply-chain incident.",
  },
  {
    name: "Ansible command reference",
    category: "Automation",
    blurb:
      "A searchable single-page reference for Ansible, built for DevOps, DevSecOps, SRE and platform engineers who need the right module quickly.",
    stack: ["Ansible", "Automation", "Configuration management"],
    repo: `${GH}/ansible-command-reference`,
    why: "Ansible is half of how we manage server fleets. This is the working knowledge behind that.",
  },
  {
    name: "Code intelligence graph",
    category: "AI-assisted engineering",
    blurb:
      "A local-first structural code graph exposed over MCP and a CLI, so a review reads only the blast radius of a change rather than scanning an entire repository.",
    stack: ["MCP", "Tree-sitter", "Static analysis"],
    repo: `${GH}/code-review-graph`,
    why: "How we review large codebases quickly without guessing at impact.",
  },
];

/** Older course and tutorial projects, kept for completeness but not featured. */
export const archiveNote =
  "Earlier learning projects — vProfile, Jenkins pipelines, Databricks case studies — remain public on the profile. They are course work rather than original engineering, so they are not featured here.";

export interface ProofPost {
  title: string;
  topic: string;
  takeaway: string;
  url: string;
}

export const posts: ProofPost[] = [
  {
    title: "Migrating 180+ microservices with zero service disruption",
    topic: "Cloud migration",
    takeaway:
      "The sequencing and rollback rehearsal that made a zero-downtime aviation migration possible — and the parts that were harder than expected.",
    url: "",
  },
  {
    title: "Istio across 180 services: what the diagrams do not tell you",
    topic: "Service mesh",
    takeaway:
      "Rolling out mTLS namespace by namespace without breaking live traffic, and using Kiali and Jaeger to find the latency the dashboards missed.",
    url: "",
  },
  {
    title: "Mimir for long-term, multi-tenant metrics",
    topic: "Observability",
    takeaway:
      "Running Mimir in both monolithic and distributed modes, and why the choice depends on tenancy rather than scale.",
    url: "",
  },
  {
    title: "Reverse-engineering undocumented production into Terraform",
    topic: "Infrastructure as code",
    takeaway:
      "Importing a live estate nobody had documented, and closing drift until the plan came back clean.",
    url: "",
  },
  {
    title: "A production EKS MCP server for AI-assisted diagnostics",
    topic: "AI-assisted engineering",
    takeaway:
      "Giving an AI agent structured, read-only access to a cluster — and exactly where the boundary has to sit.",
    url: "",
  },
  {
    title: "Putting a churn model into production with KServe",
    topic: "MLOps",
    takeaway:
      "Seven years of data versioned with DVC, served on Kubernetes, promoted through GitOps like any other service.",
    url: "",
  },
];

export const publishedPosts = () => posts.filter((p) => p.url.trim().length > 0);

export const profiles = [
  { label: "LinkedIn", url: company.linkedin, note: "Where the writing goes first" },
  { label: "GitHub — personal", url: company.githubPersonal, note: "Project repositories" },
  { label: "GitHub — organization", url: company.githubOrg, note: "Company repositories" },
  { label: "Docker Hub", url: company.dockerHub, note: "Published images" },
  { label: "Portfolio", url: portfolioUrl, note: "Project index with write-ups" },
];
