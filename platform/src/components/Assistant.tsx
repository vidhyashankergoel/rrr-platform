"use client";

/**
 * The customer-facing assistant.
 *
 * Talks to /api/chat, which routes to whichever agent owns the subject and
 * writes the whole exchange to the database. Beyond plain chat it does the
 * things that actually convert a conversation into a conversation with a human:
 *
 *  • Inline lead capture — with unticked CASL/PIPEDA consent, in the panel
 *  • Quick actions — book a call, request an NDA, book the read-only audit
 *  • A proactive opener on high-intent pages, once per session, dismissible
 *  • Agent attribution, so the visitor can see which specialist answered
 *  • Per-answer feedback, recorded so bad answers can be found and fixed
 *  • Transcript persistence across reloads, and a copy-transcript action
 *  • An always-available route to a human
 *
 * Accessibility: role="dialog", aria-live log, Escape closes, focus returns to
 * the launcher, fully keyboard operable — AODA requires WCAG 2.0 AA and we
 * target 2.1 AA.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { company, currencyFromDollars as money } from "@/lib/company";
import { auditOffer } from "@/lib/catalogue";
import { OPENERS, actionForChip, chipsFor } from "@/lib/chips";
import BookingDialog from "./BookingDialog";
import { BOOK_EVENT } from "./BookCall";

type Role = "user" | "bot" | "system";

interface Turn {
  id: string;
  role: Role;
  html: string;
  agentName?: string;
  feedback?: "up" | "down";
}

/** Pages where a visitor is far enough down the funnel to warrant an opener. */
const PROACTIVE: Record<string, string> = {
  "/pricing": "Working out a budget? I can give you a range for a specific piece of work, or tell you what a given number realistically buys.",
  "/services": "Not sure which of these you need? Describe what is going wrong and I will point you at the right one.",
  "/trust": "Happy to answer anything about how we de-risk a first engagement — NDAs, phasing, or the read-only audit.",
  "/security": "Ask me anything about the controls we build in, or how we behave while we have access to your estate.",
};

/**
 * Quick actions are *actions*, not links.
 *
 * They used to be anchors: "Request an NDA" was a `mailto:` (which does
 * nothing on a machine with no mail client configured, which is most of them)
 * and "Book the audit" navigated to /contact — a no-op for the many visitors
 * already on /contact. Both looked broken because both were. Each one now
 * does its work inside the panel, where the visitor already is.
 */
type ActionKey = "call" | "nda" | "audit";

const QUICK_ACTIONS: { key: ActionKey; label: string }[] = [
  { key: "call", label: "Book a free call" },
  { key: "nda", label: "Request an NDA" },
  { key: "audit", label: "Book the audit" },
];

/** Copy for the two in-panel request forms. */
const REQUESTS: Record<
  "nda" | "audit",
  { title: string; blurb: string; cta: string; serviceIds: string; message: string; reply: string[] }
> = {
  nda: {
    title: "Request a mutual NDA",
    blurb:
      "We will send a mutual non-disclosure agreement for you to review — mutual because you will see our methods and we will see your estate. Signed before any access is granted, and before you tell us anything you would not put in an email.",
    cta: "Send me the NDA",
    serviceIds: "nda",
    message:
      "NDA requested from the site assistant. Send the mutual NDA for review. No confidential detail has been shared yet.",
    reply: [
      "Noted — a mutual NDA is on its way to you.",
      "",
      "**What happens now.** A person reviews and sends it, usually within one business day. It is mutual: it binds us as much as it binds you. Nothing is auto-sent — a human signs off on every document that leaves here.",
      "",
      "If your own legal team would rather we sign **your** paper, say so and we will. That is normal and we do not argue about it.",
      "",
      "_Not legal advice. Have your own counsel read it._",
    ],
  },
  audit: {
    title: "Book the infrastructure audit",
    // Duration and price come from the catalogue so this cannot drift from
    // the pricing table: five business days, $4,500. Saying "two weeks" here
    // while the table says five days is the kind of small inconsistency a
    // procurement reviewer notices and a salesperson has to explain away.
    blurb:
      `${auditOffer.durationLabel}, read-only access, ${money(auditOffer.price)} fixed. You get a written findings report, a prioritized remediation plan and a costed proposal — and you own all three whether or not you hire us for the work.`,
    cta: "Request the audit",
    // Must be the catalogue id, or the reply templates and the estimator
    // both fail to recognise what was asked for.
    serviceIds: auditOffer.id,
    message:
      "Infrastructure audit requested from the site assistant. Wants the fixed-fee, read-only audit.",
    reply: [
      `Good — that is the right place to start, and the cheapest way to find out whether we are any use to you. ${auditOffer.durationLabel}, ${money(auditOffer.price)}, fixed.`,
      "",
      "**What happens now.** A person replies within one business day to agree a start date and the read-only access we need. Before any access: a mutual NDA, and scoped credentials you issue and can revoke.",
      "",
      "**What you get.** A findings report, a prioritized plan, and a costed proposal. Yours to keep and to take to another firm if you would rather.",
    ],
  },
};

/** Minimal, safe markdown. Everything is escaped before any tag is introduced. */
function render(md: string): string {
  const esc = md.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

  const lines = esc.split("\n");
  const out: string[] = [];
  let inList = false;

  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = /^[•\-*]\s+(.*)$/.exec(line);
    if (bullet) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${bullet[1]}</li>`);
      continue;
    }
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
    if (line.length === 0) continue;
    out.push(`<p>${line}</p>`);
  }
  if (inList) out.push("</ul>");

  return out
    .join("")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>");
}

function stripTags(html: string): string {
  return html
    .replace(/<li>/g, "• ")
    .replace(/<\/(p|li|ul)>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sessionId(): string {
  try {
    const existing = sessionStorage.getItem("rrr-session");
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    sessionStorage.setItem("rrr-session", id);
    return id;
  } catch {
    return `s-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

export default function Assistant() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [chips, setChips] = useState(OPENERS.slice(0, 3));
  const [booking, setBooking] = useState(false);
  const [request, setRequest] = useState<"nda" | "audit" | null>(null);
  const [bookingTopic, setBookingTopic] = useState<string | undefined>();
  const [showPing, setShowPing] = useState(true);
  const [nudge, setNudge] = useState<string | null>(null);
  const [showCapture, setShowCapture] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [copied, setCopied] = useState(false);

  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const session = useRef<string>("");
  const exchanges = useRef(0);

  useEffect(() => {
    session.current = sessionId();
    try {
      const saved = sessionStorage.getItem("rrr-turns");
      if (saved) {
        const parsed = JSON.parse(saved) as Turn[];
        if (Array.isArray(parsed) && parsed.length) setTurns(parsed);
      }
      if (sessionStorage.getItem("rrr-captured") === "1") setCaptured(true);
    } catch {
      /* private browsing */
    }
  }, []);

  useEffect(() => {
    try {
      if (turns.length) sessionStorage.setItem("rrr-turns", JSON.stringify(turns.slice(-40)));
    } catch {
      /* quota or private browsing */
    }
  }, [turns]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [turns, busy, showCapture, request]);

  // Chips track the page until the visitor says something, after which the
  // conversation is the better signal.
  useEffect(() => {
    if (!turns.some((t) => t.role === "user")) setChips(chipsFor(pathname));
  }, [pathname, turns]);

  const close = useCallback(() => {
    setOpen(false);
    // The launcher carries `hidden={open}`, so at this instant it is still
    // hidden and cannot take focus. Wait for React to paint the next frame,
    // then return focus — otherwise a keyboard user is dumped at the top of
    // the document with no idea where they were.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => launcherRef.current?.focus());
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Any "Book a free call" button on the site opens the dialog through here,
  // so there is one dialog, one availability fetch and one piece of state.
  useEffect(() => {
    const onBook = (e: Event) => {
      setBookingTopic((e as CustomEvent<{ topic?: string }>).detail?.topic);
      setBooking(true);
    };
    window.addEventListener(BOOK_EVENT, onBook);
    return () => window.removeEventListener(BOOK_EVENT, onBook);
  }, []);

  // Proactive opener: once per session, only on high-intent pages.
  useEffect(() => {
    const message = PROACTIVE[pathname ?? ""];
    if (!message || open) return;
    try {
      if (sessionStorage.getItem("rrr-nudged") === "1") return;
    } catch {
      return;
    }
    const t = setTimeout(() => {
      setNudge(message);
      try {
        sessionStorage.setItem("rrr-nudged", "1");
      } catch {
        /* ignore */
      }
    }, 18_000);
    return () => clearTimeout(t);
  }, [pathname, open]);

  const openPanel = useCallback(() => {
    setOpen(true);
    setShowPing(false);
    setNudge(null);
    setTimeout(() => inputRef.current?.focus(), 250);
    setTurns((t) =>
      t.length
        ? t
        : [
            {
              id: "greet",
              role: "bot",
              agentName: "Ada",
              html: render(
                [
                  `Hi — I am Ada, the automated assistant for **${company.shortName}**.`,
                  "",
                  "I can tell you what we build, what it typically costs in Canadian dollars, how long it takes, how we secure it, and who we have done it for.",
                  "",
                  "Ask me anything, or pick one below.",
                ].join("\n"),
              ),
            },
          ],
    );
  }, []);

  const submit = useCallback(
    async (text?: string) => {
      const message = (text ?? value).trim();
      if (!message || busy) return;

      setValue("");
      setBusy(true);
      exchanges.current += 1;
      setTurns((t) => [...t, { id: `u-${Date.now()}`, role: "user", html: render(message) }]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sessionId: session.current,
            message,
            pageUrl: pathname ?? undefined,
          }),
        });

        const data = (await res.json()) as {
          reply?: string;
          agentName?: string;
          suggestions?: string[];
          escalate?: boolean;
          error?: string;
        };

        const reply =
          data.reply ??
          data.error ??
          `I could not reach the server. Please email ${company.email} and a person will pick it up.`;

        setTurns((t) => [
          ...t,
          { id: `b-${Date.now()}`, role: "bot", agentName: data.agentName, html: render(reply) },
        ]);

        // Prefer what the answering agent suggests — it knows what it just
        // said. Otherwise follow the topic rather than shuffling at random,
        // which produced chips with no relationship to the answer above them.
        setChips(
          data.suggestions?.length ? data.suggestions.slice(0, 3) : chipsFor(pathname, message),
        );

        // Offer to connect them to a person once the conversation has substance.
        if (!captured && (data.escalate || exchanges.current >= 3)) {
          setShowCapture(true);
        }
      } catch {
        setTurns((t) => [
          ...t,
          {
            id: `e-${Date.now()}`,
            role: "bot",
            html: render(
              `I could not reach the server just then. Email **${company.email}** or call **${company.phone}** and a person will pick it up.`,
            ),
          },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [value, busy, pathname, captured],
  );

  async function rate(id: string, verdict: "up" | "down") {
    setTurns((t) => t.map((x) => (x.id === id ? { ...x, feedback: verdict } : x)));
    try {
      await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: session.current, messageId: id, verdict }),
      });
    } catch {
      /* feedback is best-effort */
    }
  }

  async function capture(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const payload = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      company: String(fd.get("company") ?? ""),
      message:
        "Started from the site assistant. Conversation transcript is attached to this lead.\n\n" +
        turns
          .filter((t) => t.role !== "system")
          .map((t) => `${t.role === "user" ? "Them" : "Ada"}: ${stripTags(t.html)}`)
          .join("\n\n")
          .slice(0, 3500),
      consentContact: fd.get("consentContact") === "on",
      consentMarketing: false,
      sessionId: session.current,
      sourceUrl: typeof window !== "undefined" ? window.location.href : "",
    };

    if (!payload.consentContact) return;

    setBusy(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (json.ok) {
        setCaptured(true);
        setShowCapture(false);
        try {
          sessionStorage.setItem("rrr-captured", "1");
        } catch {
          /* ignore */
        }
        setTurns((t) => [
          ...t,
          {
            id: `ok-${Date.now()}`,
            role: "bot",
            agentName: "Ada",
            html: render(
              [
                "Thank you — that is recorded and a person will reply within one business day.",
                "",
                `If it is urgent, call **${company.phone}** directly.`,
                "",
                "_Your conversation here has been attached so whoever replies has the context and you do not have to repeat yourself._",
              ].join("\n"),
            ),
          },
        ]);
      } else {
        setTurns((t) => [
          ...t,
          {
            id: `err-${Date.now()}`,
            role: "bot",
            html: render(json.error ?? `Something went wrong. Please email ${company.email}.`),
          },
        ]);
      }
    } finally {
      setBusy(false);
    }
  }

  /**
   * The NDA and audit requests.
   *
   * Both are ordinary leads with a stated purpose, which is what they are —
   * so they inherit the consent record, the retention date, the owner
   * notification and the approval queue that /api/leads already gets right,
   * rather than growing a second half-correct path.
   */
  async function sendRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!request) return;

    const spec = REQUESTS[request];
    const fd = new FormData(e.currentTarget);

    if (fd.get("consentContact") !== "on") return;

    const transcript = turns
      .filter((t) => t.role !== "system")
      .map((t) => `${t.role === "user" ? "Them" : "Ada"}: ${stripTags(t.html)}`)
      .join("\n\n")
      .slice(0, 3000);

    setBusy(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          company: String(fd.get("company") ?? ""),
          serviceIds: spec.serviceIds,
          message: `${spec.message}\n\n--- Conversation ---\n\n${transcript}`,
          consentContact: true,
          consentMarketing: false,
          sessionId: session.current,
          sourceUrl: typeof window !== "undefined" ? window.location.href : "",
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (json.ok) {
        setRequest(null);
        setCaptured(true);
        try {
          sessionStorage.setItem("rrr-captured", "1");
        } catch {
          /* private browsing */
        }
        setTurns((t) => [
          ...t,
          { id: `req-${Date.now()}`, role: "bot", agentName: "Ada", html: render(spec.reply.join("\n")) },
        ]);
      } else {
        setTurns((t) => [
          ...t,
          {
            id: `reqerr-${Date.now()}`,
            role: "bot",
            html: render(
              json.error ?? `Something went wrong. Please email **${company.email}** and we will sort it out.`,
            ),
          },
        ]);
      }
    } catch {
      setTurns((t) => [
        ...t,
        {
          id: `reqerr-${Date.now()}`,
          role: "bot",
          html: render(
            `I could not reach the server. Email **${company.email}** or call **${company.phone}** and a person will pick it up.`,
          ),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  /** Quick-action dispatch. Every one of these does something here and now. */
  function runAction(key: ActionKey) {
    if (key === "call") {
      setBooking(true);
      return;
    }
    setRequest(key);
    setTurns((t) => [
      ...t,
      {
        id: `ask-${key}-${Date.now()}`,
        role: "bot",
        agentName: key === "nda" ? "Legal" : "Ada",
        html: render(`**${REQUESTS[key].title}**\n\n${REQUESTS[key].blurb}`),
      },
    ]);
  }

  function copyTranscript() {
    const text = turns
      .filter((t) => t.role !== "system")
      .map((t) => `${t.role === "user" ? "You" : (t.agentName ?? "Ada")}: ${stripTags(t.html)}`)
      .join("\n\n");
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => undefined,
    );
  }

  return (
    <>
      {/* Proactive nudge */}
      {nudge && !open && (
        <div className="ai-nudge" role="status">
          <button
            className="ai-nudge__x"
            type="button"
            aria-label="Dismiss"
            onClick={() => setNudge(null)}
          >
            ×
          </button>
          <p>{nudge}</p>
          <button className="btn btn--primary btn--sm" type="button" onClick={openPanel}>
            Ask Ada
          </button>
        </div>
      )}

      <button
        ref={launcherRef}
        className="ai-launch"
        type="button"
        hidden={open}
        onClick={openPanel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="aiPanel"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9z" />
          <path d="M18.5 3.5v3M20 5h-3" />
        </svg>
        <span>Ask Ada</span>
        {showPing && <i className="ai-launch__ping" />}
      </button>

      <div
        id="aiPanel"
        className={`ai-panel${open ? " is-open" : ""}`}
        role="dialog"
        aria-label="Ada, automated assistant"
        hidden={!open}
      >
        <div className="ai-head">
          <div className="ai-head__avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3.5" y="7.5" width="17" height="12" rx="3" />
              <path d="M12 7.5V4M8.5 13h.01M15.5 13h.01M9.5 16.5h5" />
              <circle cx="12" cy="3" r="1.3" />
            </svg>
          </div>
          <div>
            <strong>Ada</strong>
            <span>
              <i className="dot" style={{ background: "#3ddba4" }} /> Automated · replies instantly
            </span>
          </div>
          <button
            type="button"
            aria-label={copied ? "Transcript copied" : "Copy transcript"}
            title={copied ? "Copied" : "Copy transcript"}
            onClick={copyTranscript}
            style={{ marginLeft: "auto" }}
          >
            {copied ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 13 4 4L19 7" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="11" height="11" rx="2" />
                <path d="M5 15V5a2 2 0 0 1 2-2h10" />
              </svg>
            )}
          </button>
          <button type="button" aria-label="Close assistant" onClick={close}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Quick actions — always reachable, never buried */}
        <div className="ai-actions">
          {QUICK_ACTIONS.map((a) => (
            <button key={a.key} type="button" onClick={() => runAction(a.key)}>
              {a.label}
            </button>
          ))}
        </div>

        <div className="ai-log" ref={logRef} role="log" aria-live="polite">
          {turns.map((t) => (
            <div key={t.id} className={`ai-msg ai-msg--${t.role === "user" ? "user" : "bot"}`}>
              <div className="ai-msg__bubble" dangerouslySetInnerHTML={{ __html: t.html }} />
              {t.role === "bot" && t.id !== "greet" && (
                <div className="ai-msg__meta">
                  {t.agentName && t.agentName !== "Ada" && <span>{t.agentName} · </span>}
                  {t.feedback ? (
                    <span>{t.feedback === "up" ? "Thanks — noted." : "Thanks — we will look at this one."}</span>
                  ) : (
                    <>
                      <button className="ai-rate" type="button" onClick={() => void rate(t.id, "up")} aria-label="This answer helped">
                        Helpful
                      </button>
                      <button className="ai-rate" type="button" onClick={() => void rate(t.id, "down")} aria-label="This answer did not help">
                        Not helpful
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}

          {busy && (
            <div className="ai-msg ai-msg--bot">
              <div className="ai-msg__bubble ai-typing">
                <i /><i /><i />
              </div>
            </div>
          )}

          {/* NDA / audit request — the quick action's actual payload */}
          {request && (
            <div className="ai-capture">
              <h4>{REQUESTS[request].cta}</h4>
              <p>Three fields. A person picks it up from there.</p>
              <form onSubmit={sendRequest}>
                <input name="name" type="text" placeholder="Your name" required minLength={2} autoComplete="name" />
                <input name="email" type="email" placeholder="Work email" required autoComplete="email" />
                <input name="company" type="text" placeholder="Company" autoComplete="organization" />
                <label className="ai-consent">
                  <input name="consentContact" type="checkbox" required />
                  <span>
                    {company.legalName} may use these details to respond to this request. Not sold,
                    not shared, deleted on request.
                  </span>
                </label>
                <div style={{ display: "flex", gap: ".5rem" }}>
                  <button className="btn btn--primary btn--sm" type="submit" disabled={busy}>
                    {busy ? "Sending…" : REQUESTS[request].cta}
                  </button>
                  <button className="btn btn--ghost btn--sm" type="button" onClick={() => setRequest(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Inline lead capture */}
          {showCapture && !captured && !request && (
            <div className="ai-capture">
              <h4>Want a person to pick this up?</h4>
              <p>
                Leave your details and someone replies within one business day. Your conversation here
                comes with it, so you do not have to explain it twice.
              </p>
              <form onSubmit={capture}>
                <input name="name" type="text" placeholder="Your name" required minLength={2} autoComplete="name" />
                <input name="email" type="email" placeholder="Work email" required autoComplete="email" />
                <input name="company" type="text" placeholder="Company (optional)" autoComplete="organization" />
                <label className="ai-consent">
                  <input name="consentContact" type="checkbox" required />
                  <span>
                    {company.legalName} may use these details to reply to this enquiry. Not sold, not
                    shared, deleted on request.
                  </span>
                </label>
                <div style={{ display: "flex", gap: ".5rem" }}>
                  <button className="btn btn--primary btn--sm" type="submit" disabled={busy}>
                    {busy ? "Sending…" : "Send"}
                  </button>
                  <button
                    className="btn btn--ghost btn--sm"
                    type="button"
                    onClick={() => setShowCapture(false)}
                  >
                    Not now
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="ai-chips">
          {chips.map((c) => {
            // A chip that reads like an instruction should carry it out, not
            // send it as a question and have Ada describe it back.
            const action = actionForChip(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => (action ? runAction(action) : void submit(c))}
                disabled={busy}
              >
                {c}
              </button>
            );
          })}
        </div>

        <form
          className="ai-form"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label className="visually-hidden" htmlFor="aiInput">
            Your question
          </label>
          <textarea
            id="aiInput"
            ref={inputRef}
            rows={1}
            value={value}
            placeholder="Ask about services, pricing, security, timelines…"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
          />
          <button type="submit" aria-label="Send message" disabled={busy || !value.trim()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m4 12 16-8-5.5 16L11 13z" />
            </svg>
          </button>
        </form>

        <p className="ai-foot">
          Ada is automated and can be wrong. Prices are indicative, not an offer. Conversations are
          stored so we can answer you properly — see our <a href="/legal/privacy">privacy notice</a>.
        </p>
      </div>

      <BookingDialog
        open={booking}
        onClose={() => setBooking(false)}
        topic={bookingTopic}
        sessionId={session.current}
      />
    </>
  );
}
