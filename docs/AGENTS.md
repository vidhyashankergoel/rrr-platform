# The agents

Eight agents that run on a clock with nobody watching. What each does, what it
is allowed to do, and what it needs before it can start.

```bash
npm run agents:status         # what is configured, what is missing
npm run agents:tick           # one pass, then exit
npm run agents:tick -- --dry  # decide everything, change nothing
npm run agents:run            # stay running, tick every minute
npm run test:agents           # 73 assertions
```

---

## 1. The rule that governs all of them

> **Agents propose. Humans dispose. The system executes.**

No agent sends an email, transmits a document, offers a price, or publishes
anything. Everything outward-facing becomes an **Approval** row carrying the
exact text that would go out, and waits for a person at `/admin`.

**Why, given you asked for autonomy:**

- CASL s.13 puts the burden of proving a message was lawful on the sender.
  "Our software wrote it" is not a defence. The ceiling is **$10,000,000**.
- A composer that drafts a price, a date or a commitment can be wrong in ways
  that are expensive and hard to withdraw once sent.
- The firm's entire pitch is that a named human is accountable. An unreviewed
  machine reply contradicts that on first contact.

One exception, and it is narrow: the **fixed acknowledgement** sent the moment
somebody submits the form. That text is written by us, reviewed once, tested
by `npm run test:emails`, and identical every time — there is nothing left for
a human to review.

**To remove the gate:** set `AGENT_AUTOSEND=all`. It is honoured, because it is
your business and your risk. It is logged loudly on every run so the decision
stays visible instead of becoming a forgotten default. I would not turn it on
until you have read fifty drafts and agreed with all fifty.

---

## 2. The roster

| Agent | Every | Needs | What it does |
|---|---|---|---|
| **Inbox watcher** | 5m | IMAP | Reads the mailbox read-only, matches mail to known customers, triages |
| **Email handler** | 5m | — | Decides owner, SLA and action for each message |
| **Reply composer** | 2m | — | Drafts a reply unique to one customer |
| **Follow-up runner** | 15m | — | Chases quiet enquiries, then stops |
| **Work list** | 10m | — | Turns approved deals into work for the delivery plane |
| **LinkedIn** | 1d | — | Drafts posts for a person to publish |
| **GitHub** | 1d | token | Audits public repositories, proposes fixes |
| **Watchdog** | 30m | — | Finds what is failing silently and escalates |

Five of the eight work with no configuration at all.

---

## 3. Reply composer — the one you asked for

Writes a letter that belongs to one customer and nobody else.

**How it understands somebody** — it builds a brief before writing a word:

1. The enquiry: their words, budget, timeline, services ticked.
2. **The chat transcript**, if they spoke to Ada first. Usually the richest
   source, and the one a human would forget to read.
3. Their history: earlier enquiries, bookings, what we already sent.
4. The catalogue, for the figures the reply needs.

From that it extracts the specifics — the technologies they named, the problem
in their own words, and **the objection they have not said out loud**.

Real output, with no language model connected:

> Hello Dana,
>
> Thanks for getting in touch.
>
> What I have taken from your message:
>
>   "We run about 40 EC2 instances with no Terraform at all. Deploys take a
>   day and only one person knows how. We need Kubernetes and proper CI/CD
>   before our next funding round."
>
> Kubernetes, Terraform and AWS look like the centre of it.
>
> On cost, so you are not waiting on a call for it — Kubernetes Platform
> Build: $25,000–$55,000, 4–8 weeks. That is the published range and it is
> indicative, not an offer; the honest number for your estate depends on
> things we have not seen yet.
>
> …

**With a model** (`LLM_BASE_URL`) it writes the prose instead, under a house
style that bans "reach out", "leverage", "solutions" and eleven other words,
and under hard rules: quote only catalogue figures, never promise a date,
never offer a discount.

**Every draft is validated before a human sees it.** A model draft that
invents a price, offers a discount, guarantees uptime, or is too generic to
reference anything the customer said is **discarded** in favour of the
deterministic one. It is not passed through for a human to "just fix" —
that trains the reviewer to skim, which is how a bad figure eventually ships.

---

## 4. Inbox watcher — read-only, by construction

Opens the mailbox `readOnly: true` at the protocol level. It marks nothing
read, deletes nothing, files nothing, replies to nothing. A bug here cannot
destroy mail.

That is a stronger guarantee than "we were careful". An agent with write
access to the business inbox is one bad regex away from archiving a contract.

Classifies into: customer reply, new enquiry, booking response, billing,
recruitment, vendor/spam, unknown. **Unknown is escalated, never binned** —
the failure mode is "a person looks at it", not "it disappears".

**To connect it** (Gmail, using the same App Password as SMTP):

```bash
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=rrrsolutionprovider@gmail.com
IMAP_PASS=your_16_character_app_password
```

---

## 5. Email handler — who owns it, how fast

| Class | Owner | SLA | Action |
|---|---|---|---|
| anything urgent | principal | 2h | **person writes it** |
| customer reply | principal | 8h | draft for approval |
| new enquiry | principal | 8h | draft for approval |
| booking response | principal | 4h | person |
| billing | finance | 24h | person — money is never automated |
| recruitment | HR | 5d | filed |
| vendor/spam | nobody | — | ignored |
| unknown | principal | 24h | person |

Urgency overrides everything. A machine-written reply to somebody whose
production is down reads badly, so that one always goes to a human.

---

## 6. Follow-up runner — and why it stops

Three touches over three weeks, then the lead goes dormant and we leave them
alone. Each touch says something *different*:

1. Make it easy to say no, and give them the audit option either way.
2. Answer the objection they probably have but did not state (lock-in).
3. Close the loop honestly and stop.

It cancels itself when the person replies, unsubscribes, is won, is lost, or
is already dormant. "Just checking in" is the message that trained everyone to
ignore follow-ups, and a fourth email does not win work — under CASL it is an
offence rather than a nuisance.

---

## 7. LinkedIn — drafts only, and not by my choice

LinkedIn's API does not permit posting to a personal profile without partner
access, which a two-person firm will not get. The only ways to automate it are
browser automation or an unofficial client, and **both breach the User
Agreement**. The penalty is restriction or a permanent ban.

Your LinkedIn profile is currently the firm's main proof that it exists — it
is linked from every page of the site. Risking it to save the thirty seconds
it takes to paste a post is a bad trade at any price.

So the agent writes posts; you publish them. Drafts appear in `ContentDraft`,
and it stops writing once three are waiting — a backlog of twenty drafts
nobody posts is just another guilt queue.

Posts follow one rule: **post the thing you learned, not the thing you sell.**

---

## 8. GitHub — real actions, behind a switch

Audits public repositories for what makes a firm look unserious: missing
descriptions, missing licences, missing topics. A prospect who clicks through
from the site sees these.

Defaults to reporting, not acting. `GITHUB_WRITE=true` lets it open issues —
and only issues. It never commits and never force-pushes.

```bash
GITHUB_TOKEN=github_pat_...   # read access to public repos is enough
GITHUB_ORG=vidhya101
```

---

## 9. Watchdog — the one allowed to be annoying

The expensive failures are silent. Mail stops being delivered and enquiries
keep arriving into a database nobody opens. None of that throws an exception.

It checks: mail provider missing or misconfigured, failed sends, messages
stuck queued, approvals pending over a day, enquiries with nothing sent back,
calls unconfirmed within 24 hours, past calls never closed out, urgent mail
untriaged, overdue and blocked work, failing agent runs, and records past
their PIPEDA retention date.

Critical findings are emailed to you **at most once a day**, so the alert does
not become the thing you filter.

---

## 10. Running it 24/7

**Simplest:**

```bash
cd platform && npm run agents:run
```

**Better, for a machine that reboots** — a supervised one-shot recovers from a
crash on its own; a dead long-running process stays dead until somebody
notices:

```bash
*/5 * * * * cd /path/to/platform && npm run agents:tick >> agents.log 2>&1
```

Each agent's own interval decides whether it does anything, so frequent ticks
are cheap.

---

## 11. Cost

With no `LLM_BASE_URL`, **everything above costs nothing to run** — no API
calls, no tokens. The composer uses the deterministic writer, the classifier
uses signals rather than a model.

Connect a local model (Ollama, OmniRoute, LiteLLM) and only the reply composer
uses it, once per enquiry, with caching deliberately disabled so no two
customers ever receive the same letter.

---

## 12. What is deliberately not automated

| Not automated | Why |
|---|---|
| Sending composed replies | CASL s.13, and the firm's accountability promise |
| Any contract or NDA | A machine must not transmit a document that binds you |
| Prices and discounts | Only from the catalogue, only indicative, never conceded |
| Billing and invoices | Money |
| Replies to anyone in an outage | A person should write that one |
| LinkedIn posting | Their terms; the account is too valuable |
| Writing to the mailbox | Read-only by construction |
| Deleting anything | Retention is proposed, never executed silently |
