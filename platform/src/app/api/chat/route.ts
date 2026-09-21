import { NextResponse } from "next/server";
import { z } from "zod";
import { runTurn } from "@/lib/agents/orchestrator";
import { rateLimit, clientKey } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  sessionId: z.string().min(8).max(64),
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
