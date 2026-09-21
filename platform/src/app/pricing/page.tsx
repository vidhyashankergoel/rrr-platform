import type { Metadata } from "next";
import Link from "next/link";
import { services, retainers, rateCard, auditOffer, faq } from "@/lib/catalogue";
import { company, currencyFromDollars as money } from "@/lib/company";
import { TAX_TABLE, SMALL_SUPPLIER_THRESHOLD } from "@/lib/costing";
import { PageHead, CtaBand, Faq } from "@/components/Bits";
import Estimator from "@/components/Estimator";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Published pricing in Canadian dollars: fixed-scope engagements, an hourly rate card, and three retainer tiers. Estimate your engagement before you talk to anyone.",
};

export default function PricingPage() {
  const registered = company.gstHstNumber.length > 0;

  return (
    <>
      <PageHead
        crumb="Pricing"
        title="Published pricing, in Canadian dollars"
        lede="We publish what things cost because hiding it wastes everyone’s time. Fixed price where the scope can be pinned down, a rate card where it can’t, and a retainer if you want us to keep it running."
      />

      {/* ---------------- ESTIMATOR ---------------- */}
      <section className="section">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "2.5rem" }}>
            <span className="eyebrow">Estimate first</span>
            <h2>Build an indicative estimate</h2>
            <p className="lede">
              Pick the outcomes you need. The range and timeline update as you go — no form, no email
              address, no sales call required.
            </p>
          </div>
          <Estimator />
        </div>
      </section>

      {/* ---------------- FIXED SCOPE ---------------- */}
      <section className="section section--alt" id="fixed">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "2.5rem" }}>
            <span className="eyebrow">Fixed scope</span>
            <h2>Defined outcome, fixed price</h2>
            <p className="lede">
              The delivery risk sits with us. If it takes longer than we estimated, that is our problem,
              not your invoice.
            </p>
          </div>

          <div className="table-scroll">
            <table>
              <caption className="visually-hidden">
                Fixed-scope engagements with price ranges and durations in Canadian dollars
              </caption>
              <thead>
                <tr>
                  <th scope="col">Engagement</th>
                  <th scope="col">Price (CAD)</th>
                  <th scope="col">Duration</th>
                  <th scope="col">Term</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>{auditOffer.name}</strong>
                    <br />
                    <span style={{ fontSize: ".85rem" }}>The low-risk way to start</span>
                  </td>
                  <td className="num">{money(auditOffer.price)}</td>
                  <td className="num">{auditOffer.durationLabel}</td>
                  <td>Short</td>
                </tr>
                {services.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.name}</strong>
                      <br />
                      <span style={{ fontSize: ".85rem" }}>{s.blurb.slice(0, 110)}…</span>
                    </td>
                    <td className="num">
                      {s.priceLow === s.priceHigh ? money(s.priceLow) : `${money(s.priceLow)} – ${money(s.priceHigh)}`}
                      {s.priceNote && (
                        <>
                          <br />
                          <span style={{ fontSize: ".75rem", fontWeight: 400, color: "var(--text-3)" }}>
                            {s.priceNote}
                          </span>
                        </>
                      )}
                    </td>
                    <td className="num">{s.durationLabel}</td>
                    <td>{s.term === "short" ? "Short" : "Long"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: ".85rem", color: "var(--text-3)", marginTop: "1rem" }}>
            All prices in Canadian dollars, excluding applicable GST/HST. Ranges reflect scope and
            estate complexity; a firm fixed price follows a free scoping call and a short discovery.
            Published figures are indicative and are not an offer.
          </p>
        </div>
      </section>

      {/* ---------------- RETAINERS ---------------- */}
      <section className="section" id="retainers">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "2.5rem" }}>
            <span className="eyebrow">Ongoing</span>
            <h2>Retainers</h2>
            <p className="lede">
              For teams that have a platform but not a platform team. Cancel with notice — no multi-year
              lock-in beyond the stated term.
            </p>
          </div>
          <div className="grid grid-3">
            {retainers.map((r) => (
              <article className={`card price-card${r.featured ? " price-card--featured" : ""}`} key={r.key}>
                <h3>{r.name}</h3>
                <p style={{ fontSize: ".9rem" }}>{r.blurb}</p>
                <div className="price">
                  {money(r.price)} <small>CAD {r.unit}</small>
                </div>
                <ul className="check-list">
                  {r.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
                <p style={{ fontSize: ".78rem", color: "var(--text-3)" }}>{r.term}</p>
                <Link
                  className={`btn btn--${r.featured ? "primary" : "ghost"}`}
                  href={`/contact?plan=${encodeURIComponent(r.name)}`}
                >
                  Discuss {r.name}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- RATE CARD ---------------- */}
      <section className="section section--alt" id="rates">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "2.5rem" }}>
            <span className="eyebrow">Time and materials</span>
            <h2>Hourly rate card</h2>
            <p className="lede">
              For advisory work, or anything genuinely open-ended. Always with a not-to-exceed cap agreed
              up front — we stop at it rather than sailing past.
            </p>
          </div>
          <div className="table-scroll">
            <table>
              <caption className="visually-hidden">Hourly rates by role in Canadian dollars</caption>
              <thead>
                <tr>
                  <th scope="col">Role</th>
                  <th scope="col">Rate (CAD/hr)</th>
                  <th scope="col">Typically used for</th>
                </tr>
              </thead>
              <tbody>
                {rateCard.map((r) => (
                  <tr key={r.role}>
                    <td><strong>{r.role}</strong></td>
                    <td className="num">{r.rate}</td>
                    <td>{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ---------------- BILLING TERMS ---------------- */}
      <section className="section">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "2.5rem" }}>
            <span className="eyebrow">Commercial terms</span>
            <h2>How billing works</h2>
          </div>
          <div className="grid grid-3">
            <div className="card">
              <h3 style={{ fontSize: "var(--step-1)" }}>Payment schedule</h3>
              <ul className="check-list">
                <li><strong>Fixed scope:</strong> 40% on signature, 30% at midpoint, 30% on acceptance</li>
                <li><strong>Time &amp; materials:</strong> monthly in arrears against an inspectable timesheet</li>
                <li><strong>Retainer:</strong> monthly in advance</li>
              </ul>
            </div>
            <div className="card">
              <h3 style={{ fontSize: "var(--step-1)" }}>Terms</h3>
              <ul className="check-list">
                <li>Net {company.paymentTermsDays} days from invoice date</li>
                <li>{company.lateInterestAnnualPct}% per annum on overdue amounts</li>
                <li>EFT or cheque, in Canadian dollars</li>
                <li>Purchase order numbers carried on the invoice where procurement requires it</li>
              </ul>
            </div>
            <div className="card">
              <h3 style={{ fontSize: "var(--step-1)" }}>Tax</h3>
              <ul className="check-list">
                <li>
                  {registered
                    ? `${TAX_TABLE.ON.label} applied per the place-of-supply rules for your province`
                    : "GST/HST registration in progress — invoices will show it once issued"}
                </li>
                <li>
                  Registration becomes mandatory above {money(SMALL_SUPPLIER_THRESHOLD)} in taxable supplies
                  over four consecutive calendar quarters
                </li>
                <li>Quebec QST and the western provincial sales taxes are assessed case by case</li>
              </ul>
            </div>
          </div>

          <div
            className="card"
            style={{
              marginTop: "2rem",
              borderLeft: "4px solid var(--warn)",
              background: "var(--bg-alt)",
            }}
          >
            <h3 style={{ fontSize: "1rem" }}>A note on payment fraud</h3>
            <p style={{ marginBottom: 0 }}>
              Our banking details appear only on an issued invoice, and they do not change mid-engagement.
              If you receive any message claiming our banking details have changed, telephone us on the
              number published on this site before acting on it. We will never ask for banking details,
              card numbers or credentials by email or in chat.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--alt">
        <div className="wrap-tight">
          <div className="center" style={{ marginBottom: "2.5rem" }}>
            <span className="eyebrow">Common questions</span>
            <h2>About pricing and terms</h2>
          </div>
          <Faq items={faq.slice(0, 5)} />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
