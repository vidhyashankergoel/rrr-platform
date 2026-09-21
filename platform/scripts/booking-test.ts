/**
 * BOOKING TESTS
 *
 * Covers the scoping-call booking end to end: slot generation, the time-zone
 * arithmetic that decides *when* a call actually is, the calendar artefacts a
 * visitor takes away, and the server-side rejections that stop a booking
 * landing outside office hours or on top of another one.
 *
 * Runs against the pure functions where it can and against a live server for
 * the HTTP surface, so `npm test` needs no server and `npm run test:e2e`
 * exercises the routes.
 */

import {
  availableDays,
  isOfferedSlot,
  describeSlot,
  wallClock,
  zonedToUtc,
  calendarEvent,
  toIcs,
  googleCalendarUrl,
  outlookCalendarUrl,
  BOOKABLE_HOURS,
  DURATION_MIN,
  TIMEZONE,
} from "../src/lib/booking";

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail = "") {
  if (condition) {
    passed += 1;
  } else {
    failed += 1;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function group(name: string) {
  console.log(`\n${name}`);
}

// ---------------------------------------------------------------------------
//  Time zone arithmetic
// ---------------------------------------------------------------------------
group("Time zone");

{
  // Toronto is UTC-4 in summer (EDT) and UTC-5 in winter (EST). Getting this
  // backwards puts every call an hour out for half the year.
  const summer = zonedToUtc(2026, 7, 15, 14, 0);
  check("summer 14:00 ET is 18:00 UTC", summer.toISOString() === "2026-07-15T18:00:00.000Z", summer.toISOString());

  const winter = zonedToUtc(2026, 1, 15, 14, 0);
  check("winter 14:00 ET is 19:00 UTC", winter.toISOString() === "2026-01-15T19:00:00.000Z", winter.toISOString());

  // The day the clocks go forward: 2026-03-08 at 02:00 ET. A slot at 09:00
  // that morning is on the *new* offset.
  const dstDay = zonedToUtc(2026, 3, 8, 9, 0);
  check("morning after spring-forward is UTC-4", dstDay.toISOString() === "2026-03-08T13:00:00.000Z", dstDay.toISOString());

  // And the day they go back: 2026-11-01.
  const fallBack = zonedToUtc(2026, 11, 1, 9, 0);
  check("morning after fall-back is UTC-5", fallBack.toISOString() === "2026-11-01T14:00:00.000Z", fallBack.toISOString());

  const round = wallClock(summer);
  check("round-trips back to the same wall clock", round.hour === 14 && round.minute === 0, `${round.hour}:${round.minute}`);
}

// ---------------------------------------------------------------------------
//  Slot generation
// ---------------------------------------------------------------------------
group("Slot generation");

{
  // A fixed Monday morning, so the assertions do not drift with the clock.
  const monday = new Date("2026-09-21T12:00:00.000Z"); // 08:00 ET
  const days = availableDays(monday);

  check("offers at least ten weekdays", days.length >= 10, `${days.length}`);
  check(
    "never offers a weekend",
    days.every((d) => !/^(Sat|Sun)/.test(d.label)),
    days.map((d) => d.label).join(", "),
  );

  const full = days.find((d) => d.slots.length === 14);
  check("a full day has 14 slots (09-17 less lunch)", Boolean(full));

  const allLabels = days.flatMap((d) => d.slots.map((s) => s.label));
  check("never offers the lunch hour", !allLabels.some((l) => l.startsWith("12:")), "12:xx present");
  check("first slot of a full day is 09:00", full?.slots[0]?.label === "09:00", full?.slots[0]?.label);
  check("last slot of a full day is 16:30", full?.slots.at(-1)?.label === "16:30", full?.slots.at(-1)?.label);
  check(
    "every slot is on the hour or half hour",
    allLabels.every((l) => l.endsWith(":00") || l.endsWith(":30")),
  );
  check(
    "no slot is inside the lead time",
    days.flatMap((d) => d.slots).every((s) => new Date(s.startsAt).getTime() >= monday.getTime()),
  );

  // The lead time should eat the start of today rather than all of it.
  const firstDay = days[0];
  check("today is still bookable later in the day", firstDay?.slots.length ? true : false);

  check(
    "slot labels agree with the instants they carry",
    days.every((d) =>
      d.slots.every((s) => {
        const w = wallClock(new Date(s.startsAt));
        return s.label === `${String(w.hour).padStart(2, "0")}:${String(w.minute).padStart(2, "0")}`;
      }),
    ),
  );
}

// ---------------------------------------------------------------------------
//  Server-side validation
// ---------------------------------------------------------------------------
group("Slot validation");

{
  const from = new Date("2026-09-21T12:00:00.000Z");
  const offered = availableDays(from)[1]!.slots[3]!;

  check("accepts a slot it offered", isOfferedSlot(new Date(offered.startsAt), from));
  check("rejects 03:00 ET", !isOfferedSlot(zonedToUtc(2026, 9, 23, 3, 0), from));
  check("rejects the lunch hour", !isOfferedSlot(zonedToUtc(2026, 9, 23, 12, 0), from));
  check("rejects 17:00 (past the last start)", !isOfferedSlot(zonedToUtc(2026, 9, 23, 17, 0), from));
  check("rejects a Saturday", !isOfferedSlot(zonedToUtc(2026, 9, 26, 11, 0), from));
  check("rejects a date in the past", !isOfferedSlot(zonedToUtc(2026, 9, 1, 11, 0), from));
  check("rejects beyond the horizon", !isOfferedSlot(zonedToUtc(2026, 12, 1, 11, 0), from));
  check("rejects an off-grid minute", !isOfferedSlot(zonedToUtc(2026, 9, 23, 11, 17), from));
}

// ---------------------------------------------------------------------------
//  Display
// ---------------------------------------------------------------------------
group("Display");

{
  const summer = describeSlot(new Date("2026-09-22T15:30:00.000Z"));
  check("summer slot reads as EDT", summer === "Tue 22 Sep 2026, 11:30–12:00 EDT", summer);

  const winter = describeSlot(new Date("2026-01-20T16:00:00.000Z"));
  check("winter slot reads as EST", winter === "Tue 20 Jan 2026, 11:00–11:30 EST", winter);

  check("published hours match the generated window", BOOKABLE_HOURS.includes("09:00") && BOOKABLE_HOURS.includes("17:00"), BOOKABLE_HOURS);
  check("duration is 30 minutes", DURATION_MIN === 30);
  check("time zone is Toronto", TIMEZONE === "America/Toronto");
}

// ---------------------------------------------------------------------------
//  Calendar artefacts
// ---------------------------------------------------------------------------
group("Calendar file");

{
  const ev = calendarEvent({
    id: "test123",
    startsAt: new Date("2026-09-22T15:30:00.000Z"),
    durationMin: 30,
    email: "buyer@example.test",
    platform: "MS_TEAMS",
    topic: "Semicolons; commas, and a\nnewline — all need escaping.",
  });
  const ics = toIcs(ev);

  check("is a VCALENDAR", ics.startsWith("BEGIN:VCALENDAR") && ics.trimEnd().endsWith("END:VCALENDAR"));
  check("uses CRLF line endings", ics.includes("\r\n") && !/[^\r]\n/.test(ics));
  check("start time is correct", ics.includes("DTSTART:20260922T153000Z"));
  check("end time is start plus duration", ics.includes("DTEND:20260922T160000Z"));
  check("is marked tentative, not confirmed", ics.includes("STATUS:TENTATIVE"));
  check("carries a reminder", ics.includes("BEGIN:VALARM"));
  check("names the attendee", ics.includes("buyer@example.test"));
  check("escapes semicolons and commas", ics.includes("\\;") && ics.includes("\\,"));
  check("escapes newlines rather than emitting them", !ics.includes("all need escaping") || ics.includes("\\n"));

  // RFC 5545 §3.1: no content line over 75 octets, and continuations start
  // with a single space.
  const lines = ics.split("\r\n").filter(Boolean);
  const over = lines.filter((l) => Buffer.byteLength(l, "utf8") > 75);
  check("no line exceeds 75 octets", over.length === 0, over[0]);
  check(
    "unfolds back to valid properties",
    lines
      .filter((l) => !l.startsWith(" "))
      .every((l) => /^[A-Z][A-Z0-9-]*[;:]/.test(l)),
  );

  const google = googleCalendarUrl(ev);
  check("Google link targets Google", google.startsWith("https://calendar.google.com/"));
  check("Google link carries the range", google.includes("20260922T153000Z%2F20260922T160000Z"));
  check("Google link carries the time zone", google.includes("ctz=America%2FToronto"));

  const outlook = outlookCalendarUrl(ev);
  check("Outlook link targets Microsoft", outlook.startsWith("https://outlook.office.com/"));
  check("Outlook link carries the start", outlook.includes("2026-09-22T15%3A30%3A00.000Z"));

  check("description says the booking is not yet confirmed", /TENTATIVE/i.test(ev.description));
}

// ---------------------------------------------------------------------------
//  HTTP surface (skipped without a server)
// ---------------------------------------------------------------------------
async function http(base: string) {
  group(`HTTP (${base})`);

  const res = await fetch(`${base}/api/bookings`);
  const json = (await res.json()) as { timezone: string; durationMin: number; days: { slots: unknown[] }[] };
  check("GET returns availability", res.status === 200 && json.days.length > 0);
  check("GET reports the duration", json.durationMin === 30);

  // Each case gets its own client key so the rate limiter, which is doing its
  // job, does not mask the validation being tested.
  let n = 0;
  const post = async (body: Record<string, unknown>) => {
    n += 1;
    const r = await fetch(`${base}/api/bookings`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-real-ip": `198.51.100.${n}` },
      body: JSON.stringify(body),
    });
    return { status: r.status, json: (await r.json()) as { ok?: boolean; error?: string; when?: string } };
  };

  const base_ = {
    name: "Test Buyer",
    email: `booking-test-${Date.now()}@example.test`,
    platform: "EITHER",
    consentContact: true,
  };

  const free = json.days.at(-1) as { slots: { startsAt: string }[] };
  const slot = free.slots.at(-1)!.startsAt;

  const ok = await post({ ...base_, startsAt: slot });
  check("accepts a valid booking", ok.status === 200 && ok.json.ok === true, ok.json.error);

  const dupe = await post({ ...base_, email: "someone-else@example.test", startsAt: slot });
  check("refuses to double-book", dupe.status === 409, `${dupe.status}`);

  const noConsent = await post({ ...base_, startsAt: free.slots[0]!.startsAt, consentContact: false });
  check("refuses without consent", noConsent.status === 400, `${noConsent.status}`);

  const badTime = await post({ ...base_, startsAt: "2026-09-26T15:00:00.000Z" });
  check("refuses a weekend", badTime.status === 409, `${badTime.status}`);

  const bot = await post({ ...base_, startsAt: free.slots[0]!.startsAt, website: "http://spam.test" });
  check("swallows the honeypot without erroring", bot.status === 200);

  const ics = await fetch(`${base}/api/bookings/does-not-exist/ics`);
  check("unknown booking has no calendar file", ics.status === 404);
}

async function main() {
  const base = process.env.TEST_BASE_URL;
  if (base) {
    try {
      await http(base);
    } catch (err) {
      failed += 1;
      console.log(`  ✗ HTTP suite could not run — ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    console.log("\nHTTP — skipped (set TEST_BASE_URL to include it)");
  }

  console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

void main();
