import Link from "next/link";
import type { Service } from "@/lib/catalogue";
import { currencyFromDollars as money } from "@/lib/company";
import BookCallButton from "./BookCall";

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}

export function PageHead({
  title,
  lede,
  crumb,
}: {
  title: string;
  lede: string;
  crumb: string;
}) {
  return (
    <section className="page-head">
      <div className="wrap">
        <p className="crumbs">
          <Link href="/">Home</Link> &nbsp;/&nbsp; {crumb}
        </p>
        <h1>{title}</h1>
        <p>{lede}</p>
      </div>
    </section>
  );
}

const ICONS: Record<string, React.ReactNode> = {
  cloud: <><path d="M18 10h-1.3A5 5 0 1 0 7 12.1" /><path d="M18 10a4 4 0 0 1 0 8H7a4 4 0 0 1-.6-7.9" /></>,
  move: <><path d="M5 9V5h4M19 15v4h-4" /><path d="m5 5 6 6M19 19l-6-6" /><rect x="3" y="13" width="8" height="8" rx="1.5" /></>,
  k8s: <><path d="M12 2.6 20 7v10l-8 4.4L4 17V7z" /><circle cx="12" cy="12" r="2.6" /></>,
  mesh: <><circle cx="12" cy="4.5" r="2" /><circle cx="4.8" cy="17" r="2" /><circle cx="19.2" cy="17" r="2" /><circle cx="12" cy="12" r="2.2" /><path d="M12 6.5v3.3M10.3 13.6 6.5 15.9M13.7 13.6l3.8 2.3" /></>,
  code: <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" />,
  wrench: <><path d="M14.5 6.2a4.5 4.5 0 0 0 5.9 5.9l-8.2 8.2a2.5 2.5 0 0 1-3.6-3.6z" /><path d="M14.5 6.2 17.8 3" /></>,
  pipeline: <><circle cx="5" cy="6" r="2.2" /><circle cx="5" cy="18" r="2.2" /><circle cx="19" cy="12" r="2.2" /><path d="M7.2 6h5.3a4 4 0 0 1 4 4v.2M7.2 18h5.3a4 4 0 0 0 4-4v-.2" /></>,
  git: <><circle cx="6" cy="6" r="2.4" /><circle cx="6" cy="18" r="2.4" /><circle cx="18" cy="9" r="2.4" /><path d="M6 8.4v7.2M8.3 7.4A6 6 0 0 0 15.6 9.2M18 11.4c0 4-4 4.3-6 4.6" /></>,
  chart: <><path d="M3 3v16.5A1.5 1.5 0 0 0 4.5 21H21" /><path d="m7 15 3.5-4.5 3 3L19 7" /></>,
  pulse: <path d="M3 12h3.5l2-6 4 12 2.5-6H21" />,
  db: <><ellipse cx="12" cy="5.5" rx="8" ry="3" /><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13" /><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></>,
  layers: <><path d="m12 2.8 9 4.6-9 4.6-9-4.6z" /><path d="m3 12.4 9 4.6 9-4.6M3 17l9 4.6L21 17" /></>,
  brain: <><path d="M9.5 3.5A3 3 0 0 0 6.6 7 3 3 0 0 0 5 9.8a3 3 0 0 0 1.4 2.6A3 3 0 0 0 6 15a3 3 0 0 0 3 3h.5V3.5z" /><path d="M14.5 3.5A3 3 0 0 1 17.4 7 3 3 0 0 1 19 9.8a3 3 0 0 1-1.4 2.6A3 3 0 0 1 18 15a3 3 0 0 1-3 3h-.5V3.5z" /><path d="M12 3v18" /></>,
  shield: <><path d="M12 2.6 20 6v6.2c0 4.6-3.3 7.9-8 9.2-4.7-1.3-8-4.6-8-9.2V6z" /><path d="m8.8 12 2.2 2.2 4.2-4.4" /></>,
  coins: <><ellipse cx="9" cy="6.5" rx="6" ry="2.8" /><path d="M3 6.5v4c0 1.5 2.7 2.8 6 2.8s6-1.3 6-2.8v-4" /><path d="M15 11.2c3.3 0 6 1.3 6 2.8v4c0 1.5-2.7 2.8-6 2.8s-6-1.3-6-2.8v-3" /></>,
  alert: <><path d="M12 3.3 22 20H2z" /><path d="M12 9.5v4.2M12 17h.01" /></>,
};

export function ServiceIcon({ name }: { name: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name] ?? ICONS.cloud}
    </svg>
  );
}

export function ServiceCard({ service, detailed = false }: { service: Service; detailed?: boolean }) {
  const price =
    service.priceLow === service.priceHigh
      ? money(service.priceLow)
      : `${money(service.priceLow)} – ${money(service.priceHigh)}`;

  return (
    <article className="card card--hover" id={service.id}>
      <div className="card__icon">
        <ServiceIcon name={service.icon} />
      </div>
      {service.featured && (
        <span className="tag tag--accent" style={{ position: "absolute", top: "1rem", right: "1rem" }}>
          Popular
        </span>
      )}
      <h3>{service.name}</h3>
      <p>{service.blurb}</p>

      <ul className="check-list">
        {(detailed ? service.includes : service.includes.slice(0, 3)).map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>

      {detailed && (
        <>
          <h4 style={{ fontSize: ".82rem", letterSpacing: ".09em", textTransform: "uppercase", color: "var(--text-3)", marginTop: "1.25rem" }}>
            What changes afterwards
          </h4>
          <ul>
            {service.outcomes.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </>
      )}

      <div className="tags" style={{ marginBottom: "1rem" }}>
        {service.stack.slice(0, 6).map((t) => (
          <span className="tag" key={t}>
            {t}
          </span>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
          paddingTop: "1rem",
          borderTop: "1px solid var(--line-soft)",
        }}
      >
        <div>
          <div className="num">{price}</div>
          <div style={{ fontSize: ".78rem", color: "var(--text-3)" }}>
            CAD{service.priceNote ? `, ${service.priceNote}` : ", excl. tax"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="num">{service.durationLabel}</div>
          <div style={{ fontSize: ".78rem", color: "var(--text-3)" }}>typical duration</div>
        </div>
      </div>
    </article>
  );
}

export function CtaBand() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="cta-band">
          <div>
            <h2>Tell us what&rsquo;s broken.</h2>
            <p>
              Thirty minutes, no charge, no pitch deck. You will leave with an honest read on the size
              of the problem — even if that read is &ldquo;you don&rsquo;t need a consultancy for this&rdquo;.
            </p>
          </div>
          <div className="btn-row">
            <BookCallButton>Book the call</BookCallButton>
            <Link className="btn btn--ghost" href="/pricing">
              See pricing
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Faq({ items }: { items: Array<{ q: string; a: string }> }) {
  return (
    <>
      {items.map((f) => (
        <details className="acc" key={f.q}>
          <summary>{f.q}</summary>
          <div className="acc__body">
            <p>{f.a}</p>
          </div>
        </details>
      ))}
    </>
  );
}
