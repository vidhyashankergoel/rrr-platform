"use client";

/**
 * Floating, dynamic page furniture.
 *
 *  • ScrollProgress — a thin reading-progress bar under the header
 *  • BackToTop      — appears after the first viewport, returns to the top
 *  • Reveal         — fades sections in as they enter view
 *
 * All three respect prefers-reduced-motion, and all three degrade to nothing
 * rather than to something broken when JavaScript is unavailable.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export function ScrollProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      setPct(scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="scroll-progress" aria-hidden="true">
      <div className="scroll-progress__bar" style={{ transform: `scaleX(${pct / 100})` }} />
    </div>
  );
}

export function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.9);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toTop = useCallback(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    // Move focus to the top of the document so keyboard and screen-reader
    // users land where the page visually lands. `preventScroll` matters:
    // without it the browser scrolls the focused element into view and
    // fights the smooth scroll that is still in flight, leaving the page
    // stranded part-way up.
    document.querySelector<HTMLElement>(".skip-link")?.focus({ preventScroll: true });
  }, []);

  return (
    <button
      type="button"
      className={`to-top${show ? " is-visible" : ""}`}
      onClick={toTop}
      aria-label="Back to top"
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}

/**
 * Fades a block in as it scrolls into view. Renders its children immediately
 * when motion is reduced or IntersectionObserver is unavailable, so content is
 * never hidden by a failed animation.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  as?: "div" | "section" | "article" | "li";
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={`reveal${shown ? " is-in" : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
