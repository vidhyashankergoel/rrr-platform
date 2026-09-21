import type { Metadata } from "next";
import { company } from "@/lib/company";
import { Mark, Lockup } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Brand",
  robots: { index: false, follow: false },
};

const PALETTE = [
  { name: "Ink", hex: "#05121F", note: "Primary dark. Backgrounds, the logo tile." },
  { name: "Deep", hex: "#0A1F33", note: "Secondary dark surface." },
  { name: "Teal", hex: "#16B8A6", note: "Primary accent. Actions, links, emphasis." },
  { name: "Teal light", hex: "#2AD3BF", note: "Accent on dark ground." },
  { name: "Amber", hex: "#F0A830", note: "Secondary accent. Use sparingly." },
  { name: "Paper", hex: "#FFFFFF", note: "Light ground." },
  { name: "Mist", hex: "#F4F7FA", note: "Alternate light section." },
  { name: "Slate", hex: "#46596B", note: "Body text on light." },
];

export default function BrandPage() {
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <p className="crumbs">Internal</p>
          <h1>Brand assets</h1>
          <p>
            The mark, the wordmark, the palette and the rules. Everything here is vector, so it scales
            from a favicon to a trade-show banner without a raster file in sight.
          </p>
        </div>
      </section>

      {/* ---------------- LOCKUPS ---------------- */}
      <section className="section">
        <div className="wrap">
          <span className="eyebrow">Lockups</span>
          <h2>Primary marks</h2>

          <div className="grid grid-2" style={{ marginTop: "2rem" }}>
            <div className="card" style={{ display: "grid", placeItems: "center", minHeight: 220 }}>
              <Lockup size={44} />
              <p style={{ fontSize: ".8rem", color: "var(--text-3)", marginTop: "1.5rem", marginBottom: 0 }}>
                Horizontal lockup on light — the default
              </p>
            </div>

            <div
              className="card"
              style={{ display: "grid", placeItems: "center", minHeight: 220, background: "#05121F", border: 0 }}
            >
              <Lockup size={44} onDark />
              <p style={{ fontSize: ".8rem", color: "#7994ac", marginTop: "1.5rem", marginBottom: 0 }}>
                Horizontal lockup on ink
              </p>
            </div>

            <div className="card" style={{ display: "grid", placeItems: "center", minHeight: 220 }}>
              <div style={{ display: "flex", gap: "2rem", alignItems: "flex-end" }}>
                <Mark size={64} />
                <Mark size={40} />
                <Mark size={24} />
                <Mark size={16} />
              </div>
              <p style={{ fontSize: ".8rem", color: "var(--text-3)", marginTop: "1.5rem", marginBottom: 0 }}>
                Mark at 96, 48, 32 and 16 px — legible at favicon size
              </p>
            </div>

            <div className="card" style={{ display: "grid", placeItems: "center", minHeight: 220 }}>
              <div style={{ display: "flex", gap: "2.5rem", alignItems: "center" }}>
                <Mark size={48} tone="ink" />
                <div style={{ background: "#05121F", padding: "1rem", borderRadius: 12 }}>
                  <Mark size={48} tone="paper" ground="#05121F" />
                </div>
                <Mark size={56} boxed />
              </div>
              <p style={{ fontSize: ".8rem", color: "var(--text-3)", marginTop: "1.5rem", marginBottom: 0 }}>
                Single-colour and tiled versions — one-colour print, engraving, app icon
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- PALETTE ---------------- */}
      <section className="section section--alt">
        <div className="wrap">
          <span className="eyebrow">Colour</span>
          <h2>Palette</h2>
          <div className="grid grid-4" style={{ marginTop: "2rem" }}>
            {PALETTE.map((c) => (
              <div className="card" key={c.hex} style={{ padding: "0", overflow: "hidden" }}>
                <div style={{ background: c.hex, height: 90, borderBottom: "1px solid var(--line)" }} />
                <div style={{ padding: "1rem" }}>
                  <strong style={{ display: "block" }}>{c.name}</strong>
                  <code style={{ fontSize: ".8rem", color: "var(--text-3)" }}>{c.hex}</code>
                  <p style={{ fontSize: ".78rem", marginTop: ".5rem", marginBottom: 0 }}>{c.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- TYPE ---------------- */}
      <section className="section">
        <div className="wrap">
          <span className="eyebrow">Typography</span>
          <h2>Type</h2>
          <div className="card" style={{ marginTop: "2rem" }}>
            <p style={{ fontSize: "var(--step-4)", fontWeight: 800, letterSpacing: "-.035em", lineHeight: 1.05, color: "var(--text)", marginBottom: ".5rem" }}>
              Infrastructure
            </p>
            <p style={{ fontSize: ".8rem", color: "var(--text-3)" }}>
              Display — system sans, 800 weight, −3.5% tracking
            </p>
            <hr />
            <p style={{ fontSize: "var(--step-1)", color: "var(--text)" }}>
              Body copy is set in the system sans stack at 400 and 550 weight. It is fast, it is already
              on every device, and it never blocks a paint waiting for a font file.
            </p>
            <hr />
            <p style={{ fontFamily: "var(--font-mono)", fontSize: ".9rem", color: "var(--text-2)" }}>
              terraform apply -var-file=env/prod.tfvars
            </p>
            <p style={{ fontSize: ".8rem", color: "var(--text-3)", marginBottom: 0 }}>
              Mono — for commands, code and figures
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- RULES ---------------- */}
      <section className="section section--alt">
        <div className="wrap-tight">
          <span className="eyebrow">Usage</span>
          <h2>Rules</h2>
          <div className="grid grid-2" style={{ marginTop: "2rem" }}>
            <div className="card">
              <h3 style={{ fontSize: "1rem", color: "var(--ok)" }}>Do</h3>
              <ul className="check-list">
                <li>Keep clear space of at least the tile&rsquo;s corner radius on all sides</li>
                <li>Use the full legal name — {company.legalName} — on contracts and invoices</li>
                <li>Use the mono version when only one colour is available</li>
                <li>Keep the mark on ink, paper, or mist. Nothing else.</li>
              </ul>
            </div>
            <div className="card">
              <h3 style={{ fontSize: "1rem", color: "var(--crit)" }}>Don&rsquo;t</h3>
              <ul className="check-list">
                <li>Stretch, skew, rotate or re-colour the mark</li>
                <li>Place it on a photograph or a busy background</li>
                <li>Re-type the wordmark in a different face</li>
                <li>Use the mark below 16px — use the mono version instead</li>
              </ul>
            </div>
          </div>

          <div className="card" style={{ marginTop: "1.5rem", borderLeft: "4px solid var(--warn)" }}>
            <h3 style={{ fontSize: "1rem" }}>Before you use this commercially</h3>
            <p style={{ marginBottom: 0 }}>
              This mark has not been cleared against the Canadian Trademarks Database or CIPO. Run a
              search before you print it on anything, and consider filing if the name is going to carry
              real goodwill. A NUANS report covers the corporate name, not the trademark — they are
              different searches.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
