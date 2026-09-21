"use client";

/**
 * Book a 30-minute scoping call.
 *
 * Three steps: pick a time, give us enough to call you, then take the calendar
 * entry away with you. The third step is the one that matters — a booking the
 * visitor cannot see in their own diary is a booking they will miss.
 *
 * WHY NOT CALENDLY
 * ----------------
 * A third-party scheduler would show real availability, but it also ships the
 * visitor's name and email to another processor, which is a PIPEDA disclosure
 * we would have to declare and a vendor a bank's procurement team would ask
 * about. This keeps the data here. The trade is that we cannot see live
 * availability, so the flow says "requested" and a person confirms.
 *
 * Accessibility: role="dialog" with aria-modal, labelled heading, Escape
 * closes, focus moves in on open and back to the opener on close, every slot
 * is a real button, and the whole thing is operable from the keyboard.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { company } from "@/lib/company";
import { BOOKABLE_HOURS, PLATFORM_LABEL, type Day, type Platform } from "@/lib/booking";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Prefills the agenda box — e.g. when opened from the audit offer. */
  topic?: string;
  sessionId?: string;
}

interface Confirmation {
  when: string;
  icsUrl: string;
  googleUrl: string;
  outlookUrl: string;
}

const PLATFORMS: Platform[] = ["GOOGLE_MEET", "MS_TEAMS", "PHONE"];

export default function BookingDialog({ open, onClose, topic, sessionId }: Props) {
  const [days, setDays] = useState<Day[] | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform>("EITHER");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Confirmation | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Load availability the first time the dialog is opened, not on page load —
  // most visitors never open it and the response is uncacheable.
  useEffect(() => {
    if (!open || days) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/bookings");
        const json = (await res.json()) as { days?: Day[] };
        if (!cancelled) setDays(json.days ?? []);
      } catch {
        if (!cancelled) setError("Could not load available times. Please try again, or call us.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, days]);

  useEffect(() => {
    if (open) setTimeout(() => headingRef.current?.focus(), 60);
  }, [open]);

  const reset = useCallback(() => {
    setSlot(null);
    setError(null);
    setDone(null);
    setDayIndex(0);
  }, []);

  const close = useCallback(() => {
    onClose();
    // Always clear. Keeping a finished booking on screen means reopening the
    // dialog to book a *second* call lands on the old confirmation with no
    // obvious way back. The calendar links are also in the acknowledgement
    // email, so closing here loses nothing.
    reset();
  }, [onClose, reset]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
      if (e.key !== "Tab") return;
      // Keep Tab inside the dialog — otherwise focus wanders behind the
      // overlay onto controls the visitor cannot see.
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, close]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!slot) return;

    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          company: String(fd.get("company") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          topic: String(fd.get("topic") ?? ""),
          website: String(fd.get("website") ?? ""),
          startsAt: slot,
          platform,
          consentContact: fd.get("consentContact") === "on",
          sessionId,
          sourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });

      const json = (await res.json()) as Confirmation & { ok?: boolean; error?: string };

      if (json.ok) {
        setDone({
          when: json.when,
          icsUrl: json.icsUrl,
          googleUrl: json.googleUrl,
          outlookUrl: json.outlookUrl,
        });
      } else {
        setError(json.error ?? "Something went wrong. Please try again.");
        // A taken or expired slot means our list is stale — refetch it.
        if (res.status === 409) {
          setSlot(null);
          setDays(null);
        }
      }
    } catch {
      setError(`Could not reach the server. Please email ${company.email} or call ${company.phone}.`);
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  const day = days?.[dayIndex];

  return (
    <div className="bk-overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div
        className="bk"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bkTitle"
      >
        <button className="bk__x" type="button" onClick={close} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {done ? (
          // ---- Step 3: the calendar entry ------------------------------------
          <div className="bk__done">
            <div className="bk__tick" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 13 4 4L19 7" />
              </svg>
            </div>
            <h2 id="bkTitle" tabIndex={-1} ref={headingRef}>
              Time requested
            </h2>
            <p className="bk__when">{done.when}</p>
            <p>
              This is a request, not yet a confirmation — we do not pretend to know our own diary
              from a web form. A person confirms it and sends the joining link, usually within one
              business day.
            </p>
            <p className="bk__sub">Put it in your calendar now so it is not forgotten:</p>
            <div className="bk__cal">
              <a className="btn btn--primary btn--sm" href={done.googleUrl} target="_blank" rel="noopener noreferrer">
                Google Calendar
              </a>
              <a className="btn btn--ghost btn--sm" href={done.outlookUrl} target="_blank" rel="noopener noreferrer">
                Outlook / Teams
              </a>
              <a className="btn btn--ghost btn--sm" href={done.icsUrl} download>
                Download .ics
              </a>
            </div>
            <p className="bk__fine">
              Outlook creates the Teams meeting when you add it; we send the Meet link with the
              confirmation if you chose Google. Need to move it? Reply to the email you just
              received, or call {company.phone}.
            </p>
            <button className="btn btn--ghost btn--sm" type="button" onClick={() => { reset(); onClose(); }}>
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 id="bkTitle" tabIndex={-1} ref={headingRef}>
              Book a 30-minute call
            </h2>
            <p className="bk__lede">
              No pitch. We ask what is breaking, tell you what it would take to fix, and say so if we
              are not the right people. {BOOKABLE_HOURS}.
            </p>

            {/* ---- Step 1: pick a time ------------------------------------ */}
            {!days && !error && <p className="bk__loading">Loading available times…</p>}

            {days && days.length === 0 && (
              <p className="bk__loading">
                No times are open in the next two weeks. Email {company.email} and we will find one.
              </p>
            )}

            {days && days.length > 0 && (
              <>
                <div className="bk__days" role="tablist" aria-label="Choose a day">
                  {days.map((d, i) => (
                    <button
                      key={d.date}
                      type="button"
                      role="tab"
                      aria-selected={i === dayIndex}
                      className={`bk__day${i === dayIndex ? " is-on" : ""}`}
                      onClick={() => {
                        setDayIndex(i);
                        setSlot(null);
                      }}
                    >
                      {d.label}
                      <em>{d.slots.length} free</em>
                    </button>
                  ))}
                </div>

                <div className="bk__slots" role="group" aria-label={`Times on ${day?.label ?? ""}`}>
                  {day?.slots.map((s) => (
                    <button
                      key={s.startsAt}
                      type="button"
                      className={`bk__slot${slot === s.startsAt ? " is-on" : ""}`}
                      aria-pressed={slot === s.startsAt}
                      onClick={() => setSlot(s.startsAt)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="bk__tz">Times shown in Toronto time (ET).</p>
              </>
            )}

            {/* ---- Step 2: who is coming ---------------------------------- */}
            {slot && (
              <form className="bk__form" onSubmit={submit}>
                <div className="bk__grid">
                  <label>
                    <span>Your name</span>
                    <input name="name" type="text" required minLength={2} autoComplete="name" />
                  </label>
                  <label>
                    <span>Work email</span>
                    <input name="email" type="email" required autoComplete="email" />
                  </label>
                  <label>
                    <span>Company</span>
                    <input name="company" type="text" autoComplete="organization" />
                  </label>
                  <label>
                    <span>Phone (optional)</span>
                    <input name="phone" type="tel" autoComplete="tel" />
                  </label>
                </div>

                <fieldset className="bk__platform">
                  <legend>How would you like to meet?</legend>
                  {PLATFORMS.map((p) => (
                    <label key={p}>
                      <input
                        type="radio"
                        name="platform"
                        value={p}
                        checked={platform === p}
                        onChange={() => setPlatform(p)}
                      />
                      <span>{PLATFORM_LABEL[p]}</span>
                    </label>
                  ))}
                  <label>
                    <input
                      type="radio"
                      name="platform"
                      value="EITHER"
                      checked={platform === "EITHER"}
                      onChange={() => setPlatform("EITHER")}
                    />
                    <span>{PLATFORM_LABEL.EITHER}</span>
                  </label>
                </fieldset>

                <label className="bk__topic">
                  <span>What should we cover? (optional, but it makes the call better)</span>
                  <textarea
                    name="topic"
                    rows={3}
                    defaultValue={topic ?? ""}
                    placeholder="e.g. we are on 40 EC2 instances with no IaC and our deploys take a day"
                  />
                </label>

                {/* Honeypot. `.visually-hidden` also clamps the input's own box
                    so it cannot push a narrow layout sideways while invisible. */}
                <div className="visually-hidden" aria-hidden="true">
                  <label htmlFor="bkWebsite">Leave this empty</label>
                  <input id="bkWebsite" name="website" type="text" tabIndex={-1} autoComplete="off" />
                </div>

                <label className="bk__consent">
                  <input name="consentContact" type="checkbox" required />
                  <span>
                    {company.legalName} may use these details to arrange and hold this call. Not
                    sold, not shared, deleted on request. See our{" "}
                    <a href="/legal/privacy">privacy notice</a>.
                  </span>
                </label>

                {error && (
                  <p className="bk__error" role="alert">
                    {error}
                  </p>
                )}

                <button className="btn btn--primary" type="submit" disabled={busy}>
                  {busy ? "Requesting…" : "Request this time"}
                </button>
              </form>
            )}

            {error && !slot && (
              <p className="bk__error" role="alert">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
