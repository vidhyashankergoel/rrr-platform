# LinkedIn company page — content to paste

Everything below is written to be pasted directly. Nothing here needs editing
before it goes live.

> ## ⚠️ Read this first
>
> **This content deliberately does not name past clients.** An earlier draft
> listed the Greater Toronto Airports Authority, RSA Insurance and Citibank by
> name. The live site does not, and neither should this — the two must say the
> same thing, or the discrepancy is the first thing a diligent prospect finds.
>
> The reason is in `TRADEMARK-AND-PRIOR-WORK.md`: that work was delivered
> under employment with Wipro, and until somebody has read the employment
> agreement and confirmed that *client identity* falls outside its
> confidentiality definition, naming those clients on a company page is a risk
> taken for a marginal gain. The descriptive form —
> "a major Canadian international airport authority" — carries nearly all the
> credibility with none of the exposure.
>
> If the agreement is later checked and permits naming them, change
> `ATTRIBUTION_MODE` in `platform/src/lib/attribution.ts` to `"named"` and
> update this page to match. **Change both or neither.**

---

## What I cannot do for you

Creating the page needs your LinkedIn login, and LinkedIn's API does not allow
a company page to be created programmatically. So: you create it, you paste
this in. Ten minutes.

---

## Before you start

You need a personal LinkedIn profile with a current position listed — LinkedIn
refuses to let you create a company page otherwise. Yours qualifies.

Have ready:

- **Logo** — `brand/logo-mark.svg` in this repository, exported to PNG at
  **300 × 300**
- **Cover image** — 1128 × 191
- **Website** — `https://www.rrrsolutionproviders.ca`

---

## Create

**linkedin.com/company/setup/new** → **Company**

| Field | Value |
|---|---|
| Name | `RRR Solution Providers` |
| Public URL | `linkedin.com/company/rrr-solution-providers` |
| Website | `https://www.rrrsolutionproviders.ca` |
| Industry | `IT Services and IT Consulting` |
| Company size | `1-10 employees` |
| Company type | `Privately Held` |
| Logo | the 300 × 300 PNG |
| Tagline | `Cloud, Kubernetes and platform engineering for Canadian teams` |

Tick the verification box, **Create page**.

> Add `Inc.` to the name only once incorporation is complete. Claiming a
> corporate form you do not yet hold is the kind of small inaccuracy that
> undermines everything else on the page.

---

## About section — paste verbatim

> We build, migrate and operate cloud platforms for Canadian organizations —
> AWS, Azure and GCP, Kubernetes, Terraform, CI/CD and observability.
>
> **What makes us different**
>
> **We publish our prices.** Every service on our site carries a price range in
> Canadian dollars and a realistic duration. You can build a budget before you
> speak to anyone.
>
> **You own everything.** All work lands in your repositories and your cloud
> accounts, with runbooks and recorded handover sessions. No proprietary
> wrapper, no component only we can renew. The test we hold ourselves to: your
> team can run the platform the day we leave.
>
> **We tell you when you don't need us.** If a two-day fix solves it, we say so
> on the call rather than shaping it into a six-week engagement.
>
> **Experience behind the work**
>
> • 180+ microservices moved from on-premises to AWS with zero service
> disruption — a major Canadian international airport authority
> • 14 fragmented network connections consolidated into a single Azure Virtual
> WAN hub, 40% cost reduction — a multinational general insurance group
> • 10 TB+ of Oracle financial data automated for backup, patching and recovery
> under regulated change control — a global retail and investment bank
> • Detection and resolution time cut from hours to minutes, and a churn model
> put into production on Kubernetes — Rugby Canada
> • Undocumented AWS production infrastructure reverse-engineered into
> version-controlled Terraform — Digitalogy LLC
>
> The first three were delivered by our founder in the course of employment
> with a global IT services firm. They are evidence of hands-on capability, not
> a claim of endorsement or of this company's corporate track record.
>
> **What we do**
>
> Cloud landing zones · On-premises to cloud migration · Kubernetes platforms
> (EKS, AKS, GKE, OpenShift, kubeadm) · Service mesh · Terraform and Ansible ·
> CI/CD and GitOps · Observability (Prometheus, Grafana, Loki, Mimir, Datadog)
> · Database setup and migration · MLOps · Security and compliance hardening ·
> Cloud cost optimization
>
> **How we start**
>
> A free 30-minute scoping call, or a fixed-price infrastructure audit at
> $4,500 over five business days. Read-only access, a written report, and you
> keep the report regardless of what happens next.
>
> Certified Kubernetes Administrator · Microsoft Certified Azure Developer
> Associate · Eligible for Canadian Reliability Status
>
> Toronto, Ontario 🇨🇦
> rrrsolutionproviders@gmail.com · +1 (437) 366-4623
> https://www.rrrsolutionproviders.ca

---

## Specialties — paste as a list (max 20)

```
Cloud Migration
Amazon Web Services (AWS)
Microsoft Azure
Google Cloud Platform (GCP)
Kubernetes
Terraform
Infrastructure as Code
CI/CD
DevOps
Site Reliability Engineering
GitOps
Observability
Prometheus
Grafana
Database Migration
PostgreSQL
Cloud Cost Optimization
Platform Engineering
Ansible
MLOps
```

---

## Location

| Field | Value |
|---|---|
| Country | Canada |
| State | Ontario |
| City | Toronto |
| Primary location | Yes |

Leave the street address blank until you have a registered office. A home
address on a public company page is a durable privacy mistake — and unlike a
DNS record, you cannot quietly change your mind after it has been indexed.

---

## People

### Your own profile

Add a position:

| Field | Value |
|---|---|
| Title | `Founder & Principal Cloud Engineer` |
| Company | `RRR Solution Providers` *(select the page once it exists)* |
| Location | Toronto, Ontario, Canada |
| Start date | your incorporation month |

Description:

> I build and operate cloud infrastructure for Canadian organizations — AWS,
> Azure and GCP, Kubernetes, Terraform, CI/CD and observability.
>
> Eight years of production infrastructure across aviation, insurance, banking
> and sport. Certified Kubernetes Administrator.
>
> We publish our prices, hand everything back in your own repositories, and say
> so when you do not need us.
>
> Free 30-minute scoping call: https://www.rrrsolutionproviders.ca

### Do not list anyone else without written consent

Naming a colleague as an employee of a company they have not agreed to join is
a misrepresentation, and under PIPEDA their name and employment status are
personal information you need consent to publish. Get it in writing —
an email saying "yes, list me as X" is enough — and keep it.

---

## First five posts

Post one a week. The rule behind all of them: **post what you learned, not what
you sell.** A feed of "we can help with Kubernetes!" converts nobody.

### 1 — Launch

> After eight years building cloud infrastructure for airports, insurers and
> banks, I have started my own firm.
>
> RRR Solution Providers does cloud migration, Kubernetes platforms,
> infrastructure as code and observability for Canadian organizations.
>
> Three things we do differently:
>
> **We publish our prices.** Every service on our site has a range in Canadian
> dollars and a realistic duration. No "contact us for pricing".
>
> **You own the work.** Everything lands in your repositories and your cloud
> accounts. Your team can run it the day we leave.
>
> **We say when you don't need us.** If a two-day fix solves it, we will tell
> you on the call.
>
> Starting with a fixed-price infrastructure audit: $4,500, five business days,
> read-only access, and the report is yours whether or not you hire us.
>
> https://www.rrrsolutionproviders.ca

### 2 — A real lesson

> The most expensive thing in a cloud migration is not the cloud bill.
>
> It is the infrastructure nobody wrote down.
>
> On one migration — 180+ microservices off on-premises — the estate had 27
> separate load balancers, manual deployments across 500+ production hosts, and
> no consistent way to see service-to-service traffic.
>
> None of that was in a document. It was in people's heads.
>
> The work that actually took the time was not provisioning EKS. It was
> reverse-engineering what was already running, writing it down, and proving
> the written version matched reality before touching anything.
>
> If you are planning a migration, budget for discovery properly. The estimate
> that goes wrong is always the one that assumed the existing setup was
> documented.

### 3 — An opinion worth disagreeing with

> Most teams adopting Kubernetes do not need Kubernetes.
>
> They need repeatable deploys, a way to roll back, and somewhere to see what
> is happening. Kubernetes gives you those — along with a control plane to
> operate, a networking model to learn, and an upgrade treadmill.
>
> If you run six services with predictable traffic, a container service like
> ECS or Cloud Run will get you the same outcome for a fraction of the
> operational weight.
>
> Kubernetes earns its keep at dozens of services, multiple teams deploying
> independently, or genuinely variable load.
>
> We build Kubernetes platforms. We also talk people out of them. Those are
> not in conflict.

### 4 — Something concrete

> A short reference we use on every engagement: the PromQL and LogQL queries
> that actually get used during an incident.
>
> Not the tutorial ones. The ones you want at 3am when something is on fire and
> you need to know which service, which pod, and since when.
>
> https://github.com/vidhya101/promql-logql-query-reference
>
> Free, no sign-up. If you have a query that has saved you, add it.

### 5 — The audit

> The cheapest way to find out whether your cloud setup is a problem.
>
> A fixed-price infrastructure audit: $4,500, five business days, read-only
> access we never need to keep.
>
> You get a written report on security exposure, cost waste with dollar figures
> attached, and reliability risk — plus a remediation plan your own team can
> execute.
>
> The report is yours whether or not you use us for the work. If you take it to
> another firm, that is a perfectly reasonable outcome.
>
> Before any access: a mutual NDA, and credentials you issue and can revoke.
>
> https://www.rrrsolutionproviders.ca/contact

---

## Settings to change immediately after creating the page

| Setting | Why |
|---|---|
| **Custom button** → "Visit website" → your URL | The default does nothing useful |
| **Page admins** → add a second admin once someone qualifies | A single admin means one lost account loses the page |
| **Auto-invite connections** → OFF until there is content | Inviting people to an empty page wastes invitations you cannot get back |

---

## After the page exists

Put its URL into `platform/src/lib/company.ts`:

```ts
linkedinCompany: "https://www.linkedin.com/company/rrr-solution-providers",
```

The footer, the contact page and the structured data all read from that
constant, so one line makes the link appear everywhere. Push, and it deploys
in about 45 seconds.

---

## A note on the posts

The LinkedIn agent (`docs/AGENTS.md` §7) drafts posts like these on an ongoing
basis and stores them in the `ContentDraft` table. It writes them; you publish
them.

That split is not a limitation of the implementation. LinkedIn's API does not
permit posting to a personal profile without partner access, and automating the
site breaches the User Agreement — the penalty is losing the account your
company page depends on. Thirty seconds of pasting is the better trade.
