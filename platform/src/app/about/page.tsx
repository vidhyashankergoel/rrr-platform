import type { Metadata } from "next";
import { company } from "@/lib/company";
import { DELIVERY_ORG } from "@/lib/agents/delivery-org";
import { PageHead, CtaBand } from "@/components/Bits";

export const metadata: Metadata = {
  title: "About",
  description:
    "Who we are, how we staff engagements, and how we use AI-assisted engineering without letting it near your production systems unsupervised.",
};

/**
 * PEOPLE — do not add a real person here until they have given written consent
 * to appear on the site as part of the company. Publishing someone's name and
 * role without that creates exposure under PIPEDA and misrepresents the firm's
 * capacity to prospective clients.
 */
const people = [
  {
    name: "Vidhya Shanker Goel",
    role: "Founder & Principal Platform Engineer",
    location: "Toronto, ON",
    bio: "Eight-plus years of production infrastructure across banking, aviation, insurance and AI research. Led the migration of 180+ microservices to AWS for the Greater Toronto Airports Authority with zero service disruption, and has led engineering teams of four and eight.",
    certs: ["CKA", "AZ-203", "AZ-900", "Oracle OCP"],
  },
];

export default function AboutPage() {
  const levels = [
    { level: "principal", label: "Principal" },
    { level: "architect", label: "Architecture" },
    { level: "manager", label: "Delivery management" },
    { level: "lead", label: "Team leads" },
    { level: "engineer", label: "Engineers" },
    { level: "assurance", label: "Assurance" },
  ] as const;

  return (
    <>
      <PageHead
        crumb="About"
        title="A small firm that behaves like a large one"
        lede="Senior engineers, published prices, written acceptance criteria, and everything handed back in your repositories. No pyramid, no bench, no bait-and-switch on who does the work."
      />

      {/* ---------------- FOUNDER ---------------- */}
      <section className="section">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "2.5rem" }}>
            <span className="eyebrow">Who you deal with</span>
            <h2>The people, not the logo</h2>
          </div>
          <div className="grid grid-3">
            {people.map((p) => (
              <article className="card" key={p.name}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    background: "var(--brand-700)",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: "1.3rem",
                    marginBottom: "1rem",
                  }}
                >
                  {p.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </div>
                <h3 style={{ marginBottom: ".15rem" }}>{p.name}</h3>
                <p style={{ color: "var(--accent-500)", fontWeight: 650, marginBottom: ".15rem" }}>{p.role}</p>
                <p style={{ fontSize: ".82rem", color: "var(--text-3)" }}>{p.location}</p>
                <p>{p.bio}</p>
                <div className="tags">
                  {p.certs.map((c) => (
                    <span className="tag tag--accent" key={c}>{c}</span>
                  ))}
                </div>
              </article>
            ))}

            <article className="card" style={{ background: "var(--bg-alt)", border: 0 }}>
              <h3 style={{ fontSize: "var(--step-1)" }}>How we staff engagements</h3>
              <p>
                A pod sized to the work: one senior engineer for a focused build, up to an architect,
                several engineers and a delivery manager for a programme. Specialists in data, security
                and databases join for the workstreams that need them.
              </p>
              <p style={{ marginBottom: 0 }}>
                <strong style={{ color: "var(--text)" }}>The named engineers on your proposal are the
                engineers who do the work.</strong> You meet them before you sign anything. We do not bid
                with senior people and staff with juniors.
              </p>
            </article>

            <article className="card" style={{ background: "var(--bg-alt)", border: 0 }}>
              <h3 style={{ fontSize: "var(--step-1)" }}>Where we are</h3>
              <p>
                Toronto, Ontario. Most delivery is remote across North American time zones, with on-site
                available in the Greater Toronto Area for workshops, cutovers and discovery.
              </p>
              <p style={{ marginBottom: 0 }}>
                Canadian-incorporated, comfortable with standard Canadian procurement terms, and eligible
                for Reliability Status clearance work.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ---------------- AI-ASSISTED ENGINEERING ---------------- */}
      <section className="section section--dark">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "3rem" }}>
            <span className="eyebrow">How we work</span>
            <h2>AI-assisted engineering, with a human on every gate</h2>
            <p className="lede">
              We run an internal agent system that handles discovery, architecture drafting, task
              decomposition and documentation. It is genuinely faster. It is also genuinely constrained,
              and we would rather tell you exactly how than wave the word &ldquo;AI&rdquo; at you.
            </p>
          </div>

          <div className="grid grid-3">
            <div className="card">
              <h3 style={{ fontSize: "var(--step-1)" }}>What the agents do</h3>
              <ul className="check-list">
                <li>Read the repository and cloud estate, and report what is actually there</li>
                <li>Draft architecture options and decision records</li>
                <li>Decompose work into tasks with acceptance criteria</li>
                <li>Produce Terraform, manifests and pipeline definitions for review</li>
                <li>Write runbooks and handover documentation</li>
              </ul>
            </div>
            <div className="card">
              <h3 style={{ fontSize: "var(--step-1)" }}>What they never do</h3>
              <ul className="check-list">
                <li>Apply a change to any environment of yours</li>
                <li>Run a destructive command</li>
                <li>Make a cloud, region or architecture decision that is yours to make</li>
                <li>Send you anything — email, proposal or contract — without a human approving it</li>
                <li>Commit us to a price, a date or a scope</li>
              </ul>
            </div>
            <div className="card">
              <h3 style={{ fontSize: "var(--step-1)" }}>Why it is safe</h3>
              <p>
                Every agent output enters a review chain: engineer to team lead to delivery manager to a
                named human. Every outward-facing action is queued for explicit approval and recorded
                with who decided, when, and why.
              </p>
              <p style={{ marginBottom: 0 }}>
                You get the speed of automation with the accountability of a person signing their name
                to it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- DELIVERY ORG ---------------- */}
      <section className="section section--alt">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "2.5rem" }}>
            <span className="eyebrow">Delivery structure</span>
            <h2>Who reviews what</h2>
            <p className="lede">
              Every engagement runs through the same structure, whether it is delivered by two people or
              ten. Each level reviews the level below it.
            </p>
          </div>

          <div className="grid grid-3">
            {levels.map((l) => {
              const members = DELIVERY_ORG.filter((a) => a.level === l.level);
              if (members.length === 0) return null;
              return (
                <div className="card" key={l.level}>
                  <span className="tag tag--accent">{l.label}</span>
                  <ul style={{ marginTop: "1rem", marginBottom: 0 }}>
                    {members.map((m) => (
                      <li key={m.key}>
                        <strong style={{ color: "var(--text)" }}>{m.title.split("—")[0]?.trim()}</strong>
                        <br />
                        <span style={{ fontSize: ".85rem" }}>{m.produces[0]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------- PRINCIPLES ---------------- */}
      <section className="section">
        <div className="wrap-tight">
          <div className="center" style={{ marginBottom: "2.5rem" }}>
            <span className="eyebrow">How we behave</span>
            <h2>Five things we hold to</h2>
          </div>
          <div className="timeline">
            <div className="tl-item">
              <h4>We tell you when you don&rsquo;t need us</h4>
              <p>
                If a two-day fix solves it, we will say so on the free call rather than shape it into a
                six-week engagement. It costs us a project and earns us the next three.
              </p>
            </div>
            <div className="tl-item">
              <h4>We do not silently choose for you</h4>
              <p>
                Cloud, region, Kubernetes distribution, state backend, deployment strategy, recovery
                objectives — these are your decisions. We bring options and trade-offs, not a fait accompli.
              </p>
            </div>
            <div className="tl-item">
              <h4>We build the simplest thing that works</h4>
              <p>
                Every additional component is something your team has to operate at 03:00. If a senior
                engineer would call it unnecessarily complicated, we simplify it.
              </p>
            </div>
            <div className="tl-item">
              <h4>We re-quote scope changes rather than absorb them</h4>
              <p>
                Silent absorption becomes a surprise invoice or a missed deadline. Neither is fair to
                you, so changes are priced when they arise.
              </p>
            </div>
            <div className="tl-item">
              <h4>We hand it back properly</h4>
              <p>
                Everything in your accounts and repositories, with runbooks and recorded sessions. The
                test: your team can run it the day we leave.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- CORPORATE ---------------- */}
      <section className="section section--alt">
        <div className="wrap-tight">
          <div className="card">
            <h2 style={{ fontSize: "var(--step-2)" }}>Corporate information</h2>
            <div className="table-scroll" style={{ border: 0 }}>
              <table style={{ minWidth: 0 }}>
                <tbody>
                  <tr>
                    <td><strong>Legal name</strong></td>
                    <td>{company.legalName}</td>
                  </tr>
                  <tr>
                    <td><strong>Jurisdiction</strong></td>
                    <td>{company.regionName}, {company.country}</td>
                  </tr>
                  <tr>
                    <td><strong>Corporation number</strong></td>
                    <td>{company.corporationNumber || "Pending incorporation"}</td>
                  </tr>
                  <tr>
                    <td><strong>Business number (CRA)</strong></td>
                    <td>{company.businessNumber || "Pending registration"}</td>
                  </tr>
                  <tr>
                    <td><strong>GST/HST number</strong></td>
                    <td>{company.gstHstNumber || "Registration in progress"}</td>
                  </tr>
                  <tr>
                    <td><strong>Registered office</strong></td>
                    <td>{company.addressLine ? `${company.addressLine}, ` : ""}{company.city}, {company.region} {company.postalCode}</td>
                  </tr>
                  <tr>
                    <td><strong>Insurance</strong></td>
                    <td>Commercial general liability, professional liability and cyber — certificates on request</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
