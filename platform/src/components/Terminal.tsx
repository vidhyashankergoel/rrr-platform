"use client";

import { useEffect, useRef, useState } from "react";

const LINES: Array<[string, string]> = [
  ["c-mut", "# provision the platform, not the ticket"],
  ["c-cmd", "$ terraform apply -var-file=env/prod.tfvars"],
  ["c-ok", "Apply complete. 148 added, 0 changed, 0 destroyed."],
  ["c-cmd", "$ kubectl get nodes -o wide"],
  ["c-key", "NAME             STATUS   ROLES    VERSION"],
  ["c-mut", "ip-10-0-2-41     Ready    worker   v1.31.4"],
  ["c-mut", "ip-10-0-3-17     Ready    worker   v1.31.4"],
  ["c-mut", "ip-10-0-4-88     Ready    worker   v1.31.4"],
  ["c-cmd", "$ argocd app list"],
  ["c-ok", "payments        Synced   Healthy   canary 25%"],
  ["c-ok", "checkout        Synced   Healthy   stable"],
  ["c-ok", "observability   Synced   Healthy   stable"],
  ["c-cmd", "$ promtool check slo --burn-rate"],
  ["c-ok", "SLO 99.9% · budget 96.2% left · no alerts firing"],
  ["c-mut", "# zero downtime. every change reviewed in git."],
];

export default function Terminal() {
  const [shown, setShown] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(LINES.length);
      return;
    }
    let cancelled = false;
    let i = 0;
    const tick = () => {
      if (cancelled || i >= LINES.length) return;
      i += 1;
      setShown(i);
      setTimeout(tick, 90 + Math.random() * 170);
    };
    const start = setTimeout(tick, 350);
    return () => {
      cancelled = true;
      clearTimeout(start);
    };
  }, []);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [shown]);

  return (
    <div className="term" aria-hidden="true">
      <div className="term__bar">
        <i /><i /><i />
        <span>~/platform · prod</span>
      </div>
      <div className="term__body" ref={bodyRef}>
        {LINES.slice(0, shown).map(([cls, text], i) => (
          <div key={i} className={cls}>
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}
