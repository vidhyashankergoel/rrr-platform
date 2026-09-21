import { NextResponse } from "next/server";
import { z } from "zod";
import { db, audit } from "@/lib/db";
import { rateLimit, clientKey } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Per-answer feedback. The point is not the score — it is being able to pull
 * up every conversation where someone pressed "Not helpful" and read what the
 * assistant actually said. That is how the catalogue and the agent copy get
 * better, and it costs nothing to collect.
 */
const Body = z.object({
  sessionId: z.string().min(8).max(64),
  messageId: z.string().min(1).max(64),
  verdict: z.enum(["up", "down"]),
});

export async function POST(req: Request) {
  const limit = rateLimit(`fb:${clientKey(req)}`, 40, 60_000);
  if (!limit.ok) return NextResponse.json({ ok: false }, { status: 429 });

  let body;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const conversation = await db.conversation.findUnique({
      where: { sessionId: body.sessionId },
      select: { id: true, leadId: true },
    });

    await audit({
      actor: "visitor",
      action: `chat.feedback.${body.verdict}`,
      subject: conversation?.id ?? body.sessionId,
      detail: body.messageId,
      leadId: conversation?.leadId ?? undefined,
    });

    // Mark the conversation for review so a human can find it quickly.
    if (body.verdict === "down" && conversation) {
      await db.conversation.update({
        where: { id: conversation.id },
        data: { resolved: false },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Feedback must never surface an error to the visitor.
    return NextResponse.json({ ok: true });
  }
}
