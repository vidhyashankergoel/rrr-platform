import type { Metadata } from "next";
import { caseStudies } from "@/lib/catalogue";
import { displayClient, attributionLine, PRIOR_WORK_DISCLAIMER } from "@/lib/attribution";
import { PageHead, CtaBand } from "@/components/Bits";

export const metadata: Metadata = {
  title: "Our work",
  description:
    "Case studies from aviation, banking, insurance, sport and AI research — including a 180-microservice AWS migration with zero service disruption.",
};

export default function WorkPage() {
  return (
    <>
      <PageHead
        crumb="Our work"
        title="Production systems, under real constraints"
        lede="Five engagements across aviation, banking, insurance, sport and AI research. Every figure below is one we can substantiate."
      />

      <section className="section">
        <div className="wrap">
          <div className="grid" style={{ gap: "2rem" }}>
            {caseStudies.map((c) => (
              <article
                className="card"
                key={c.slug}
                id={c.slug}
                style={{ padding: "clamp(1.5rem, 3vw, 2.5rem)" }}
              >
                <div className="tags" style={{ marginBottom: "1rem" }}>
                  <span className="tag tag--accent">{c.sector}</span>
                  <span className="tag">{c.period}</span>
                </div>

                <h2 style={{ fontSize: "var(--step-2)" }}>{displayClient(c)}</h2>
                <p style={{ fontSize: ".82rem", color: "var(--text-3)", marginTop: "-.5rem" }}>{attributionLine(c)}</p>
                <p style={{ fontSize: "var(--step-1)", color: "var(--text)", fontWeight: 600, lineHeight: 1.4 }}>
                  {c.headline}
                </p>

                <div className="split" style={{ gap: "2.5rem", alignItems: "start", marginTop: "1.5rem" }}>
                  <div>
                    <h3 style={{ fontSize: ".82rem", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-3)" }}>
                      The situation
                    </h3>
                    <p>{c.problem}</p>

                    <h3 style={{ fontSize: ".82rem", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-3)" }}>
                      What we did
                    </h3>
                    <ul>
                      {c.work.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="stats" style={{ gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                      {c.results.map(([v, l]) => (
                        <div key={l}>
                          <div className="stat__num" style={{ fontSize: "1.5rem" }}>{v}</div>
                          <div className="stat__label">{l}</div>
                        </div>
                      ))}
                    </div>
                    <div className="tags" style={{ marginTop: "1.5rem" }}>
                      {c.stack.map((t) => (
                        <span className="tag" key={t}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div
            className="card"
            style={{ marginTop: "2.5rem", background: "var(--bg-alt)", border: 0 }}
          >
            <h2 style={{ fontSize: "1rem" }}>About these engagements</h2>
            <p style={{ fontSize: ".88rem", marginBottom: 0, maxWidth: "78ch" }}>
              {PRIOR_WORK_DISCLAIMER}
            </p>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
