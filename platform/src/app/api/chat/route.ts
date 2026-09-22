import { NextResponse } from "next/server";
import { z } from "zod";
import { runTurn } from "@/lib/agents/orchestrator";
import { rateLimit, clientKey } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A browser-generated session identifier.
 *
 * This is the only thing separating one visitor's conversation from another's,
 * so it has to be unguessable. The client generates a UUID; 20 characters is
 * the floor at which a token carries enough entropy to be safe. The previous
 * floor of 8 characters would have accepted "aaaaaaaa", which every visitor
 * sending it would have shared.
 */
const SESSION_ID = z
  .string()
  .regex(/^[A-Za-z0-9_-]{20,64}$/, "Invalid session identifier.");

const Body = z.object({
  sessionId: SESSION_ID,
  message: z.string().min(1).max(2000),
  pageUrl: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const limit = rateLimit(`chat:${clientKey(req)}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many messages. Please wait a moment." },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    );
  }

  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const out = await runTurn({
      sessionId: parsed.sessionId,
      message: parsed.message,
      pageUrl: parsed.pageUrl,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });
    return NextResponse.json(out);
  } catch (err) {
    console.error("[chat]", err);
    return NextResponse.json(
      {
        reply:
          "Something went wrong on my side. Rather than guess at an answer, use the contact form and a person will reply within one business day.",
        agentKey: "concierge",
        agentName: "Ada",
        suggestions: [],
        escalate: true,
        conversationId: "",
      },
      { status: 200 },
    );
  }
}
