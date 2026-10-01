"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * A number that counts up when it scrolls into view.
 *
 * IT STARTS AT ITS FINAL VALUE, NOT AT ZERO, and that is the whole point.
 *
 * The first version initialised to 0. That meant the server rendered "0.0%"
 * and the figure only became true once JavaScript had hydrated and the element
 * had been scrolled into view. A QA pass caught the result on the homepage:
 *
 *     0.0% uptime sustained
 *
 * which does not read as "loading", it reads as a company advertising that
 * nothing it builds has ever stayed up. With JavaScript disabled or broken it
 * said that permanently, and it is what a crawler or a link-preview renderer
 * would have seen too.
 *
 * So the server-rendered, no-JavaScript, pre-hydration value is now the real
 * one. The animation is an enhancement layered on top: on mount — in a layout
 * effect, before the browser paints, so there is no flash of the final number
 * dropping back to zero — the value resets to 0 and waits for the element to
 * come into view.
 *
 * Under prefers-reduced-motion it simply never resets, and the number is just
 * correct from the first paint.
 */

// useLayoutEffect warns when it runs during server rendering, where there is
// no layout to read. This is the standard isomorphic guard: the layout timing
// is what prevents the flash, and on the server the effect does not run at all.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function Counter({
  to,
  decimals = 0,
  suffix = "",
  prefix = "",
}: {
  to: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
}) {
  const [value, setValue] = useState(to);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  // Before first paint: decide whether this will animate, and if so drop to
  // zero now. After this point the component behaves as it always did.
  const willAnimate = useRef(false);
  useIsomorphicLayoutEffect(() => {
    if (done.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      done.current = true;
      return;
    }
    willAnimate.current = true;
    setValue(0);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || done.current || !willAnimate.current) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || done.current) continue;
          done.current = true;
          io.disconnect();

          const start = performance.now();
          const duration = 1400;
          const step = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            setValue(to * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(step);
            // Land exactly on the target. Easing to p === 1 is exact in theory
            // and subject to float error in practice, and "99.9%" rendering as
            // "99.8%" would be a worse bug than the one this replaced.
            else setValue(to);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [to]);

  return (
    <span ref={ref}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
