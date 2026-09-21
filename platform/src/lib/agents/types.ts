/**
 * The agent contract.
 *
 * DESIGN RULE, and the most important line in this codebase:
 *
 *   Agents propose. Humans dispose. The system executes.
 *
 * No agent may send an email, issue a price concession, transmit a contract or
 * make any other outward-facing commitment directly. Anything leaving the
 * building is returned as an `AgentAction` with `requiresApproval: true`, is
 * written to the Approval table, and only executes after a named human has
 * recorded a decision. This is what makes the system defensible under CASL
 * (which places the burden of proving consent on the sender) and safe around
 * anything contractual.
 */

import type { PrismaClient } from "@prisma/client";

export type AgentKey =
  | "concierge"
  | "qualifier"
  | "pricing"
  | "delivery"
  | "negotiation"
  | "followup"
  | "sales"
  | "legal"
  | "hr";

export interface AgentContext {
  db: PrismaClient;
  conversationId?: string;
  leadId?: string;
  /** Prior turns, oldest first, already trimmed to a sensible window. */
  history: Array<{ role: "USER" | "ASSISTANT"; content: string }>;
  /** Where the visitor is on the site, for context. */
  pageUrl?: string;
  locale: string;
}

export interface AgentInput {
  message: string;
  context: AgentContext;
}

/** Something the agent wants to happen in the outside world. */
export interface AgentAction {
  kind:
    | "OUTBOUND_EMAIL"
    | "PROPOSAL"
    | "LEGAL_DOCUMENT"
    | "PRICE_CONCESSION"
    | "SALES_HANDOFF"
    | "HR_RESPONSE";
  title: string;
  summary: string;
  payload: Record<string, unknown>;
  /**
   * Always true for anything a customer will see. The type permits false only
   * for purely internal bookkeeping (e.g. scheduling an internal reminder).
   */
  requiresApproval: boolean;
  riskNote?: string;
}

export interface AgentResult {
  /** What to say back in the chat. Plain text or a small, safe HTML subset. */
  reply: string;
  /** Hand the conversation to another agent for the next turn. */
  routeTo?: AgentKey;
  /** Structured facts learned about the lead, merged into the Lead record. */
  leadPatch?: Record<string, unknown>;
  /** Outward-facing things to queue for human approval. */
  actions?: AgentAction[];
  /** Suggested follow-up questions to show as chips. */
  suggestions?: string[];
  /** Confidence 0–1. Below `HANDOFF_THRESHOLD` the concierge offers a human. */
  confidence: number;
  /** Set when the agent believes a person should take over now. */
  escalate?: boolean;
}

export interface Agent {
  key: AgentKey;
  /** Shown to visitors — never an invented job title for a real person. */
  displayName: string;
  /** One line describing scope, used in the admin console and in routing. */
  purpose: string;
  /**
   * Terms that route a message here. Deliberately explicit rather than
   * learned, so routing is inspectable and testable.
   */
  triggers: string[];
  /** Hard limits stated in the system prompt when a model is configured. */
  guardrails: string[];
  run(input: AgentInput): Promise<AgentResult>;
}

export const HANDOFF_THRESHOLD = 0.42;
