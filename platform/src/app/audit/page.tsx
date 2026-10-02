import type { Metadata } from "next";
import Link from "next/link";
import { auditOffer } from "@/lib/catalogue";
import { currencyFromDollars as money } from "@/lib/company";
import { PageHead, Faq } from "@/components/Bits";
import BookCallButton from "@/components/BookCall";

/**
 * THE AUDIT LANDING PAGE
 *
 * The audit is named on six other pages and in almost every agent script, but
 * until now it had nowhere of its own to send anybody. That matters more than
 * it sounds: it is the only thing the firm sells that somebody can buy
 * without already trusting the firm, which makes it the page every campaign,
 * every LinkedIn post and every cold reply should be pointing at.
 *
 * The structure is ordered by what stops people buying, not by what we would
 * enjoy saying. Access first, because handing credentials to a stranger is
 * the real objection. Then what happens on each of the five days, because
 * "an audit" means something different at every firm that sells one. Then
 * what you keep. Then, deliberately, what this is not — the section that
 * costs us the engagements we would have done badly.
 */

const PREFILL = "/contact?est=audit&service=Fixed-Price%20Infrastructure%20Audit";

export const metadata: Metadata = {
  alternates: { canonical: "/audit" },
  title: auditOffer.name,
  description:
    `A ${auditOffer.durationLabel} fixed-price infrastructure audit for ${money(auditOffer.price)} CAD. ` +
    "Read-only access, a written report on security exposure, cost waste and reliability risk, " +
    "and a prioritized remediation plan you keep whether or not you continue with us.",
};

/** What happens on each of the five days. */
const DAYS = [
  {
    day: "Day 1",
    title: "Access and inventory",
    body:
      "Read-only credentials, a walk through the repositories, and 45 minutes with whoever remembers why things are the way they are. By the end of the day we have an inventory of what is actually running, which is frequently the first time anyone has had one.",
  },
  {
    day: "Day 2",
    title: "Security and access",
    body:
      "Who and what can reach production, which permissions are wider than the job needs, where credentials live and how long they last. Findings are ranked by how exploitable they are in your setup, not by a scanner’s generic severity.",
  },
  {
    day: "Day 3",
    title: "Cost",
    body:
      "Idle and oversized resources, storage nobody has lifecycled, environments left running, and commitments that no longer match the shape of the workload. Every item carries the annualized dollar figure, so the report can be read by someone who does not care about the technology.",
  },
  {
    day: "Day 4",
    title: "Reliability",
    body:
      "Single points of failure, the paths with no rollback, what is backed up against what has actually been restored, and which alerts would wake someone for something a user would never notice.",
  },
  {
    day: "Day 5",
    title: "Writing it up",
    body:
      "The report, the remediation plan in priority order, and an hour walking your team through it. You are left with a document that makes sense without us in the room, because that is the test of whether it was worth anything.",
  },
];

/** The boundaries. Stated here rather than discovered in week two. */
const NOT = [
  {
    title: "Not a penetration test",
    body:
      "Nothing is exploited and nothing is attacked. This is a review of configuration, access and architecture. If what you need is someone attempting to break in, you want a specialist penetration-testing firm and we will say so.",
  },
  {
    title: "Not a compliance certification",
    body:
      "The findings map onto what a SOC 2, ISO 27001 or PIPEDA review will ask you for, and are written so they can be handed straight to whoever is running it. But no certificate comes out of this, and an auditor will still want their own evidence.",
  },
  {
    title: "Not a sales document",
    body:
      "The report is not written to produce a proposal. Where the honest finding is that something is fine, it says so, and where the fix is one your own team should do in an afternoon, it says that too.",
  },
];

const FAQ = [
  {
    q: "What access do you actually need?",
    a: "Read-only. A reader role on the cloud accounts, read access to the repositories and the pipeline, and visibility of the dashboards. No agents are installed, nothing is changed, and no production workload is touched. If your policy requires it, we will work inside an access window you control and give the credentials back at the end of it.",
  },
  {
    q: "What if you find nothing?",
    a: "Then the report says so, and that is a useful thing to be able to put in front of a board. The price is fixed either way, which is deliberate: paying us by the finding would give us a reason to manufacture them.",
  },
  {
    q: "Do we have to use you for the remediation?",
    a: "No, and the plan is deliberately written so you do not have to. It is ordered by priority with effort estimates, in enough detail for your own team or another firm to execute it. You own the report regardless of what happens next.",
  },
  {
    q: "How much of our team’s time does it take?",
    a: "Roughly three hours in total across the five days: a kickoff, one session with whoever knows the history, and the walkthrough at the end. We work from read-only access for the rest of it precisely so that it does not become a project for your team.",
  },
  {
    q: "Is the price really fixed?",
    a: `Yes. ${money(auditOffer.price)} CAD, ${auditOffer.durationLabel}, invoiced once. If the estate turns out to be larger than described we will tell you before starting and you can decide what to do — what we will not do is start at this price and come back for more.`,
  },
  {
    q: "What happens to our data afterwards?",
    a: "Access is revoked at the end of the engagement, and we hold only the report and the working notes behind it. Nothing is used to train anything. The privacy policy covers the detail, and our obligations under it are the same to you as to anyone else.",
  },
];

export default function AuditPage() {
  return (
    <>
      <PageHead
        crumb="Audit"
        title="Find out what you actually have"
        lede={`${auditOffer.durationLabel}, ${money(auditOffer.price)} CAD, fixed. Read-only access, a written report on what is exposed, what is wasted and what is fragile — and you keep it whether or not you ever hire us.`}
      />

      {/* --- The offer, and the price, before anything else ---------------- */}
      <section className="section">
        <div className="wrap">
          <div
            className="card"
            style={{ background: "var(--bg-alt)", border: 0, padding: "2rem", marginBottom: "3rem" }}
          >
            <div className="split" style={{ gap: "2rem", alignItems: "start" }}>
              <div>
                <span className="tag tag--amber">The smallest way to start</span>
                <h2 style={{ fontSize: "var(--step-2)", marginTop: ".8rem" }}>{auditOffer.name}</h2>
                <p>{auditOffer.blurb}</p>

                {/* Not `.num`: that sets white-space:nowrap, which is right in
                    a table and wrong here — on a narrow phone the figure and
                    its qualifier need to break onto separate lines. */}
                <p>
                  <strong
                    style={{
                      fontSize: "1.9rem",
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
                    CAD &middot; {auditOffer.durationLabel} &middot; invoiced once
                  </span>
                </p>

                <div className="btn-row" style={{ marginTop: "1.5rem" }}>
                  <BookCallButton>Book the call</BookCallButton>
                  <Link className="btn btn--ghost" href={PREFILL}>
                    Request the audit
                  </Link>
                </div>
              </div>

              <ul className="check-list">
                {auditOffer.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --- The five days ------------------------------------------------- */}
      <section className="section section--alt">
        <div className="wrap">
          <div className="section-head">
            <h2>What happens, day by day</h2>
            <p className="lede">
              &ldquo;An audit&rdquo; means something different at every firm that sells one. This is
              ours, in order.
            </p>
          </div>

          <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {DAYS.map((d) => (
              <li key={d.day} className="card" style={{ marginBottom: "1rem" }}>
                <span className="tag tag--accent">{d.day}</span>
                <h3 style={{ fontSize: "var(--step-1)", marginTop: ".6rem" }}>{d.title}</h3>
                <p style={{ marginBottom: 0 }}>{d.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* --- What you keep -------------------------------------------------- */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2>What you are left holding</h2>
            <p className="lede">
              Three documents, yours on delivery, written to be useful to somebody who has never
              spoken to us.
            </p>
          </div>

          <div className="grid grid-3">
            <div className="card">
              <h3 style={{ fontSize: "var(--step-1)" }}>The findings report</h3>
              <p style={{ marginBottom: 0 }}>
                What is exposed, what is wasted and what is fragile, each with the evidence behind it
                and a plain statement of what happens if it is left alone.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: "var(--step-1)" }}>The remediation plan</h3>
              <p style={{ marginBottom: 0 }}>
                Ordered by priority with effort against each item, detailed enough for your team or
                another firm to execute without us.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: "var(--step-1)" }}>A costed proposal</h3>
              <p style={{ marginBottom: 0 }}>
                Only for the items you would want help with, priced the same way everything else on
                this site is. Ignoring it costs nothing and changes nothing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- The boundaries -------------------------------------------------- */}
      <section className="section section--alt">
        <div className="wrap">
          <div className="section-head">
            <h2>What this is not</h2>
            <p className="lede">
              Worth knowing before you pay for it rather than after.
            </p>
          </div>

          <div className="grid grid-3">
            {NOT.map((n) => (
              <div className="card" key={n.title}>
                <h3 style={{ fontSize: "var(--step-1)" }}>{n.title}</h3>
                <p style={{ marginBottom: 0 }}>{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FAQ -------------------------------------------------------------- */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2>Questions people ask first</h2>
          </div>
          <Faq items={FAQ} />
        </div>
      </section>

      {/* --- Close ------------------------------------------------------------ */}
      <section className="section">
        <div className="wrap">
          <div className="cta-band">
            <div>
              <h2>Start with the audit.</h2>
              <p>
                {auditOffer.durationLabel}, {money(auditOffer.price)} CAD, read-only access. The
                cheapest way to find out whether we are any use to you — and the report is yours
                either way.
              </p>
            </div>
            <div className="btn-row">
              <BookCallButton>Book the call</BookCallButton>
              <Link className="btn btn--ghost" href={PREFILL}>
                Request the audit
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
