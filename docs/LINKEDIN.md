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

## What I cannot do for you, including by driving your browser

Creating the page needs your LinkedIn login, so it needs you. That does not
change if I drive Chrome instead of telling you where to click — it is still
an account being created by an automated session on a site whose User
Agreement prohibits exactly that, and the account it would put at risk is the
one every page of the site links to.

So: you create it, you paste this in. Everything else is already done — the
logo, the banner, the About section, the specialties, nine posts. Ten minutes
of clicking and typing, and I have tried to make sure none of it is thinking.

The same answer applies to sending connection requests automatically. See
[The agents behind this page](#the-agents-behind-this-page) at the bottom for
what the outreach agent does instead, and why that split is deliberate rather
than unfinished.

---

## Before you start

You need a personal LinkedIn profile with a current position listed — LinkedIn
refuses to let you create a company page otherwise. Yours qualifies.

Have ready — all three are already in this repository, rendered to LinkedIn's
exact dimensions, so there is nothing to export or resize:

| File | Size | Use |
|---|---|---|
| `brand/linkedin/logo-300.png` | 300 × 300 | The logo. Use this one. |
| `brand/linkedin/logo-300-square.png` | 300 × 300 | Only if the rounded corners look wrong against a card in some view. |
| `brand/linkedin/cover-1128x376.png` | 1128 × 376 | **The banner. Use this one.** |
| `brand/linkedin/cover-2256x752.png` | 2256 × 752 | Same banner at 2×, if the first looks soft on a retina display. |
| `brand/linkedin/cover-1128x191.png` | 1128 × 191 | The dimension LinkedIn documents. Kept, but it failed to upload — see below. |

> **Why the banner is 376 tall and not the documented 191.**
>
> LinkedIn's own guidance says 1128 × 191, and a 191-tall image is what the
> first version of this produced. Uploading it returned *"Cover image upload
> failed. Please try again."* — the crop dialog frames a much taller area, and
> the image sat letterboxed inside it with black bars above and below.
>
> 1128 × 376 fills that frame. The content is centred vertically with margin
> on both sides, so if LinkedIn does crop back to a 191-tall band it takes the
> middle and every line survives. The design does not depend on which of the
> two LinkedIn picks, which is the point — guessing the right number once is
> luck; surviving either is a design decision.

Website: `https://www.rrrsolutionproviders.ca`

> The banner's left third is deliberately empty. LinkedIn composites the logo
> over the lower-left of the cover, so anything placed there is covered at
> render time rather than at design time — which is why it is easy to miss
> until the page is already public.

Regenerate either image from `brand/logo-mark.svg` after a brand change by
re-running the export described in `brand/linkedin/cover.svg`'s source.

---

## Create

**linkedin.com/company/setup/new** → **Company**

Field labels below are the ones the form actually shows, checked against the
live form rather than from memory — LinkedIn says "Organization size", not
"Company size", and the public-URL field is labelled with the prefix itself.

In form order, top to bottom:

| # | Field | Value |
|---|---|---|
| 1 | Name* | `RRR Solution Providers` |
| 2 | linkedin.com/company/* | `rrr-solution-providers` |
| 3 | Website | `https://www.rrrsolutionproviders.ca` |
| 4 | Industry* | `IT Services and IT Consulting` |
| 5 | Organization size* | `1-10 employees` |
| 6 | Organization type* | `Privately Held` |
| 7 | Logo | `brand/linkedin/logo-300.png` |
| 8 | Tagline | `Cloud, Kubernetes and platform engineering for Canadian teams` |

Field 2 takes only the slug — the `linkedin.com/company/` part is already
printed beside the box, so pasting the whole URL gives you a doubled one.

Field 4 is a typeahead. Start typing `IT Services` and pick
**IT Services and IT Consulting** from the list; a value you type but do not
select is not accepted.

Field 8 has a 120-character limit. The tagline above is 61.

Then the verification checkbox:

> *I verify that I am an authorized representative of this organization and
> have the right to act on its behalf in the creation and management of this
> page.*

That is a personal attestation, which is exactly why this step is yours.
Tick it, then **Create page**.

> Add `Inc.` to the name only once incorporation is complete. Claiming a
> corporate form you do not yet hold is the kind of small inaccuracy that
> undermines everything else on the page.

---

## Overview — paste verbatim

**Edit Page → Details → Overview.** The field is capped at **2,000
characters** and the text below is 1996, which is the reason it is
shorter than the website's version of the same copy. The earlier draft here
was 2,473 and LinkedIn would have silently cut it off mid-sentence.

Two things were dropped rather than compressed, because LinkedIn already has
dedicated fields for them and repeating them wastes the budget:

- the service list — that is the **Specialties** field below
- the contact block — those are the **Website URL** and **Phone** fields on
  the same Details tab

The field is plain text. Markdown does not render, which is why the section
headings are in capitals rather than bold.

> We build, migrate and operate cloud platforms for Canadian organizations — AWS, Azure and GCP, Kubernetes, Terraform, CI/CD and observability.
>
> WHAT MAKES US DIFFERENT
>
> We publish our prices. Every service on our site carries a price range in Canadian dollars and a realistic duration, so you can budget before you speak to anyone.
>
> You own everything. All work lands in your repositories and your cloud accounts, with runbooks and recorded handover sessions. No proprietary wrapper, no component only we can renew. The test we hold ourselves to: your team can run the platform the day we leave.
>
> We tell you when you don't need us. If a two-day fix solves it, we say so on the call rather than shaping it into a six-week engagement.
>
> EXPERIENCE BEHIND THE WORK
>
> • 180+ microservices moved from on-premises to AWS with zero service disruption — a major Canadian international airport authority
> • 14 fragmented network connections consolidated into a single Azure Virtual WAN hub, 40% cost reduction — a multinational general insurance group
> • 10 TB+ of Oracle financial data automated for backup, patching and recovery under regulated change control — a global retail and investment bank
> • Detection and resolution time cut from hours to minutes, and a churn model put into production on Kubernetes — Rugby Canada
> • Undocumented AWS production infrastructure reverse-engineered into version-controlled Terraform — Digitalogy LLC
>
> The first three were delivered by our founder in the course of employment with a global IT services firm. They are evidence of hands-on capability, not a claim of endorsement or of this company's corporate track record.
>
> HOW WE START
>
> A free 30-minute scoping call, or a fixed-price infrastructure audit at $4,500 over five business days. Read-only access, a written report, and you keep the report whatever happens next.
>
> Certified Kubernetes Administrator · Microsoft Certified Azure Developer Associate · Eligible for Canadian Reliability Status
>
> Toronto, Ontario

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

## Four posts that show the work

The five posts above introduce the firm. These four show it. Post them after
the launch post, roughly one a week, interleaved with the others.

Every one of them follows the same rule and it is worth stating once: **the
interesting part is the thing that was harder than expected, not the number at
the end.** The number is why somebody keeps reading. The difficulty is why they
believe you.

None of them names a former employer's client. See the warning at the top of
this file before you change that.

### W1 — Rolling out a service mesh without an outage

> Putting Istio across 180+ services sounds like a platform project. In
> practice it is a negotiation with every team that owns a service.
>
> The diagrams show a sidecar next to each pod and mTLS between them. What the
> diagrams do not show:
>
> **mTLS has to go on namespace by namespace, in permissive mode first.** Flip
> a namespace to STRICT while one caller is still outside the mesh and you have
> taken that path down. Permissive mode accepts both, so you can move callers
> at their own pace and only tighten once the traffic is actually all mTLS.
>
> **You find out what talks to what by watching, not by asking.** Every team
> we spoke to gave us an accurate list of what their service calls. Almost
> nobody could tell us what calls *them*. Kiali's topology view answered in an
> afternoon what three weeks of meetings had not.
>
> **Sidecars change your latency budget.** Not much per hop — but on a request
> that crosses six services it is six hops, and if your p99 alert was tuned
> with no headroom it will fire on the day you roll out. Re-baseline before,
> not after.
>
> The outcome was 180+ services migrated from on-premises to AWS with zero
> service disruption, and 99.9% uptime sustained across the following year. The
> mesh was the part that made the rest safe to move.
>
> Context: a major Canadian international airport authority. Delivered by me in
> the course of employment with a global IT services firm — evidence of what I
> have done, not a claim that anyone endorses my company.
>
> If you are planning a mesh rollout, the permissive-mode sequencing is the
> part I would most want somebody to tell me in advance. Happy to go into it.

### W2 — 25 dashboards and 150 queries, published

> Observability engagements are judged on dashboards. So here are ours, in
> full, before you hire anybody.
>
> **25 production Grafana dashboards** that drop into any Prometheus and Loki
> stack:
> https://github.com/vidhya101/grafana-observability-toolkit
>
> **150+ classified PromQL and LogQL queries** — one self-contained HTML page,
> no dependencies, no sign-up:
> https://github.com/vidhya101/promql-logql-query-reference
>
> These are not the tutorial queries. They are the ones you actually want at
> 03:00 when something is on fire and you need to know which service, which
> pod, and since when.
>
> I am publishing them for a straightforward reason. A new consultancy asks you
> to believe a claim about quality. Nobody should. Open the repository instead
> and judge the work — the naming, the structure, whether the queries would
> survive contact with your cluster.
>
> If you take them and never speak to me, that is a completely fine outcome.
> If you have a query that has saved you, send it and I will add it.

### W3 — Mimir: the choice is about tenancy, not scale

> The question people ask about Grafana Mimir is "are we big enough for the
> distributed mode?"
>
> It is usually the wrong question. We have run Mimir both ways in production,
> and the thing that actually decides it is **tenancy**, not volume.
>
> **Monolithic** runs every component in one binary. One thing to deploy, one
> thing to debug, and it will take far more load than most people assume. If
> you have one team and one set of metrics, this is almost certainly correct —
> and it stays correct for longer than the sizing guides imply.
>
> **Distributed** splits ingesters, queriers, compactors and store-gateways so
> you can scale and fail them independently. The reason to want that is rarely
> raw throughput. It is that a tenant running an expensive query should not be
> able to affect another tenant's ingestion — so you need the query path and
> the write path to fail separately.
>
> If you have one tenant, you do not have that problem, and the distributed
> mode is four more things to operate in exchange for solving it.
>
> We deployed both for Rugby Canada, who went from no enterprise monitoring at
> all to four data sources unified in Grafana, mean time to detect and resolve
> down from hours to minutes, and zero data loss on long-term retention.
>
> We also talk people out of the distributed mode regularly. Those two things
> are not in conflict.

### W4 — The infrastructure nobody wrote down

> A client asked us to reduce their AWS cost. We could not start, because
> nobody could tell us what was running.
>
> Not out of carelessness — the normal way. The people who built it had moved
> on, changes had been made in the console under time pressure, and the
> documentation described an architecture from two years earlier.
>
> What we actually did:
>
> **Imported the live estate into Terraform rather than rebuilding it.**
> `terraform import` against what exists, then closing the gap between the
> plan and reality one resource at a time until the plan came back clean. It is
> unglamorous and it is the only version that does not risk an outage.
>
> **Kept the review gates while doing it.** Modular Terraform behind GitHub
> Actions with the existing IAM controls and peer review intact. A migration
> that quietly weakens the controls has not improved anything.
>
> **Gave them a throwaway environment.** KIND and ArgoCD, so a change could be
> validated before it reached production. Developer environment setup went from
> days to under an hour.
>
> The result: 100% of production infrastructure under version control, and
> about 30% off the early-stage cloud bill — most of which was simply visible
> once everything was written down.
>
> Client: Digitalogy LLC.
>
> The general lesson, which applies well beyond that engagement: **the most
> expensive thing in a cloud estate is the part nobody wrote down.** If you are
> scoping a migration, budget discovery properly. The estimate that goes wrong
> is always the one that assumed the current setup was documented.

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

## The agents behind this page

Two of them, and both stop short of touching LinkedIn.

### The LinkedIn agent — writes posts

`docs/AGENTS.md` §7. Drafts posts on an ongoing basis into the `ContentDraft`
table, including case-study posts built from the engagement record in
`catalogue.ts`. The client label in those comes from `displayClient()`, so
while `ATTRIBUTION_MODE` is `"descriptive"` there is no code path that can
produce a draft naming a former employer's client. A test asserts it against
every idea the agent can generate, not just the one it drafted today.

```
npm run agents:tick -- --only=linkedin --force
```

### The outreach agent — writes connection notes

`platform/src/lib/agents/ops/outreach.ts`. For each person on your target list
it writes a personalised invitation note that fits LinkedIn's 300-character
limit, plus a longer message to send once they accept.

Maintain the list in `platform/data/outreach-targets.json` — copy
`outreach-targets.example.json` for the shape. `name` and `why` are both
required. `why` is the specific public reason you are contacting *that* person,
and the agent refuses the whole file rather than write a note without one,
because a note without one is a template and the recipient can tell.

The file is git-ignored and CI fails if it is ever tracked: it holds the names,
roles and employers of real people, and this repository is public.

```
npm run agents:tick -- --only=outreach --force
```

### Why neither of them sends anything

Both write drafts. You press the button. That is not an unfinished feature:

- LinkedIn's User Agreement prohibits using software, bots or automated methods
  to access the service. Automated connection requests are the most reliably
  detected of those, because LinkedIn built its detection around that exact
  case.
- The account at risk is the one every page of the site links to — and a
  company page is administered by personal profiles, so losing the profile
  loses the page with it.
- A connection request carrying a pitch is an unsolicited commercial message to
  a real person. CASL s.13 puts the burden of proving a message was lawful on
  the sender, which is a hard thing to do several hundred times.

The agent does the part that is hard — writing something specific enough that a
stranger replies. Sending was never the bottleneck.

**Send a few a day, not forty in a sitting.** A person who fires off forty
invitations in ten minutes looks like a script whether or not one was used,
which is why the agent hands you five at a time.
