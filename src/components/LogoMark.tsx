// Static SVG aperture mark — server-compatible, no "use client" needed.
// Geometry is baked from the design-lab preset:
//   N=7, t=0.3, skew=0.5, overlap=0.65, curve=1, twist=0.35,
//   bladeStroke=0.5, shadow=0.8 (stdDeviation=4)
//
// Theming: fill/stroke colours are driven by Tailwind's fill-* / stroke-*
// utilities so the mark adapts to light and dark mode automatically.

const R = 100;
const N_BLADES = 7;
const T = 0.3;
const SKEW = 0.5;
const OVERLAP = 0.65;
const CURVE = 1.0;
const TWIST = 0.35;
const BLADE_STROKE_W = 0.5;
const SHADOW_STD = 4; // shadowIntensity 0.8 × 5
const STEP_DEG = 360 / N_BLADES;

function fmt(x: number, y: number) {
  return `${x.toFixed(3)},${y.toFixed(3)}`;
}

// Build the blade path once at module load — same geometry as the design lab.
const BLADE_PATH = (() => {
  const step = (2 * Math.PI) / N_BLADES;
  const rInner = R * (0.08 + 0.72 * T);
  const arcStart = -OVERLAP * step;
  const arcEnd = step * (1 + OVERLAP);
  const largeArc = (arcEnd - arcStart) > Math.PI ? 1 : 0;
  const ax0 = R * Math.cos(arcStart);
  const ay0 = R * Math.sin(arcStart);
  const ax1 = R * Math.cos(arcEnd);
  const ay1 = R * Math.sin(arcEnd);
  const off = TWIST * (1 - T) * step;
  const p2x = rInner * Math.cos(step * (1 + SKEW) + off);
  const p2y = rInner * Math.sin(step * (1 + SKEW) + off);
  const p3x = rInner * Math.cos(step * SKEW + off);
  const p3y = rInner * Math.sin(step * SKEW + off);
  const pull = 1 + CURVE * 0.85;
  const cpTx = ((ax1 + p2x) / 2) * pull;
  const cpTy = ((ay1 + p2y) / 2) * pull;
  const cpLx = ((p3x + ax0) / 2) * pull;
  const cpLy = ((p3y + ay0) / 2) * pull;
  return [
    `M ${fmt(ax0, ay0)}`,
    `A ${R} ${R} 0 ${largeArc} 1 ${fmt(ax1, ay1)}`,
    `Q ${fmt(cpTx, cpTy)} ${fmt(p2x, p2y)}`,
    `L ${fmt(p3x, p3y)}`,
    `Q ${fmt(cpLx, cpLy)} ${fmt(ax0, ay0)}`,
    `Z`,
  ].join(" ");
})();

// Aperture opening polygon vertices — same P3 corners as the design lab.
const COVER_POINTS = (() => {
  const step = (2 * Math.PI) / N_BLADES;
  const rInner = R * (0.08 + 0.72 * T);
  const off = TWIST * (1 - T) * step;
  return Array.from({ length: N_BLADES }, (_, i) => {
    const a = i * step + SKEW * step + off;
    return `${(rInner * Math.cos(a)).toFixed(3)},${(rInner * Math.sin(a)).toFixed(3)}`;
  }).join(" ");
})();

// Outer decorative ring: thin circle at r=112 + 36 graduation tick marks.
// 9 major ticks (every 40°, matching the 9 f-stop positions) + 27 minor ones.
const RING_TICKS = Array.from({ length: 36 }, (_, i) => {
  const angle = ((i * 10) / 180) * Math.PI;
  const major = i % 4 === 0;
  const r = 112;
  const inner = r - (major ? 8 : 4);
  return {
    x1: r * Math.cos(angle),
    y1: r * Math.sin(angle),
    x2: inner * Math.cos(angle),
    y2: inner * Math.sin(angle),
    major,
  };
});

interface LogoMarkProps {
  /** Render size in px. Default 80. */
  size?: number;
  /** Must be unique per page — used as SVG def ID prefix. */
  uid?: string;
  className?: string;
}

export default function LogoMark({
  size = 80,
  uid = "logo",
  className,
}: LogoMarkProps) {
  return (
    <svg
      viewBox="-125 -125 250 250"
      width={size}
      height={size}
      className={className}
      style={{ display: "block", flexShrink: 0 }}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={`${uid}-clip`}>
          <circle r={R} />
        </clipPath>
        <filter
          id={`${uid}-shadow`}
          x="-25%"
          y="-25%"
          width="150%"
          height="150%"
        >
          <feDropShadow
            dx={0}
            dy={0}
            stdDeviation={SHADOW_STD}
            floodColor="black"
            floodOpacity={0.55}
          />
        </filter>
        {/* Per-blade masks for correct circular z-order */}
        {Array.from({ length: N_BLADES }, (_, i) => (
          <mask id={`${uid}-bm-${i}`} key={i}>
            <rect x="-120" y="-120" width="240" height="240" fill="white" />
            <g transform={`rotate(${STEP_DEG * ((i + 1) % N_BLADES)})`}>
              <path d={BLADE_PATH} fill="black" />
            </g>
          </mask>
        ))}
      </defs>

      {/* Aperture blades — clipped to outer disc */}
      <g clipPath={`url(#${uid}-clip)`}>
        {Array.from({ length: N_BLADES }, (_, i) => (
          <g key={i} mask={`url(#${uid}-bm-${i})`}>
            <g transform={`rotate(${STEP_DEG * i})`}>
              <path
                d={BLADE_PATH}
                className="fill-zinc-900 stroke-stone-100 dark:fill-zinc-100 dark:stroke-zinc-950"
                strokeWidth={BLADE_STROKE_W}
                strokeLinejoin="miter"
                strokeMiterlimit={10}
                filter={`url(#${uid}-shadow)`}
              />
            </g>
          </g>
        ))}
      </g>

      {/* Cover polygon: paints the aperture opening in the page background
          colour to hide any shadow bleed from the blade filter. */}
      <polygon
        points={COVER_POINTS}
        className="fill-stone-100 dark:fill-zinc-950"
      />

      {/* Outer ring with graduation marks — very understated (opacity 0.2).
          36 ticks in total: 9 major (at f-stop positions, 40° apart) and
          27 minor. Suggests a physical aperture ring without being loud. */}
      <g
        className="stroke-zinc-900 dark:stroke-zinc-100"
        opacity={0.2}
        fill="none"
      >
        <circle r={112} strokeWidth={0.5} />
        {RING_TICKS.map((tk, i) => (
          <line
            key={i}
            x1={tk.x1}
            y1={tk.y1}
            x2={tk.x2}
            y2={tk.y2}
            strokeWidth={tk.major ? 0.75 : 0.4}
          />
        ))}
      </g>
    </svg>
  );
}
