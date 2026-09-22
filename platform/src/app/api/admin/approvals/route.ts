import { NextResponse } from "next/server";
import { z } from "zod";
import { db, audit } from "@/lib/db";
import { send } from "@/lib/mailer";
import { rateLimit, clientKey } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The human gate.
 *
 * This is the only path by which an agent-proposed action becomes a real
 * outward-facing event. Approving records who decided, when, and why — which
 * is what makes the CASL consent trail and the contract trail defensible.
 *
 * Authentication here is a single shared token, which is appropriate for a
 * one- to five-person firm. Replace with proper per-user authentication
 * (Auth.js plus a Users table) before more people need access — the decidedBy
 * field already expects a real identity.
 */

function authorized(req: Request): string | null {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || expected.length < 16) return null;

  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  // Constant-time-ish comparison.
  if (token.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0 ? (req.headers.get("x-admin-user") ?? "admin") : null;
}

export async function GET(req: Request) {
  // Throttle BEFORE checking the token. This endpoint returns the customer
  // list, and a shared bearer token is only as strong as the number of
  // guesses an attacker gets. The POST path was throttled and this one was
  // not, which left the console's only gate open to offline-speed guessing.
  const limit = rateLimit(`admin-read:${clientKey(req)}`, 30, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    );
  }

  const who = authorized(req);
  if (!who) {
    // Record failures: repeated 401s from one address is what a credential
    // attack looks like, and without this there is no way to notice one.
    await audit({ actor: "unknown", action: "admin.auth.failed", subject: clientKey(req) });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [pending, leads, stats] = await Promise.all([
    db.approval.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { lead: { select: { id: true, name: true, email: true, company: true, stage: true } } },
    }),
    db.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      // Explicit column list, not the whole row. `unsubscribeToken` is a
      // capability and `consentIpHash` is consent evidence; neither is used
      // by the console, so neither should cross the wire where a browser
      // extension, a proxy log or a screenshot can capture it.
      select: {
        id: true, createdAt: true, name: true, email: true, phone: true,
        company: true, jobTitle: true, message: true, serviceIds: true,
        budgetBand: true, timeline: true, stage: true, score: true,
        consentContact: true, consentMarketing: true, consentAt: true,
        unsubscribedAt: true, ownerEmail: true, purgeAfter: true,
      },
    }),
    Promise.all([
      db.lead.count(),
      db.approval.count({ where: { status: "PENDING" } }),
      db.conversation.count(),
      db.emailMessage.count({ where: { status: "SENT" } }),
      db.dataSubjectRequest.count({ where: { status: { in: ["RECEIVED", "IN_PROGRESS"] } } }),
    ]),
  ]);

  return NextResponse.json({
    pending,
    leads,
    stats: {
      leads: stats[0],
      pendingApprovals: stats[1],
      conversations: stats[2],
      emailsSent: stats[3],
      openPrivacyRequests: stats[4],
    },
  });
}

const Decision = z.object({
  id: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().max(1000).optional(),
});

export async function POST(req: Request) {
  const who = authorized(req);
  if (!who) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = rateLimit(`admin:${clientKey(req)}`, 60, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Slow down." }, { status: 429 });

  let body;
  try {
    body = Decision.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const approval = await db.approval.findUnique({
    where: { id: body.id },
    include: { lead: true },
  });
  if (!approval) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (approval.status !== "PENDING") {
    return NextResponse.json({ error: "Already decided." }, { status: 409 });
  }

  await db.approval.update({
    where: { id: approval.id },
    data: {
      status: body.decision,
      decidedBy: who,
      decidedAt: new Date(),
      decisionNote: body.note,
    },
  });

  await audit({
    actor: who,
    action: `approval.${body.decision.toLowerCase()}`,
    subject: approval.kind,
    detail: approval.title,
    leadId: approval.leadId ?? undefined,
  });

  // Execute only on approval, and only for kinds that have a safe executor.
  let executed: string | null = null;

  if (body.decision === "APPROVED" && approval.kind === "OUTBOUND_EMAIL" && approval.lead) {
    const payload = JSON.parse(approval.payloadJson) as {
      subject: string;
      bodyText: string;
      category?: "TRANSACTIONAL" | "COMMERCIAL";
      sequenceKey?: string;
      sequenceStep?: number;
    };

    const result = await send({
      leadId: approval.lead.id,
      toEmail: approval.lead.email,
      subject: payload.subject,
      bodyText: payload.bodyText,
      category: payload.category ?? "TRANSACTIONAL",
      sequenceKey: payload.sequenceKey,
      sequenceStep: payload.sequenceStep,
      approvalId: approval.id,
    });

    executed = result.ok ? (result.reason ?? "sent") : `blocked: ${result.reason}`;
  }

  // LEGAL_DOCUMENT, PRICE_CONCESSION, SALES_HANDOFF and HR_RESPONSE are
  // deliberately not auto-executed. Approving them marks them actionable;
  // a person still performs the act. That is the point.

  return NextResponse.json({ ok: true, executed });
}
