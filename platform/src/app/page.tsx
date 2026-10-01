import Link from "next/link";
import { caseStudies, faq, auditOffer, services } from "@/lib/catalogue";
import { company, currencyFromDollars as money } from "@/lib/company";
import { CtaBand, Faq } from "@/components/Bits";
import { displayClient, PRIOR_WORK_DISCLAIMER_SHORT } from "@/lib/attribution";
import Terminal from "@/components/Terminal";
import Counter from "@/components/Counter";
import Pillars from "@/components/Pillars";
import WhyUs from "@/components/WhyUs";
import WhatYouGet from "@/components/WhatYouGet";
import HowWeWork from "@/components/HowWeWork";
import BookCallButton from "@/components/BookCall";
import { RevealGroup, Marquee } from "@/components/Enhancements";
import { CaseCard } from "@/components/Expand";
import Reviews from "@/components/Reviews";

const ACHIEVEMENTS = [
  {
    to: 180,
    suffix: "+",
    label: "microservices migrated",
    context: "From on-premises to AWS, with zero service disruption",
  },
  {
    to: 99.9,
    decimals: 1,
    suffix: "%",
    label: "uptime sustained",
    context: "Across twelve months, through 3× peak-season traffic",
  },
  {
    to: 40,
    suffix: "%",
    label: "cloud cost removed",
    context: "Typical reduction, verified against the prior twelve months",
  },
  {
    to: 500,
    suffix: "+",
    label: "production hosts automated",
    context: "Manual deployment eliminated across the estate",
  },
  {
    to: 27,
    prefix: "",
    suffix: " → 1",
    label: "load balancers consolidated",
    context: "One ALB/NLB design with automated scaling",
  },
  {
    to: 10,
    suffix: " TB+",
    label: "Oracle estate protected",
    context: "Backup, patching and recovery automated under regulated change control",
  },
];

// Two entries are dropped rather than shown. "Shell" reads as the oil company
// out of context, and "Container infrastructure" is a category rather than a
// technology — neither earns its place in a band whose only job is to be
// recognised at a glance. Both still appear on the case studies themselves.
const STACK_OMIT = new Set(["Shell", "Container infrastructure"]);

const STACK = Array.from(new Set(caseStudies.flatMap((c) => c.stack)))
  .filter((t) => !STACK_OMIT.has(t))
  .sort((a, b) => a.localeCompare(b));

export default function Home() {
  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="hero">
        <div className="hero__aurora" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="wrap split">
          <div>
            <span className="pill pill--ok" style={{ marginBottom: "1.25rem" }}>
              <i className="dot" /> Taking new engagements · Toronto, ON
            </span>
            <h1>
              Your infrastructure should be <em>boring</em>.
            </h1>
            <p className="hero__gloss">
              Boring means nothing pages you at 3&nbsp;a.m., nothing depends on one person&apos;s
              memory, and a deploy is uneventful. That is the whole job.
            </p>
            <p className="hero__lede">
              We build, migrate and operate cloud platforms for Canadian teams — AWS, Azure and GCP,
              Kubernetes, Terraform, CI/CD and observability. Published prices, fixed scope where it
              can be pinned down, and everything handed back in your own repositories.
            </p>
            <div className="btn-row" style={{ marginTop: "2rem" }}>
              <BookCallButton>Book a free 30-minute call</BookCallButton>
              <Link className="btn btn--ghost" href="/pricing">
                See pricing &amp; durations
              </Link>
            </div>
            <div className="hero__badges">
              <span className="pill">CKA certified</span>
              <span className="pill">Azure Developer Associate</span>
              <span className="pill">8+ years production infrastructure</span>
              <span className="pill">Eligible for Reliability Status</span>
            </div>
          </div>
          <Terminal />
        </div>
      </section>

      {/* ---------------- STACK MARQUEE ---------------- */}
      <Marquee items={STACK} />

      {/* ---------------- ACHIEVEMENTS ---------------- */}
      <section className="section section--tight section--alt">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "2.5rem" }}>
            <span className="eyebrow">What we have actually delivered</span>
            <h2>Numbers we can substantiate</h2>
            <p className="lede">
              Every figure comes from a real engagement. Ask us to walk you through any of
              them on the call.
            </p>
          </div>

          <RevealGroup className="achievements">
            {ACHIEVEMENTS.map((a) => (
              <div className="achieve" key={a.label}>
                <div className="achieve__n">
                  <Counter to={a.to} decimals={a.decimals ?? 0} suffix={a.suffix} />
                </div>
                <p className="achieve__l">{a.label}</p>
                <p className="achieve__c">{a.context}</p>
              </div>
            ))}
          </RevealGroup>

          <p
            className="center"
            style={{ fontSize: ".82rem", color: "var(--text-3)", maxWidth: "70ch", margin: "2rem auto 0" }}
          >
            Delivered for {caseStudies.map((c) => displayClient(c)).join(" · ")}.{" "}
            {PRIOR_WORK_DISCLAIMER_SHORT}
          </p>
        </div>
      </section>

      {/* ---------------- MISSION / VISION ---------------- */}
      <section className="section section--dark">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "3rem" }}>
            <span className="eyebrow">What we are here to do</span>
            <h2>Our mission and where it leads</h2>
          </div>

          <div className="mv">
            <article className="mv__card">
              <p className="mv__when">Mission · today</p>
              <p className="mv__statement">
                To give Canadian organizations cloud infrastructure they can operate themselves —
                built, migrated and documented by senior engineers at a published price, and handed
                over so completely that they never have to call us again.
              </p>
              <p className="mv__note">
                Every word there is a commitment we can be held to.
              </p>
            </article>

            <article className="mv__card mv__card--vision">
              <p className="mv__when">Vision · 2031</p>
              <p className="mv__statement">
                That no Canadian organization has to discover its own outage from a customer, or
                inherit infrastructure nobody can explain — because the standard of practice we
                demonstrate has become the one the market expects.
              </p>
              <p className="mv__note">
                We would count it a success if competitors got there first.
              </p>
            </article>
          </div>

          <div className="center" style={{ marginTop: "2.5rem" }}>
            <Link className="btn btn--ghost" href="/story">
              Read the full story, values and strategy
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- THREE PILLARS ---------------- */}
      <section className="section">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "3rem" }}>
            <span className="eyebrow">What we do</span>
            <h2>Three things, {services.length} ways to buy them</h2>
            <p className="lede">
              Every service carries a published price and a realistic duration.
            </p>
          </div>

          <Pillars />

          <div className="center" style={{ marginTop: "3rem" }}>
            <Link className="btn btn--primary" href="/services">
              See all {services.length} services with pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- HOW WE WORK ---------------- */}
      <section className="section section--alt">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "3rem" }}>
            <span className="eyebrow">How we work</span>
            <h2>Five steps, and a human at every gate</h2>
            <p className="lede">
              We use AI heavily, and it makes us faster. It never touches your environment and
              never commits us to anything.
            </p>
          </div>

          <HowWeWork />

          <div className="center" style={{ marginTop: "2.5rem" }}>
            <Link className="btn btn--ghost" href="/security">
              How we secure your estate
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- WHAT YOU GET ---------------- */}
      <section className="section">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "3rem" }}>
            <span className="eyebrow">What you get</span>
            <h2>The deliverables, named</h2>
            <p className="lede">
              Most consultancies describe activity. These are the artefacts that land in your
              hands.
            </p>
          </div>

          <WhatYouGet />
        </div>
      </section>

      {/* ---------------- WHY US ---------------- */}
      <section className="section section--alt">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "3rem" }}>
            <span className="eyebrow">Why us</span>
            <h2>Compared honestly with the alternatives</h2>
            <p className="lede">
              Including three cases where somebody else is the better answer.
            </p>
          </div>

          <WhyUs />
        </div>
      </section>

      {/* ---------------- ENTRY OFFER ---------------- */}
      <section className="section section--dark">
        <div className="wrap split">
          <div>
            <span className="eyebrow">Lowest-risk start</span>
            <h2>{auditOffer.name}</h2>
            <p className="lede">{auditOffer.blurb}</p>
            <p style={{ color: "#fff", fontWeight: 600 }}>
              Read-only access. You keep the report either way.
            </p>
            <div className="btn-row" style={{ marginTop: "2rem" }}>
              <Link className="btn btn--primary" href="/contact?service=Infrastructure%20Audit">
                Book an audit — {money(auditOffer.price)}
              </Link>
              <Link className="btn btn--ghost" href="/trust">
                Other ways to test us
              </Link>
            </div>
          </div>
          <div className="card">
            <h3 style={{ fontSize: "var(--step-1)" }}>What lands in five business days</h3>
            <ul className="check-list">
              {auditOffer.includes.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------- CLIENTS / WORK ---------------- */}
      <section className="section">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "3rem" }}>
            <span className="eyebrow">Where the work was done</span>
            <h2>Production systems, under real constraints</h2>
            <p className="lede">
              Aviation, banking, insurance, sport and AI research — including estates under
              regulated change control.
            </p>
          </div>

          <RevealGroup className="grid grid-3">
            {caseStudies.map((c) => (
              <CaseCard study={c} key={c.slug} />
            ))}
          </RevealGroup>

          <div className="center" style={{ marginTop: "2.5rem" }}>
            <Link className="btn btn--ghost" href="/work">
              Case studies in full
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- REVIEWS ---------------- */}
      <section className="section section--alt">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "2.5rem" }}>
            <span className="eyebrow">What you can check</span>
            <h2>Proof you can verify yourself</h2>
          </div>
          <Reviews />
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="section section--alt">
        <div className="wrap-tight">
          <div className="center" style={{ marginBottom: "2.5rem" }}>
            <span className="eyebrow">Straight answers</span>
            <h2>Questions we get asked before signing</h2>
          </div>
          <Faq items={faq} />
          <p style={{ textAlign: "center", marginTop: "2rem", fontSize: ".9rem" }}>
            Something not covered? Ask Ada in the corner, or call {company.phone}.
          </p>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
