# Email setup

How to start receiving enquiries and bookings. Two options — read §1, pick one,
then follow that section only.

Everything here is free.

---

## 0. What I could not do for you

Three steps need your own login and your own credentials, so they are yours:

- **Creating the accounts** (Resend, or a Google App Password).
- **Pasting the key** into `platform/.env.local` — I never see or handle it.
- **Buying the domain** (see `DOMAIN-AND-DNS.md`).

Everything else is built and tested. When you have done the steps below,
`npm run mail:check` proves whether it works — you will not have to guess.

> The company email is now **rrrsolutionprovider@gmail.com** throughout the
> site, the footer, the contact page and every outgoing message. If that
> mailbox does not exist yet, create it first — everything below assumes it.
>
> ⚠️ Note the spelling: the address is `rrrsolutionprovider` (singular) while
> the company is "RRR Solution Provider**s**" (plural). It will sit on every
> invoice and email signature. Worth changing now if it was a typo; trivial to
> change later if not (one line in `platform/src/lib/company.ts`).

---

## 1. Which option

|  | **A — Resend** | **B — SMTP (Gmail)** |
|---|---|---|
| You receive enquiries and bookings | ✅ today | ✅ today |
| Visitors receive acknowledgements | ❌ needs a domain first | ✅ today |
| Setup time | ~3 minutes | ~5 minutes |
| Volume | 3,000/month | ~500/day |
| Deliverability | built for this | fine at this volume |
| What you paste in | an API key | a Google App Password |

**Pick B if you want the whole thing working this afternoon.** It is the only
one that can reply to visitors before you own a domain.

**Pick A if you would rather set up the thing you will keep.** Resend is the
right long-term answer, and you can start it now and finish it when the domain
arrives.

You can switch later by changing one file. Nothing else in the codebase
depends on the choice.

---

## 2. Option A — Resend

### 2.1 Create the account and key

1. Go to **https://resend.com** and sign up **using
   `rrrsolutionprovider@gmail.com`**. This matters: until you verify a domain,
   Resend only delivers to the address on the account, so signing up with a
   different address sends your enquiries somewhere you are not reading.
2. Verify the sign-up email.
3. Go to **https://resend.com/api-keys** → **Create API Key**.
   Name it `rrr-site`, permission **Sending access**.
4. Copy the key. It starts `re_` and is shown once.

### 2.2 Put it in the project

Create the file `platform/.env.local` (it is git-ignored; it must never be
committed) containing:

```bash
RESEND_API_KEY=re_paste_your_key_here
MAIL_TO=rrrsolutionprovider@gmail.com
DATABASE_URL=file:./dev.db
```

Do **not** set `MAIL_FROM` yet. Left unset, the code falls back to Resend's
shared test sender, which works with no domain.

### 2.3 Check it

```bash
cd platform
npm run mail:check -- --send
```

You should see `provider  resend`, a green credentials line, and a test
message in your inbox within a minute. Check spam on the first one.

### 2.4 What is and is not working at this point

- ✅ **Enquiry notifications reach you.**
- ✅ **Booking notifications reach you.**
- ❌ **Acknowledgements to visitors do not go out.** Resend refuses any
  recipient other than the account owner until a domain is verified. The
  messages are not lost — they are stored with the reason, visible at `/admin`,
  and `mail:check` says so plainly.

### 2.5 Finish it once you own the domain

1. **https://resend.com/domains** → **Add Domain** → enter your domain.
2. Resend shows DNS records (SPF, DKIM, and usually a DMARC suggestion). Add
   them at your registrar — `DOMAIN-AND-DNS.md` §5 step 4 covers this.
3. Wait for **Verified**.
4. Add to `.env.local`:
   ```bash
   MAIL_FROM=RRR Solution Providers <hello@yourdomain.ca>
   ```
5. `npm run mail:check -- --send` again. The acknowledgement line turns green.

---

## 3. Option B — SMTP through Gmail

### 3.1 Create an App Password

A Google App Password is a 16-character password for one application. It is
not your account password and can be revoked on its own.

1. Sign in to **rrrsolutionprovider@gmail.com**.
2. Turn on **2-Step Verification** if it is not already on:
   https://myaccount.google.com/signinoptions/twosv
   (App Passwords do not exist without it.)
3. Go to **https://myaccount.google.com/apppasswords**
4. Name it `RRR site` and create it.
5. Copy the 16 characters. Google shows it once, with spaces — the spaces do
   not matter, keep or remove them.

### 3.2 Put it in the project

Create `platform/.env.local`:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=rrrsolutionprovider@gmail.com
SMTP_PASS=your_16_character_app_password
MAIL_FROM=RRR Solution Providers <rrrsolutionprovider@gmail.com>
MAIL_TO=rrrsolutionprovider@gmail.com
DATABASE_URL=file:./dev.db
```

### 3.3 Check it

```bash
cd platform
npm run mail:check -- --send
```

All three lines under "What this setup can deliver" should be green.

### 3.4 What to know

- Gmail allows roughly **500 messages a day**. This site will not approach it.
- Mail arrives **from your Gmail address**, which is honest — it is your
  address — but a `hello@yourdomain.ca` sender reads as more established.
  Move to Option A when the domain is ready.
- If Google ever rejects the password, revoke it and create a new one. The
  most common cause is 2-Step Verification being turned off.

---

## 4. Proving it end to end

With the dev server running:

```bash
cd platform
npm run dev
```

Then on the site:

1. Submit the contact form.
2. Book a call from any "Book a free call" button.

Both should appear in `rrrsolutionprovider@gmail.com` within a minute, and
both appear in the approval queue at `/admin`.

If mail is misconfigured, **nothing is lost**: the enquiry is already in the
database, the notification is stored with the failure reason, and the whole
message is printed to the server log with a loud banner. Look there first.

---

## 5. What gets sent

| Trigger | To | Type | Needs consent |
|---|---|---|---|
| Contact form | you | notification | no — internal |
| Contact form | the visitor | acknowledgement | yes, ticked on the form |
| Call booking | you | notification | no — internal |
| Call booking | the visitor | confirmation + calendar links | yes, ticked on the form |

Everything currently sent is **transactional** — it answers something the
person initiated. CASL's consent rules bite on *commercial* messages:
newsletters, outbound pitches, "we have a new service" announcements.

**Before you send anything promotional:**

1. Set `CASL_MAILING_ADDRESS` — s.6(2)(b) requires a physical address in every
   commercial message and the company address fields are still empty.
2. Only send to leads with `consentMarketing` on record. The mailer already
   refuses otherwise and logs the refusal; do not work around it.
3. s.13 puts the burden of *proving* consent on you. The consent timestamp,
   source URL and hashed IP already recorded on each lead are that proof.

Penalties reach **$1,000,000** for an individual and **$10,000,000** for an
organization. This is the one area of the build where the code deliberately
fails closed.

---

## 6. Moving to a domain address

A `@gmail.com` address on an invoice is the most common reason a procurement
team asks whether a supplier is a real company. It costs about $11 a year to
fix.

Once the domain is bought (`DOMAIN-AND-DNS.md`):

1. Set up mail hosting — **Zoho Mail** is free for one user; Google Workspace
   is about $9/month if you want the familiar interface.
2. Add the MX, SPF, DKIM and DMARC records. `DOMAIN-AND-DNS.md` §5 step 4.
3. Change one line in `platform/src/lib/company.ts`:
   ```ts
   email: "hello@rrrsolutionproviders.ca",
   ```
4. Update `MAIL_FROM` and `MAIL_TO` in `.env.local`.
5. `npm run mail:check -- --send`.

The footer, the assistant, the contact page, every email and every
structured-data block read from `company.ts`, so nothing else needs touching.

---

## 7. Deploying

`.env.local` is for your machine only. On Vercel, set the same values under
**Settings → Environment Variables**, then redeploy.

Set at minimum:

```
RESEND_API_KEY        (or the SMTP_* set)
MAIL_FROM
MAIL_TO
NEXT_PUBLIC_SITE_URL
CASL_UNSUBSCRIBE_BASE
CASL_MAILING_ADDRESS
DATABASE_URL          (a Postgres URL, not SQLite)
ADMIN_TOKEN           (openssl rand -hex 32)
```

---

## 8. Troubleshooting

Run `npm run mail:check` first — it names the problem in most cases.

| Symptom | Cause | Fix |
|---|---|---|
| `provider none` | No `.env.local`, or it is in the wrong folder | It belongs in `platform/`, beside `package.json` |
| `bad-api-key` | Key mistyped, or revoked | New key at resend.com/api-keys |
| `owner-only-sender` | No verified domain on Resend | Expected. §2.5 to finish, or use Option B |
| `smtp-verify-failed`, auth error | 2-Step Verification off, or wrong password | §3.1 — the App Password, not the account password |
| SMTP hangs and never errors | Wrong port/TLS combination | 587 with `SMTP_SECURE` unset, or 465 with `SMTP_SECURE=true` |
| Sends, but nothing arrives | Spam folder | Check it. Then SPF/DKIM/DMARC — `DOMAIN-AND-DNS.md` §5 step 4 |
| Works locally, not deployed | Variables not set on the host | §7 |

Nothing is ever silently dropped. Every attempt is a row in `EmailMessage`
with its status and error, visible at `/admin`.
