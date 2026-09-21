import Link from "next/link";
import { services } from "@/lib/catalogue";
import { currencyFromDollars as money } from "@/lib/company";

/**
 * THREE PILLARS
 *
 * Sixteen services is the right level of detail for a buyer who already knows
 * what they want, and far too much for a first-time visitor. This collapses
 * the catalogue into the three things a prospect is actually choosing between,
 * and links each one down to the detail.
 */

const PILLARS = [
  {
    key: "build",
    verb: "We build",
    title: "Platforms from scratch",
    body: "A cloud foundation, a Kubernetes platform, a pipeline, an observability stack — designed, built and handed to your team as reviewable code.",
    serviceIds: ["landing-zone", "k8s-platform", "cicd", "observability", "gitops", "service-mesh"],
    icon: (
      <>
        <path d="M3 21h18" />
        <path d="M5 21V8l7-5 7 5v13" />
        <path d="M9 21v-6h6v6" />
      </>
    ),
  },
  {
    key: "move",
    verb: "We move",
    title: "Estates onto the cloud",
    body: "On-premises to cloud, cloud to cloud, or database to managed service — in rehearsed waves with a rollback that has been tested, not assumed.",
    serviceIds: ["migration", "databases", "data-platform", "iac-retrofit", "iac", "mlops"],
    icon: (
      <>
        <path d="M5 9V5h4M19 15v4h-4" />
        <path d="m5 5 6 6M19 19l-6-6" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
      </>
    ),
  },
  {
    key: "operate",
    verb: "We operate",
    title: "What is already running",
    body: "Reliability, security and cost. SLOs that mean something, controls enforced in the pipeline, and a bill you can explain line by line.",
    serviceIds: ["sre", "security", "finops", "apm"],
    icon: (
      <>
        <path d="M12 2.6 20 6v6.2c0 4.6-3.3 7.9-8 9.2-4.7-1.3-8-4.6-8-9.2V6z" />
        <path d="m8.8 12 2.2 2.2 4.2-4.4" />
      </>
    ),
  },
];

export default function Pillars() {
  return (
    <div className="pillars">
      {PILLARS.map((p) => {
        const matched = services.filter((s) => p.serviceIds.includes(s.id));
        const cheapest = Math.min(...matched.map((s) => s.priceLow));
        const fastest = Math.min(...matched.map((s) => s.durationWeeks));

        return (
          <article className="pillar" key={p.key}>
            <div className="pillar__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                {p.icon}
              </svg>
            </div>

            <p className="pillar__verb">{p.verb}</p>
            <h3>{p.title}</h3>
            <p className="pillar__body">{p.body}</p>

            <ul className="pillar__list">
              {matched.slice(0, 4).map((s) => (
                <li key={s.id}>
                  <Link href={`/services#${s.id}`}>{s.name.split("—")[0]!.trim()}</Link>
                </li>
              ))}
              {matched.length > 4 && (
                <li className="pillar__more">
                  <Link href="/services">+{matched.length - 4} more</Link>
                </li>
              )}
            </ul>

            <div className="pillar__foot">
              <span>
                <strong>from {money(cheapest)}</strong>
                <em>CAD, excl. tax</em>
              </span>
              <span>
                <strong>from {fastest} weeks</strong>
                <em>typical</em>
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
