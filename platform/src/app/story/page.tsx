import type { Metadata } from "next";
import Link from "next/link";
import { company } from "@/lib/company";
import { PageHead, CtaBand } from "@/components/Bits";

export const metadata: Metadata = {
  title: "Our story",
  description:
    "How RRR Solution Providers came about, what we are here to do, where we intend to get to, and what we hold to while we do it.",
};

/**
 * HONESTY NOTE FOR WHOEVER EDITS THIS NEXT
 *
 * This company is new. Everything on this page is either verifiable history
 * from the founder's actual career, or clearly labelled as intent.
 *
 * Do not add invented milestones, client counts, revenue figures or a founding
 * date earlier than the real one. In Canadian B2B, procurement and enterprise
 * due diligence will check, and a single fabricated claim costs you the deal
 * and the reputation. A new firm that says "we are new, here is the evidence
 * of what we can actually do" beats a new firm pretending to be ten years old.
 */

const VALUES = [
  {
    name: "Say the inconvenient thing",
    line: "We tell clients when they do not need us, when a plan is wrong, and when we have made a mistake.",
    proof:
      "Every proposal names what we are NOT doing. Every scoping call ends with an honest size, including \"this is a two-day fix, you do not need a consultancy\".",
  },
  {
    name: "The client owns everything",
    line: "No proprietary wrapper, no component only we can renew, no dependency on our continued involvement.",
    proof:
      "All work lands in the client’s repositories and accounts. Handover, runbooks and recorded sessions are inside the fixed price, not an upsell.",
  },
  {
    name: "Simplest thing that works",
    line: "Every extra component is something a person has to operate at three in the morning.",
    proof:
      "Architecture decisions carry a written record of what was rejected and why. If a senior engineer would call it over-engineered, we take it out.",
  },
  {
    name: "A human signs every commitment",
    line: "We use AI heavily. We never let it commit us, or touch a client system, on its own authority.",
    proof:
      "Every outward-facing action — email, proposal, contract, price — passes a recorded human approval with a name and a timestamp against it.",
  },
  {
    name: "Boring is the goal",
    line: "Infrastructure that is interesting is infrastructure that is about to page someone.",
    proof:
      "Success is measured in uptime sustained, incidents not had, and the client’s own engineers running it without us.",
  },
];

const STRATEGY = [
  {
    horizon: "Year one",
    title: "Prove it on paid work",
    objectives: [
      "Incorporate federally or in Ontario, register for GST/HST, and put professional liability and cyber coverage in place",
      "Land the first ten paying engagements, weighted toward the fixed-price audit as the entry point",
      "Publish every price and duration openly — a deliberate bet that transparency wins more work than it loses",
      "Reach a position where more than half of new enquiries arrive through referral or LinkedIn rather than outbound",
    ],
  },
  {
    horizon: "Years two to three",
    title: "Build the bench, keep the standard",
    objectives: [
      "Grow to a delivery team of senior engineers across infrastructure, data, security and platform",
      "Establish a retained client base providing predictable monthly revenue alongside project work",
      "Complete SOC 2 Type I, then Type II, so regulated and public-sector buyers can procure without a bespoke security review",
      "Formalize the AI-assisted delivery system into something a client can audit, not just be told about",
    ],
  },
  {
    horizon: "Years four to five",
    title: "Be the default Canadian answer",
    objectives: [
      "Be a firm that Canadian mid-market and public-sector organizations name unprompted for cloud and platform work",
      "Hold standing qualification for Canadian public-sector procurement, with cleared personnel",
      "Open-source the parts of our tooling that do not constitute competitive advantage",
      "Run a paid apprenticeship pathway into senior platform engineering for Canadian newcomers and career changers",
    ],
  },
];

export default function StoryPage() {
  return (
    <>
      <PageHead
        crumb="Our story"
        title="Why this firm exists"
        lede="Eight years of watching the same four problems break the same way, in a bank, an insurer, an international airport and a research lab — and a conviction that most of it is avoidable."
      />

      {/* ---------------- ORIGIN ---------------- */}
      <section className="section">
        <div className="wrap-tight">
          <span className="eyebrow">Origin</span>
          <h2>It started with 180 microservices and no room for error</h2>

          <p className="lede">
            An international airport does not get to have a bad deployment. Flight information boards,
            baggage systems, gate management — the failure mode is not a bad quarter, it is people
            stranded in a terminal.
          </p>

          <p>
            Between 2020 and 2023, our founder led the migration of more than 180 microservices from
            on-premises infrastructure to AWS for the Greater Toronto Airports Authority, on the Wipro
            client account. Zero service disruption. 99.9% uptime sustained across twelve months.
            Roughly forty percent off the infrastructure bill. Four junior engineers taken through it
            who could run it afterwards.
          </p>

          <p>
            That work followed two years doing the same kind of thing under different constraints —
            consolidating fourteen fragmented network connections into a single Azure hub for RSA
            Insurance, and automating backup, patching and recovery for over ten terabytes of Oracle
            financial data at Citibank, inside regulated change windows where a mistake is a reportable
            event.
          </p>

          <h3 style={{ marginTop: "2.5rem" }}>The pattern that kept repeating</h3>

          <p>
            Four organizations. Four sectors. Four completely different technology stacks. The same four
            problems every single time:
          </p>

          <ul className="check-list">
            <li>Production worked, and exactly one person understood how it had been built</li>
            <li>Deployment was a ritual someone performed by hand, usually late on a Friday</li>
            <li>Outages were discovered by customers before they were discovered by dashboards</li>
            <li>The cloud bill grew every month and nobody could explain which part</li>
          </ul>

          <p>
            None of these are hard problems. They are well-understood problems that get deferred because
            the team is busy keeping the current thing alive. The fix is almost always a few focused
            weeks by people who have done it before — which is a terrible fit for a permanent hire and a
            very good fit for a firm you bring in, use, and send away again.
          </p>

          <h3 style={{ marginTop: "2.5rem" }}>Coming to Canada, and what changed</h3>

          <p>
            Arriving in Toronto in 2024 meant starting again in a new market, and it meant doing two
            unpaid internships to earn Canadian experience the hard way — at an AI research company, and
            at Rugby Canada, where there was no monitoring at all and seven years of membership data the
            organization could not act on. We built the monitoring stack from nothing, cut detection and
            resolution time from hours to minutes, and put a churn prediction model into production on
            Kubernetes.
          </p>

          <p>
            That period also produced something less expected. Working with AI coding agents daily,
            under real delivery pressure, it became obvious that the speed was genuine and the risk was
            equally genuine. An agent will happily produce a confident Terraform plan that destroys a
            database. The interesting engineering problem was not &ldquo;can AI do this&rdquo; — it was
            <strong> where exactly does a human have to stand</strong>.
          </p>

          <p>
            The answer we arrived at is the operating principle of this firm:{" "}
            <strong>agents propose, humans dispose, the system executes.</strong> Agents do the reading,
            the drafting, the decomposition and the documentation. A named person signs anything that
            touches a client system or commits the company. It is faster than a conventional
            consultancy and more accountable than most, and we are willing to show a client exactly how
            it works.
          </p>

          <h3 style={{ marginTop: "2.5rem" }}>Why the name</h3>
          <p>
            Three R&rsquo;s, interlocked: <strong>Reliable, Repeatable, Reviewable.</strong> The three
            properties every piece of infrastructure we hand over has to have. If it only works when one
            person does it, it is none of the three.
          </p>

          <div className="card" style={{ background: "var(--bg-alt)", border: 0, marginTop: "2.5rem" }}>
            <p style={{ marginBottom: 0, fontSize: "var(--step-1)", fontWeight: 600, color: "var(--text)" }}>
              We are a new firm with old scars. The company is young; the experience behind it is not.
              We would rather tell you that plainly than dress it up.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- MISSION / VISION ---------------- */}
      <section className="section section--dark">
        <div className="wrap">
          <div className="grid grid-2">
            <div className="card">
              <span className="tag tag--accent">Mission · the present</span>
              <h2 style={{ fontSize: "var(--step-2)", marginTop: "1rem" }}>What we do today</h2>
              <p style={{ fontSize: "var(--step-1)", color: "#e8f0f7", fontWeight: 500, lineHeight: 1.5 }}>
                To give Canadian organizations cloud infrastructure they can operate themselves —
                built, migrated and documented by senior engineers at a published price, and handed
                over so completely that they never have to call us again.
              </p>
              <p style={{ fontSize: ".88rem" }}>
                Every word of that is a commitment we can be held to: Canadian, senior, published
                price, and a handover that ends the dependency rather than creating one.
              </p>
            </div>

            <div className="card">
              <span className="tag tag--amber">Vision · 2031</span>
              <h2 style={{ fontSize: "var(--step-2)", marginTop: "1rem" }}>Where we intend to get to</h2>
              <p style={{ fontSize: "var(--step-1)", color: "#e8f0f7", fontWeight: 500, lineHeight: 1.5 }}>
                That no Canadian organization has to discover its own outage from a customer, or
                inherit infrastructure nobody can explain — because the standard of practice we
                demonstrate has become the one the market expects.
              </p>
              <p style={{ fontSize: ".88rem" }}>
                Aspirational by design. We will not get there alone, and we would count it a success if
                competitors made it true before we did.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- VALUES ---------------- */}
      <section className="section">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "3rem" }}>
            <span className="eyebrow">Values · timeless</span>
            <h2>What we stand for</h2>
            <p className="lede">
              Values are worthless unless something changes when you hold them. Each of these has the
              behaviour it actually produces written next to it, so you can check whether we mean it.
            </p>
          </div>

          <div className="grid grid-2">
            {VALUES.map((v, i) => (
              <article className="card" key={v.name}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <span
                    style={{
                      fontSize: "1.6rem",
                      fontWeight: 800,
                      color: "var(--accent-500)",
                      lineHeight: 1,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 style={{ fontSize: "var(--step-1)", marginBottom: ".4rem" }}>{v.name}</h3>
                    <p>{v.line}</p>
                    <p
                      style={{
                        fontSize: ".85rem",
                        paddingTop: ".8rem",
                        borderTop: "1px solid var(--line-soft)",
                        marginBottom: 0,
                      }}
                    >
                      <strong style={{ color: "var(--text)" }}>How you would know:</strong> {v.proof}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- STRATEGY ---------------- */}
      <section className="section section--alt">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "3rem" }}>
            <span className="eyebrow">Strategy · the plan</span>
            <h2>How we intend to get there</h2>
            <p className="lede">
              The bridge between the mission and the vision. Published because a firm that will not say
              where it is going is asking you to trust it further than it has earned.
            </p>
          </div>

          <div className="grid grid-3">
            {STRATEGY.map((s) => (
              <article className="card" key={s.horizon}>
                <span className="tag tag--accent">{s.horizon}</span>
                <h3 style={{ fontSize: "var(--step-1)", marginTop: ".9rem" }}>{s.title}</h3>
                <ul className="check-list">
                  {s.objectives.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div
            className="card"
            style={{ marginTop: "2rem", borderLeft: "4px solid var(--accent-500)" }}
          >
            <h3 style={{ fontSize: "1rem" }}>Where we are right now, stated plainly</h3>
            <p style={{ marginBottom: 0 }}>
              {company.legalName} is newly established and currently taking its first engagements. The
              case studies on this site describe work delivered by the founder in the course of prior
              employment, and are presented as evidence of hands-on capability rather than as this
              company&rsquo;s corporate track record. We think that distinction matters, so we make it
              ourselves rather than waiting to be asked.{" "}
              <Link href="/work">Read the case studies</Link>.
            </p>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
