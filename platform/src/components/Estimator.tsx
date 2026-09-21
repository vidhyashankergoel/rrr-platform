"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { services, retainers } from "@/lib/catalogue";
import { currencyFromDollars as money } from "@/lib/company";
import { computeTimeline, estimateCloud, type WorkloadSize } from "@/lib/costing";

export default function Estimator() {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [urgency, setUrgency] = useState(1);
  const [retainer, setRetainer] = useState(0);
  const [size, setSize] = useState<WorkloadSize>("medium");

  const chosen = useMemo(() => services.filter((s) => picked.has(s.id)), [picked]);

  const result = useMemo(() => {
    if (chosen.length === 0) return null;

    const low = Math.round(chosen.reduce((a, s) => a + s.priceLow, 0) * urgency);
    const high = Math.round(chosen.reduce((a, s) => a + s.priceHigh, 0) * urgency);

    // Weeks: the largest item runs at full length, the rest partially overlap.
    const weeks = chosen.map((s) => s.durationWeeks).sort((a, b) => b - a);
    const rawWeeks = (weeks[0] ?? 0) + weeks.slice(1).reduce((a, w) => a + w * 0.45, 0);

    const timeline = computeTimeline({
      totalHours: Math.round(rawWeeks * 30 * 2),
      teamSize: urgency > 1 ? 3 : 2,
      accelerated: urgency > 1,
    });

    const cloud = estimateCloud({
      provider: "aws",
      size,
      environments: 2,
      kubernetes: chosen.some((s) => s.category === "kubernetes"),
      managedDatabase: chosen.some((s) => s.category === "data"),
      observability: chosen.some((s) => s.category === "observability"),
      commitmentTermYears: 1,
    });

    return { low, high, timeline, cloud };
  }, [chosen, urgency, size]);

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="est">
      <div>
        <fieldset style={{ border: 0, padding: 0, margin: "0 0 1.5rem" }}>
          <legend style={{ fontWeight: 700, marginBottom: ".8rem" }}>What do you need?</legend>
          <div className="est__opts">
            {services.map((s) => (
              <label className="opt" key={s.id}>
                <input type="checkbox" checked={picked.has(s.id)} onChange={() => toggle(s.id)} />
                <span>
                  <span className="opt__name">{s.name}</span>
                  <span className="opt__meta">
                    {s.priceLow === s.priceHigh ? money(s.priceLow) : `${money(s.priceLow)} – ${money(s.priceHigh)}`} ·{" "}
                    {s.durationLabel}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-3" style={{ gap: "1rem" }}>
          <div className="field">
            <label htmlFor="est-urgency">Delivery pace</label>
            <select id="est-urgency" value={urgency} onChange={(e) => setUrgency(Number(e.target.value))}>
              <option value={1}>Standard</option>
              <option value={1.25}>Accelerated (+25%)</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="est-size">Workload scale</label>
            <select id="est-size" value={size} onChange={(e) => setSize(e.target.value as WorkloadSize)}>
              <option value="small">Small — a few services</option>
              <option value="medium">Medium — dozens of services</option>
              <option value="large">Large — hundreds of services</option>
              <option value="xlarge">Enterprise scale</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="est-retainer">Ongoing support</label>
            <select id="est-retainer" value={retainer} onChange={(e) => setRetainer(Number(e.target.value))}>
              <option value={0}>None</option>
              {retainers.map((r) => (
                <option key={r.key} value={r.price}>
                  {r.name} — {money(r.price)}/mo
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="est__out">
        <div className="card">
          {!result ? (
            <p style={{ margin: 0, color: "var(--text-3)" }}>
              Select one or more outcomes to see an indicative range.
            </p>
          ) : (
            <>
              <p style={{ fontSize: ".78rem", color: "var(--text-3)", margin: "0 0 .3rem", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>
                Our fees
              </p>
              <div className="est__total">
                {money(result.low)} – {money(result.high)}
              </div>
              <p style={{ fontSize: ".8rem", color: "var(--text-3)", margin: ".3rem 0 1rem" }}>
                CAD, excluding applicable GST/HST
              </p>

              {chosen.map((s) => (
                <div className="est__line" key={s.id}>
                  <span>{s.name}</span>
                  <span>
                    {money(Math.round(s.priceLow * urgency))}–{money(Math.round(s.priceHigh * urgency))}
                  </span>
                </div>
              ))}

              <div className="est__line">
                <span><strong>Indicative timeline</strong></span>
                <span>{result.timeline.elapsedWeeks} weeks</span>
              </div>

              {retainer > 0 && (
                <div className="est__line">
                  <span><strong>Ongoing support</strong></span>
                  <span>{money(retainer)} / month</span>
                </div>
              )}

              <div
                style={{
                  marginTop: "1.25rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid var(--line)",
                }}
              >
                <p style={{ fontSize: ".78rem", color: "var(--text-3)", margin: "0 0 .4rem", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>
                  Your cloud bill, separately
                </p>
                <div className="est__line" style={{ borderBottom: 0 }}>
                  <span>Estimated run-rate</span>
                  <span>
                    {money(result.cloud.monthlyLow)}–{money(result.cloud.monthlyHigh)} / mo
                  </span>
                </div>
                <p style={{ fontSize: ".74rem", color: "var(--text-3)", margin: ".4rem 0 0" }}>
                  Paid directly to your cloud provider, not to us. Assumes a one-year commitment on
                  steady-state compute.
                </p>
              </div>

              <Link
                className="btn btn--primary btn--sm"
                style={{ width: "100%", marginTop: "1.2rem" }}
                href={`/contact?est=${encodeURIComponent([...picked].join(","))}`}
              >
                Get a firm quote
              </Link>

              <p style={{ fontSize: ".74rem", color: "var(--text-3)", margin: ".9rem 0 0" }}>
                Indicative only. A firm fixed price follows a free 30-minute scoping call. This is not a
                quote and not an offer capable of acceptance.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
