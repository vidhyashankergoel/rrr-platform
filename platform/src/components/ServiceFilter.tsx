"use client";

import { useMemo, useState } from "react";
import { services } from "@/lib/catalogue";
import { ServiceCard } from "./Bits";

const FILTERS = [
  { key: "all", label: "Everything" },
  { key: "cloud", label: "Cloud" },
  { key: "kubernetes", label: "Kubernetes" },
  { key: "iac", label: "Infrastructure as code" },
  { key: "cicd", label: "CI/CD & GitOps" },
  { key: "observability", label: "Observability & SRE" },
  { key: "data", label: "Data & databases" },
  { key: "security", label: "Security" },
  { key: "short", label: "Short (2–8 weeks)" },
  { key: "long", label: "Long (2–5 months)" },
];

export default function ServiceFilter() {
  const [active, setActive] = useState("all");

  const shown = useMemo(
    () =>
      services.filter(
        (s) => active === "all" || s.category === active || s.term === active,
      ),
    [active],
  );

  return (
    <>
      <div className="chips" role="group" aria-label="Filter services">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className="chip"
            aria-pressed={active === f.key}
            onClick={() => setActive(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="visually-hidden" role="status">
        {shown.length} {shown.length === 1 ? "service" : "services"} shown.
      </p>

      <div className="grid grid-3">
        {shown.map((s) => (
          <ServiceCard key={s.id} service={s} />
        ))}
      </div>
    </>
  );
}
