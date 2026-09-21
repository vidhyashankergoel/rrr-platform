"use client";

/**
 * "Book a free call" buttons, anywhere on the site.
 *
 * PROGRESSIVE ENHANCEMENT
 * -----------------------
 * This renders a real anchor to /contact. With JavaScript alive we intercept
 * the click and open the booking dialog; without it, the link still goes to a
 * page with a working form. A button that only works when a script loads is
 * the bug class that produced "the Ada button is not working" — a dead chunk
 * meant a dead control with no fallback. An anchor cannot fail that way.
 *
 * The dialog itself lives in <Assistant>, mounted once in the layout. These
 * buttons ask for it over a window event rather than each dragging in their
 * own copy of the dialog, its state and its availability fetch.
 */

import type { ReactNode } from "react";

export const BOOK_EVENT = "rrr:book-call";

/** Open the booking dialog from anywhere, including non-React code. */
export function openBooking(topic?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(BOOK_EVENT, { detail: { topic } }));
}

interface Props {
  children: ReactNode;
  className?: string;
  /** Prefills the agenda box — e.g. "The infrastructure audit". */
  topic?: string;
  /** Where the link goes when JavaScript has not loaded. */
  fallbackHref?: string;
}

export default function BookCallButton({
  children,
  className = "btn btn--primary",
  topic,
  fallbackHref = "/contact",
}: Props) {
  return (
    <a
      className={className}
      href={fallbackHref}
      onClick={(e) => {
        // Let modified clicks (new tab, new window) behave normally.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        openBooking(topic);
      }}
    >
      {children}
    </a>
  );
}
