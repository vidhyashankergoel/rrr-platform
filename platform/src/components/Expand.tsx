"use client";

/**
 * PROGRESSIVE DISCLOSURE
 *
 * The homepage was 22.9 screens on a 375px phone and just under 2,000 words.
 * Nobody scrolls that, and a reader who gives up at screen six never reaches
 * the pricing. The content is good — the problem is that all of it was open
 * at once.
 *
 * Two patterns, chosen for different jobs:
 *
 *  • `Disclosure` wraps a list behind a summary line. It is built on native
 *    <details>/<summary>, so it opens with no JavaScript, is keyboard and
 *    screen-reader correct without any work from us, and survives a failed
 *    hydration. A React re-implementation of this would be strictly worse.
 *
 *  • `CaseCard` is a dialog, because a full case study is too much to inline
 *    and a reader opening one has made a deliberate choice to go deeper.
 *
 * The rule for both: the summary must carry enough to be useful on its own.
 * Hiding the only copy of something behind a click does not shorten a page,
 * it just makes the page lie about its length.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CaseStudy } from "@/lib/catalogue";
import { displayClient, attributionLine } from "@/lib/attribution";

// ---------------------------------------------------------------------------
//  Disclosure — native, no JavaScript required
// ---------------------------------------------------------------------------

export function Disclosure({
  summary,
  count,
  children,
  open = false,
  tone,
}: {
  summary: string;
  /** Shown next to the summary so the reader knows what the click costs. */
  count?: number;
  children: React.ReactNode;
  open?: boolean;
  tone?: "accent" | "amber";
}) {
  return (
    <details className={`disc${tone ? ` disc--${tone}` : ""}`} open={open}>
      <summary className="disc__sum">
        <span className="disc__title">{summary}</span>
        {count !== undefined && <span className="disc__count">{count}</span>}
        <svg
          className="disc__chev"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="disc__body">{children}</div>
    </details>
  );
}

// ---------------------------------------------------------------------------
//  CaseCard — compact card, full study in a dialog
// ---------------------------------------------------------------------------

export function CaseCard({ study }: { study: CaseStudy }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // The dialog is portalled to document.body rather than rendered in place.
  //
  // In place it is a sibling of the card, which puts it inside the
  // <RevealGroup> wrapper — and `.reveal-group > *` sets opacity: 0 on its
  // children. The dialog opened, locked the page and took hit-tests while
  // being completely invisible, which is the worst version of broken: the
  // page appears frozen and nothing explains why.
  //
  // The portal also removes a second latent bug. An ancestor with a transform
  // becomes the containing block for position: fixed descendants, so a modal
  // nested inside an animated wrapper is positioned against that wrapper
  // rather than the viewport.
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Lock the page behind the dialog. Without this the background scrolls
    // under the overlay on touch, which on a phone reads as the page being
    // broken rather than as a dialog being open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        return;
      }
      if (e.key !== "Tab") return;

      // Keep Tab inside the dialog, or focus wanders into the page behind it
      // and the reader is tabbing through a document they cannot see.
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    // Focus the dialog itself rather than its first link, so a screen reader
    // announces the heading before the reader is dropped into the controls.
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      // Return focus to the card that opened it, not to the top of the page.
      (previouslyFocused ?? openerRef.current)?.focus?.();
    };
  }, [open, close]);

  const client = displayClient(study);
  const headline = study.results[0];
  const titleId = `case-${study.slug}`;

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        className="case-card card card--hover"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <span className="tags">
          <span className="tag tag--accent">{study.sector}</span>
          <span className="tag">{study.period}</span>
        </span>

        <span className="case-card__client">{client}</span>
        <span className="case-card__headline">{study.headline}</span>

        {headline && (
          <span className="case-card__metric">
            <span className="case-card__metric-n">{headline[0]}</span>
            <span className="case-card__metric-l">{headline[1]}</span>
          </span>
        )}

        <span className="case-card__more">
          Read the full study
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </button>

      {open &&
        mounted &&
        createPortal(
        <div
          className="bk-overlay"
          onMouseDown={(e) => e.target === e.currentTarget && close()}
        >
          <div
            className="bk case-dlg"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
          >
            <button className="bk__x" type="button" onClick={close} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="tags" style={{ marginBottom: ".75rem" }}>
              <span className="tag tag--accent">{study.sector}</span>
              <span className="tag">{study.period}</span>
            </div>

            <p className="case-dlg__client">{client}</p>
            <h3 id={titleId} className="case-dlg__headline">{study.headline}</h3>

            <p className="case-dlg__label">The situation</p>
            <p className="case-dlg__problem">{study.problem}</p>

            <p className="case-dlg__label">What we did</p>
            <ul className="check-list">
              {study.work.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>

            <p className="case-dlg__label">Result</p>
            <div className="case-dlg__results">
              {study.results.map(([v, l]) => (
                <div key={l}>
                  <div className="stat__num">{v}</div>
                  <div className="stat__label">{l}</div>
                </div>
              ))}
            </div>

            <div className="tags" style={{ marginTop: "1.25rem" }}>
              {study.stack.map((t) => (
                <span className="tag" key={t}>{t}</span>
              ))}
            </div>

            <p className="case-dlg__attr">{attributionLine(study)}.</p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
