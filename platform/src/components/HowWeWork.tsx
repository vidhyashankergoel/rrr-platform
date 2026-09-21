/**
 * HOW WE WORK — the delivery model as a diagram rather than prose.
 *
 * Inline SVG, no library, no raster asset. It scales to any width, inherits
 * the theme's colours through CSS custom properties, and carries a real
 * text alternative so it is not a hole in the page for a screen reader.
 */

export default function HowWeWork() {
  return (
    <figure className="flow">
      <svg
        viewBox="0 0 980 300"
        role="img"
        aria-labelledby="flowTitle flowDesc"
        preserveAspectRatio="xMidYMid meet"
      >
        <title id="flowTitle">How an engagement flows, and where the human gates sit</title>
        <desc id="flowDesc">
          Five stages run left to right: Scoping call, free and 30 minutes; Discovery, three to five
          days; Fixed proposal, within five business days; Delivery, in weekly increments; and
          Handover, included in the price. Above the flow, an AI-assisted layer reads repositories,
          drafts architecture, decomposes work and writes documentation. Below it, a human approval
          gate sits between every stage, and every change that touches a client environment is
          executed by a named person, never by an agent.
        </desc>

        <defs>
          <linearGradient id="flowLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--accent-500)" stopOpacity="0.25" />
            <stop offset="0.5" stopColor="var(--accent-500)" stopOpacity="0.9" />
            <stop offset="1" stopColor="var(--amber-500)" stopOpacity="0.7" />
          </linearGradient>
          <marker id="flowArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0 0 L10 5 L0 10 z" fill="var(--accent-500)" />
          </marker>
        </defs>

        {/* --- AI-assisted layer --------------------------------------- */}
        <rect x="24" y="16" width="932" height="52" rx="12" className="flow__band flow__band--ai" />
        <text x="44" y="38" className="flow__bandLabel">AI-ASSISTED LAYER</text>
        <text x="44" y="56" className="flow__bandBody">
          Reads the real repository · drafts architecture · decomposes work · writes documentation
        </text>

        {/* --- The spine ------------------------------------------------ */}
        <line x1="60" y1="150" x2="920" y2="150" stroke="url(#flowLine)" strokeWidth="3" markerEnd="url(#flowArrow)" />

        {/* --- Stages ---------------------------------------------------- */}
        {[
          { x: 60, n: "1", label: "Scoping call", meta: "Free · 45 min" },
          { x: 262, n: "2", label: "Discovery", meta: "3–5 days" },
          { x: 464, n: "3", label: "Fixed proposal", meta: "Within 5 days" },
          { x: 666, n: "4", label: "Delivery", meta: "Weekly increments" },
          { x: 868, n: "5", label: "Handover", meta: "Included" },
        ].map((s) => (
          <g key={s.n} transform={`translate(${s.x} 150)`}>
            <circle r="26" className="flow__node" />
            <text y="7" textAnchor="middle" className="flow__num">{s.n}</text>
            <text y="52" textAnchor="middle" className="flow__label">{s.label}</text>
            <text y="70" textAnchor="middle" className="flow__meta">{s.meta}</text>
          </g>
        ))}

        {/* --- Human gates ------------------------------------------------ */}
        {[161, 363, 565, 767].map((x, i) => (
          <g key={i} transform={`translate(${x} 150)`}>
            <rect x="-13" y="-13" width="26" height="26" rx="7" className="flow__gate" />
            <path d="M-5 0 L-1.5 4 L5 -4" className="flow__tick" />
          </g>
        ))}

        {/* --- Human gate band -------------------------------------------- */}
        <rect x="24" y="238" width="932" height="46" rx="12" className="flow__band flow__band--human" />
        <text x="44" y="258" className="flow__bandLabel flow__bandLabel--human">HUMAN GATE AT EVERY STEP</text>
        <text x="44" y="275" className="flow__bandBody">
          A named person approves every outward action. No agent applies a change to your environment.
        </text>
      </svg>

      <figcaption>
        Agents propose. Humans dispose. The system executes.
      </figcaption>
    </figure>
  );
}
