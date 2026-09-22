# Your checklist

Everything still waiting on you, in the order that matters. Written assuming
you have not done this before — so each step says exactly where to click and
what "done" looks like.

**Where things stand right now:**

| | Status |
|---|---|
| Domain `rrrsolutionproviders.ca` | ✅ bought, active to 2027-09-22 |
| Code on GitHub, tests, CI | ✅ done and green |
| Email — can you receive enquiries? | ❌ **no** |
| Database ready for hosting | ❌ still SQLite |
| Site live on the internet | ❌ not yet |
| Company legally incorporated | ❌ not yet |

---

# TODAY — 30 minutes

These three are worth doing before anything else.

## ☐ 1. Lock down the domain (5 min)

The domain **is** the company. If someone takes it, they get your email and
your website.

1. Go to **https://dcc.godaddy.com/control/portfolio** and sign in.
2. Click `rrrsolutionproviders.ca`.
3. Find each of these and turn it ON:

| Setting | Set to | Why |
|---|---|---|
| Domain lock | **ON** | Stops anyone transferring it away |
| Auto-renew | **ON** (already is) | If it lapses you may never get it back |
| WHOIS privacy | **ON** | Otherwise your home address is public and scraped |

4. Then **https://account.godaddy.com/security** → turn on **2-Step
   Verification**.

**Done when:** the domain page shows "Locked" and GoDaddy asks for a code when
you sign in.

---

## ☐ 2. Make email work (10 min) — the most valuable 10 minutes here

**Right now, if someone fills in your contact form, you will not be told.**
The enquiry is saved safely, but no email reaches you. Nothing else on this
list matters as much.

You need a **Google App Password**. That is a 16-character password for one
app. It is *not* your Gmail password, and you can revoke it on its own.

1. Sign in to **rrrsolutionprovider@gmail.com**.
2. Go to **https://myaccount.google.com/signinoptions/twosv** and turn on
   **2-Step Verification** if it is not already on. *(App Passwords do not
   exist without this — it is not optional.)*
3. Go to **https://myaccount.google.com/apppasswords**
4. In the box, type `RRR site`, and click **Create**.
5. Google shows you 16 characters with spaces, like `abcd efgh ijkl mnop`.
   **Copy it now** — it is shown once.

Now create the settings file. In Terminal:

```bash
cd ~/Desktop/incorp/platform
open -e .env.local
```

That opens an empty TextEdit window. Paste this in, replacing the password
line with your 16 characters:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=rrrsolutionprovider@gmail.com
SMTP_PASS=paste_your_16_characters_here
MAIL_FROM=RRR Solution Providers <rrrsolutionprovider@gmail.com>
MAIL_TO=vidhyashankargoel1996@gmail.com
DATABASE_URL=file:./dev.db
```

> `MAIL_TO` is where enquiry alerts land. It is set to your personal inbox so
> you do not miss anything. Change it whenever you want.

Save (⌘S) and close. Then test it:

```bash
cd ~/Desktop/incorp/platform
npm run mail:check -- --send
```

**Done when:** you see green ticks and a test email arrives. *Check your spam
folder for the first one.*

> This file is never uploaded to GitHub — it is excluded, and CI fails the
> build if a password ever gets committed.

---

## ☐ 3. Create two secret keys (2 min)

Two random values the app needs. Run this twice:

```bash
openssl rand -hex 32
```

Add both to the same `.env.local` file:

```
ADMIN_TOKEN=paste_the_first_one
CONSENT_SALT=paste_the_second_one
```

| Key | What it does |
|---|---|
| `ADMIN_TOKEN` | The password for your admin console at `/admin`. Without it you cannot approve anything the agents draft. |
| `CONSENT_SALT` | Protects your proof that customers consented. Without it the app deliberately stores nothing rather than store something reversible. |

**Done when:** both lines are in the file. Keep them — treat them like
passwords.

---

# THIS WEEK — getting the site live

## ☐ 4. Create a free database (5 min)

Your site currently uses SQLite, which is a file on your laptop. Web hosting
cannot use a file — it needs a real database. **Neon** is free.

1. Go to **https://neon.tech** → **Sign up** (use your GitHub account, it is
   quickest).
2. Click **Create project**. Name it `rrr-platform`.
3. Region: pick the one nearest Toronto (usually **US East**).
4. It shows a **connection string** starting `postgresql://`. Copy it.

**Done when:** you have that string saved somewhere. Send it to me and I will
do the rest — switching the app over is my job, not yours.

---

## ☐ 5. Log in to Vercel (3 min)

Vercel is the free hosting that runs your site. I cannot log in as you.

```bash
cd ~/Desktop/incorp/platform
npx vercel login
```

Choose **Continue with GitHub**. A browser opens, you approve, done.

**Done when:** `npx vercel whoami` prints your username instead of
"Logged out".

**Then tell me**, and I will deploy it, connect the database, set all the
environment variables, and check every page works before you touch DNS.

---

## ☐ 6. Point the domain at the site (10 min + waiting)

**Only after step 5 is done and I confirm the site works.**

I will give you the exact two records to add. You will:

1. GoDaddy → **My Products** → `rrrsolutionproviders.ca` → **DNS** →
   **Manage Zones**
2. **Delete** GoDaddy's default parking records first — they cause
   intermittent failures that look like a hosting problem and are not.
3. Add the two records I give you.

**Done when:** `https://www.rrrsolutionproviders.ca` loads your site. Can take
minutes, occasionally up to 48 hours.

---

# BEFORE YOU TAKE A PAYING CLIENT

Legal and financial. None of it blocks the website, all of it blocks invoicing
a real customer properly.

## ☐ 7. Incorporate the company

`docs/INCORPORATION.md` has the full walkthrough. The short version:

1. **NUANS report** (~$30) — proves the name is available.
2. **Incorporate** — Ontario (~$300) or federal (~$200). Federal protects the
   name across Canada.
3. **CRA Business Number** — free, once incorporated.
4. **GST/HST registration** — mandatory once you bill $30,000 in four quarters.
   Worth registering earlier so you can claim input credits back.

Then send me the numbers and I will put them on the site and on invoices,
which the OBCA requires.

## ☐ 8. Business address

Three fields in the code are empty and one of them is a legal requirement:
`addressLine`, `postalCode`, and the CASL mailing address.

**CASL requires a physical mailing address in every commercial email.** You
are fine today — replies to an enquiry are exempt — but you cannot send a
newsletter or any outbound pitch until this exists. Penalties reach
**$10,000,000**.

A home address works. So does a registered-office service (~$200/year) if you
would rather not publish where you live.

## ☐ 9. Insurance

Most corporate clients will not sign without it. `docs/INCORPORATION.md` has
the detail — typically commercial general liability plus errors & omissions,
and cyber liability for anyone touching infrastructure.

## ☐ 10. Write a breach procedure

One page: who to call, what to check, when to notify. PIPEDA requires
reporting breaches that pose a real risk of significant harm to the Privacy
Commissioner **and** to the affected people.

An hour now. Impossible to do calmly during an actual incident.

---

# TWO DECISIONS ONLY YOU CAN MAKE

## ☐ A. The email spelling

Your address is `rrrsolutionprovider@gmail.com` — **singular**. The company is
"RRR Solution Provider**s**" — **plural**. It will appear on every invoice,
every proposal and every email signature.

- Keep it → nothing to do.
- Change it → create the new Gmail, tell me, one line changes in the code.

## ☐ B. Whether I upgrade Next.js now

`npm audit` reports 6 vulnerabilities (5 high, 1 critical) in an image library
that Next.js pulls in. They pre-date all of this work.

The fix is a Next.js version bump slightly outside the range currently pinned,
so it carries a small risk of breaking something. **I would do it before you
go live**, with the full test suite behind it to catch anything.

Say the word and it is about 20 minutes.

---

# What I do once you have done yours

| You finish | I then do |
|---|---|
| Step 4 (database) | Switch the app to Postgres, migrate the schema |
| Step 5 (Vercel login) | Deploy, set every environment variable, verify every page |
| Step 6 prep | Give you the exact DNS records |
| Step 7 (incorporation) | Put the numbers on the site and invoices |
| Decision B | Upgrade Next.js and re-run everything |

---

# If you only do one thing

**Step 2 — email.** Everything else is built and waiting. Without it, someone
can fill in your contact form tomorrow and you will never know.
