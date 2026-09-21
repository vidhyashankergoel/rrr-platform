"use client";

/**
 * THE HUMAN GATE.
 *
 * This screen is the reason the agent system is safe to run. Everything an
 * agent wants to do in the outside world lands here first, and nothing leaves
 * the building until a person clicks Approve — which records who decided, when,
 * and why.
 *
 * Auth is a single shared token held in memory for the session, sent as a
 * bearer header. That is right for a firm of one to five people. Replace it
 * with per-user authentication before more people need access; the decidedBy
 * field already expects a real identity rather than "admin".
 */

import { useCallback, useEffect, useState } from "react";

interface Approval {
  id: string;
  kind: string;
  title: string;
  summary: string;
  payloadJson: string;
  riskNote: string | null;
  createdAt: string;
  lead: { id: string; name: string; email: string; company: string | null; stage: string } | null;
}

interface Lead {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  company: string | null;
  stage: string;
  score: number;
  consentContact: boolean;
  consentMarketing: boolean;
  message: string | null;
}

interface Payload {
  pending: Approval[];
  leads: Lead[];
  stats: {
    leads: number;
    pendingApprovals: number;
    conversations: number;
    emailsSent: number;
    openPrivacyRequests: number;
  };
}

const HIGH_RISK = new Set(["LEGAL_DOCUMENT", "PRICE_CONCESSION", "OUTBOUND_EMAIL"]);

const KIND_LABEL: Record<string, string> = {
  OUTBOUND_EMAIL: "Outbound email",
  PROPOSAL: "Proposal / quote",
  LEGAL_DOCUMENT: "Legal document",
  PRICE_CONCESSION: "Price or terms concession",
  SALES_HANDOFF: "Sales handoff",
  HR_RESPONSE: "Candidate response",
};

export default function AdminConsole() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(
    async (t: string) => {
      setError(null);
      try {
        const res = await fetch("/api/admin/approvals", {
          headers: { authorization: `Bearer ${t}` },
          cache: "no-store",
        });
        if (res.status === 401) {
          setError("That token was not accepted. Check ADMIN_TOKEN is set and at least 16 characters.");
          setAuthed(false);
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        setData((await res.json()) as Payload);
        setAuthed(true);
      } catch {
        setError("Could not reach the console API.");
      }
    },
    [],
  );

  useEffect(() => {
    if (!authed || !token) return;
    const id = setInterval(() => void load(token), 30_000);
    return () => clearInterval(id);
  }, [authed, token, load]);

  async function decide(id: string, decision: "APPROVED" | "REJECTED") {
    const note = decision === "REJECTED" ? (window.prompt("Why are you rejecting this?") ?? "") : "";
    setBusy(id);
    try {
      const res = await fetch("/api/admin/approvals", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, decision, note }),
      });
      const json = (await res.json()) as { executed?: string | null; error?: string };
      if (json.error) setError(json.error);
      else if (json.executed) setError(`Executed: ${json.executed}`);
      await load(token);
    } finally {
      setBusy(null);
    }
  }

  if (!authed) {
    return (
      <div className="gate">
        <h1 style={{ fontSize: "var(--step-2)" }}>Console</h1>
        <p style={{ fontSize: ".9rem" }}>
          Approval queue and pipeline. Not indexed, not linked from the public site.
        </p>
        {error && <div className="form-status form-status--err">{error}</div>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void load(token);
          }}
        >
          <div className="field">
            <label htmlFor="tok">Admin token</label>
            <input
              id="tok"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoComplete="off"
              placeholder="ADMIN_TOKEN"
            />
            <p className="hint" style={{ marginTop: ".5rem" }}>
              Generate one with <code>openssl rand -hex 32</code> and put it in{" "}
              <code>.env.local</code>.
            </p>
          </div>
          <button className="btn btn--primary" type="submit" style={{ width: "100%" }}>
            Open console
          </button>
        </form>
      </div>
    );
  }

  const s = data?.stats;

  return (
    <div className="admin-shell">
      <div className="admin-head">
        <h1>Console</h1>
        <span className="tag tag--accent">{s?.pendingApprovals ?? 0} awaiting decision</span>
      </div>

      {error && <div className="form-status form-status--ok">{error}</div>}

      <div className="kpi-row">
        <div className={`kpi${(s?.pendingApprovals ?? 0) > 0 ? " kpi--alert" : ""}`}>
          <div className="kpi__n">{s?.pendingApprovals ?? 0}</div>
          <div className="kpi__l">Awaiting approval</div>
        </div>
        <div className="kpi">
          <div className="kpi__n">{s?.leads ?? 0}</div>
          <div className="kpi__l">Leads</div>
        </div>
        <div className="kpi">
          <div className="kpi__n">{s?.conversations ?? 0}</div>
          <div className="kpi__l">Conversations</div>
        </div>
        <div className="kpi">
          <div className="kpi__n">{s?.emailsSent ?? 0}</div>
          <div className="kpi__l">Emails sent</div>
        </div>
        <div className={`kpi${(s?.openPrivacyRequests ?? 0) > 0 ? " kpi--alert" : ""}`}>
          <div className="kpi__n">{s?.openPrivacyRequests ?? 0}</div>
          <div className="kpi__l">Privacy requests · 30-day clock</div>
        </div>
      </div>

      {/* ---------------- APPROVAL QUEUE ---------------- */}
      <h2 style={{ fontSize: "var(--step-1)" }}>Approval queue</h2>
      <p style={{ fontSize: ".88rem", marginBottom: "1.5rem" }}>
        Nothing here has reached a customer. Approving records your decision against the audit trail;
        for outbound email it also sends, after the CASL consent check.
      </p>

      {data?.pending.length === 0 && (
        <div className="card">
          <p style={{ marginBottom: 0 }}>Nothing waiting. Every agent action has been decided.</p>
        </div>
      )}

      {data?.pending.map((a) => {
        let pretty = a.payloadJson;
        try {
          pretty = JSON.stringify(JSON.parse(a.payloadJson), null, 2);
        } catch {
          /* leave as-is */
        }

        return (
          <div className={`approval${HIGH_RISK.has(a.kind) ? " approval--risk" : ""}`} key={a.id}>
            <div style={{ display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap" }}>
              <span className={`tag ${HIGH_RISK.has(a.kind) ? "tag--amber" : "tag--accent"}`}>
                {KIND_LABEL[a.kind] ?? a.kind}
              </span>
              {a.lead && <span className="tag">{a.lead.stage}</span>}
            </div>

            <h3 style={{ marginTop: ".7rem" }}>{a.title}</h3>
            <p className="approval__meta">
              {new Date(a.createdAt).toLocaleString("en-CA")}
              {a.lead && ` · ${a.lead.name} <${a.lead.email}>${a.lead.company ? ` · ${a.lead.company}` : ""}`}
            </p>

            <p style={{ fontSize: ".9rem" }}>{a.summary}</p>

            {a.riskNote && <div className="approval__risk">⚠ {a.riskNote}</div>}

            <details>
              <summary style={{ cursor: "pointer", fontSize: ".85rem", fontWeight: 600 }}>
                Exact payload that would be sent
              </summary>
              <pre>{pretty}</pre>
            </details>

            <div className="approval__actions">
              <button
                className="btn btn--primary btn--sm"
                type="button"
                disabled={busy === a.id}
                onClick={() => void decide(a.id, "APPROVED")}
              >
                {busy === a.id ? "Working…" : "Approve"}
              </button>
              <button
                className="btn btn--ghost btn--sm"
                type="button"
                disabled={busy === a.id}
                onClick={() => void decide(a.id, "REJECTED")}
              >
                Reject
              </button>
            </div>
          </div>
        );
      })}

      {/* ---------------- PIPELINE ---------------- */}
      <h2 style={{ fontSize: "var(--step-1)", marginTop: "3rem" }}>Recent leads</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Received</th>
              <th scope="col">Who</th>
              <th scope="col">Stage</th>
              <th scope="col">Score</th>
              <th scope="col">Consent</th>
              <th scope="col">Enquiry</th>
            </tr>
          </thead>
          <tbody>
            {data?.leads.map((l) => (
              <tr key={l.id}>
                <td className="num">{new Date(l.createdAt).toLocaleDateString("en-CA")}</td>
                <td>
                  <strong>{l.name}</strong>
                  <br />
                  <span style={{ fontSize: ".82rem" }}>{l.email}</span>
                  {l.company && (
                    <>
                      <br />
                      <span style={{ fontSize: ".82rem" }}>{l.company}</span>
                    </>
                  )}
                </td>
                <td>
                  <span className="tag">{l.stage}</span>
                </td>
                <td className="num">{l.score}</td>
                <td style={{ fontSize: ".8rem" }}>
                  {l.consentContact ? "✓ contact" : "✗ contact"}
                  <br />
                  {l.consentMarketing ? "✓ marketing" : "— no marketing"}
                </td>
                <td style={{ fontSize: ".84rem", maxWidth: 320 }}>
                  {l.message ? `${l.message.slice(0, 160)}${l.message.length > 160 ? "…" : ""}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: ".8rem", color: "var(--text-3)", marginTop: "2rem" }}>
        Refreshes every 30 seconds. Personal information on this screen is subject to our privacy
        notice and the retention schedule in it — do not copy it into anywhere that is not covered.
      </p>
    </div>
  );
}
