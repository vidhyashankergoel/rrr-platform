import { currencyFromDollars as money } from "@/lib/company";
import { auditOffer } from "@/lib/catalogue";

/**
 * WHY US — an honest comparison, including where we are the wrong answer.
 *
 * A comparison table that only flatters its author gets discounted the moment
 * a buyer reads it. This one names the cases where a large consultancy, a
 * freelancer, or hiring is genuinely the better choice, which is what makes
 * the rest of it credible.
 */

const COLUMNS: Array<{ key: string; label: string; highlight?: boolean }> = [
  { key: "us", label: "Us", highlight: true },
  { key: "big", label: "Large consultancy" },
  { key: "free", label: "Freelancer" },
  { key: "hire", label: "Hiring in-house" },
];

const ROWS: Array<{
  question: string;
  us: string;
  big: string;
  free: string;
  hire: string;
}> = [
  {
    question: "Do you know the price before you talk to them?",
    us: "Published on the site",
    big: "After two meetings",
    free: "Usually hourly",
    hire: "Salary plus 25–30% loaded",
  },
  {
    question: "Who actually does the work?",
    us: "The named engineers on the proposal",
    big: "Often juniors behind a senior pitch",
    free: "The person you met",
    hire: "Whoever you can hire",
  },
  {
    question: "Who carries the overrun risk?",
    us: "Us, on fixed scope",
    big: "You, via change requests",
    free: "You",
    hire: "You",
    },
  {
    question: "What happens when they leave?",
    us: "Runbooks, recorded handover, you own it",
    big: "A managed-service contract",
    free: "Whatever was documented",
    hire: "Nothing — they were the documentation",
  },
  {
    question: "Time to start",
    us: "2–3 weeks",
    big: "1–3 months",
    free: "Days",
    hire: "3–6 months to hire and onboard",
  },
  {
    question: "Can you stop cheaply?",
    us: "Exit after any phase, no penalty",
    big: "Contractual notice period",
    free: "Yes",
    hire: "No — it is a person's job",
  },
  {
    question: "Depth across cloud, data and security",
    us: "A pod with real specialists",
    big: "Yes, at scale",
    free: "One person's range",
    hire: "One person's range",
  },
];

const HONEST = [
  {
    title: "A large consultancy is better when",
    body: "You need hundreds of people, a global footprint, or a name your board already recognizes. We are small, deliberately, and we will say so rather than pretend otherwise.",
  },
  {
    title: "A freelancer is better when",
    body: "The task is small, well-defined, and you only need one pair of hands for a few days. Our smallest engagement is the audit at " + money(auditOffer.price) + " — below that, a freelancer is the right call.",
  },
  {
    title: "Hiring is better when",
    body: "The work is permanent and ongoing. If you would have to find work for this person after the project, it is a project. If you would not, it is a role — hire for it.",
  },
];

export default function WhyUs() {
  return (
    <>
      <div className="compare">
        <table>
          <caption className="visually-hidden">
            How we compare with a large consultancy, a freelancer and hiring in-house
          </caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="visually-hidden">Question</span>
              </th>
              {COLUMNS.map((c) => (
                <th scope="col" key={c.key} className={c.highlight ? "compare__us" : undefined}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.question}>
                <th scope="row">{r.question}</th>
                <td className="compare__us">{r.us}</td>
                <td>{r.big}</td>
                <td>{r.free}</td>
                <td>{r.hire}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-3" style={{ marginTop: "2.5rem" }}>
        {HONEST.map((h) => (
          <div className="card" key={h.title} style={{ background: "var(--bg-alt)", border: 0 }}>
            <h3 style={{ fontSize: "1rem" }}>{h.title}</h3>
            <p style={{ fontSize: ".9rem", marginBottom: 0 }}>{h.body}</p>
          </div>
        ))}
      </div>

      <p
        style={{
          textAlign: "center",
          fontSize: ".9rem",
          color: "var(--text-2)",
          maxWidth: "62ch",
          margin: "2rem auto 0",
        }}
      >
        If one of those three describes you, take that option. We would rather lose the
        engagement than take work we are the wrong answer to.
      </p>
    </>
  );
}
