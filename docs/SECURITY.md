# Security and privacy

The site is public. The database holds other people's personal information —
names, email addresses, phone numbers, and whatever they told us in confidence
in an enquiry or a chat. This is what protects it, what does not, and what to
do before real customers use it.

`npm run test:security` asserts every control on this page. It runs in CI on
every push, because a protection nobody tests is one that quietly stops
working and nobody notices until somebody else does.

---

## 1. What we hold, and for how long

| Record | Contains | Retained |
|---|---|---|
| `Lead` | Name, email, phone, company, role, the message they wrote | 2 years |
| `Conversation` / `Message` | The full chat transcript | With the lead |
| `Booking` | Name, email, phone, what they want to discuss | 1 year |
| `InboundMail` | Sender, subject, first ~400 characters | 1 year |
| `EmailMessage` | Everything we sent them | With the lead |

Every one carries a `purgeAfter` date set at creation. That is what makes
PIPEDA Principle 5 enforceable rather than aspirational — and the watchdog
raises records past their date rather than letting them sit.

**Deliberately not stored:** raw IP addresses, full inbound message bodies
(the mailbox remains the record), payment details of any kind.

---

## 2. Controls, and why each exists

### Every endpoint is throttled

An endpoint that takes an identifier and answers unthrottled is an oracle: it
reports "does this exist?" as fast as somebody can ask. All six API routes are
rate limited.

Two were fixed during this review:

- **`/api/admin/approvals` GET** was unthrottled. It returns the customer list
  behind a single shared token, so its only gate was open to guessing at
  whatever rate the network allowed. It is now throttled **before** the token
  is checked, and failed attempts are recorded as `admin.auth.failed` — a
  burst of those from one address is what a credential attack looks like.
- **`/api/bookings/[id]/ics`** was unauthenticated *and* unthrottled. The file
  names a real person and carries their email. Now: 20 requests a minute, the
  id must match the expected shape before any query runs, and a missing
  booking and a cancelled one return exactly the same 404 — distinguishing
  them would confirm an id exists.

### Minimum necessary in every response

The admin console used to receive whole `Lead` rows. Two columns had no
business crossing the wire:

- `unsubscribeToken` — a **capability**. Anyone holding it can unsubscribe
  that person.
- `consentIpHash` — consent evidence, used by nothing on screen.

Responses now name their columns explicitly. A browser extension, a proxy log
or a screenshot can only capture what was actually sent.

### Consent evidence cannot be reversed

An IP address has about four billion possibilities, so a digest with a known
salt is reversible by anyone who can read the database — it would be *storing*
the address while claiming to protect it.

This repository is public, so a hard-coded fallback salt is a **published**
salt. The code now fails closed: with no `CONSENT_SALT` set it records that
consent came from an unidentifiable session rather than storing a reversible
digest. Losing a weak signal beats storing personal data we said we were
protecting.

**Set `CONSENT_SALT` in production** (`openssl rand -hex 32`) to keep CASL
s.13 proof-of-consent evidence.

### Personal information stays out of the logs

Hosting platforms retain logs, surface them in a dashboard, and often forward
them to a third-party aggregator. A log line is a second, longer-lived copy of
whatever it prints.

When mail fails, development prints the whole notification — the log is the
only visible copy and a silent failure means a lost customer. **Production
prints the failure and nothing else.** The enquiry is already safe in the
database; the operator needs to know delivery failed, not to re-read the
message in a log. Recipient addresses are replaced by the message id.

### Session identifiers carry real entropy

A session id is the only thing separating one visitor's conversation from
another's. The schema accepted eight characters, which would have accepted
`aaaaaaaa` — shared by every visitor who sent it. It now requires 20–64
characters of the alphabet a UUID uses.

### Consent is never assumed

`consentContact` must be **literally `true`** on both the enquiry form and the
booking form — not truthy, not defaulted, not pre-ticked. Marketing consent
defaults to `false` and is stored separately, because CASL and PIPEDA ask
different questions.

### Headers

CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`,
`Permissions-Policy`, `frame-ancestors 'none'`, `object-src 'none'`.
`unsafe-eval` exists only in development, where Next's hot reload needs it —
the test asserts it cannot reach production.

The calendar file is `private, no-store` so no shared cache or CDN retains a
copy of a document naming a real person.

---

## 3. What is NOT protected yet — read this before launch

Being straight about the gaps matters more than the list above.

### Rate limiting is per-instance, and serverless has many instances

`src/lib/ratelimit.ts` keeps counters in memory. On a single server that is
correct. **On Vercel each serverless instance has its own memory**, so an
attacker spreading requests across instances gets the limit multiplied by
however many are warm.

It still stops casual abuse and accidental loops. It does **not** stop a
determined attacker. Before the admin console holds real customer data on a
serverless host, move the counters to Upstash Redis — it has a free tier and
the interface in `ratelimit.ts` is small enough to swap in an afternoon.

### The admin console is one shared token

There is no user model. Anyone with `ADMIN_TOKEN` is an administrator, and
there is no way to tell who did what — `decidedBy` records a name the client
supplies.

Adequate for one to five people. Replace with real per-user authentication
before anyone outside the founding team needs access. The `decidedBy` field
already expects a real identity.

### There is no encryption at rest beyond the host's

SQLite locally, Postgres in production. Neither encrypts individual columns.
A host compromise exposes the lead table. Managed Postgres providers encrypt
volumes at rest, which covers a stolen disk but not a compromised application.

### No formal breach procedure exists

PIPEDA requires reporting a breach of security safeguards to the Privacy
Commissioner, and notifying affected individuals, where there is a *real risk
of significant harm*. There is no written procedure. Write one before taking
a client whose data matters — it is an hour of work and you cannot do it
calmly during an incident.

### The dependency advisories are unresolved

`npm audit` reports 6 (5 high, 1 critical) in `sharp`/`libheif`, reached
transitively through Next 15.1.6. They predate this work. The fix is a Next
minor upgrade outside the stated range — a deliberate change with its own
regression risk. **Do it before launch**, with the full suite behind it.

---

## 4. Before real customers use this

In order:

1. `ADMIN_TOKEN` — `openssl rand -hex 32`. Without it the console refuses
   everything, which is the right failure but also means you cannot approve
   anything.
2. `CONSENT_SALT` — a second, different random value.
3. Resolve the `npm audit` advisories.
4. Move rate limiting to Redis if the console will be on a serverless host.
5. `CASL_MAILING_ADDRESS` — required in every commercial message.
6. Write the breach procedure.

---

## 5. Reporting a vulnerability

Email **rrrsolutionprovider@gmail.com** with "Security" in the subject.

We will acknowledge within two business days and tell you what we intend to do
and when. We will not threaten you, and we will credit you if you want it.

Please do not run automated scanners against the production site — it is a
small business, not a bug-bounty target, and the noise is indistinguishable
from an attack.
