"use client";

import { useEffect, useRef, useState } from "react";

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
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || done.current) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      setValue(to);
      done.current = true;
      return;
    }

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
