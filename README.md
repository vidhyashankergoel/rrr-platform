# RRR Solution Providers

Website, customer-facing AI assistant, agent system and database for a Canadian
cloud and platform engineering firm.

---

## What is here

```
incorp/
├── platform/          ← the real application (Next.js 15, React 19, TypeScript, Prisma)
├── site/              ← a static HTML version, kept as a zero-dependency fallback
├── brand/             ← logo source
└── docs/              ← incorporation, GitHub org, LinkedIn, legal review
```

**`platform/` is the product.** `site/` was built first and still works if you
ever need a page you can drop on any static host with no build step.

---

## Test it

```bash
cd platform
npm run dev          # in one terminal
npm test             # in another — the full suite
npm test -- --fast   # skip the browser and load suites
```

Ten suites, **424 assertions**, all passing:

| Suite | What it proves | Assertions |
|---|---|---|
| **Types** | App and scripts compile clean under `strict` | — |
| **Retrieval ranking** | The knowledge index resolves known-hard queries | 11 |
| **Delivery plane** | Org structure, pipeline gates, work-package dispatch, the no-autonomy invariant | — |
| **Customer journey + database** | End-to-end journey, CASL and PIPEDA enforcement, referential integrity | 44 |
| **Attribution modes** | Prior-work naming switches cleanly across every surface | 30 |
| **Copy and grammar** | Rendered text: spelling, typos, placeholders, terminology, Canadian convention | 16,217 words |
| **End-to-end functional** | Every button, link, form field and admin action, in a real browser | 97 |
| **Bot battery** | Customer questions across 20 personas and journeys | 133 |
| **Responsive layout** | 12 viewports x 10 pages — overflow, target size, text size | 120 |
| **Load and reliability** | Latency under concurrency, rate limiting, security headers | — |

Individual suites:

```bash
npm run test:e2e          # sandbox + every button, link and form (isolated DB)
npm run sandbox           # just start the sandbox and leave it running
npm run test:bot          # the 133 customer questions
npm run test:responsive   # 280px fold through 2560px ultrawide
npm run test:load         # concurrency, rate limiting, headers
npm run test:journey      # database + CASL/PIPEDA
npm run test:delivery     # the agent hierarchy
npm run test:retrieval    # ranking debugger
npm run test:copy         # spelling, typos, placeholders, terminology
npm run test:attribution  # prior-work naming modes
npm run test:booking      # call slots, DST arithmetic, calendar files
npm run test:chips        # every suggested question gets a real answer
npm run test:emails       # auto-reply templates: routing, honesty, figures
npm run test:agents       # the operations agents: triage, composing, safety gates

npm run agents:status     # which agents are ready, which need credentials
npm run agents:run        # run the agents continuously
npm run mail:check        # is email actually working?
```

### The sandbox

`npm run test:e2e` spins up an isolated instance — its own SQLite database, its
own port, its own agent inbox, outbound mail and model gateway both disabled.
The end-to-end suite submits real enquiry forms and holds real conversations,
so it writes Lead and Conversation rows carrying personal information. Keeping
that out of the database you will eventually point at production is the whole
reason the sandbox exists.

The scenario library lives in `platform/scripts/scenarios.ts`. Adding a
question there adds a test — that is the intended way to grow coverage when a
real prospect asks something the assistant handles badly.

---

## Run it

```bash
cd platform
npm install
cp env.example .env.local        # then fill in DATABASE_URL and ADMIN_TOKEN
npx prisma db push               # creates the local SQLite database
npm run dev                      # http://localhost:3000
```

Generate an admin token:

```bash
openssl rand -hex 32
```

That single value gates `/admin`. The console will not open without it.

---

## The pages

| Route | Purpose |
|---|---|
| `/` | Home — positioning, services, proof, process |
| `/services` | All 16 services with published prices and durations |
| `/pricing` | Interactive estimator, fixed pricing, retainers, rate card, billing terms |
| `/work` | Five case studies |
| `/security` | How we secure client estates, and how we behave while holding access |
| `/trust` | The five-rung ladder: how a new firm de-risks a first engagement |
| `/story` | Origin, mission, vision, values, strategy |
| `/about` | People, delivery structure, AI-assisted engineering, corporate info |
| `/contact` | Enquiry form with PIPEDA/CASL consent capture |
| `/brand` | Internal — logo, palette, type, usage rules |
| `/admin` | Internal — the approval queue |
| `/legal/*` | Privacy notice, terms of use, accessibility statement |

---

## The agent system

Two planes, deliberately separated.

### Front of house — talks to prospects

`src/lib/agents/registry.ts`, `sales.ts`, `finance.ts`

| Agent | Owns |
|---|---|
| `concierge` | Front door, general questions, routing |
| `qualifier` | Turns a conversation into a scored lead |
| `sales` | Structured discovery, pitch, objection handling |
| `pricing` | Quotes only from the published catalogue |
| `budget` | Works backwards from a stated budget |
| `timeline` | Elapsed delivery time including your review cycles |
| `cloudcost` | The client's cloud run-rate, separate from our fees |
| `effort` | Roles, hours and per-hour rates |
| `quote` | Assembles a multi-service programme quote |
| `billing` | Payment terms and invoicing mechanics |
| `negotiation` | Holds the line on price; cannot grant a discount |
| `delivery` | How we build, staff and hand over |
| `legal` | Drafts from reviewed templates; never advises, never sends |
| `hr` | Candidate enquiries, inside Ontario Human Rights Code limits |
| `followup` | Drafts sequenced follow-up email |
| `internal-cost` | **Internal only** — delivery cost and margin |
| `internal-invoice` | **Internal only** — compliant invoice drafts |

The last two are not reachable from the public router.

### Delivery plane — does the work

`src/lib/agents/delivery-org.ts`, `pipeline.ts`

```
Principal ──────────► client relationship, requirement
     ├── Architect ──► target architecture, ADRs
     ├── Delivery Manager ──► team, effort, duration, cost, model
     └── Team Leads ──► task breakdown, review everything below
              └── Engineers ──► Terraform, Kubernetes, CI/CD, observability, data, security
     Assurance ──► independent QA, technical writing
```

This plane does not exist until a human marks an engagement WON **and** releases
it. Work packages are written to disk (`src/lib/bridge/claude-code.ts`) for your
existing Claude Code setup to pick up — deliberately files, not an API call, so
a web request can never start an agent that touches infrastructure.

### The rule that makes it safe

> **Agents propose. Humans dispose. The system executes.**

No agent sends an email, issues a price, transmits a contract, or applies a
change. Everything outward-facing lands in the `Approval` table and waits for a
named person at `/admin`.

---

## Cost control

The assistant is designed to cost approximately nothing to run.

1. **Retrieval first** — when the catalogue answers confidently, no model is
   called. On a consulting site this is most traffic.
2. **Response cache** — identical questions cached for an hour.
3. **Model tiering** — cheap/local for chat, better model only for drafting.
4. **Context trimming** — only the top retrieved entries are sent.
5. **Hard token caps** per request.
6. **Daily call ceiling** — past it, the site silently reverts to retrieval.

It works with **no model configured at all.** Point `LLM_BASE_URL` at anything
OpenAI-compatible to add one:

```bash
# OmniRoute — free providers, no credentials
LLM_BASE_URL="http://localhost:20128/v1"
LLM_MODEL_FAST="auto/cheap"
LLM_MODEL_QUALITY="auto/coding"

# Ollama — fully local, nothing leaves your network
LLM_BASE_URL="http://localhost:11434/v1"
LLM_MODEL_FAST="llama3.1:8b"
```

> **You do not need to fine-tune anything.** The catalogue is injected as
> context on every call, so the model answers from your real prices. Fine-tuning
> would bake today's prices into weights and go stale the moment you change one.

---

## Canadian compliance

Built in, not bolted on.

| Obligation | Where |
|---|---|
| **PIPEDA** consent | `Lead` model — granular, timestamped, with source URL and hashed IP |
| **PIPEDA** retention | `purgeAfter` set at creation on every record holding personal data |
| **PIPEDA** access requests | `DataSubjectRequest` model with the 30-day clock |
| **CASL** s.6(1) consent | Marketing consent stored separately; mailer refuses commercial sends without it |
| **CASL** s.6(2) identification | Sender block and mailing address on every message |
| **CASL** s.11 unsubscribe | Per-lead token, honoured within 10 business days |
| **CASL** s.13 proof | Consent evidence retained 3 years after withdrawal |
| **AODA / WCAG 2.1 AA** | Skip links, focus states, reduced motion, labelled forms, live regions |
| **GST/HST** | `costing.ts` — per-province rates, place-of-supply, small-supplier threshold |
| **Excise Tax Act** invoicing | `invoiceRequiredFields()` enforces the mandatory fields by value |
| **Ontario Human Rights Code** | HR agent cannot ask about or record protected grounds |

The tax rates in `costing.ts` are current as at 2026. **Verify them annually** —
Nova Scotia moved from 15% to 14% in April 2025.

---

## Before you go live

Blocking:

- [ ] NUANS report + trademark search on the name
- [ ] Incorporate; fill in `corporationNumber`, `businessNumber` in `src/lib/company.ts`
- [ ] Register for GST/HST; add `gstHstNumber` — **tax stays off until you do**
- [ ] Add `addressLine` and `postalCode` — CASL requires a mailing address
- [ ] Buy the domain; move off the Gmail address
- [ ] Professional liability, CGL and cyber insurance in force
- [ ] Read the Wipro employment agreement; set `ATTRIBUTION_MODE` accordingly
- [ ] Have a Canadian lawyer review the MSA, SOW, NDA and DPA templates
- [ ] Have counsel review `/legal/terms` — particularly the liability limitation
- [ ] Set a real `ADMIN_TOKEN`
- [ ] Switch Prisma provider to `postgresql` and point at a managed database

Should do:

- [ ] Assistive-technology testing (JAWS, NVDA, VoiceOver) — the accessibility
      statement currently discloses this is outstanding
- [ ] Replace shared-token admin auth with per-user authentication
- [ ] Add LinkedIn post permalinks to `src/lib/proof.ts`
- [ ] Run `npm test` and confirm 7/7 before every deploy
- [ ] Align the "7+ years" on the old portfolio with the "8+ years" here
- [ ] Get written consent before listing any colleague as team

---

## Things I deliberately did not do

- **Invent a corporate history.** The company is new. `/story` says so, and
  `/trust` turns it into an argument rather than hiding it.
- **List your colleagues as staff.** They are in the codebase, disabled, with a
  note. Publishing real people without written consent is a PIPEDA and
  misrepresentation exposure.
- **Claim "20+ years" or "135 AI agents".** Both would have been checked. The
  defensible version sells harder.
- **Let any agent send anything.** Every outward action needs a human.
- **Create your GitHub org or LinkedIn page.** Those need your login. All the
  content is written — see `docs/`.

---

## Docs

| File | Contents |
|---|---|
| `docs/INCORPORATION.md` | NUANS, federal vs Ontario, CRA, insurance, costs, sequence |
| `docs/GITHUB-ORG.md` | Org setup, profile README, security settings, what to publish |
| `docs/LINKEDIN.md` | Company page fields, About copy, first five posts |
| `docs/LEGAL-REVIEW.md` | What a lawyer must review before the legal agent is used |
| `docs/DOMAIN-AND-DNS.md` | Domain candidates, registrar advice, DNS records, email auth |
| `docs/TRADEMARK-AND-PRIOR-WORK.md` | CIPO search results for "RRR", and the Wipro attribution analysis |
| `docs/DEPLOY.md` | The repository, why not GitHub Pages, and how to put this online |
| `docs/AGENTS.md` | The eight operations agents, what each may do, and how to run them 24/7 |
| `docs/EMAIL-SETUP.md` | Getting enquiries and bookings delivered to your inbox |
| `docs/BOOKING.md` | How call booking works, why it says "requested", and what to change when you have a real calendar |
