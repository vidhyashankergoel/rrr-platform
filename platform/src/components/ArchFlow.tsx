/**
 * DELIVERY ARCHITECTURE — the path a change takes from commit to production.
 *
 * A server component. The animation is pure CSS on inline SVG, so this ships
 * no JavaScript at all: the diagram is in the HTML, it renders with scripting
 * disabled, and a crawler reads the same labels a person does.
 *
 * ACCURACY. Every stage here is one this firm actually runs, drawn from the
 * engagement record — reviewed pull requests, scanning gates, ephemeral
 * environments, canary and blue-green rollout, mesh-level traffic shifting,
 * and the observability loop that decides whether a rollout proceeds. Nothing
 * is aspirational and nothing identifies a client: these are the standard
 * components of the discipline, not anyone's proprietary arrangement.
 *
 * MOBILE. The diagram sits in its own horizontal scroller below 900px rather
 * than scaling down. A 1040-wide viewBox squeezed into 375px renders 13px
 * labels at 4px, which is not a diagram, it is a texture. A diagram is one of
 * the few things that legitimately scrolls sideways — unlike the pricing
 * table, where the horizontal scroll hid the price.
 */

const STAGES = [
  { x: 40, label: "Commit", sub: "Reviewed PR" },
  { x: 205, label: "Build & scan", sub: "SAST · SCA · IaC · image" },
  { x: 390, label: "Ephemeral env", sub: "Per-PR sandbox" },
  { x: 575, label: "Progressive", sub: "Canary → blue-green" },
  { x: 770, label: "Production", sub: "Multi-cloud" },
] as const;

const CLOUDS = [
  { x: 770, y: 268, label: "AWS" },
  { x: 862, y: 268, label: "Azure" },
  { x: 954, y: 268, label: "GCP" },
] as const;

export default function ArchFlow() {
  return (
    <figure className="archflow">
      <div className="archflow__scroll">
        <svg
          className="archflow__svg"
          viewBox="0 0 1040 360"
          role="img"
          aria-labelledby="archflow-title archflow-desc"
        >
          <title id="archflow-title">How a change reaches production</title>
          <desc id="archflow-desc">
            A commit in a reviewed pull request moves through build and security scanning, into a
            per-pull-request ephemeral environment, then a progressive rollout that starts as a
            canary and completes as a blue-green cutover, and finally to production running across
            AWS, Azure and Google Cloud. Observability data flows back to the rollout stage, where
            a breached service level objective rolls the change back automatically.
          </desc>

          <defs>
            <linearGradient id="af-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="var(--accent-500)" stopOpacity=".35" />
              <stop offset="1" stopColor="var(--accent-300)" stopOpacity=".9" />
            </linearGradient>
            <linearGradient id="af-box" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--surface)" />
              <stop offset="1" stopColor="var(--surface-2)" />
            </linearGradient>
          </defs>

          {/* ---- the spine, and the packet travelling it ---- */}
          <path id="af-spine" className="af-spine" d="M120 120 H 850" />
          <path className="af-spine-flow" d="M120 120 H 850" />

          {/* ---- the feedback loop, drawn beneath ---- */}
          <path
            className="af-loop"
            d="M830 150 C 830 230, 700 230, 660 180"
            markerEnd="url(#af-arrow)"
          />
          <marker
            id="af-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" fill="var(--amber-500)" />
          </marker>
          <text className="af-loop-label" x="745" y="248" textAnchor="middle">
            SLO breach → automatic rollback
          </text>

          {/* ---- stages ---- */}
          {STAGES.map((s, i) => (
            <g key={s.label} className="af-stage" style={{ ["--i" as string]: i }}>
              <rect x={s.x} y={86} width={150} height={68} rx={12} />
              <text className="af-stage__label" x={s.x + 75} y={113} textAnchor="middle">
                {s.label}
              </text>
              <text className="af-stage__sub" x={s.x + 75} y={133} textAnchor="middle">
                {s.sub}
              </text>
              <circle className="af-node" cx={s.x + 75} cy={86} r={4} />
            </g>
          ))}

          {/* ---- multi-cloud runtime ---- */}
          {CLOUDS.map((c, i) => (
            <g key={c.label} className="af-cloud" style={{ ["--i" as string]: i }}>
              <rect x={c.x} y={c.y} width={76} height={34} rx={8} />
              <text x={c.x + 38} y={c.y + 22} textAnchor="middle">
                {c.label}
              </text>
            </g>
          ))}
          <path className="af-fan" d="M845 154 V 200 H 808 V 268" />
          <path className="af-fan" d="M845 154 V 200 H 900 V 268" />
          <path className="af-fan" d="M845 154 V 200 H 992 V 268" />

          {/* ---- gate annotations ---- */}
          <text className="af-gate" x={280} y={72} textAnchor="middle">
            blocks on critical
          </text>
          <text className="af-gate" x={465} y={72} textAnchor="middle">
            destroyed on merge
          </text>
          <text className="af-gate" x={650} y={72} textAnchor="middle">
            mesh-weighted traffic
          </text>
        </svg>
      </div>

      <figcaption className="archflow__cap">
        Every stage is a gate. A change that fails scanning never reaches an environment, and a
        rollout whose error budget burns too fast reverses itself without anyone being paged.
      </figcaption>
    </figure>
  );
}
