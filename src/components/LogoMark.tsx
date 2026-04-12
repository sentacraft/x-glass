"use client";

// Aperture mark component — client component so the interactive and loading
// variants can update blade geometry in the browser.
// Theming via Tailwind fill-*/stroke-* utilities (light/dark automatic).

import { useState, useRef, useEffect } from "react";
import { BRAND_LOGO } from "@/config/brand";
import { ANIMATION } from "@/config/ui";

// ── Geometry ──────────────────────────────────────────────────────────────────

const R = 100;
const N = BRAND_LOGO.N;
const SKEW = BRAND_LOGO.skew;
const OVERLAP = BRAND_LOGO.overlap;
const CURVE = BRAND_LOGO.curve;
const TWIST = BRAND_LOGO.twist;
const BLADE_STROKE_W = BRAND_LOGO.bladeStrokeWidth;
const SHADOW_STD = BRAND_LOGO.shadowStdDeviation;
const STEP_DEG = 360 / N;
const DEFAULT_T = BRAND_LOGO.t;

function fmt(x: number, y: number) {
  return `${x.toFixed(3)},${y.toFixed(3)}`;
}

function bladePath(t: number): string {
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

function coverPoints(t: number): string {
  const step = (2 * Math.PI) / N;
  const rInner = R * (0.08 + 0.72 * t);
  const off = TWIST * (1 - t) * step;
  return Array.from({ length: N }, (_, i) => {
    const a = i * step + SKEW * step + off;
    return `${(rInner * Math.cos(a)).toFixed(3)},${(rInner * Math.sin(a)).toFixed(3)}`;
  }).join(" ");
}

// ── Component ─────────────────────────────────────────────────────────────────

interface LogoMarkProps {
  /** Render size in px. Default 80. */
  size?: number;
  /** Must be unique per page — used as SVG def ID prefix. */
  uid?: string;
  className?: string;
  /**
   * When true, aperture openness tracks horizontal mouse position over the
   * logo (left = closed, right = open) and eases back to default on leave.
   */
  interactive?: boolean;
}

export default function LogoMark({
  size = 80,
  uid = "logo",
  className,
  interactive = false,
}: LogoMarkProps) {
  const [t, setT] = useState(DEFAULT_T);
  const tRef = useRef(DEFAULT_T);
  const animRef = useRef<number | null>(null);
  // Entry-offset refs: fade out the gap between current aperture and cursor's
  // absolute position so there's no jump when the cursor first enters.
  const entryOffsetRef = useRef(0);
  const entryTimeRef = useRef(0);

  // Cancel any pending animation on unmount
  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  function absT(clientX: number, rect: DOMRect) {
    return Math.max(0.02, Math.min(0.98, (clientX - rect.left) / rect.width));
  }

  function handleMouseEnter(e: React.MouseEvent<SVGSVGElement>) {
    if (!interactive) return;
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    const rect = e.currentTarget.getBoundingClientRect();
    // Record the gap to fade away — aperture stays put at entry, then converges
    entryOffsetRef.current = tRef.current - absT(e.clientX, rect);
    entryTimeRef.current = performance.now();
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const target = absT(e.clientX, rect);
    // Fade the entry offset to zero over logoCatchupMs (ease-out)
    const p = Math.min(1, (performance.now() - entryTimeRef.current) / ANIMATION.logoCatchupMs);
    const offset = entryOffsetRef.current * (1 - p) ** 2;
    const newT = Math.max(0.02, Math.min(0.98, target + offset));
    tRef.current = newT;
    setT(newT);
  }

  function handleMouseLeave() {
    if (!interactive) return;
    const startT = tRef.current;
    const startTime = performance.now();
    const DURATION = ANIMATION.logoEaseOutMs;

    function easeOut(p: number) { return 1 - (1 - p) ** 3; }

    function tick(now: number) {
      const p = Math.min(1, (now - startTime) / DURATION);
      const newT = startT + (DEFAULT_T - startT) * easeOut(p);
      tRef.current = newT;
      setT(newT);
      if (p < 1) animRef.current = requestAnimationFrame(tick);
      else animRef.current = null;
    }

    animRef.current = requestAnimationFrame(tick);
  }

  const bp = bladePath(t);
  const cp = coverPoints(t);

  return (
    <svg
      viewBox="-112 -112 224 224"
      width={size}
      height={size}
      className={className}
      style={{ display: "block", flexShrink: 0 }}
      aria-hidden="true"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <defs>
        <clipPath id={`${uid}-clip`}>
          <circle r={R} />
        </clipPath>
        <filter id={`${uid}-shadow`} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx={0} dy={0} stdDeviation={SHADOW_STD} floodColor="black" floodOpacity={0.55} />
        </filter>
        {/* Per-blade masks — recomputed as t changes so z-order stays correct */}
        {Array.from({ length: N }, (_, i) => (
          <mask id={`${uid}-bm-${i}`} key={i}>
            <rect x="-120" y="-120" width="240" height="240" fill="white" />
            <g transform={`rotate(${STEP_DEG * ((i + 1) % N)})`}>
              <path d={bp} fill="black" />
            </g>
          </mask>
        ))}
      </defs>

      {/* Aperture blades — clipped to outer disc */}
      <g clipPath={`url(#${uid}-clip)`}>
        {Array.from({ length: N }, (_, i) => (
          <g key={i} mask={`url(#${uid}-bm-${i})`}>
            <g transform={`rotate(${STEP_DEG * i})`}>
              <path
                d={bp}
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

      {/* Cover polygon — hides shadow bleed in the aperture opening */}
      <polygon points={cp} className="fill-stone-100 dark:fill-zinc-950" />
    </svg>
  );
}
