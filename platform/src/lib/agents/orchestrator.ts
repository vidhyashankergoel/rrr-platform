/**
 * The orchestrator: one turn of conversation, end to end.
 *
 *   message in → route to an agent → run it → persist everything →
 *   queue any outward-facing action for human approval → reply out
 *
 * Nothing here talks to a customer directly except the chat reply itself.
 */

import { db, audit } from "../db";
import { agents, route } from "./registry";
import { HANDOFF_THRESHOLD, type AgentResult } from "./types";
import type { ApprovalKind, LeadStage } from "@prisma/client";

export interface TurnInput {
  sessionId: string;
  message: string;
  pageUrl?: string;
  userAgent?: string;
  locale?: string;
}

export interface TurnOutput {
  reply: string;
  agentKey: string;
  agentName: string;
  suggestions: string[];
  escalate: boolean;
  conversationId: string;
}

const MAX_MESSAGE = 2000;
const HISTORY_WINDOW = 10;

export async function runTurn(input: TurnInput): Promise<TurnOutput> {
  const started = Date.now();
  const message = input.message.slice(0, MAX_MESSAGE).trim();

  // --- Conversation -------------------------------------------------------
  let conversation = await db.conversation.findUnique({
    where: { sessionId: input.sessionId },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: HISTORY_WINDOW },
    },
  });

  if (!conversation) {
    const created = await db.conversation.create({
      data: {
        sessionId: input.sessionId,
        pageUrl: input.pageUrl,
        userAgent: input.userAgent?.slice(0, 300),
        locale: input.locale ?? "en-CA",
        // PIPEDA Principle 5: retention is set at creation, not decided later.
        purgeAfter: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      include: { messages: true },
    });
    conversation = { ...created, messages: [] };
    await audit({ actor: "system", action: "conversation.created", subject: created.id });
  }

  await db.message.create({
    data: { conversationId: conversation.id, role: "USER", content: message },
  });

  // --- Route --------------------------------------------------------------
  const agentKey = route(message, conversation.activeAgent);
  const agent = agents[agentKey] ?? agents.concierge!;

  const history = conversation.messages
    .filter((m) => m.role !== "SYSTEM")
    .map((m) => ({ role: m.role as "USER" | "ASSISTANT", content: m.content }));

  // --- Run ----------------------------------------------------------------
  let result: AgentResult;
  let error: string | undefined;

  try {
    result = await agent.run({
      message,
      context: {
        db,
        conversationId: conversation.id,
        leadId: conversation.leadId ?? undefined,
        history,
        pageUrl: input.pageUrl,
        locale: conversation.locale,
      },
    });
  } catch (err) {
    error = err instanceof Error ? err.message : "unknown";
    result = {
      reply:
        "Something went wrong on my side. Rather than guess, let me point you at a person — the contact form gets a reply within one business day.",
      confidence: 0,
      escalate: true,
    };
  }

  const escalate = Boolean(result.escalate) || result.confidence < HANDOFF_THRESHOLD;

  // --- Persist the assistant turn ----------------------------------------
  await db.message.create({
    data: {
      conversationId: conversation.id,
      role: "ASSISTANT",
      agentKey: agent.key,
      content: result.reply,
      meta: JSON.stringify({ confidence: result.confidence, escalate }),
    },
  });

  const run = await db.agentRun.create({
    data: {
      agentKey: agent.key,
      trigger: "chat",
      status: error ? "FAILED" : result.actions?.length ? "BLOCKED_PENDING_APPROVAL" : "SUCCEEDED",
      inputJson: JSON.stringify({ message, route: agentKey }),
      outputJson: JSON.stringify({
        confidence: result.confidence,
        routeTo: result.routeTo,
        actions: result.actions?.map((a) => a.kind),
      }),
      error,
      latencyMs: Date.now() - started,
      model: process.env.ANTHROPIC_API_KEY ? (process.env.ANTHROPIC_MODEL ?? null) : null,
      conversationId: conversation.id,
      leadId: conversation.leadId,
    },
  });

  // --- Update routing state and any learned facts about the lead ----------
  await db.conversation.update({
    where: { id: conversation.id },
    data: {
      activeAgent: result.routeTo ?? agent.key,
      intent: agentKey,
      handedOff: conversation.handedOff || escalate,
      updatedAt: new Date(),
    },
  });

  if (result.leadPatch && conversation.leadId) {
    const patch = result.leadPatch as {
      score?: number;
      serviceIds?: string;
      stage?: string;
      estimateLow?: number;
      estimateHigh?: number;
    };
    await db.lead.update({
      where: { id: conversation.leadId },
      data: {
        ...(patch.score !== undefined ? { score: patch.score } : {}),
        ...(patch.serviceIds ? { serviceIds: patch.serviceIds } : {}),
        ...(patch.stage ? { stage: patch.stage as LeadStage } : {}),
        ...(patch.estimateLow !== undefined ? { estimateLow: patch.estimateLow } : {}),
        ...(patch.estimateHigh !== undefined ? { estimateHigh: patch.estimateHigh } : {}),
      },
    });
  }

  // --- Queue outward-facing actions for a human ---------------------------
  for (const action of result.actions ?? []) {
    if (!action.requiresApproval) continue;
    await db.approval.create({
      data: {
        kind: action.kind as ApprovalKind,
        title: action.title,
        summary: action.summary,
        payloadJson: JSON.stringify(action.payload),
        riskNote: action.riskNote,
        agentRunId: run.id,
        leadId: conversation.leadId,
      },
    });
    await audit({
      actor: agent.key,
      action: "approval.queued",
      subject: action.kind,
      detail: action.title,
      leadId: conversation.leadId ?? undefined,
    });
  }

  return {
    reply: result.reply,
    agentKey: agent.key,
    agentName: agent.displayName,
    suggestions: result.suggestions ?? [],
    escalate,
    conversationId: conversation.id,
  };
}
