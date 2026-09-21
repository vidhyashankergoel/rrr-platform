import type { Metadata } from "next";
import Link from "next/link";
import { currencyFromDollars as money } from "@/lib/company";
import { auditOffer, rateCard } from "@/lib/catalogue";
import { projects, publishedPosts, profiles, portfolioUrl, archiveNote } from "@/lib/proof";
import { PageHead, CtaBand } from "@/components/Bits";
import BookCallButton from "@/components/BookCall";

export const metadata: Metadata = {
  title: "Why trust us",
  description:
    "We are a new firm. Here is how we earn trust: phased engagements, a read-only starting point, published pricing, an NDA before discovery, and work you can inspect yourself.",
};

const LADDER = [
  {
    step: "01",
    commitment: "Nothing",
    title: "Read the work",
    body: "Open the repositories. Read the code, the commit history, the structure. Judge the engineering before you speak to anyone.",
    risk: "No contact, no obligation, no data given to us.",
    cta: { label: "Browse the projects", href: "#projects" },
  },
  {
    step: "02",
    commitment: "30 minutes",
    title: "Take the scoping call",
    body: "Describe the problem. We tell you the honest size of it, including when the honest answer is that you do not need a consultancy for this.",
    risk: "Free. No follow-up sequence unless you ask for one.",
    cta: { label: "Book the call", href: "/contact" },
  },
  {
    step: "03",
    commitment: `${money(auditOffer.price)}`,
    title: "Buy the read-only audit",
    body: `${auditOffer.durationLabel}. We need read access and nothing else. You get a written report of what is exposed, what is wasted, and what is fragile — and you keep it regardless of what happens next.`,
    risk: "Fixed price, read-only access, no ongoing commitment.",
    cta: { label: "Book an audit", href: "/contact?service=Infrastructure%20Audit" },
  },
  {
    step: "04",
    commitment: "Hourly",
    title: "Use us by the hour first",
    body: "Not ready for a fixed-scope project? Engage us hourly against a not-to-exceed cap you set. We stop at the cap rather than sailing past it and invoicing you afterwards.",
    risk: "You control the ceiling. Stop any time.",
    cta: { label: "See the rate card", href: "/pricing#rates" },
  },
  {
    step: "05",
    commitment: "Phase one",
    title: "Run one phase of the real work",
    body: "Every engagement is broken into phases with their own price, acceptance criteria and exit. Phase one is genuinely standalone — if you stop after it, what you have still works and still has value.",
    risk: "Exit after any phase. No termination penalty.",
    cta: { label: "See how phasing works", href: "#phasing" },
  },
];

const VERIFIABLE = [
  {
    claim: "The engineering is real",
    how: "Open the repositories below — original work, not course projects. Read the Terraform, the pipelines, the dashboards. Code is harder to fake than a case study.",
  },
  {
    claim: "The certifications are real",
    how: "CKA, AZ-203 and AZ-900 are all independently verifiable. Ask for the credential IDs and check them with the Linux Foundation and Microsoft directly.",
  },
  {
    claim: "The employment history is real",
    how: "The LinkedIn profile carries the Wipro tenure and the client accounts. Ask for references and we will arrange them once we are past a first call.",
  },
  {
    claim: "The insurance is real",
    how: "Commercial general liability, professional liability and cyber. Ask for the certificates — we will send them without being chased.",
  },
  {
    claim: "The pricing is real",
    how: "It is published on this site. Compare our proposal against it. If a number differs from the published range, we have to explain why.",
  },
  {
    claim: "The AI controls are real",
    how: "Ask to see the approval queue. Every agent action is logged with who approved it and when. We will show you the actual screen, not a diagram of it.",
  },
];

export default function TrustPage() {
  const liveposts = publishedPosts();

  return (
    <>
      <PageHead
        crumb="Why trust us"
        title="We are new. Here is how you de-risk that."
        lede="Every consultancy claims senior people and honest pricing. The difference worth looking for is whether they have built a way for you to find out cheaply — before you are committed."
      />

      {/* ---------------- THE HONEST FRAME ---------------- */}
      <section className="section">
        <div className="wrap split">
          <div>
            <span className="eyebrow">Starting position</span>
            <h2>The thing you are actually worried about</h2>
            <p className="lede">
              You are considering handing production infrastructure to a firm without a decade of
              logos. That is a rational thing to be cautious about, and we are not going to argue you
              out of it.
            </p>
            <p>
              So we have done the opposite of what most new firms do. Instead of manufacturing the
              appearance of scale, we have built a ladder where every rung is cheap to step off — and
              published the prices so you can see there is no bait in it.
            </p>
            <p style={{ fontWeight: 600, color: "var(--text)" }}>
              The company is young. The engineering behind it is not: eight years across banking,
              insurance, aviation and AI research, including a 180-service AWS migration with zero
              service disruption.
            </p>
          </div>

          <div className="card" style={{ background: "var(--bg-alt)", border: 0, padding: "2rem" }}>
            <h3 style={{ fontSize: "var(--step-1)" }}>What we will put in writing</h3>
            <ul className="check-list">
              <li><strong>Mutual NDA before discovery</strong> — yours or ours, signed before we see anything</li>
              <li><strong>Fixed price where scope allows</strong> — the overrun risk is ours, not your invoice</li>
              <li><strong>Not-to-exceed cap on hourly work</strong> — we stop at it</li>
              <li><strong>Named engineers in the proposal</strong> — and you meet them before signing</li>
              <li><strong>Exit after any phase</strong> — no termination penalty</li>
              <li><strong>You own everything</strong> — your repositories, your accounts, no lock-in</li>
              <li><strong>Access revoked at the end</strong> — and we will remind you to do it</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------- THE LADDER ---------------- */}
      <section className="section section--alt">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "3rem" }}>
            <span className="eyebrow">The ladder</span>
            <h2>Five rungs, each one cheap to step off</h2>
            <p className="lede">
              Most clients start at rung three. Nobody is asked to start at rung five.
            </p>
          </div>

          <div className="grid grid-3">
            {LADDER.map((l) => (
              <article className="card card--hover" key={l.step}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem" }}>
                  <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-500)", lineHeight: 1 }}>
                    {l.step}
                  </span>
                  <span className="tag tag--amber">{l.commitment}</span>
                </div>
                <h3 style={{ fontSize: "var(--step-1)", marginTop: "1rem" }}>{l.title}</h3>
                <p style={{ fontSize: ".92rem" }}>{l.body}</p>
                <p
                  style={{
                    fontSize: ".84rem",
                    paddingTop: ".8rem",
                    borderTop: "1px solid var(--line-soft)",
                    color: "var(--text-3)",
                  }}
                >
                  <strong style={{ color: "var(--ok)" }}>Your exposure:</strong> {l.risk}
                </p>
                <Link className="btn btn--ghost btn--sm" href={l.cta.href}>
                  {l.cta.label}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- PHASING ---------------- */}
      <section className="section" id="phasing">
        <div className="wrap split">
          <div>
            <span className="eyebrow">Phasing</span>
            <h2>Every engagement breaks into standalone phases</h2>
            <p className="lede">
              A phase is not a milestone in a long march. It is a unit of work that leaves you better
              off on its own, whether or not you buy the next one.
            </p>
            <p>
              A migration does not start with the migration. It starts with a landing zone you would
              want regardless. A platform build does not start with the cluster; it starts with the
              infrastructure code that makes the cluster reproducible.
            </p>
            <p style={{ fontWeight: 600, color: "var(--text)" }}>
              The test: if you cancelled after phase one, would you have wasted the money? If the answer
              is yes, we have phased it wrong.
            </p>
          </div>

          <div className="timeline">
            <div className="tl-item">
              <span className="tag tag--accent">Phase 0 · {money(auditOffer.price)}</span>
              <h4>Audit</h4>
              <p>Read-only. A written report of exposure, waste and fragility. Standalone value: you know what is wrong, whoever fixes it.</p>
            </div>
            <div className="tl-item">
              <span className="tag">Phase 1</span>
              <h4>Foundation</h4>
              <p>The landing zone or the infrastructure code. Standalone value: your estate is reproducible and reviewable for the first time.</p>
            </div>
            <div className="tl-item">
              <span className="tag">Phase 2</span>
              <h4>The main build</h4>
              <p>Platform, migration wave, pipeline or observability stack. Standalone value: the primary outcome you engaged us for.</p>
            </div>
            <div className="tl-item">
              <span className="tag">Phase 3</span>
              <h4>Hardening and handover</h4>
              <p>Security, runbooks, recorded sessions, and your engineers demonstrating they can operate it. Standalone value: independence from us.</p>
            </div>
            <div className="tl-item">
              <span className="tag tag--amber">Optional</span>
              <h4>Retainer</h4>
              <p>Only if you want it. It has never been a condition of anything above, and it never will be.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- VERIFIABLE ---------------- */}
      <section className="section section--dark">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "3rem" }}>
            <span className="eyebrow">Verify it yourself</span>
            <h2>Do not take our word for any of this</h2>
            <p className="lede">
              Six claims on this site, and how to check each one without asking us.
            </p>
          </div>
          <div className="grid grid-3">
            {VERIFIABLE.map((v) => (
              <article className="card" key={v.claim}>
                <h3 style={{ fontSize: "1rem" }}>{v.claim}</h3>
                <p style={{ fontSize: ".9rem", marginBottom: 0 }}>{v.how}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- PROJECTS ---------------- */}
      <section className="section" id="projects">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "3rem" }}>
            <span className="eyebrow">Open work</span>
            <h2>Read the code</h2>
            <p className="lede">
              Public repositories covering infrastructure automation, pipelines, containers, networking
              and analytics. Not polished marketing artefacts — actual working projects.
            </p>
          </div>

          <div className="grid grid-3">
            {projects.map((p) => (
              <article className="card card--hover" key={p.repo}>
                <span className="tag tag--accent">{p.category}</span>
                <h3 style={{ fontSize: "1.02rem", marginTop: ".9rem" }}>{p.name}</h3>
                <p style={{ fontSize: ".9rem" }}>{p.blurb}</p>
                <p
                  style={{
                    fontSize: ".84rem",
                    color: "var(--text)",
                    fontWeight: 550,
                    borderLeft: "3px solid var(--accent-500)",
                    paddingLeft: ".8rem",
                    margin: "0 0 1rem",
                  }}
                >
                  {p.why}
                </p>
                <div className="tags" style={{ marginBottom: "1rem" }}>
                  {p.stack.map((s) => (
                    <span className="tag" key={s}>{s}</span>
                  ))}
                </div>
                <a
                  className="btn btn--ghost btn--sm"
                  href={p.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View repository
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 17 17 7M8 7h9v9" />
                  </svg>
                </a>
              </article>
            ))}
          </div>

          <div className="center" style={{ marginTop: "2.5rem" }}>
            <a className="btn btn--primary" href={portfolioUrl} target="_blank" rel="noopener noreferrer">
              Full project index
            </a>
            <p style={{ fontSize: ".82rem", color: "var(--text-3)", maxWidth: "62ch", margin: "1.5rem auto 0" }}>
              {archiveNote}
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- WRITING ---------------- */}
      {liveposts.length > 0 && (
        <section className="section section--alt">
          <div className="wrap">
            <div className="center" style={{ marginBottom: "3rem" }}>
              <span className="eyebrow">Published writing</span>
              <h2>How we think, in public</h2>
              <p className="lede">
                Write-ups of real engagements — the approach taken, what worked, and what turned out
                harder than expected.
              </p>
            </div>
            <div className="grid grid-3">
              {liveposts.map((post) => (
                <a
                  className="card card--hover"
                  key={post.url}
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none", color: "inherit", display: "block" }}
                >
                  <span className="tag tag--accent">{post.topic}</span>
                  <h3 style={{ fontSize: "1.02rem", marginTop: ".9rem" }}>{post.title}</h3>
                  <p style={{ fontSize: ".9rem" }}>{post.takeaway}</p>
                  <span style={{ fontSize: ".84rem", color: "var(--accent-500)", fontWeight: 650 }}>
                    Read on LinkedIn →
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------------- PROFILES ---------------- */}
      <section className="section">
        <div className="wrap-tight">
          <div className="center" style={{ marginBottom: "2.5rem" }}>
            <span className="eyebrow">Everywhere else</span>
            <h2>Check us anywhere you like</h2>
          </div>
          <div className="card">
            {profiles
              .filter((p) => p.url)
              .map((p) => (
                <a className="contact-row" key={p.url} href={p.url} target="_blank" rel="noopener noreferrer">
                  <span className="contact-row__ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17 17 7M8 7h9v9" />
                    </svg>
                  </span>
                  <span>
                    <strong>{p.label}</strong>
                    <span>{p.note}</span>
                  </span>
                </a>
              ))}
          </div>
        </div>
      </section>

      {/* ---------------- NDA + HOURLY ---------------- */}
      <section className="section section--alt">
        <div className="wrap">
          <div className="grid grid-2">
            <div className="card">
              <span className="tag tag--accent">Confidentiality</span>
              <h2 style={{ fontSize: "var(--step-2)", marginTop: "1rem" }}>We sign an NDA first</h2>
              <p>
                Mutual, and normally before we have seen anything at all. Your paper or ours — we have no
                preference and we do not negotiate it at length.
              </p>
              <ul className="check-list">
                <li>Signed before discovery, not after a proposal</li>
                <li>Covers anything you tell us on the very first call</li>
                <li>We will sign it before a first call if your procurement requires that</li>
                <li>A data processing agreement on top, wherever we touch personal information</li>
              </ul>
              <p style={{ fontSize: ".86rem", color: "var(--text-3)", marginBottom: 0 }}>
                Ask and we will send ours within the business day.
              </p>
            </div>

            <div className="card">
              <span className="tag tag--amber">Commercials</span>
              <h2 style={{ fontSize: "var(--step-2)", marginTop: "1rem" }}>Hourly, if you prefer</h2>
              <p>
                Fixed price is our default because it puts the risk on us. But if you want to start
                smaller and keep control of the meter, we bill time-and-materials against a cap you set.
              </p>
              <div className="table-scroll" style={{ border: 0 }}>
                <table style={{ minWidth: 0, fontSize: ".86rem" }}>
                  <tbody>
                    {rateCard.slice(0, 4).map((r) => (
                      <tr key={r.role}>
                        <td style={{ padding: ".55rem .4rem" }}>{r.role}</td>
                        <td className="num" style={{ padding: ".55rem .4rem" }}>{r.rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="check-list">
                <li>Not-to-exceed cap agreed up front — we stop at it</li>
                <li>Monthly invoice against a timesheet you can inspect</li>
                <li>Stop any time, no notice period on hourly work</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- CLOSE ---------------- */}
      <section className="section">
        <div className="wrap-tight center">
          <h2>Start at whichever rung you are comfortable with</h2>
          <p className="lede">
            If that is &ldquo;read the repositories and nothing else for now&rdquo;, that is a
            perfectly reasonable place to stop. Nothing here expires.
          </p>
          <div className="btn-row" style={{ justifyContent: "center", marginTop: "2rem" }}>
            <BookCallButton>Book the free call</BookCallButton>
            <Link className="btn btn--ghost" href="/contact?service=Mutual%20NDA">
              Request a mutual NDA
            </Link>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
