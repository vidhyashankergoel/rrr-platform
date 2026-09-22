# Deploying

Where the code lives, why it is not on GitHub Pages, and how to put it online.

---

## 1. The repository

**https://github.com/vidhyashankergoel/rrr-platform** — public, in the
`vidhyashankergoel` organization, `main` tracking `origin/main`.

Excluded from it, deliberately:

| Excluded | Why |
|---|---|
| `*.db` | Lead, Conversation and Booking rows hold real names, addresses and what people told us in confidence. A committed database is a PIPEDA breach, not untidiness. |
| Local configuration | Holds live credentials. `platform/env.example` documents every variable with placeholders. |
| `agent-inbox/` | Work packages reference real client engagements. |
| `node_modules/`, build output | Noise. |

CI enforces both of the first two on every push: a credential-shaped string or
a tracked database fails the build.

---

## 2. Why not GitHub Pages

Two independent reasons. Either alone would rule it out.

### The application needs a server

GitHub Pages serves static files. It runs no server code at all. This
application has six API routes, a database and a background scheduler:

| Route | Breaks without a server |
|---|---|
| `/api/leads` | The enquiry form. Nothing is captured, nothing is emailed. |
| `/api/bookings` | The whole booking system. No slots, no bookings. |
| `/api/bookings/[id]/ics` | The calendar file people add to their diary. |
| `/api/chat` | Ada. Every answer. |
| `/api/chat/feedback` | Answer ratings. |
| `/api/admin/approvals` | The approval queue — the human gate the agents depend on. |

Put this on Pages and a visitor sees a site that looks finished and does
nothing. The contact form fails silently. That is worse than having no site.

### The static fallback in `site/` is stale

There is a hand-written static site in `site/`. It cannot stand in either:
`index.html` links to `about.html`, `contact.html`, `pricing.html` and
`services.html`, and **none of those files exist**. Publishing it produces a
live URL where every navigation link returns 404.

It is kept in the repository as a reference for the original copy. It should
be deleted or rebuilt before it is ever served.

### And the plan does not allow a private Pages site anyway

GitHub Pages is available for public repositories on GitHub Free, and for
private repositories only on Pro, Team or Enterprise. A genuinely
access-controlled Pages site requires Enterprise Cloud. The organization is on
Free.

---

## 3. Deploying the real thing — Vercel

Free, made by the people who make Next.js, and it runs the API routes.
`platform/vercel.json` is committed, so this is nearly all done for you.

### 3.1 A database that is not SQLite

SQLite is a file, and a serverless platform has no persistent filesystem.
Use Postgres. **Neon** and **Supabase** both have free tiers that suit this
workload; RDS if you want it in your own account.

Create a database, copy the connection string, then:

```bash
cd platform
# in prisma/schema.prisma change:  provider = "sqlite"  ->  "postgresql"
npx prisma db push
```

### 3.2 Deploy

```bash
cd platform
npx vercel          # first run links the project — accept the defaults
npx vercel --prod
```

You get a URL like `rrr-platform.vercel.app`. **Confirm the site works there
before touching DNS.** Debugging a broken deploy and broken DNS simultaneously
is miserable.

### 3.3 Environment variables

Vercel dashboard → Settings → Environment Variables. Every one of these is in
`platform/env.example` with an explanation:

```
DATABASE_URL            your Postgres connection string
NEXT_PUBLIC_SITE_URL    https://www.rrrsolutionproviders.ca
ADMIN_TOKEN             openssl rand -hex 32
MAIL_TO                 where enquiry notifications land
MAIL_FROM               RRR Solution Providers <hello@rrrsolutionproviders.ca>
RESEND_API_KEY          or the SMTP_* set — see EMAIL-SETUP.md
CASL_UNSUBSCRIBE_BASE   https://www.rrrsolutionproviders.ca/unsubscribe
CASL_MAILING_ADDRESS    required before anything promotional
```

`ADMIN_TOKEN` gates `/admin`. Without it the console refuses every request,
which is the correct failure — but it also means you cannot approve anything,
so set it.

### 3.4 Then DNS

`DOMAIN-AND-DNS.md` covers the records, including the SPF, DKIM and DMARC that
decide whether your proposals arrive or land in spam.

---

## 4. The agents

The agents are a separate process from the website. They do not run on Vercel's
serverless functions, which are request-scoped.

**Simplest:** any always-on machine, including the laptop.

```bash
cd platform && npm run agents:run
```

**Better, for a machine that reboots** — a supervised one-shot recovers from a
crash on its own, whereas a dead long-running process stays dead until somebody
notices:

```
*/5 * * * * cd /path/to/platform && npm run agents:tick >> agents.log 2>&1
```

**In production:** a small always-on host (Railway, Render, Fly.io, or a $6
VPS) pointed at the same Postgres database as the website. The agents need
`DATABASE_URL` and the mail variables; nothing else.

---

## 5. Keeping local and remote in step

```bash
git pull --rebase       # before starting work
git push                # after committing
```

`main` already tracks `origin/main`, so both are bare commands.

CI runs on every push: types for both configs, the agent suite, the auto-reply
templates, booking, attribution, delivery, retrieval, the customer journey, a
production build, and the two credential checks. Watch it with:

```bash
gh run watch
gh run list --limit 5
```

The browser suites are not in CI — they need a running server and a real
Chromium. Run them locally before anything important:

```bash
cd platform
npm test              # 14 suites
npm run test:e2e      # 109 assertions in a real browser
```
