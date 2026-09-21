import type { Metadata } from "next";
import { services, auditOffer } from "@/lib/catalogue";
import { currencyFromDollars as money } from "@/lib/company";
import { PageHead, ServiceCard, CtaBand } from "@/components/Bits";
import ServiceFilter from "@/components/ServiceFilter";

export const metadata: Metadata = {
  title: "Services & pricing",
  description:
    "Cloud landing zones, on-premises migration, Kubernetes platforms, Terraform, CI/CD, GitOps, observability, databases, MLOps and security hardening — each with a published CAD price range and duration.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHead
        crumb="Services"
        title="Everything we do, with the price on it"
        lede={`${services.length} defined services. Every one carries a published price range in Canadian dollars and a realistic duration, because you should be able to budget before you talk to anyone.`}
      />

      <section className="section">
        <div className="wrap">
          <div className="card" style={{ background: "var(--bg-alt)", border: 0, marginBottom: "3rem", padding: "2rem" }}>
            <div className="split" style={{ gap: "2rem" }}>
              <div>
                <span className="tag tag--amber">Start here</span>
                <h2 style={{ fontSize: "var(--step-2)", marginTop: ".8rem" }}>{auditOffer.name}</h2>
                <p>{auditOffer.blurb}</p>
                {/* Deliberately not `.num` — that class sets white-space:nowrap,
                    which is right for a table figure and wrong here: on a
                    280px folded phone the price and the qualifier must be able
                    to break onto separate lines. */}
                <p style={{ marginBottom: 0 }}>
                  <strong
                    style={{
                      fontSize: "1.6rem",
                      fontWeight: 700,
                      color: "var(--text)",
                      fontVariantNumeric: "tabular-nums",
                      display: "block",
                      lineHeight: 1.1,
                    }}
                  >
                    {money(auditOffer.price)}
                  </strong>
                  <span style={{ fontSize: ".85rem", color: "var(--text-3)" }}>
                    CAD · {auditOffer.durationLabel}
                  </span>
                </p>
              </div>
              <ul className="check-list">
                {auditOffer.includes.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          </div>

          <ServiceFilter />
        </div>
      </section>

      <section className="section section--alt">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "2rem" }}>
            <span className="eyebrow">Detail</span>
            <h2>Full service detail</h2>
          </div>
          <div className="grid grid-2">
            {services.map((s) => (
              <ServiceCard key={s.id} service={s} detailed />
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
