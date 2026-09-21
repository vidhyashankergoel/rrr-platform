"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { services } from "@/lib/catalogue";
import { company } from "@/lib/company";

type Status = { kind: "ok" | "err"; text: string } | null;

export default function ContactForm() {
  const params = useSearchParams();
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  // Prefill from the estimator, a retainer card, or a service link.
  useEffect(() => {
    const parts: string[] = [];

    const est = params.get("est");
    if (est) {
      const ids = est.split(",").filter(Boolean);
      setPicked(ids);
      const names = services.filter((s) => ids.includes(s.id)).map((s) => `• ${s.name}`);
      if (names.length) parts.push(`Scope selected in the estimator:\n${names.join("\n")}`);
    }

    const plan = params.get("plan");
    if (plan) parts.push(`Interested in the ${plan} retainer.`);

    const service = params.get("service");
    if (service) parts.push(`Enquiry about: ${service}`);

    if (parts.length) setMessage(parts.join("\n\n") + "\n\n");
  }, [params]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;

    setBusy(true);
    setStatus(null);

    const fd = new FormData(form);
    const payload: Record<string, unknown> = Object.fromEntries(fd.entries());
    payload.consentContact = fd.get("consentContact") === "on";
    payload.consentMarketing = fd.get("consentMarketing") === "on";
    payload.serviceIds = picked.join(",");
    payload.sourceUrl = window.location.href;
    try {
      payload.sessionId = sessionStorage.getItem("np-session") ?? undefined;
    } catch {
      /* private browsing */
    }

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; error?: string };

      if (res.ok && data.ok) {
        form.reset();
        setMessage("");
        setPicked([]);
        setStatus({ kind: "ok", text: data.message ?? "Thank you — we will be in touch." });
      } else {
        setStatus({
          kind: "err",
          text: data.error ?? `Something went wrong. Please email ${company.email} directly.`,
        });
      }
    } catch {
      setStatus({
        kind: "err",
        text: `Could not reach the server. Please email ${company.email} or call ${company.phone}.`,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate={false}>
      {status && (
        <div className={`form-status form-status--${status.kind}`} role="status">
          {status.text}
        </div>
      )}

      <div className="form-grid">
        <div className="field">
          <label htmlFor="cf-name">
            Your name <span aria-hidden="true">*</span>
          </label>
          <input id="cf-name" name="name" type="text" required minLength={2} autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="cf-email">
            Work email <span aria-hidden="true">*</span>
          </label>
          <input id="cf-email" name="email" type="email" required autoComplete="email" />
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="cf-company">Company</label>
          <input id="cf-company" name="company" type="text" autoComplete="organization" />
        </div>
        <div className="field">
          <label htmlFor="cf-phone">
            Phone <span className="hint">— optional</span>
          </label>
          <input id="cf-phone" name="phone" type="tel" autoComplete="tel" />
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="cf-budget">Budget envelope</label>
          <select id="cf-budget" name="budgetBand" defaultValue="">
            <option value="">Prefer not to say</option>
            <option value="under-25k">Under $25,000</option>
            <option value="25-75k">$25,000 – $75,000</option>
            <option value="75-150k">$75,000 – $150,000</option>
            <option value="150k-plus">$150,000+</option>
            <option value="unsure">Trying to find out what it should cost</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="cf-timeline">Timeline</label>
          <select id="cf-timeline" name="timeline" defaultValue="">
            <option value="">Not sure yet</option>
            <option value="immediate">Immediate — something is on fire</option>
            <option value="1-3-months">Next 1–3 months</option>
            <option value="3-6-months">3–6 months</option>
            <option value="exploring">Exploring, no date</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="cf-message">
          What are you trying to solve? <span aria-hidden="true">*</span>
          <span className="hint"> — what is running today, and what is going wrong, is the most useful thing you can tell us</span>
        </label>
        <textarea
          id="cf-message"
          name="message"
          required
          minLength={10}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {/* Honeypot — visually hidden, ignored by real users. */}
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="cf-website">Leave this field empty</label>
        <input id="cf-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {/*
        PIPEDA Principle 3 (Consent) and CASL s.6(1).
        Both boxes ship UNTICKED. A pre-ticked box is not consent, and CASL
        s.13 puts the burden of proving consent on the sender.
      */}
      <div className="field field--check">
        <input id="cf-consent" name="consentContact" type="checkbox" required />
        <label htmlFor="cf-consent">
          <strong>Required.</strong> I agree that {company.legalName} may use the details above to respond
          to this enquiry. It will not be sold or shared with third parties for marketing, and I can ask
          for it to be deleted at any time.
        </label>
      </div>

      <div className="field field--check">
        <input id="cf-marketing" name="consentMarketing" type="checkbox" />
        <label htmlFor="cf-marketing">
          <strong>Optional.</strong> I would also like occasional emails about platform engineering
          practice and new services. I can unsubscribe from any message, and doing so will not affect my
          enquiry.
        </label>
      </div>

      <button className="btn btn--primary" type="submit" disabled={busy}>
        {busy ? "Sending…" : "Send enquiry"}
      </button>

      <p className="form-note">
        We reply within one business day. If it is urgent, call{" "}
        <a href={`tel:${company.phoneHref}`}>{company.phone}</a>. We will never ask you for banking
        details, card numbers or passwords — by email, by phone, or in chat.
      </p>
    </form>
  );
}
