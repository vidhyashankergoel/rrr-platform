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

/**
 * Lights a soft highlight under the cursor on every hoverable card.
 *
 * One delegated listener on the document rather than a listener per card:
 * the homepage alone has a dozen of them, and the pattern scales to pages
 * that render a list of fifty. Writes are throttled to one per animation
 * frame, because pointermove fires far faster than the screen refreshes and
 * setting a custom property on every event is how a hover effect turns into
 * a janky one.
 *
 * Does nothing when motion is reduced. The CSS falls back to a centred sheen,
 * so the card still responds to hover — just without following the pointer.
 */
export function CardGlow() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let pending: { el: HTMLElement; x: number; y: number } | null = null;

    const flush = () => {
      frame = 0;
      if (!pending) return;
      const { el, x, y } = pending;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
      pending = null;
    };

    const onMove = (e: PointerEvent) => {
      const card = (e.target as Element | null)?.closest<HTMLElement>(".card--hover");
      if (!card) return;
      const r = card.getBoundingClientRect();
      pending = { el: card, x: e.clientX - r.left, y: e.clientY - r.top };
      if (!frame) frame = requestAnimationFrame(flush);
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}

/**
 * Reveals its children one after another instead of all at once.
 *
 * The stagger lives in CSS (`.reveal-group`) rather than in inline styles, so
 * a list of any length is handled by one rule and the delay is capped — a
 * fortieth card arriving three seconds late is not an animation, it is a wait.
 */
export function RevealGroup({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
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
      { threshold: 0.05, rootMargin: "0px 0px -50px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal-group${shown ? " is-in" : ""} ${className}`.trim()}>
      {children}
    </div>
  );
}

/**
 * A continuously scrolling band of the stack we actually work in.
 *
 * The track is rendered twice and the keyframe translates it by exactly half
 * its width, which is what makes the loop seamless rather than snapping. The
 * second copy is aria-hidden: it is the same list, and a screen reader
 * announcing every technology twice is worse than not announcing the band.
 *
 * Pauses on hover so a reader who wants to actually read it can.
 */
export function Marquee({ items }: { items: readonly string[] }) {
  return (
    <div className="marquee" role="region" aria-label="Technologies we work with">
      <div className="marquee__track">
        {[0, 1].map((copy) => (
          <div
            key={copy}
            style={{ display: "flex", gap: "var(--sp-6)" }}
            aria-hidden={copy === 1 ? true : undefined}
          >
            {items.map((item) => (
              <span className="marquee__item" key={`${copy}-${item}`}>
                {item}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
