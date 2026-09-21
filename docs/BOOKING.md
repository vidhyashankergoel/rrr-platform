# Call booking

How the "Book a free call" flow works, what it deliberately does not do, and
what to change when you get a real calendar.

---

## 1. What a visitor sees

1. They click **Book a free call** — from the navigation bar, the homepage
   hero, the CTA band, the contact page, or the assistant panel.
2. A dialog opens showing the next ten working days and the free 30-minute
   slots on each.
3. They pick a slot, give a name, work email, optional company and phone, say
   whether they want Google Meet, Teams or a phone call, and tick consent.
4. They get a confirmation screen with **Add to Google Calendar**, **Add to
   Outlook/Teams** and **Download .ics**, plus an acknowledgement email.

At every step the wording says **requested**, not confirmed. See §3.

---

## 2. Where the slots come from

`platform/src/lib/booking.ts`.

| Setting | Value | Constant |
|---|---|---|
| Days | Monday–Friday | weekday filter in `availableDays` |
| Hours | 09:00–17:00 Toronto | `WORKDAY_START_HOUR`, `WORKDAY_END_HOUR` |
| Lunch | 12:00–13:00 excluded | `LUNCH_HOUR` |
| Length | 30 minutes | `DURATION_MIN` |
| Earliest | 4 hours from now | `MIN_LEAD_HOURS` |
| Horizon | 14 days | `HORIZON_DAYS` |

That yields 14 slots on a full day. Change a constant and the dialog, the API,
the validation and the published-hours sentence all move together — the lede in
the dialog is generated from them (`BOOKABLE_HOURS`) precisely so it cannot
drift from what is actually offered.

### Statutory holidays

Not modelled. A hard-coded holiday table rots silently the first year nobody
updates it, and Ontario's list is not the same as the federal one. The person
confirming the request catches a Canada Day booking; the visitor has already
been told a person confirms.

### Time zones

Slots are Toronto wall-clock times converted to UTC instants through the
platform's own IANA database (`Intl.DateTimeFormat`), not a fixed offset.
Toronto is UTC−5 in winter and UTC−4 in summer; `zonedToUtc` resolves the
offset twice so a slot near a DST transition lands on the right instant. The
test suite asserts both changeover mornings in 2026.

---

## 3. Why it says "requested" and not "confirmed"

**We cannot see the firm's real calendar.** Doing so needs an OAuth grant into
Google Workspace or Microsoft 365, which does not exist yet.

So the system offers times inside published office hours and treats the
submission as a request. Saying "confirmed" would produce double-booked slots
and no-shows, which costs more trust than the extra sentence costs.

Three places carry this through, and all three must stay consistent:

- the dialog's confirmation screen,
- the acknowledgement email,
- the `.ics` file, which is written `STATUS:TENTATIVE`.

An approval lands in the console at `/admin` for a person to accept and send
the joining link.

---

## 4. Why not Calendly

It would show real availability. It would also send every prospect's name and
email to a third-party processor, which is:

- a PIPEDA disclosure to declare in the privacy notice,
- another vendor to name on a bank's security questionnaire,
- another subprocessor in the MSA.

For a firm whose pitch is "we do not leak your data", the trade was not worth
it at this size. Revisit when volume makes manual confirmation the bottleneck.

---

## 5. The calendar artefacts

| Route | Produces |
|---|---|
| `GET /api/bookings` | The offered days and slots as JSON |
| `POST /api/bookings` | Creates the booking, returns the calendar links |
| `GET /api/bookings/<id>/ics` | The `.ics` file |

The `.ics` is hand-built to RFC 5545: CRLF line endings, 75-**octet** line
folding that never splits a multi-byte character, `;` `,` and newline escaped,
a 15-minute `VALARM`, and `STATUS:TENTATIVE`.

The Google and Outlook links open each vendor's own event composer, prefilled.
That is why **Teams** is offered through the Outlook link: generating a real
Teams join URL needs Graph API credentials, and adding the event from inside
Outlook creates the Teams meeting in one click anyway.

### Access control

The booking id is a cuid and there is no listing endpoint, so holding the link
is the whole authorization story. The file contains only what the person who
made the booking told us. There is no visitor account to log in to, so this is
the honest design rather than a shortcut — but do not add anything to that file
that the requester did not supply.

---

## 6. What is stored

The `Booking` model in `prisma/schema.prisma`, joined to the `Lead` where the
email is already known so a returning prospect does not fork into two records.

PIPEDA applies exactly as it does to the enquiry form:

- consent is explicit and recorded, never pre-ticked,
- purpose is stated on the form,
- `purgeAfter` is set at creation — one year for a booking, two for the lead,
- only the fields a call actually needs are collected.

Refusals, all server-side, because the browser's copy of the slot list can be
stale or tampered with:

| Case | Response |
|---|---|
| Time outside office hours, in the past, or beyond the horizon | 409 |
| Slot already taken | 409 |
| Consent not given | 400 |
| Malformed email, short name, unknown platform | 400 |
| Honeypot filled | 200, silently discarded |
| More than 4 attempts in 15 minutes from one address | 429 |

---

## 7. Notifications

Two messages, both fire-and-forget so a mail failure can never turn a saved
booking into an error for the visitor:

1. **To the business** — `notifyInternal()` in `src/lib/mailer.ts`. Skips the
   CASL consent checks because the recipient is the sender. With no provider
   configured it prints the whole notification to the server log and records it
   as `QUEUED`, so nothing is lost and the gap is loud.
2. **To the visitor** — `send()`, category `TRANSACTIONAL`, which is correct:
   it answers a request they initiated. It still carries the CASL
   identification block and unsubscribe mechanism.

> **This is the piece that needs configuration before launch.** Until
> `RESEND_API_KEY` and `MAIL_FROM` are set, bookings are saved and visible at
> `/admin` but **no email is delivered to anyone**. See
> `DOMAIN-AND-DNS.md` §4 for the SPF/DKIM/DMARC records that have to exist
> first, or the mail will be delivered to spam.

---

## 8. When you get a real calendar

The change is contained:

1. Add OAuth for Google Calendar or Microsoft Graph.
2. In `availableDays`, subtract busy periods from the generated grid.
3. On `POST`, create the real event and store the join URL in
   `Booking.meetingUrl`.
4. Set `Booking.status` to `CONFIRMED` and `confirmedAt` at creation.
5. Change `STATUS:TENTATIVE` to `CONFIRMED` in `toIcs`, and update the three
   pieces of copy in §3.

Do steps 4 and 5 **only** together with 1–3. Claiming a confirmation the
calendar has not actually made is the failure this design exists to avoid.

---

## 9. Tests

```bash
npm run test:booking      # 45 assertions, no server needed
npm run test:e2e          # includes the dialog, driven in a real browser
```

Covered: DST arithmetic on both 2026 changeover days, slot generation, lunch
and weekend exclusion, every server-side refusal, `.ics` structure and RFC 5545
line folding, and the Google and Outlook link formats.
