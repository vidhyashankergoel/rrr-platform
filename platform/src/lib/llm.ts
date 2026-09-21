/**
 * THE MODEL LAYER — built for near-zero running cost.
 *
 * Everything speaks the OpenAI chat-completions wire format, so one setting
 * points the whole system at whichever gateway you are running:
 *
 *   OmniRoute       http://localhost:20128/v1     ← free providers, 19 routing
 *                                                   strategies, model "auto"
 *   Ollama          http://localhost:11434/v1     ← fully local, $0, no egress
 *   LM Studio       http://localhost:1234/v1
 *   LiteLLM / vLLM  http://localhost:4000/v1
 *   OpenRouter      https://openrouter.ai/api/v1
 *
 * SIX COST CONTROLS, in the order they save the most money:
 *
 *  1. RETRIEVAL FIRST — when the catalogue answers the question confidently,
 *     no model is called at all. On a consulting site most traffic is "what
 *     does X cost", which retrieval answers exactly and for free.
 *  2. CACHE — identical questions return a cached answer for an hour. FAQ
 *     traffic is extremely repetitive; this alone removes most calls.
 *  3. TIERING — high-volume chat runs on the cheap/local tier. The expensive
 *     tier is reserved for drafting agents, which run a handful of times a day.
 *  4. CONTEXT TRIMMING — only the top few retrieved entries are sent, never
 *     the whole catalogue. Input tokens are most of the bill.
 *  5. HARD TOKEN CAPS — per request, so one malformed prompt cannot run away.
 *  6. DAILY CEILING — past a configured number of calls per day the system
 *     silently reverts to retrieval. The site degrades, it never overspends.
 *
 * With OmniRoute's free providers or a local Ollama model, steps 3–6 are
 * belt-and-braces: the marginal cost is already zero.
 */

export type Tier = "fast" | "quality";

export interface CompleteInput {
  system: string;
  context: string;
  history: Array<{ role: "USER" | "ASSISTANT"; content: string }>;
  message: string;
  maxTokens?: number;
  tier?: Tier;
  /** Skip the cache for this call (drafting a unique document). */
  noCache?: boolean;
}

const TIMEOUT_MS = 20_000;
const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_CONTEXT_CHARS = 6_000;
const MAX_HISTORY_TURNS = 6;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

interface Gateway {
  baseUrl: string;
  apiKey: string;
  model: string;
  label: string;
}

function gatewayFor(tier: Tier): Gateway | null {
  const baseUrl = process.env.LLM_BASE_URL;
  if (!baseUrl) return null;

  // Many local gateways need no key. Send a placeholder so strict clients
  // do not reject the request for a missing Authorization header.
  const apiKey = process.env.LLM_API_KEY ?? "local";

  const model =
    tier === "quality"
      ? (process.env.LLM_MODEL_QUALITY ?? process.env.LLM_MODEL_FAST ?? "auto")
      : (process.env.LLM_MODEL_FAST ?? "auto/cheap");

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    apiKey,
    model,
    label: `${new URL(baseUrl).host} · ${model}`,
  };
}

export function activeProvider(): { mode: "gateway" | "retrieval"; detail: string } {
  const g = gatewayFor("fast");
  return g ? { mode: "gateway", detail: g.label } : { mode: "retrieval", detail: "catalogue retrieval only" };
}

// ---------------------------------------------------------------------------
// Cost control 2 — response cache
// ---------------------------------------------------------------------------

const cache = new Map<string, { text: string; at: number }>();

function cacheKey(input: CompleteInput, model: string): string {
  const normalized = input.message.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
  // Context is hashed cheaply so a catalogue change invalidates the cache.
  let h = 0;
  for (let i = 0; i < input.context.length; i++) h = (h * 31 + input.context.charCodeAt(i)) | 0;
  return `${model}:${h}:${normalized}`;
}

function cacheGet(key: string): string | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.text;
}

function cacheSet(key: string, text: string) {
  if (cache.size > 500) {
    // Drop the oldest quarter rather than growing without bound.
    const entries = [...cache.entries()].sort((a, b) => a[1].at - b[1].at);
    for (let i = 0; i < 125; i++) cache.delete(entries[i]![0]);
  }
  cache.set(key, { text, at: Date.now() });
}

// ---------------------------------------------------------------------------
// Cost control 6 — daily ceiling
// ---------------------------------------------------------------------------

let callsToday = 0;
let callDay = new Date().toISOString().slice(0, 10);

function withinDailyBudget(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== callDay) {
    callDay = today;
    callsToday = 0;
  }
  const ceiling = Number(process.env.LLM_DAILY_CALL_LIMIT ?? 2000);
  return callsToday < ceiling;
}

export function usageToday() {
  return { day: callDay, calls: callsToday, limit: Number(process.env.LLM_DAILY_CALL_LIMIT ?? 2000) };
}

// ---------------------------------------------------------------------------
// The call
// ---------------------------------------------------------------------------

export async function complete(input: CompleteInput): Promise<string | null> {
  const tier = input.tier ?? "fast";
  const gateway = gatewayFor(tier);
  if (!gateway) return null;

  if (!withinDailyBudget()) {
    console.warn("[llm] daily call ceiling reached — falling back to retrieval");
    return null;
  }

  // Cost control 4 — trim context and history before they become input tokens.
  const context = input.context.slice(0, MAX_CONTEXT_CHARS);
  const history = input.history.slice(-MAX_HISTORY_TURNS);

  const key = cacheKey({ ...input, context }, gateway.model);
  if (!input.noCache) {
    const cached = cacheGet(key);
    if (cached) return cached;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    callsToday += 1;

    const res = await fetch(`${gateway.baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${gateway.apiKey}`,
      },
      body: JSON.stringify({
        model: gateway.model,
        // Low temperature: this system quotes prices. Creativity is a defect here.
        temperature: 0.25,
        max_tokens: Math.min(input.maxTokens ?? 650, 1200),
        messages: [
          { role: "system", content: `${input.system}\n\n<context>\n${context}\n</context>` },
          ...history.map((m) => ({
            role: m.role === "USER" ? "user" : "assistant",
            content: m.content,
          })),
          { role: "user", content: input.message },
        ],
      }),
    });

    if (!res.ok) {
      console.warn(`[llm] ${gateway.label} returned ${res.status}`);
      return null;
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) return null;

    if (!input.noCache) cacheSet(key, text);
    return text;
  } catch (err) {
    // Timeout, gateway down, network error — the caller falls back to retrieval.
    console.warn("[llm] call failed:", err instanceof Error ? err.message : err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Cost control 1 — the most important one.
 *
 * Call this before `complete()`. When the catalogue already answers the
 * question well, return that answer and never touch a model. On a consulting
 * site this handles the majority of traffic at zero marginal cost, and it is
 * also strictly more accurate, because a retrieved price is the real price.
 */
export function shouldSkipModel(retrievalScore: number): boolean {
  const threshold = Number(process.env.LLM_RETRIEVAL_SKIP_THRESHOLD ?? 0.85);
  return retrievalScore >= threshold;
}
