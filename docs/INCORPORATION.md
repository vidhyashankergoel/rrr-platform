# Incorporating RRR Solution Providers — Canada

A practical sequence. Do these in order; several later steps depend on earlier ones.
Nothing here is legal or tax advice — it is a checklist to take to an accountant.

---

## 0. The name — do this first

`RRR Solution Providers Inc.` is structurally valid: a distinctive element (RRR),
a descriptive element (Solution Providers), and a legal element (Inc.). All three
are required.

**Before you can reserve it you need a NUANS pre-search report.**

- Order from a NUANS member search house — roughly **$25–$75**.
- The report is valid for **90 days**.
- It checks *corporate name* conflicts. It does **not** check trademarks.
- Ontario also offers an "Ontario-biased NUANS" if you incorporate provincially.

**Separately, run a trademark search** at the Canadian Trademarks Database
(CIPO). A corporate name can be registered and still infringe someone's mark.
"RRR" is short and generic enough that a clash is plausible. Budget for a
trademark agent search if the name is going to carry real goodwill.

> ⚠️ Do not print business cards, letterhead, or buy the domain permanently
> until NUANS and the trademark search both come back clean.

---

## 1. Federal or Ontario?

| | **Federal (CBCA)** | **Ontario (OBCA)** |
|---|---|---|
| Name protection | Canada-wide | Ontario only |
| Cost | ~$200 online | ~$300 online |
| Annual return | Yes, $12 | Yes, filed with CRA |
| Extra-provincial registration | Needed in each province you operate | Needed outside Ontario |
| Director residency | **25% must be Canadian resident** | **No residency requirement** since 2021 |

**Recommendation:** if you are the sole director and hold an open work permit
rather than PR or citizenship, **Ontario (OBCA)** is the simpler path — the CBCA
25% Canadian-resident director requirement is a real obstacle for a single
non-resident director. Confirm your own status with a lawyer; "resident in
Canada" for CBCA purposes is a defined term and not the same as immigration status.

Federal becomes worth it once you are selling across provinces and want the name
protected nationally.

---

## 2. Incorporate

**Ontario:** ServiceOntario Business Registry → Articles of Incorporation.

You will be asked for:

- Corporate name (with the NUANS report number)
- Registered office address in Ontario — **a real address, and it becomes public**
- Number and names of directors, with addresses
- Share structure — for a single founder, one class of common shares is normal
- Any restrictions on business activity — normally "none"

**Decide before you file:**

- **Share structure.** If you ever intend to bring in a co-founder, take
  investment, or income-split with a spouse, the structure matters and is
  annoying to change later. Talk to an accountant *before* filing, not after.
- **Registered office address.** Your home address becomes a public record. A
  registered-office service is ~$200/year and worth it.

Keep: Articles, Certificate of Incorporation, corporation number.

---

## 3. Minute book

Legally required, and the first thing a buyer, lender or serious client's
counsel asks for. Must contain:

- Articles and Certificate of Incorporation
- By-laws
- Directors' and shareholders' resolutions
- Share register and share certificates
- Register of directors and officers

A lawyer will prepare one for roughly $500–$1,500. A template kit is cheaper
and adequate for a single-founder company, but get it reviewed once.

---

## 4. CRA — Business Number and accounts

Register at CRA Business Registration Online. You get a **BN**, then add
program accounts:

| Account | When |
|---|---|
| **RC — Corporate income tax** | Automatic on incorporation |
| **RT — GST/HST** | See below |
| **RP — Payroll** | Before your first payroll run, including your own salary |
| **RM — Import/export** | Only if importing goods |

### GST/HST registration

- Mandatory once taxable supplies exceed **$30,000 over four consecutive
  calendar quarters** (the small-supplier threshold).
- **Register voluntarily from day one anyway.** Reasons:
  - You can claim **input tax credits** on everything you buy — laptop, cloud,
    software, professional fees. That is real money back.
  - B2B clients do not care; they claim the HST back themselves.
  - Not being registered signals "very small" to enterprise procurement.
- Ontario rate is **13% HST**.
- Filing frequency: annual under $1.5M, but **quarterly is easier to keep on
  top of** and reduces the size of any single surprise.

> Until the RT account is issued, **do not charge GST/HST**. Charging tax you
> are not registered to collect is an offence. The site's costing engine already
> enforces this — it will not add tax while `gstHstNumber` is empty in
> `platform/src/lib/company.ts`.

---

## 5. Banking and payments

- Business chequing account — requires Articles and BN.
- **Never commingle personal and business funds.** It undermines the corporate
  veil, which is the main reason to incorporate at all.
- Set up a separate account for the HST you collect. It is not your money.
- Accounting software from day one: QuickBooks Online, Xero or Wave.

---

## 6. Insurance — before your first engagement

Enterprise clients will ask for certificates. You cannot get them retroactively.

| Cover | Typical limit | Why |
|---|---|---|
| **Commercial general liability** | $2M–$5M | Standard MSA requirement |
| **Professional liability (E&O)** | $1M–$2M | The one that matters — covers negligent advice |
| **Cyber liability** | $1M–$2M | You hold client infrastructure access |

Expect roughly **$1,500–$4,000/year** combined for a small IT consultancy.
Brokers who know the tech sector: Foxquilt, Zensurance, BFL Canada.

---

## 7. Contracts — get these reviewed once

The site references all of these. Have a Canadian commercial lawyer review them
one time; after that you reuse them.

1. **Master Services Agreement** — liability cap, IP assignment, termination
2. **Statement of Work** template — scope, price, acceptance criteria
3. **Mutual NDA** — you will sign this before most discovery
4. **Data Processing Agreement** — PIPEDA, wherever you touch personal data
5. **Independent contractor agreement** — for anyone you subcontract

Budget **$2,500–$6,000** for the set. This is the single highest-value legal
spend for a consultancy, because these documents are what limit your downside.

> ⚠️ **The `legal` agent in this codebase drafts from templates. It does not
> write them and it does not give advice.** Do not let it near a client until a
> lawyer has signed off the underlying templates. See `docs/LEGAL-REVIEW.md`.

---

## 8. Employment, when you hire

- **WSIB** — register if you have workers; some IT consulting is exempt, confirm.
- **EHT (Employer Health Tax)** — Ontario, above the payroll exemption threshold.
- **Payroll deductions** — CPP, EI, income tax, remitted on schedule.
- **ESA** — Ontario minimum standards apply: vacation, public holidays,
  termination notice. The written policies become mandatory above certain
  headcounts.
- **Ontario Human Rights Code** — the HR agent's guardrails encode this. Do not
  relax them.

Contractor vs. employee is a CRA determination, not a matter of what the
contract says. Getting it wrong means back-assessed source deductions plus
penalties. Ask the accountant.

---

## 9. Domain and online identity

- Buy `.ca` **and** `.com` if both are available. `.ca` requires Canadian
  Presence Requirements — an incorporated Canadian company qualifies.
- Registrars: Namespro, Rebel.ca, Cloudflare Registrar (at cost, no markup).
- Register the matching handles on LinkedIn, GitHub and Docker Hub **on the
  same day** — see `docs/GITHUB-ORG.md` and `docs/LINKEDIN.md`.
- Email on the domain immediately. A Gmail address on a proposal costs you
  enterprise credibility, and it is the single cheapest fix on this list.

> The site currently ships `rrrsolutionprovider@gmail.com` as the contact
> address. Change it to `hello@<domain>` in
> `platform/src/lib/company.ts` the day the domain resolves.

---

## 10. After incorporation — fill these in

Everything below appears on the live site and is currently blank. Each is a
one-line edit in **`platform/src/lib/company.ts`**:

```ts
corporationNumber: "",   // from the Certificate of Incorporation
businessNumber:    "",   // CRA BN, e.g. "12345 6789 RC0001"
gstHstNumber:      "",   // unlocks tax on invoices — leave blank until registered
addressLine:       "",   // required by CASL in every commercial email
postalCode:        "",
linkedinCompany:   "",   // after creating the company page
email:             "",   // change to hello@<domain>
siteUrl:           "",   // via NEXT_PUBLIC_SITE_URL
```

Also update `CASL_MAILING_ADDRESS` in your environment file. The mailer will
send without it, but a commercial message lacking a mailing address breaches
CASL s.6(2)(b).

---

## Rough first-year cost

| Item | Cost |
|---|---|
| NUANS report | $25–$75 |
| Incorporation (Ontario) | ~$300 |
| Minute book | $500–$1,500 |
| Registered office service | ~$200/yr |
| Legal — contract templates | $2,500–$6,000 |
| Insurance | $1,500–$4,000/yr |
| Accounting | $1,500–$3,500/yr |
| Domain + email | ~$150/yr |
| Hosting (Vercel + Neon) | $0–$40/mo |
| **Total** | **~$7,000–$16,000** |

The two you should not economise on are **professional liability insurance**
and the **contract templates**. Both exist to cap a downside that is otherwise
unlimited.

---

## Sequence

```
NUANS + trademark search
        ↓
Incorporate (Ontario)
        ↓
Minute book ──────────────┐
        ↓                 │
CRA: BN, RT, RP           │
        ↓                 │
Business bank account     │
        ↓                 │
Insurance ────────────────┤
        ↓                 │
Legal templates reviewed ─┘
        ↓
Domain + email + LinkedIn + GitHub org
        ↓
Fill in company.ts, deploy
        ↓
First engagement
```
