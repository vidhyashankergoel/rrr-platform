import { NextResponse } from "next/server";
import { z } from "zod";
import { db, audit, hashIp } from "@/lib/db";
import { rateLimit, clientKey } from "@/lib/ratelimit";
import { company } from "@/lib/company";
import { notifyInternal, send } from "@/lib/mailer";
import {
  availableDays,
  calendarEvent,
  describeSlot,
  googleCalendarUrl,
  isOfferedSlot,
  outlookCalendarUrl,
  DURATION_MIN,
  TIMEZONE,
  PLATFORM_LABEL,
  type Platform,
} from "@/lib/booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Scoping-call bookings.
 *
 * GET  — the slots we are willing to offer, generated from published office
 *        hours. No authentication: this is the same information as the opening
 *        hours in the footer, just machine-readable.
 *
 * POST — records a *request*. See src/lib/booking.ts for why this is a request
 *        and not a confirmation. PIPEDA applies exactly as it does to the
 *        enquiry form: explicit consent, stated purpose, retention date set at
 *        creation, minimum fields.
 */

export async function GET() {
  return NextResponse.json({
    timezone: TIMEZONE,
    durationMin: DURATION_MIN,
    days: availableDays(),
  });
}

const Body = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  company: z.string().max(160).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  topic: z.string().max(2000).optional().or(z.literal("")),
  startsAt: z.string().datetime(),
  platform: z.enum(["GOOGLE_MEET", "MS_TEAMS", "PHONE", "EITHER"]).default("EITHER"),
  consentContact: z.literal(true, {
    errorMap: () => ({ message: "We need your permission to contact you about this call." }),
  }),
  sessionId: z.string().max(64).optional(),
  sourceUrl: z.string().max(500).optional(),
  // Honeypot.
  website: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const limit = rateLimit(`booking:${clientKey(req)}`, 4, 15 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many booking attempts. Please try again shortly." },
      { status: 429 },
    );
  }

  let data;
  try {
    data = Body.parse(await req.json());
  } catch (err) {
    const message =
      err instanceof z.ZodError
        ? (err.errors[0]?.message ?? "Please check the details and try again.")
        : "Please check the details and try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (data.website && data.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const startsAt = new Date(data.startsAt);

  // Never trust a time the browser sent. A slot outside office hours, in the
  // past, or inside the lead time would produce a meeting nobody attends.
  if (!isOfferedSlot(startsAt)) {
    return NextResponse.json(
      { error: "That time is no longer available. Please pick another slot." },
      { status: 409 },
    );
  }

  // One call per slot. Two visitors can reach this line at the same moment;
  // the loser gets a clear message rather than a silent double-booking.
  const taken = await db.booking.findFirst({
    where: { startsAt, status: { in: ["REQUESTED", "CONFIRMED"] } },
  });
  if (taken) {
    return NextResponse.json(
      { error: "Someone just took that slot. Please pick another." },
      { status: 409 },
    );
  }

  const now = new Date();
  const email = data.email.toLowerCase();

  try {
    // Attach to an existing lead where we already know this person, so the
    // booking joins their history instead of creating a duplicate record.
    const existing = await db.lead.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });

    const lead =
      existing ??
      (await db.lead.create({
        data: {
          name: data.name,
          email,
          phone: data.phone || null,
          company: data.company || null,
          message: data.topic || null,
          source: "booking",
          stage: "SCOPING",
          consentContact: true,
          consentMarketing: false,
          consentAt: now,
          consentSourceUrl: data.sourceUrl ?? null,
          consentIpHash: await hashIp(clientKey(req)),
          purgeAfter: new Date(now.getTime() + 730 * 24 * 60 * 60 * 1000),
        },
      }));

    const booking = await db.booking.create({
      data: {
        leadId: lead.id,
        name: data.name,
        email,
        company: data.company || null,
        phone: data.phone || null,
        topic: data.topic || null,
        startsAt,
        durationMin: DURATION_MIN,
        timezone: TIMEZONE,
        platform: data.platform as Platform,
        status: "REQUESTED",
        purgeAfter: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    if (data.sessionId) {
      await db.conversation
        .update({ where: { sessionId: data.sessionId }, data: { leadId: lead.id } })
        .catch(() => undefined);
    }

    const when = describeSlot(startsAt);
    const event = calendarEvent(booking);

    // A human has to accept this. The approval queue is where that happens.
    await db.approval.create({
      data: {
        kind: "SALES_HANDOFF",
        title: `Call requested — ${data.company || data.name}`,
        summary: `${when} · ${PLATFORM_LABEL[data.platform as Platform]} · ${DURATION_MIN} minutes\n\n${data.topic || "No agenda given."}`.slice(0, 600),
        payloadJson: JSON.stringify({ bookingId: booking.id, leadId: lead.id, startsAt: booking.startsAt }),
        riskNote: "Confirm or decline before the slot, and send the meeting link.",
        leadId: lead.id,
      },
    });

    await audit({
      actor: "system",
      action: "booking.requested",
      subject: email,
      detail: `${when} ${data.platform}`,
      leadId: lead.id,
    });

    // --- Notify, acknowledge. Fire-and-forget: the booking is committed. ---
    void (async () => {
      const rule = "─".repeat(41);
      await notifyInternal({
        subject: `Call requested — ${data.company || data.name} — ${when}`,
        body: [
          `${data.name} has requested a ${DURATION_MIN}-minute scoping call.`,
          "",
          rule,
          `When:      ${when}`,
          `Platform:  ${PLATFORM_LABEL[data.platform as Platform]}`,
          `Name:      ${data.name}`,
          `Email:     ${email}`,
          `Phone:     ${data.phone || "—"}`,
          `Company:   ${data.company || "—"}`,
          `Came from: ${data.sourceUrl || "—"}`,
          rule,
          "",
          "What they want to talk about:",
          "",
          data.topic || "(not stated)",
          "",
          rule,
          "",
          "ACTION REQUIRED: they have been told this is a request, not a",
          "confirmation. Send the meeting link to confirm it, or propose",
          "another time. Nothing is sent automatically.",
          "",
          `Console: ${company.siteUrl}/admin`,
        ].join("\n"),
        replyTo: email,
        leadId: lead.id,
        sequenceKey: "booking-notification",
        banner: "CALL REQUESTED — no mail provider configured, NOT delivered",
      }).catch(() => undefined);

      await send({
        leadId: lead.id,
        toEmail: email,
        subject: `Call requested — ${when}`,
        bodyText: [
          `Hello ${data.name.split(" ")[0] ?? ""},`.trim(),
          "",
          `You have asked for a ${DURATION_MIN}-minute scoping call:`,
          "",
          `  ${when}`,
          `  ${PLATFORM_LABEL[data.platform as Platform]}`,
          "",
          "To be straight with you: this is a request, not yet a confirmation.",
          "A person will confirm it and send the joining link, usually within",
          "one business day. If the time no longer works we will propose another.",
          "",
          "The calendar entry is marked tentative for the same reason.",
          "",
          // Repeated here because the confirmation screen is gone the moment
          // they close the tab, and a booking that never reaches their diary
          // is a booking they will miss.
          "Add it to your calendar:",
          "",
          `  Google Calendar:  ${googleCalendarUrl(event)}`,
          `  Outlook / Teams:  ${outlookCalendarUrl(event)}`,
          `  Calendar file:    ${company.siteUrl}/api/bookings/${booking.id}/ics`,
          "",
          `Need to change or cancel it? Reply to this email or call ${company.phone}.`,
          "",
          "Nothing is sold on the call. We will ask what is breaking, tell you",
          "what it would take to fix, and say so if we are not the right people.",
        ].join("\n"),
        category: "TRANSACTIONAL",
        sequenceKey: "booking-acknowledgement",
      }).catch(() => undefined);
    })();

    return NextResponse.json({
      ok: true,
      bookingId: booking.id,
      when,
      durationMin: DURATION_MIN,
      icsUrl: `/api/bookings/${booking.id}/ics`,
      googleUrl: googleCalendarUrl(event),
      outlookUrl: outlookCalendarUrl(event),
      message: `Requested: ${when}. A person confirms it and sends the joining link, usually within one business day.`,
    });
  } catch (err) {
    console.error("[bookings]", err);
    return NextResponse.json(
      { error: `Something went wrong saving that. Please email ${company.email} directly.` },
      { status: 500 },
    );
  }
}
