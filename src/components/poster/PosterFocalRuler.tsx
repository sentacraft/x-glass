import type { Lens } from "@/lib/types";

// Per-lens bar colors (zinc-900 → zinc-500 → zinc-400 → zinc-300)
const LENS_COLORS = ["#18181b", "#71717a", "#a1a1aa", "#d4d4d8"];

// Standard focal length reference ticks
const TICK_CANDIDATES = [10, 14, 18, 24, 35, 50, 70, 100, 135, 200, 300, 400];

interface PosterFocalRulerProps {
  lenses: Lens[];
  /** Total width available (matches poster content width). */
  width?: number;
}

export function PosterFocalRuler({ lenses, width = 670 }: PosterFocalRulerProps) {
  const n = lenses.length;

  // Compute log10 display range with padding
  const rawMin = Math.min(...lenses.map((l) => l.focalLengthMin));
  const rawMax = Math.max(...lenses.map((l) => l.focalLengthMax));
  const viewMin = Math.max(1, rawMin * 0.85);
  const viewMax = rawMax * 1.08;
  const logMin = Math.log10(viewMin);
  const logMax = Math.log10(viewMax);

  const toX = (mm: number) =>
    ((Math.log10(Math.max(1, mm)) - logMin) / (logMax - logMin)) * width;

  const BAR_H = 6;
  const BAR_GAP = 5;
  const TICK_AREA = 20; // height for tick marks + labels below the bars
  const totalH = n * (BAR_H + BAR_GAP) - BAR_GAP + TICK_AREA;

  const barsBottom = n * (BAR_H + BAR_GAP) - BAR_GAP;

  const visibleTicks = TICK_CANDIDATES.filter(
    (mm) => mm >= viewMin * 0.92 && mm <= viewMax * 1.05
  );

  return (
    <svg
      width={width}
      height={totalH}
      viewBox={`0 0 ${width} ${totalH}`}
      style={{ overflow: "visible" }}
    >
      {/* Track */}
      <rect x={0} y={0} width={width} height={barsBottom} rx={3} fill="#f4f4f5" />

      {/* Per-lens bars */}
      {lenses.map((lens, i) => {
        const x1 = toX(lens.focalLengthMin);
        const x2 = toX(lens.focalLengthMax);
        const y = i * (BAR_H + BAR_GAP);
        const color = LENS_COLORS[i] ?? LENS_COLORS[LENS_COLORS.length - 1];
        const isPrime = lens.focalLengthMin === lens.focalLengthMax;

        if (isPrime) {
          // Vertical tick for prime lens
          return (
            <rect
              key={i}
              x={Math.max(0, x1 - 1.5)}
              y={y}
              width={3}
              height={BAR_H}
              rx={1.5}
              fill={color}
            />
          );
        }

        return (
          <rect
            key={i}
            x={x1}
            y={y}
            width={Math.max(4, x2 - x1)}
            height={BAR_H}
            rx={BAR_H / 2}
            fill={color}
          />
        );
      })}

      {/* Tick marks and labels */}
      {visibleTicks.map((mm) => {
        const x = toX(mm);
        return (
          <g key={mm}>
            <line
              x1={x}
              y1={barsBottom + 3}
              x2={x}
              y2={barsBottom + 7}
              stroke="#d4d4d8"
              strokeWidth={1}
            />
            <text
              x={x}
              y={barsBottom + TICK_AREA}
              textAnchor="middle"
              fontSize={9}
              fill="#a1a1aa"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            >
              {mm}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
