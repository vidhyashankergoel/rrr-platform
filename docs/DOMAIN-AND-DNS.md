# Domain name and DNS

> ## ✅ PURCHASED — rrrsolutionproviders.ca
> Registered through **GoDaddy Domains Canada** (CIRA registry), active
> 2026-09-22, **auto-renews 2027-09-22 at C$21.99**. Paid C$4.51 for year one.
>
> Do these four things at the registrar today, before anything else:
>
> | Setting | Value | Why |
> |---|---|---|
> | WHOIS privacy | ON | CIRA masks individual registrants by default, but confirm it — otherwise your address is public and scraped |
> | Domain lock | ON | Blocks unauthorized transfer |
> | Auto-renew | ON (already) | Losing the domain is unrecoverable |
> | Two-factor on the GoDaddy account | ON | The domain *is* the company |
>
> Registrant email should **not** be an address on this domain — if the domain
> lapses you lose the recovery mailbox too. Keep it on Gmail.

What to buy, what to avoid, and exactly how to point it at the site once you own it.

---

## 1. Buy `.ca` and `.com` together

Not optional for a Canadian B2B firm.

- **`.ca`** signals a Canadian supplier. Procurement teams notice. It requires
  meeting CIRA's **Canadian Presence Requirements** — an Ontario-incorporated
  company qualifies, so buy it *after* incorporation or in your own name as a
  Canadian citizen/permanent resident and transfer later.
- **`.com`** stops someone else taking your name, and is what people type by
  default.

Point `.com` at `.ca` with a 301 redirect (or the reverse). Pick one as
canonical and stay with it — splitting traffic across both hurts search ranking
and looks amateur in an email signature.

> ⚠️ **GoDaddy caveat.** Their renewal prices are roughly 2–4× the first-year
> promo, and they upsell aggressively at checkout. Decline every add-on —
> privacy protection should be free (it is at Cloudflare), and you do not need
> their hosting, email, or "website builder". If you want the cheapest honest
> option, **Cloudflare Registrar** sells at wholesale cost with no markup and
> free WHOIS privacy. **Namespro** and **Rebel.ca** are solid Canadian
> registrars for `.ca`.
>
> Buying at GoDaddy is fine. Just set a calendar reminder before renewal.

---

## 2. Name candidates — checked 2026-09-20

I resolved each candidate over DNS and, where it answered, looked at what is
hosting it. **Treat this as a strong signal, not proof**: a domain can be
registered with no nameservers set and still look free here. Confirm at the
registrar before you rely on it.

### ✅ Available — and the ones to buy

| Domain | Status | Note |
|---|---|---|
| **rrrsolutionproviders.ca** | Free | Exact legal-name match. Unambiguous on an invoice. |
| **rrrsolutionproviders.com** | Free | Buy alongside the `.ca` and redirect. |
| **rrrsolutionproviders.ca** | Free | Short, memorable, says the category in one word. |
| **rrrplatform.ca / .com** | Both free | "Platform engineering" is the growth term. |
| **rrrdevops.ca / .com** | Both free | Highest search intent; narrows you to DevOps. |
| **rrrengineering.ca** | Free | Broader than "devops", still concrete. |
| **rrrcloudworks.ca** | Free | "Works" implies delivery rather than advice. |
| **rrrtech.ca** | Free | Generic, but short. |
| **rrrsp.ca** | Free | Very short. Unmemorable — an acronym of an acronym. |

### ❌ Taken — including my earlier recommendation

| Domain | Held by | What it is |
|---|---|---|
| **rrrsolutions.ca** | GoDaddy parking (`domaincontrol.com`) | Registered, parked, no site. Possibly acquirable through GoDaddy's broker — expect a premium. |
| **rrrsolutions.com** | GoDaddy parking | Same. |
| **rrrcloud.com** | Afternic (`afternic.com`) | **Actively listed for sale** on GoDaddy's aftermarket. It will have a price attached — usually four figures. |
| **rrr.ca** | Registered, not serving | Three-letter `.ca` domains are valuable and rarely released. |

> **Correction to my earlier advice.** I previously recommended
> `rrrsolutions.ca` as the canonical domain. It is taken — parked at GoDaddy.
> The recommendation below replaces it.

### Recommendation

**Buy three:**

1. **`rrrsolutionproviders.ca`** — the legal name, for contracts, invoices and
   anywhere the registered entity must be unambiguous.
2. **`rrrsolutionproviders.com`** — defensive, redirects to the `.ca`.
3. **`rrrsolutionproviders.ca`** — the everyday brand. Short enough to say over the phone,
   short enough for an email address (`you@rrrsolutionproviders.ca`), and it tells a
   stranger what you do.

Make **`rrrsolutionproviders.ca` canonical** and 301 the other two to it. Your legal name
still appears on every page footer, invoice and contract, which is what the
OBCA actually requires — the domain does not have to carry it.

Roughly **$30–$45 for all three in year one** at Cloudflare or Namespro.

**If you would rather have one domain:** `rrrsolutionproviders.ca` alone is
fine. It is long, but it is exactly your legal name and nobody will ever
question which company they are dealing with.

### The phone test

Say each aloud and see which survives:

- *"R-R-R cloud dot C-A"* → typed correctly first time
- *"R-R-R solution providers dot C-A"* → correct, but they will ask you to repeat it
- *"R-R-R-S-P dot C-A"* → they will get it wrong

### On buying a taken domain

`rrrcloud.com` is listed on Afternic, so it has an asking price you can see at
checkout. Before paying a premium for any aftermarket domain:

- Check its history at `web.archive.org` — a domain previously used for spam
  carries a reputation penalty you inherit
- Search `site:thedomain.com` on Google to see what is indexed
- Remember you are buying convenience, not necessity. `.ca` serves a Canadian
  B2B firm better than `.com` anyway

## 3. Before you pay

1. **NUANS** — confirms the corporate name is clear (see `INCORPORATION.md`).
2. **CIPO trademark search** — a corporate name search does *not* cover
   trademarks. "RRR" is short and generic; check it.
3. **Social handles** — check the matching handle on LinkedIn and GitHub is free
   before committing to the name. Register them the same day.
4. **Domain history** — paste the domain into
   `web.archive.org` and Google `site:thedomain.ca`. A domain previously used
   for spam carries a reputation penalty you inherit.

---

## 4. Once you own it — the settings to change

Regardless of registrar:

| Setting | Value | Why |
|---|---|---|
| **WHOIS privacy** | ON | Otherwise your home address is public and you will be spammed |
| **Domain lock** | ON | Prevents unauthorized transfer |
| **Auto-renew** | ON | Losing the domain is unrecoverable |
| **Two-factor auth** | ON, on the registrar account | The domain *is* the company |
| **Registrant email** | Not an address on the domain itself | If the domain lapses you lose the recovery email too |

> That last one catches people out. Use a Gmail or Outlook address as the
> registrant contact, never `admin@yourdomain.ca`.

---

## 5. DNS — pointing it at the site

The app deploys cleanly to **Vercel** (zero config for Next.js) or
**Cloudflare Pages**. Instructions below assume Vercel; the shape is the same
either way.

### Step 1 — deploy first, DNS second

```bash
cd platform
npx vercel          # first run links the project
npx vercel --prod
```

You get a URL like `rrr-platform.vercel.app`. Confirm the site works there
**before** touching DNS. Debugging a broken deploy and broken DNS at the same
time is miserable.

### Step 2 — add the domain in Vercel

Vercel dashboard → Project → Settings → Domains → add `rrrsolutionproviders.ca` and
`www.rrrsolutionproviders.ca`. Vercel then tells you which records to create.

### Step 3 — create the records at GoDaddy

GoDaddy → My Products → DNS → Manage Zones.

| Type | Name | Value | TTL |
|---|---|---|---|
| `A` | `@` | `76.76.21.21` | 600 |
| `CNAME` | `www` | `cname.vercel-dns.com` | 600 |

**Delete** GoDaddy's default parking records first — the `A` record pointing at
their parked-page IP, and any `CNAME` for `www` pointing at
`_domainconnect` or their builder. Leaving them causes intermittent failures
that look like a Vercel problem and are not.

> Use whatever values **your** Vercel dashboard shows. The IP above is Vercel's
> current apex address, but verify rather than trusting a document.

### Step 4 — email records

You will send from the domain, so these are mandatory. Values come from your
email provider (Google Workspace, Microsoft 365, Zoho, Fastmail).

| Type | Name | Purpose |
|---|---|---|
| `MX` | `@` | Where mail is delivered |
| `TXT` | `@` | **SPF** — who may send as you |
| `TXT` | `resend._domainkey` etc. | **DKIM** — cryptographic signing |
| `TXT` | `_dmarc` | **DMARC** — what to do with failures |

Start DMARC in monitor mode and tighten once you see clean reports:

```
v=DMARC1; p=none; rua=mailto:dmarc@rrrsolutionproviders.ca; fo=1
```

After a few weeks of clean reports, move to `p=quarantine`, then `p=reject`.

**This matters more than it sounds.** Without SPF, DKIM and DMARC, your
proposals land in spam and anyone can spoof invoices from your domain. Invoice
fraud against small consultancies is common, and your own security page
promises clients you take this seriously.

### Step 5 — verify

```bash
dig rrrsolutionproviders.ca A +short
dig www.rrrsolutionproviders.ca CNAME +short
dig rrrsolutionproviders.ca TXT +short
dig _dmarc.rrrsolutionproviders.ca TXT +short
```

Then check the site actually loads over HTTPS and that the redirect works:

```bash
curl -sI https://rrrsolutionproviders.ca | head -1
curl -sI https://www.rrrsolutionproviders.ca | head -1
curl -sI http://rrrsolutionproviders.ca | head -1     # should 301 to https
```

DNS propagation is usually minutes, occasionally up to 48 hours. Check from
outside your own network with `dnschecker.org` — your ISP may cache.

---

## 6. Update the code

Two places, both one-line:

**`platform/src/lib/company.ts`**
```ts
email:  "hello@rrrsolutionproviders.ca",        // stop using the Gmail address
siteUrl: "https://www.rrrsolutionproviders.ca",
```

**Environment variables** (Vercel → Settings → Environment Variables)
```
NEXT_PUBLIC_SITE_URL   https://www.rrrsolutionproviders.ca
MAIL_FROM              RRR Solution Providers <hello@rrrsolutionproviders.ca>
CASL_UNSUBSCRIBE_BASE  https://www.rrrsolutionproviders.ca/unsubscribe
CASL_MAILING_ADDRESS   RRR Solution Providers Inc., <street>, Toronto, ON <postal>, Canada
DATABASE_URL           <your Postgres connection string>
ADMIN_TOKEN            <openssl rand -hex 32>
```

Also switch `prisma/schema.prisma` from `sqlite` to `postgresql` and point
`DATABASE_URL` at a managed database (Neon and Supabase both have usable free
tiers; RDS if you want it in your own account).

Then redeploy. The footer, the assistant, every email and every structured-data
block read from those constants, so nothing else needs touching.

---

## 7. Cost

| Item | Cloudflare | GoDaddy (yr 1 → renewal) |
|---|---|---|
| `.ca` | ~$11/yr | ~$5 → ~$25/yr |
| `.com` | ~$11/yr | ~$2 → ~$24/yr |
| WHOIS privacy | free | often bundled, sometimes charged |
| Hosting (Vercel Hobby) | $0 | — |
| Database (Neon free tier) | $0 | — |
| Email (Zoho Mail, 1 user) | ~$1.50/mo | — |

**Realistic total: about $50–$90 for the first year.** The main cost of this
business is not infrastructure.

---

## 8. Checklist

- [ ] NUANS and CIPO trademark searches clear
- [ ] LinkedIn and GitHub handles available
- [ ] `.ca` and `.com` purchased
- [ ] WHOIS privacy, domain lock, auto-renew, 2FA all on
- [ ] Registrant email is *not* on the domain itself
- [ ] Deployed to Vercel and working on the `.vercel.app` URL
- [ ] GoDaddy parking records deleted
- [ ] `A` and `CNAME` records created
- [ ] HTTPS working, `http` → `https` redirect confirmed
- [ ] Apex → `www` (or the reverse) redirect confirmed
- [ ] MX, SPF, DKIM, DMARC configured and verified
- [ ] Test email sent and received, not in spam
- [ ] `company.ts` and environment variables updated
- [ ] Prisma switched to Postgres
- [ ] Redeployed, site live on the real domain
