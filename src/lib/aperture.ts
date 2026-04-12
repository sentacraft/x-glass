// Pure aperture-mark geometry functions — no React, no hooks.
// Shared between the interactive LogoMark component and server-side renderers
// (OG image, apple-icon) that cannot use client components.

import { BRAND_LOGO } from "@/config/brand";

export const R = 100;
export const BLADE_COUNT = BRAND_LOGO.N;
export const STEP_DEG = 360 / BLADE_COUNT;

const { N, skew: SKEW, overlap: OVERLAP, curve: CURVE, twist: TWIST } = BRAND_LOGO;

function fmt(x: number, y: number) {
  return `${x.toFixed(3)},${y.toFixed(3)}`;
}

/** SVG path string for a single aperture blade at openness t ∈ [0, 1]. */
export function bladePath(t: number): string {
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
}

/** Space-separated x,y pairs for the center cover polygon at openness t. */
export function coverPoints(t: number): string {
  const step = (2 * Math.PI) / N;
  const rInner = R * (0.08 + 0.72 * t);
  const off = TWIST * (1 - t) * step;
  return Array.from({ length: N }, (_, i) => {
    const a = i * step + SKEW * step + off;
    return `${(rInner * Math.cos(a)).toFixed(3)},${(rInner * Math.sin(a)).toFixed(3)}`;
  }).join(" ");
}
