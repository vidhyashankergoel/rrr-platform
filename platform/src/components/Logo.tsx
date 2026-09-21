/**
 * THE RRR MARK — interlocking monogram.
 *
 * Three R's built from one geometric skeleton, overlapped so the bowls weave
 * through each other. Each R is drawn twice: once in the background colour at
 * a wider stroke to knock a clean gap out of whatever sits beneath it, then in
 * its own colour. Drawing left to right in that order produces the weave
 * without needing masks or clip paths — which means it survives being pasted
 * into Word, printed in one colour, or rendered at 16px.
 *
 * CONSTRUCTION of a single R, in the 0–102 unit grid:
 *   stem   vertical at x=4, from the baseline up to the bowl
 *   bowl   major arc from (4,30) round to (4,74) — a true circle, not an oval
 *   leg    straight diagonal from the stem junction down to (46,102)
 *
 * Monoline throughout: one stroke weight, round caps, round joins.
 */

const R_PATH = "M 4,102 V 30 A 31,31 0 1 1 4,74 L 46,102";
const R_OFFSET = 57;
const STROKE = 12;
const KNOCKOUT_EXTRA = 8;

export type MarkTone = "colour" | "ink" | "paper";

export function Mark({
  size = 32,
  tone = "colour",
  /** The ground the mark sits on. Needed to cut the weave gaps cleanly. */
  ground = "#FFFFFF",
  title = "RRR Solution Providers",
  boxed = false,
}: {
  size?: number;
  tone?: MarkTone;
  ground?: string;
  title?: string;
  /** Wrap in the ink tile — for avatars, favicons and app icons. */
  boxed?: boolean;
}) {
  // Tonal set: three values of one hue so the weave reads, and so the whole
  // thing collapses gracefully to a single colour when it has to.
  const colours =
    tone === "colour"
      ? ["#0E6E7C", "#12A090", "#2AD3BF"]
      : tone === "paper"
        ? ["#FFFFFF", "#FFFFFF", "#FFFFFF"]
        : ["#05121F", "#05121F", "#05121F"];

  const bg = boxed ? "#05121F" : ground;
  const boxedColours = boxed && tone === "colour" ? ["#0E6E7C", "#12A090", "#2AD3BF"] : colours;

  const inner = (
    <g>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${i * R_OFFSET} 0)`}>
          {/* Knockout — cuts the gap that makes the weave read */}
          {i > 0 && (
            <path
              d={R_PATH}
              fill="none"
              stroke={bg}
              strokeWidth={STROKE + KNOCKOUT_EXTRA}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          <path
            d={R_PATH}
            fill="none"
            stroke={boxedColours[i]}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ))}
    </g>
  );

  if (boxed) {
    return (
      <svg
        viewBox="0 0 96 96"
        width={size}
        height={size}
        role="img"
        aria-label={title}
        style={{ flex: "none", display: "block" }}
      >
        <title>{title}</title>
        <rect width="96" height="96" rx="22" fill="#05121F" />
        <g transform="translate(7 24) scale(0.40)">{inner}</g>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 196 118"
      width={(size / 118) * 196}
      height={size}
      role="img"
      aria-label={title}
      style={{ flex: "none", display: "block", overflow: "visible" }}
    >
      <title>{title}</title>
      <g transform="translate(6 2)">{inner}</g>
    </svg>
  );
}

export function Wordmark({ onDark = false }: { onDark?: boolean }) {
  return (
    <span className="brandword" data-ondark={onDark ? "true" : undefined}>
      RRR Solution Providers
      <span className="brandword__sub">Cloud &amp; Platform Engineering</span>
    </span>
  );
}

export function Lockup({
  size = 30,
  onDark = false,
  tone,
}: {
  size?: number;
  onDark?: boolean;
  tone?: MarkTone;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: ".7rem" }}>
      <Mark size={size} tone={tone ?? "colour"} ground={onDark ? "#05121F" : "#FFFFFF"} />
      <Wordmark onDark={onDark} />
    </span>
  );
}
