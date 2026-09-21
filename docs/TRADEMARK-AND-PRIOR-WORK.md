# Trademark clearance and prior-work attribution

Two questions answered here:

1. **Is "RRR Solution Providers" clear to use in Canada?**
2. **Can you describe the Wipro client work on your own website?**

> **I am not a lawyer or a registered trademark agent.** What follows is a
> direct search of the public Canadian Trademarks Database and a plain reading
> of the risks. It is research to take to a professional, not a legal opinion.

---

## 1. Trademark search — "RRR"

**Searched:** Canadian Trademarks Database (CIPO), Trademark field = `RRR`
**Database last updated:** 2026-09-16
**Searched on:** 2026-09-20
**Results:** 16 marks

### Live marks containing "RRR"

| App. no. | Mark | Type | Owner | Nice classes | Field |
|---|---|---|---|---|---|
| 2308346 | **RRR** | Standard characters | Groupe International Aéro Mag (2000) inc., QC | 1, 37, 40 | Aircraft de-icing fluids and services |
| 2065185 | **RRR** | Standard characters | Amanda Jeppesen, Aurora ON | 3, 44 | Cosmetics and skin-care services |
| 1760052 | **RRR Logo** | Design | eDataNetworks Inc., Edmonton | 35 | Consumer loyalty programs |
| 1740783 | **RRR Design** | Design | Rubicon Technologies LLC, Kentucky | 9, 35, 40 | Waste-management software |
| 1832286 | **RUBICON & RRR Design** | Design | Rubicon Technologies LLC | 9, 35, 40, **42** | Waste-management cloud software |
| 1868424 | RRR TRIPLE R & Design | Design | — | 7, 11 | Machinery / lighting |
| 0535845 | RRR DESIGN | Design | — | 7 | Machinery |

### Dead marks (no longer a bar)

`1288214 RRR` (expunged) · `0410900 RRR & DESIGN` (expunged, had covered 35/37/41/42) ·
`1133754 RRR FFE` (withdrawn) · `0853115` and `0853118 RRR WORLD` (abandoned) ·
`1107870 RRR & Design` (abandoned) · `0748360` (abandoned)

### What this means

**The headline: nothing found blocks you from using "RRR Solution Providers"
for IT consulting.** More specifically:

- **No live mark covers IT consulting, cloud computing, software development
  or infrastructure services.** The only live Class 42 registration — Class 42
  is where IT services live — is Rubicon's, and its statement of services is
  expressly limited to *waste-management* software. A cloud engineering firm
  is not confusing with that.
- **The two live plain "RRR" word marks are in unrelated fields** — aircraft
  de-icing and cosmetics. Canadian confusion analysis under s.6 of the
  *Trademarks Act* weighs the nature of the goods, services and trade. Neither
  is close to yours.
- **Class 35 has two live RRR marks** (loyalty programs, waste-management
  business consulting). Class 35 covers "business consulting" broadly, so if
  you ever file, expect an examiner to raise these. They are still
  distinguishable on the actual services.

### What it does *not* mean

- **This is a direct-hit search only.** A proper clearance search also covers
  phonetic equivalents and variants — TRIPLE R, R3, 3R, RRRR, ARRR — plus
  common-law (unregistered) use, business-name registers and domain use. A
  trademark agent charges roughly **$500–$1,500** for that. Worth it before you
  spend on signage, print or a rebrand.
- **A three-letter acronym is a weak mark.** Short letter combinations are hard
  to register, hard to enforce, and easy for a competitor to work around. You
  will get a stronger, more defensible mark from the full
  **"RRR SOLUTION PROVIDERS"** as a composite than from "RRR" alone — and the
  composite is also more likely to survive examination.
- **Using a name and owning it are different things.** You can trade under
  "RRR Solution Providers" from day one without registering anything.
  Registration gives you the right to stop others, nationwide, and is worth
  filing once the name is carrying real goodwill.

### Recommendation

| | |
|---|---|
| **Use the name now?** | Yes. Nothing found conflicts in your field. |
| **File a trademark now?** | Not yet. Spend the money on insurance and contracts first. |
| **File within 12–18 months?** | Yes, if the name is winning work. File **"RRR SOLUTION PROVIDERS"** as a word mark in **Class 42**, and Class 35 if you sell advisory separately. |
| **Before printing anything physical** | Get a proper clearance search from a trademark agent. |

**Verify this yourself:** [Canadian Trademarks Database](https://ised-isde.canada.ca/cipo/trademark-search/srch?null=&lang=eng)
— search field "Trademark", term `RRR`.

---

## 2. The Wipro question

### What you asked

Whether describing the Greater Toronto Airports Authority, Citibank and RSA
Insurance engagements on your own company's website creates exposure, given
that work was performed while employed by Wipro Technologies.

### What I can and cannot tell you

**I cannot tell you whether your contract permits it — I have not seen it, and
it is the only document that decides the question.** What I have done is build
the site so the risk is minimized by default and so you can eliminate the
remaining exposure with a one-word change once you *have* read the contract.

### The four risks, honestly

| Risk | Severity | What actually triggers it |
|---|---|---|
| **Confidentiality breach** | ⚠️ **The real one** | Most IT services employment agreements define "Confidential Information" to include *client identity* and engagement detail, and the clause survives termination. If yours does, naming GTAA, Citibank and RSA is a breach regardless of how publicly known it is. |
| **Non-solicitation** | Low–medium | Describing past work is not soliciting. But a non-solicit clause plus client names on a page selling services is an argument you would rather not have. |
| **Implied endorsement** | Low, now mitigated | Listing client names can imply they endorse you. The site now states explicitly that they do not. |
| **Misrepresentation to buyers** | Low, now mitigated | Presenting employment work as the *company's* track record misleads a buyer. The site now distinguishes the two on every surface. |

### Read your contract for these four things

1. A **confidentiality / non-disclosure** clause — and specifically whether
   "client information" or "client identity" falls inside its definition.
2. A **survival clause** saying how long confidentiality outlives employment.
   Many are perpetual for confidential information.
3. A **non-solicitation** clause and its duration (commonly 12–24 months).
4. Anything restricting **use of the employer's name or its clients' names**
   after employment ends.

If any of those are broad, switch the site to descriptive mode — one word,
below.

### What is already built

Every prior-employment reference now runs through
`platform/src/lib/attribution.ts`. Three modes:

```ts
export const ATTRIBUTION_MODE: AttributionMode = "named";
//                                                ^^^^^^^
//   "named"        GTAA / Citibank / RSA named, with a no-endorsement notice
//   "descriptive"  "A major Canadian international airport authority"
//   "minimal"      "Aviation sector, Canada"
```

Changing that one value re-frames **every** surface at once: the home page
logo strip, the case studies, the assistant's answers, the sales agent's
evidence list and the knowledge index. Verified by
`npm run test:attribution` — 30 assertions confirm that in `descriptive` and
`minimal` modes, the strings "Greater Toronto Airports Authority", "RSA
Insurance Group", "Citibank" and "Wipro" appear **nowhere**, while your own
engagements (Rugby Canada, Digitalogy) stay named because they genuinely are
yours.

The metrics survive the switch. "180+ microservices, zero disruption, 99.9%
uptime, ~40% cost reduction, at a major Canadian international airport
authority" is nearly as persuasive as the named version, and carries none of
the contractual risk.

### Also now on every relevant page

> Engagements above were delivered by our founder in the course of employment
> with a prior employer, on that employer's client accounts. They are presented
> as evidence of hands-on capability, not as this company's corporate track
> record, and they do not imply that any client or former employer endorses,
> sponsors or is affiliated with this firm. No confidential information,
> proprietary methodology or client data is disclosed. All third-party names
> and marks belong to their owners.

### What the site deliberately does *not* say

- No Wipro methodology, framework, tooling or internal process
- No client architecture diagrams, account identifiers, hostnames or data
- No client logos — names as plain text only, which is a materially weaker
  implication of endorsement than a logo wall
- No claim that any client is a client of *this* company
- No client contact names

### Recommendation

1. **Read the Wipro agreement this week.** Look for the four things above.
2. **If the confidentiality clause captures client identity → switch to
   `"descriptive"`.** One word. The site is already tested for it.
3. **If it does not, `"named"` is defensible** — the engagements are already
   public on your own LinkedIn profile, the disclaimer is explicit, and no
   confidential detail is disclosed.
4. **If you cannot find the agreement**, request a copy from Wipro HR. You are
   entitled to it, and asking is not a red flag.
5. **If it is ambiguous, switch to `"descriptive"` and move on.** Thirty
   minutes with an employment lawyer costs a few hundred dollars; the argument
   costs vastly more, and the marketing difference is small.

> **My recommendation, if you want one:** switch to `"descriptive"` until you
> have actually read the contract. You lose very little persuasive power and
> you remove the only genuinely serious exposure on the site. Switch back to
> `"named"` once you know it is safe.

---

## Checklist

- [ ] Request and read the Wipro employment agreement
- [ ] Check the confidentiality clause definition and survival period
- [ ] Check the non-solicitation clause and its duration
- [ ] Set `ATTRIBUTION_MODE` accordingly in `platform/src/lib/attribution.ts`
- [ ] Run `npm run test:attribution` to confirm the mode applies everywhere
- [ ] Commission a full trademark clearance search before any print spend
- [ ] Reconsider filing "RRR SOLUTION PROVIDERS" in Class 42 in 12–18 months
