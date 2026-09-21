# LinkedIn company page — exact content to paste

**I cannot create this for you** — it requires your authenticated LinkedIn
login, and creating accounts on your behalf is not something I'll do. Everything
below is ready to paste. Should take about twenty minutes.

---

## Before you start

You need:

- A personal LinkedIn profile at least 7 days old with a profile photo ✓ (you have this)
- **A company email on your own domain** (`you@rrrsolutionproviders.ca`).
  LinkedIn will not let you verify a company page with a Gmail address.
  **Do the domain and email first** — see `INCORPORATION.md` step 9.
- The logo exported as PNG (see "Assets" below)

> If you create the page before the domain exists, you will be stuck with an
> unverified page. Wait the extra day.

---

## Create

LinkedIn → grid icon (top right) → **Create a Company Page** → **Company**

| Field | Value |
|---|---|
| **Name** | `RRR Solution Providers` |
| **Public URL** | `linkedin.com/company/rrr-solution-providers` |
| **Website** | `https://www.rrrsolutionproviders.ca` |
| **Industry** | `IT Services and IT Consulting` |
| **Company size** | `2–10 employees` |
| **Company type** | `Privately Held` |
| **Founded** | `2026` |
| **Tagline** (120 char max) | `Cloud, Kubernetes and platform engineering for Canadian teams. Published pricing. You own everything we build.` |

> **On company size:** pick the truthful band. "51–200" on a page with one
> employee listed is checked by exactly the enterprise buyers you want, and it
> is the kind of discrepancy that ends a procurement conversation.

---

## About section (paste verbatim)

> We build, migrate and operate cloud platforms for Canadian organisations — AWS, Azure and GCP, Kubernetes, Terraform, CI/CD and observability.
>
> **What makes us different**
>
> **We publish our prices.** Every service on our site carries a price range in Canadian dollars and a realistic duration. You can build a budget before you speak to anyone.
>
> **You own everything.** All work lands in your repositories and your cloud accounts, with runbooks and recorded handover sessions. No proprietary wrapper, no component only we can renew. The test we hold ourselves to: your team can run the platform the day we leave.
>
> **We tell you when you don't need us.** If a two-day fix solves it, we say so on the free scoping call rather than shaping it into a six-week engagement.
>
> **Experience behind the work**
>
> • 180+ microservices migrated from on-premises to AWS with zero service disruption and 99.9% uptime sustained (Greater Toronto Airports Authority)
> • 14 fragmented network connections consolidated into a single Azure Virtual WAN hub, 40% cost reduction (RSA Insurance)
> • 10 TB+ of Oracle financial data automated for backup, patching and recovery under regulated change control (Citibank)
> • Detection and resolution time cut from hours to minutes, and a churn model put into production on Kubernetes (Rugby Canada)
>
> Prior engagements were delivered in the course of employment with the named employer and are presented as evidence of hands-on capability.
>
> **What we do**
>
> Cloud landing zones · On-premises to cloud migration · Kubernetes platforms (EKS, AKS, GKE, OpenShift, kubeadm) · Service mesh · Terraform and Ansible · CI/CD and GitOps · Observability (Prometheus, Grafana, Loki, Mimir, Datadog) · Database setup and migration · MLOps · Security and compliance hardening · Cloud cost optimization
>
> **How we start**
>
> A free 45-minute scoping call, or a fixed-price infrastructure audit at $4,500 over five business days. Read-only access, a written report, and you keep it regardless of what happens next.
>
> Certified Kubernetes Administrator · Microsoft Certified Azure Developer Associate · Eligible for Canadian Reliability Status
>
> Toronto, Ontario 🇨🇦
> rrrsolutionprovider@gmail.com · +1 (437) 366-4623

*(Replace the email once you have the domain address.)*

---

## Specialties (up to 20 — paste as a list)

```
Cloud Migration
Kubernetes
Amazon Web Services
Microsoft Azure
Google Cloud Platform
Terraform
Infrastructure as Code
DevOps
Site Reliability Engineering
CI/CD
GitOps
ArgoCD
Observability
Prometheus
Grafana
DevSecOps
Platform Engineering
Database Migration
MLOps
Cloud Cost Optimization
```

---

## Locations

Primary: **Toronto, Ontario, Canada**

You need a street address. If you are using a registered-office service, use
that address — do not publish your home address on a public company page.

---

## Management / people

LinkedIn does not have a formal "chairperson / director" field on a company
page. Corporate officers appear in two ways:

### 1. Your own profile — update the Experience section

| Field | Value |
|---|---|
| Title | `Founder & Principal Platform Engineer` |
| Employment type | `Full-time` |
| Company | `RRR Solution Providers` *(select the page once created)* |
| Location | `Toronto, Ontario, Canada` |
| Start date | *(month you incorporate)* |

Description:

> Founded RRR Solution Providers to build and migrate cloud platforms for Canadian organisations.
>
> Direct delivery across AWS, Azure and GCP: landing zones, on-premises migration, Kubernetes platforms, Terraform, CI/CD, observability and database migration.
>
> Previously led the migration of 180+ microservices to AWS for the Greater Toronto Airports Authority with zero service disruption, and delivered infrastructure for Citibank and RSA Insurance under regulated change control.
>
> CKA · AZ-203 · AZ-900 · Eligible for Canadian Reliability Status

This is what populates the "People" section on the company page.

> **Title honesty.** "Founder & Principal Platform Engineer" is accurate and
> sells better than "CEO" for a firm of this size — it tells a buyer that the
> person they are talking to does the work. If you want the corporate title for
> contracts, "President" or "Director" is the OBCA term; use it on the paperwork
> and keep the engineering title on LinkedIn.

### 2. Do not list colleagues without written consent

Himalay, Ananya, Kaustubh, Haris and Manish must each associate themselves with
the page **from their own profile**. You cannot add them, and you should not
describe them as team members on the site or the page until they have agreed in
writing. See the note in `platform/src/app/about/page.tsx`.

---

## Assets

| Asset | Size | Source |
|---|---|---|
| Logo | 300×300 PNG | Export from `/brand` — the `boxed` mark |
| Cover image | 1128×191 PNG | Ink background, lockup left, tagline right |

To export the logo: run the site, open `http://localhost:3000/brand`, screenshot
the boxed mark, or convert `brand/logo-mark.svg` with any SVG→PNG tool.

---

## First five posts

Post these over the first fortnight. Each ends with a soft call to action, not a
hard sell.

**1 — Why we publish our prices**
> Most consultancies make you sit through a discovery call before they'll tell you what anything costs. We publish every price on our site.
>
> Three reasons:
> • It respects your time. If our range doesn't fit your budget, you find out in thirty seconds instead of three meetings.
> • It disciplines us. Every proposal has to justify itself against a published number.
> • It filters well. The clients who value straight answers self-select.
>
> The trade-off is that competitors can see our pricing. We think that matters less than the trust it buys.

**2 — Migrating 180 microservices with zero downtime**
> The technology was the easy part. Sequencing was not.
>
> [Write 300 words on wave planning and rollback rehearsal from the GTAA work.]

**3 — The restore nobody has tested**
> Ask your team when the restore was last actually performed — not the backup, the restore. In most estates we review, the answer is never.
>
> [200 words on why, and what a tested restore looks like.]

**4 — Where a human has to stand in AI-assisted engineering**
> We use AI agents heavily. They read repositories, draft architecture, decompose work and write documentation. They never apply a change to a client environment.
>
> [300 words on the "agents propose, humans dispose" boundary.]

**5 — What "you own everything" actually means**
> [250 words on handover, lock-in and the day-we-leave test.]

**Cadence after that:** two posts a week, technical. The audience you want
follows people who explain things, not people who announce things.

> **Link the posts back into the site.** Once each is live, copy its permalink
> into `platform/src/lib/proof.ts` → `posts[].url`. Entries with an empty `url`
> are filtered out and never render, so the Trust page stays clean until you
> fill them in.

---

## Settings to change immediately after creating the page

- **Verify the page** with your domain email — the verified badge matters
- Turn on **Page admin notifications**
- Add a **custom button**: `Visit website` → your site
- Enable **Invite connections** and invite your network in batches (LinkedIn
  caps this; you get a monthly allowance of credits)
- Post once **before** inviting anyone — an empty page converts badly
