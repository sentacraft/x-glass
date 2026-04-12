// Pure aperture-mark geometry functions — no React, no hooks.
// Shared between the interactive LogoMark component and server-side renderers
// (OG image, apple-icon) that cannot use client components.

export const R = 100;

export interface ApertureParams {
  N: number;
  /**
   * Half-spread of the two inner blade tips around the arc midpoint.
   * Replaces the old "skew" parameter.
   *
   * The arc midpoint is always at step/2 (= 180°/N). With halfSpread h:
   *   trailing tip = step/2 − h×step
   *   leading  tip = step/2 + h×step
   *
   * Both visible side edges end up with the same angular span:
   *   (0.5 + overlap − halfSpread) × step
   * …so all N blade gaps are mathematically identical regardless of N or t.
   *
   * Range: [0, overlap + 0.5)
   *   0   → symmetric / no-sweep (both tips merge at arc midpoint)
   *   0.5 → moderate sweep, largest equal gaps
   *   →max → maximum sweep, gaps shrink toward zero
   */
  halfSpread: number;
  overlap: number;
  curve: number;
  twist: number;
}

function fmt(x: number, y: number) {
  return `${x.toFixed(3)},${y.toFixed(3)}`;
}

/** SVG path string for a single aperture blade at openness t ∈ [0, 1]. */
export function bladePath(t: number, p: ApertureParams): string {
  const { N, halfSpread, overlap: OVERLAP, curve: CURVE, twist: TWIST } = p;
  const step = (2 * Math.PI) / N;
  const rInner = R * (0.08 + 0.72 * t);
  const arcStart = -OVERLAP * step;
  const arcEnd = step * (1 + OVERLAP);
  const largeArc = arcEnd - arcStart > Math.PI ? 1 : 0;
  const ax0 = R * Math.cos(arcStart);
  const ay0 = R * Math.sin(arcStart);
  const ax1 = R * Math.cos(arcEnd);
  const ay1 = R * Math.sin(arcEnd);
  const off = TWIST * (1 - t) * step;
  // Symmetric tip placement — guarantees equal gap on both sides of every blade
  const p3Angle = step / 2 - halfSpread * step + off;
  const p2Angle = step / 2 + halfSpread * step + off;
  const p2x = rInner * Math.cos(p2Angle);
  const p2y = rInner * Math.sin(p2Angle);
  const p3x = rInner * Math.cos(p3Angle);
  const p3y = rInner * Math.sin(p3Angle);
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
}

/** Space-separated x,y pairs for the center cover polygon at openness t. */
export function coverPoints(t: number, p: ApertureParams): string {
  const { N, halfSpread, twist: TWIST } = p;
  const step = (2 * Math.PI) / N;
  const rInner = R * (0.08 + 0.72 * t);
  const off = TWIST * (1 - t) * step;
  // Vertex i = trailing tip of blade i = step/2 − halfSpread×step + i×step + off
  return Array.from({ length: N }, (_, i) => {
    const a = i * step + (0.5 - halfSpread) * step + off;
    return `${(rInner * Math.cos(a)).toFixed(3)},${(rInner * Math.sin(a)).toFixed(3)}`;
  }).join(" ");
}
