import { db, audit } from "@/lib/db";
import { rateLimit, clientKey } from "@/lib/ratelimit";
import { calendarEvent, toIcs } from "@/lib/booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The calendar file for one booking.
 *
 * The booking id is the capability: a cuid is unguessable, and the file
 * contains only what the person who made the booking already told us. There is
 * no listing endpoint, so possessing the link is the whole authorization
 * story — deliberately, because the visitor has no account to log in to.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  // The booking id is the only thing protecting this file, and the file
  // contains a customer's name and email address. A cuid is not guessable in
  // practice, but an unthrottled lookup endpoint is still an oracle: given
  // enough requests it answers "does this id exist?" over and over. Throttling
  // turns an impractical attack into an impossible one, and costs a legitimate
  // visitor nothing — they fetch this once.
  const limit = rateLimit(`ics:${clientKey(req)}`, 20, 60_000);
  if (!limit.ok) {
    return new Response("Too many requests", {
      status: 429,
      headers: { "retry-after": String(limit.retryAfter) },
    });
  }

  const { id } = await ctx.params;

  // Reject anything that is not shaped like one of our ids before touching
  // the database, so a malformed or probing request never becomes a query.
  if (!/^[a-z0-9]{20,32}$/.test(id)) {
    return new Response("Not found", { status: 404 });
  }

  const booking = await db.booking.findUnique({ where: { id } });
  if (!booking || booking.status === "CANCELLED") {
    // Same response either way. Distinguishing "no such booking" from
    // "cancelled" would confirm an id exists, which is the thing worth hiding.
    await audit({ actor: "anonymous", action: "ics.miss", subject: clientKey(req) });
    return new Response("Not found", { status: 404 });
  }

  const ics = toIcs(calendarEvent(booking));

  return new Response(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="scoping-call-${id}.ics"`,
      // private + no-store: this file names a real person, so no shared
      // cache or CDN may retain a copy.
      "cache-control": "private, no-store, max-age=0",
      // This file is a download, never a page. Stop a browser guessing.
      "x-content-type-options": "nosniff",
    },
  });
}
