# GitHub organisation — setup and content

**I cannot create this for you** — it needs your authenticated GitHub account.
Everything below is ready to paste.

You already have `github.com/vidhya101` (personal) and
`github.com/vidhyashankergoel`. Decide which is which before you start:

- **Personal account** → your own projects, the portfolio, experiments
- **Organisation** → company repositories, client-facing modules, the profile
  a prospect lands on

---

## 1. Create the organisation

GitHub → **+** → **New organization** → **Free** plan.

| Field | Value |
|---|---|
| Organization name | `rrr-solution-providers` |
| Contact email | `hello@rrrsolutionproviders.ca` |
| This organization belongs to | **A business or institution** |

> Pick the handle carefully — changing it later breaks every clone URL, badge
> and CI reference that points at it.

---

## 2. Organisation profile

**Settings → Profile**

| Field | Value |
|---|---|
| Display name | `RRR Solution Providers` |
| Email | `hello@rrrsolutionproviders.ca` |
| Description | `Cloud, Kubernetes and platform engineering for Canadian teams. Published pricing. You own everything we build.` |
| URL | `https://www.rrrsolutionproviders.ca` |
| Location | `Toronto, Ontario, Canada` |
| Logo | 400×400 PNG from `/brand` |

---

## 3. The profile README

Create a **public** repository named exactly `.github`, then add
`profile/README.md`. GitHub renders it on the organisation landing page.

````markdown
<div align="center">

# RRR Solution Providers

**Cloud, Kubernetes and platform engineering for Canadian teams**

Toronto, Ontario 🇨🇦

[Website](https://www.rrrsolutionproviders.ca) ·
[Pricing](https://www.rrrsolutionproviders.ca/pricing) ·
[Security](https://www.rrrsolutionproviders.ca/security) ·
[LinkedIn](https://www.linkedin.com/company/rrr-solution-providers)

</div>

---

## What we do

We build, migrate and operate cloud platforms. AWS, Azure and GCP.

| | |
|---|---|
| **Cloud** | Landing zones, on-premises migration, multi-account governance |
| **Kubernetes** | EKS, AKS, GKE, OpenShift, ROSA, kubeadm — plus Istio and Cilium |
| **Infrastructure as code** | Terraform, Terragrunt, Ansible, policy-as-code |
| **CI/CD and GitOps** | GitHub Actions, Jenkins, Azure DevOps, ArgoCD, Flux |
| **Observability** | Prometheus, Grafana, Loki, Mimir, OpenTelemetry, Datadog |
| **Data** | PostgreSQL, Oracle, RDS, Aurora, Airflow, lakehouse, MLOps |
| **Security** | Least-privilege IAM, supply-chain controls, CIS / SOC 2 / ISO 27001 |

---

## How we work

**Published pricing.** Every service carries a price range in Canadian dollars
and a realistic duration, on our website. You can budget before you talk to us.

**You own everything.** All work lands in your repositories and your cloud
accounts, with runbooks and recorded handover. No proprietary wrapper. The test
we hold ourselves to: your team can run it the day we leave.

**Agents propose, humans dispose.** We use AI heavily for reading, drafting and
decomposition. No agent applies a change to a client environment, and every
outward-facing action requires a named human to approve it.

---

## Track record

| Client | Sector | Outcome |
|---|---|---|
| Greater Toronto Airports Authority | Aviation | 180+ microservices migrated to AWS, zero service disruption, 99.9% uptime, ~40% cost reduction |
| RSA Insurance Group | Insurance | 14 network connections consolidated into one Azure Virtual WAN hub, 40% cost reduction |
| Citibank | Banking | 10 TB+ Oracle estate automated for backup, patching and recovery under regulated change control |
| Rugby Canada | Sport | MTTD and MTTR cut from hours to minutes; churn model in production on Kubernetes |
| Digitalogy | AI research | Undocumented AWS production reverse-engineered into version-controlled Terraform |

*Engagements delivered in the course of employment with the named employer, presented as evidence of hands-on capability.*

---

## Start small

**Fixed-price infrastructure audit — $4,500 CAD, five business days.**
Read-only access. A written report covering security exposure, cost waste with
dollar figures, and reliability risk. You keep it whether or not you engage us
further.

[Book an audit →](https://www.rrrsolutionproviders.ca/contact)

---

## Certifications

Certified Kubernetes Administrator (CKA) ·
Microsoft Certified: Azure Developer Associate (AZ-203) ·
Microsoft Certified: Azure Fundamentals (AZ-900) ·
Oracle Certified Professional ·
Eligible for Canadian Reliability Status

---

<div align="center">
<sub>hello@rrrsolutionproviders.ca · +1 (437) 366-4623 · Toronto, ON</sub>
</div>
````

---

## 4. Security settings — do these on day one

You are a firm that sells security hardening. Your own organisation being
misconfigured is the worst possible advertisement, and prospects **do** look.

**Settings → Authentication security**
- ✅ **Require two-factor authentication** for all members
- ✅ Require SAML SSO — only once you have a paid plan and staff

**Settings → Member privileges**
- Base permissions: **Read** (not Write)
- ❌ Members cannot create public repositories
- ❌ Members cannot delete or transfer repositories
- ❌ Members cannot change repository visibility

**Settings → Code security and analysis** — enable for all repositories
- ✅ Dependency graph
- ✅ Dependabot alerts
- ✅ Dependabot security updates
- ✅ **Secret scanning**
- ✅ **Push protection** — blocks a credential before it lands, which is the
  only control here that actually prevents the incident rather than reporting it
- ✅ Code scanning (CodeQL) on public repositories

**Settings → Actions → General**
- Workflow permissions: **Read repository contents permission** (not write)
- ❌ Do not allow GitHub Actions to create or approve pull requests
- Allowed actions: **Allow enterprise, and select non-enterprise, actions** —
  then pin the ones you use

---

## 5. Repository conventions

Every public repository gets:

- `README.md` — what it does, how to run it, what it assumes
- `LICENSE` — MIT for anything you want adopted, or none for client work
- `SECURITY.md` — how to report a vulnerability, and your response time
- `.github/dependabot.yml`
- Branch protection on `main`: require a PR, require status checks, no force push

### `SECURITY.md` template

```markdown
# Security Policy

## Reporting a vulnerability

Email **security@rrrsolutionproviders.ca** with:

- A description of the issue
- Steps to reproduce
- The impact you believe it has

**Do not open a public issue for a security report.**

## What to expect

| | |
|---|---|
| Acknowledgement | Within 2 business days |
| Initial assessment | Within 5 business days |
| Fix or mitigation plan | Communicated with the assessment |

We will not pursue good-faith security research that stops at proof of concept
and does not access, modify or destroy data belonging to others.
```

---

## 6. What to publish, and what never to

**Publish** — these are marketing assets that happen to be code:

- Reusable Terraform modules (VPC, EKS, RDS patterns)
- GitHub Actions workflow templates with security gates
- Helm chart scaffolds
- Grafana dashboard JSON and Prometheus alert rules
- Policy-as-code bundles (OPA / Gatekeeper)
- A reference landing zone

Each one is evidence of competence a prospect can read, which is exactly what a
new firm needs and cannot buy.

> **Never publish:** client names in code or commit messages, anything derived
> from a client's private repository, account IDs, ARNs, IP ranges, hostnames,
> or architecture diagrams of a client estate. Check commit history, not just
> the current file — `git log -p` before making a repository public.

---

## 7. Migrating the existing portfolio

Your projects currently live under `github.com/vidhya101`. Two options:

1. **Leave them** and link from the site — already wired up in
   `platform/src/lib/proof.ts`. Simplest, and honest: they are personal
   learning projects, not company work.
2. **Transfer** the ones that represent company capability (Terraform modules,
   pipeline templates) into the organisation, and clean up the READMEs first.

Recommendation: **option 1 now, option 2 when you have genuine company
repositories to sit alongside them.** An organisation containing only
transferred personal projects looks thinner than a personal account containing
the same projects.

---

## 8. After setup

Update `platform/src/lib/company.ts`:

```ts
githubOrg: "https://github.com/rrr-solution-providers",
```

The footer, the trust page and the assistant all read from that one constant.
