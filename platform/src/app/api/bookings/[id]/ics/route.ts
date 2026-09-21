import { db } from "@/lib/db";
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
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const booking = await db.booking.findUnique({ where: { id } });
  if (!booking || booking.status === "CANCELLED") {
    return new Response("Not found", { status: 404 });
  }

  const ics = toIcs(calendarEvent(booking));

  return new Response(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="scoping-call-${id}.ics"`,
      "cache-control": "no-store",
      // This file is a download, never a page. Stop a browser guessing.
      "x-content-type-options": "nosniff",
    },
  });
}
