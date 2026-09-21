# Legal review — required before the `legal` agent touches a client

The codebase contains an agent that drafts proposals, statements of work and
agreement documents. **It must not produce anything a client sees until a
Canadian commercial lawyer has reviewed the underlying templates once.**

This document is what you hand that lawyer.

---

## Why this matters more than it looks

An AI drafting contracts is the highest-risk thing in this system. Not because
the drafting is bad — because a clause that is *nearly* right is worse than one
that is obviously wrong. A limitation of liability that fails to exclude
consequential loss correctly, or an IP assignment that does not actually assign,
reads fine and does nothing.

The controls already in the code:

- The agent **cannot send a document.** It produces a draft that enters the
  `Approval` queue.
- `Document.status` starts at `DRAFT` and cannot reach `SENT` without a
  recorded human decision.
- The agent's guardrails forbid it from altering liability, indemnity,
  limitation, governing-law or termination clauses.
- It is instructed to state that it cannot give legal advice, and it does.

What the code **cannot** do is make a bad template good. That is this review.

---

## Templates requiring review

### 1. Master Services Agreement

The umbrella terms. Review specifically:

- **Limitation of liability** — cap, and what is carved out of it. A cap at fees
  paid is standard; make sure it survives Ontario law.
- **Exclusion of consequential and indirect loss**
- **Indemnities** — which way they run, and whether they are capped
- **IP ownership** — the site promises clients own everything we build. Confirm
  the assignment language actually achieves that, including moral rights waiver.
- **Confidentiality** — mutual, survival period
- **Insurance** — the levels you actually carry, not aspirational ones
- **Termination** — for convenience, for cause, and what happens to work in
  progress and to access
- **Governing law** — Ontario, and whether that survives a client's standard
  form
- **Subcontracting** — you will subcontract; make sure you may

### 2. Statement of Work template

- Scope definition and, critically, **what is out of scope**
- Acceptance criteria and the acceptance mechanism
- Change control — the site promises scope changes are re-quoted, so the SOW
  must actually require that
- Payment milestones (the site publishes 40/30/30) and what triggers each
- Assumptions and client dependencies, and the consequence if they are not met

### 3. Mutual NDA

- Definition of confidential information and the standard exclusions
- Term and survival
- Permitted disclosures — including to subcontractors and to your own insurers
- Return or destruction on termination
- Confirm it is genuinely mutual

### 4. Data Processing Agreement

PIPEDA-based. Where you process personal information on a client's behalf:

- Purpose limitation and the processing instructions
- Sub-processor consent mechanism
- Security measures — should match what `/security` publicly claims
- Breach notification timelines
- **Cross-border transfer** — the privacy notice discloses US processing;
  confirm the DPA handles it
- Return or deletion at the end of the engagement
- Audit rights

### 5. Independent contractor agreement

For anyone you subcontract:

- IP assignment that is capable of flowing through to the client
- Confidentiality binding them to your client obligations
- **Contractor vs employee** — this is a CRA determination and getting it wrong
  means back-assessed source deductions and penalties. Ask the accountant as
  well as the lawyer.

---

## Website documents also requiring review

| Page | Review focus |
|---|---|
| `/legal/terms` | Limitation of liability (capped at CAD $100), governing law, the consumer-protection carve-out, and the disclaimers around the AI assistant |
| `/legal/privacy` | Whether the described practice matches actual practice, and the cross-border transfer disclosure |
| `/legal/accessibility` | Whether the "partially conformant" claim is stated correctly for AODA purposes |

`/legal/terms` currently carries a visible note saying it has not been reviewed.
**Remove that note only once it has been.**

---

## Specific questions worth asking

1. Is a **CAD $100 liability cap on website use** enforceable in Ontario, or
   does it need to be framed differently?
2. Does our disclaimer that **published prices are not offers** actually prevent
   a claim that a price was accepted? The estimator produces a specific number.
3. What do we need to say about the **AI assistant** so that nothing it outputs
   can bind us? Current wording is in `/legal/terms` clause 3.
4. Are the **case studies** safe? They name former employers' clients, with a
   disclaimer that the work was done in the course of employment. Is the
   disclaimer sufficient, and is there an issue with the former employer?
5. Does describing prior engagements delivered at Wipro create any
   **confidentiality or non-solicitation** exposure under that employment
   contract? *This one is worth asking first — check the Wipro agreement.*
6. Is `RRR Solution Providers` clear of **trademark** conflicts? NUANS covers
   corporate names only.

---

## Do not deploy the legal agent until

- [ ] All five templates reviewed and the reviewed versions stored
- [ ] `Document.templateVersion` set to the reviewed version identifier
- [ ] `/legal/terms` reviewed and the disclaimer note removed
- [ ] The privacy notice confirmed to match actual practice
- [ ] Question 5 above answered — the Wipro point is the one that could bite
      before you have a single client

Until then the agent will still queue drafts for approval, which is harmless.
Just do not approve one.
