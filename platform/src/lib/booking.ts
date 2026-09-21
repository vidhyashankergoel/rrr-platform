/**
 * Scoping-call booking.
 *
 * WHAT THIS IS HONEST ABOUT
 * -------------------------
 * We do not hold OAuth tokens for the firm's Google or Microsoft calendar, so
 * this module cannot see real availability. It offers slots inside *published
 * office hours* and treats a submission as a **request** that a human confirms.
 * The visitor gets a calendar file straight away so the time is held in their
 * own diary; the meeting link arrives with the human confirmation.
 *
 * Saying "confirmed" before a person has looked would be a lie that produces a
 * no-show, so every surface here says "requested".
 *
 * TIME ZONES
 * ----------
 * Office hours are Toronto wall-clock time, which is UTC-5 or UTC-4 depending
 * on the date. Rather than pull in a date library we ask the platform's own
 * IANA database through Intl, which Node and every current browser ship.
 * `zonedToUtc` is applied twice so a slot that straddles a DST change lands on
 * the correct instant rather than an hour out.
 */

import { company } from "./company";

export const TIMEZONE = "America/Toronto";
export const DURATION_MIN = 30;

/** Monday–Friday, 09:00–17:00 Toronto, minus the lunch hour. */
const WORKDAY_START_HOUR = 9;
const WORKDAY_END_HOUR = 17;
const LUNCH_HOUR = 12;

/**
 * The bookable window, in words, derived from the constants above.
 *
 * The dialog used to quote `company.hours` ("Mon-Fri 09:00-18:00 ET"), which
 * is when we answer the phone — not when calls can be booked. Offering
 * nothing after 16:30 while advertising 18:00 is a small lie that makes a
 * visitor hunt for a slot that was never there.
 */
export const BOOKABLE_HOURS = `Weekdays, ${String(WORKDAY_START_HOUR).padStart(2, "0")}:00–${String(WORKDAY_END_HOUR).padStart(2, "0")}:00 Toronto time`;

/** Nothing sooner than this — a person has to see the request first. */
const MIN_LEAD_HOURS = 4;
/** How far ahead we publish. */
export const HORIZON_DAYS = 14;

export type Platform = "GOOGLE_MEET" | "MS_TEAMS" | "PHONE" | "EITHER";

export interface Slot {
  /** ISO-8601 UTC instant the call starts. */
  startsAt: string;
  /** "09:30" — Toronto wall clock, for display. */
  label: string;
}

export interface Day {
  /** "2026-09-22" in Toronto. */
  date: string;
  /** "Mon 22 Sep" */
  label: string;
  slots: Slot[];
}

// ---------------------------------------------------------------------------
//  Time zone helpers
// ---------------------------------------------------------------------------

const PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  weekday: "short",
});

interface Wall {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: string;
}

/** The wall-clock reading a Toronto clock shows at a given UTC instant. */
export function wallClock(instant: Date): Wall {
  const parts = PARTS.formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  // Intl renders midnight as "24" in some engines; normalise it.
  const hour = Number(get("hour")) % 24;
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour,
    minute: Number(get("minute")),
    second: Number(get("second")),
    weekday: get("weekday"),
  };
}

/** Toronto's offset from UTC, in minutes, at a given instant. */
function offsetMinutes(instant: Date): number {
  const w = wallClock(instant);
  const asIfUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  return (asIfUtc - instant.getTime()) / 60_000;
}

/**
 * A Toronto wall-clock time to the UTC instant it names.
 *
 * Two passes: the first guesses the offset using the naive instant, the second
 * corrects it if that guess landed on the other side of a DST transition.
 */
export function zonedToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
): Date {
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  const firstGuess = new Date(naive - offsetMinutes(new Date(naive)) * 60_000);
  const corrected = new Date(naive - offsetMinutes(firstGuess) * 60_000);
  return corrected;
}

// ---------------------------------------------------------------------------
//  Slot generation
// ---------------------------------------------------------------------------

const WEEKDAY_LABEL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABEL = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Statutory holidays are handled by the human confirming the request rather
 * than by a table here. A hard-coded holiday list rots silently; a person
 * reading "requested" does not.
 */
export function availableDays(from: Date = new Date()): Day[] {
  const earliest = from.getTime() + MIN_LEAD_HOURS * 60 * 60_000;
  const today = wallClock(from);
  const days: Day[] = [];

  for (let offset = 0; offset <= HORIZON_DAYS; offset += 1) {
    // Step through calendar days by their Toronto date, using midday as the
    // probe instant so a DST change never shifts us onto the wrong date.
    const probe = new Date(
      zonedToUtc(today.year, today.month, today.day, 12).getTime() + offset * 86_400_000,
    );
    const w = wallClock(probe);

    if (w.weekday === "Sat" || w.weekday === "Sun") continue;

    const slots: Slot[] = [];
    for (let hour = WORKDAY_START_HOUR; hour < WORKDAY_END_HOUR; hour += 1) {
      if (hour === LUNCH_HOUR) continue;
      for (const minute of [0, 30]) {
        const starts = zonedToUtc(w.year, w.month, w.day, hour, minute);
        if (starts.getTime() < earliest) continue;
        slots.push({ startsAt: starts.toISOString(), label: `${pad(hour)}:${pad(minute)}` });
      }
    }

    if (!slots.length) continue;

    const jsDay = new Date(Date.UTC(w.year, w.month - 1, w.day)).getUTCDay();
    days.push({
      date: `${w.year}-${pad(w.month)}-${pad(w.day)}`,
      label: `${WEEKDAY_LABEL[jsDay]} ${w.day} ${MONTH_LABEL[w.month - 1]}`,
      slots,
    });
  }

  return days;
}

/** Is this instant a slot we would actually have offered? Used server-side. */
export function isOfferedSlot(startsAt: Date, from: Date = new Date()): boolean {
  const wanted = startsAt.getTime();
  return availableDays(from).some((d) =>
    d.slots.some((s) => new Date(s.startsAt).getTime() === wanted),
  );
}

/** "Mon 22 Sep 2026, 14:30–15:00 ET" */
export function describeSlot(startsAt: Date, durationMin = DURATION_MIN): string {
  const w = wallClock(startsAt);
  const end = wallClock(new Date(startsAt.getTime() + durationMin * 60_000));
  const jsDay = new Date(Date.UTC(w.year, w.month - 1, w.day)).getUTCDay();
  return (
    `${WEEKDAY_LABEL[jsDay]} ${w.day} ${MONTH_LABEL[w.month - 1]} ${w.year}, ` +
    `${pad(w.hour)}:${pad(w.minute)}–${pad(end.hour)}:${pad(end.minute)} ` +
    (offsetMinutes(startsAt) === -240 ? "EDT" : "EST")
  );
}

// ---------------------------------------------------------------------------
//  Calendar artefacts
// ---------------------------------------------------------------------------

/** 20260922T183000Z */
function icsStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** RFC 5545 escaping: backslash, semicolon, comma, newline. */
function icsEscape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * RFC 5545 §3.1: content lines fold at 75 **octets**, not characters, and a
 * multi-octet character may not be split across the fold.
 *
 * Counting characters instead of octets is the classic bug here — an em dash
 * is three octets in UTF-8, so a line of 73 characters can be 79 octets and
 * strict parsers (Outlook among them) reject the file. This walks code points
 * and measures their encoded length.
 */
function fold(line: string): string {
  const LIMIT = 74; // leaves room for the leading space on continuation lines
  if (new TextEncoder().encode(line).length <= LIMIT) return line;

  const out: string[] = [];
  let current = "";
  let octets = 0;
  let first = true;

  // Iterating the string yields whole code points, so a surrogate pair is
  // never severed either.
  for (const ch of line) {
    const size = new TextEncoder().encode(ch).length;
    const budget = first ? LIMIT : LIMIT - 1;
    if (octets + size > budget) {
      out.push(first ? current : ` ${current}`);
      first = false;
      current = "";
      octets = 0;
    }
    current += ch;
    octets += size;
  }
  if (current) out.push(first ? current : ` ${current}`);

  return out.join("\r\n");
}

export interface CalendarEvent {
  uid: string;
  startsAt: Date;
  durationMin: number;
  title: string;
  description: string;
  organizerName: string;
  organizerEmail: string;
  attendeeEmail: string;
  url?: string;
}

/**
 * An .ics file the visitor can open in any calendar client.
 *
 * STATUS:TENTATIVE is deliberate and matches what we tell them: the time is
 * held, the meeting is not confirmed until a person accepts it.
 */
export function toIcs(ev: CalendarEvent): string {
  const end = new Date(ev.startsAt.getTime() + ev.durationMin * 60_000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RRR Solution Providers//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${ev.uid}`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(ev.startsAt)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${icsEscape(ev.title)}`,
    `DESCRIPTION:${icsEscape(ev.description)}`,
    ev.url ? `URL:${icsEscape(ev.url)}` : null,
    `ORGANIZER;CN=${icsEscape(ev.organizerName)}:mailto:${ev.organizerEmail}`,
    `ATTENDEE;CN=${icsEscape(ev.attendeeEmail)};RSVP=TRUE:mailto:${ev.attendeeEmail}`,
    "STATUS:TENTATIVE",
    "TRANSP:OPAQUE",
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Scoping call in 15 minutes",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((l): l is string => l !== null);

  return lines.map(fold).join("\r\n") + "\r\n";
}

/** "Add to Google Calendar" — opens Google's own event composer, prefilled. */
export function googleCalendarUrl(ev: CalendarEvent): string {
  const end = new Date(ev.startsAt.getTime() + ev.durationMin * 60_000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates: `${icsStamp(ev.startsAt)}/${icsStamp(end)}`,
    details: ev.description,
    ctz: TIMEZONE,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * "Add to Outlook" — Microsoft 365's web composer. A Teams meeting is created
 * from inside Outlook with one click, which is why this is the Teams route:
 * generating a real Teams join link needs Graph API credentials we do not have
 * and would not ask a visitor to trust us with.
 */
export function outlookCalendarUrl(ev: CalendarEvent): string {
  const end = new Date(ev.startsAt.getTime() + ev.durationMin * 60_000);
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: ev.title,
    startdt: ev.startsAt.toISOString(),
    enddt: end.toISOString(),
    body: ev.description,
  });
  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export const PLATFORM_LABEL: Record<Platform, string> = {
  GOOGLE_MEET: "Google Meet",
  MS_TEAMS: "Microsoft Teams",
  PHONE: "Phone call",
  EITHER: "Either — you choose",
};

/**
 * Turn a stored booking into the event the visitor's calendar will show.
 *
 * Shared by the POST response and the .ics endpoint so the file, the Google
 * link and the Outlook link can never drift apart.
 */
export function calendarEvent(b: {
  id: string;
  startsAt: Date;
  durationMin: number;
  email: string;
  platform: string;
  topic?: string | null;
}): CalendarEvent {
  const platform = PLATFORM_LABEL[(b.platform as Platform) ?? "EITHER"] ?? "Either — you choose";

  return {
    uid: `${b.id}@rrrsolutionproviders.ca`,
    startsAt: b.startsAt,
    durationMin: b.durationMin,
    title: `Scoping call — ${company.shortName}`,
    description: [
      `A ${b.durationMin}-minute scoping call with ${company.shortName}.`,
      "",
      `Preferred platform: ${platform}.`,
      "",
      "This entry is TENTATIVE until a person confirms it and sends the",
      "joining link — usually within one business day.",
      b.topic ? `\nWhat you asked to cover:\n${b.topic}` : "",
      "",
      `Questions or need to move it: ${company.email} · ${company.phone}`,
    ]
      .filter(Boolean)
      .join("\n"),
    organizerName: company.legalName,
    organizerEmail: company.email,
    attendeeEmail: b.email,
    url: `${company.siteUrl}/contact`,
  };
}

