"use client";

// Aperture mark component — renders the X-Glass logo using the physical
// iris kinematic model (iris-kinematics.ts).
//
// Automatically selects IRIS_SM for sizes below LOGO_SM_THRESHOLD so
// the blade gap remains legible at small render sizes (nav, favicon, etc.).
//
// Theming via Tailwind fill-*/stroke-* utilities (light/dark automatic).

import { useState, useRef, useEffect, useMemo } from "react";
import {
  solveAllBlades,
  bladeShapePath,
  thetaRange,
  buildDerivedConfig,
  computeThetaOpen,
  tNormToTheta,
  apertureInradius,
  findThetaForInradius,
} from "@/lib/iris-kinematics";
import { IRIS_LG, IRIS_SM, LOGO_SM_THRESHOLD } from "@/config/brand";
import { ANIMATION } from "@/config/ui";

const R_HOUSING = 100;
const SHADOW_STD = 1.5;
const SHADOW_OPACITY = 0.55;

// ── Component ─────────────────────────────────────────────────────────────────

interface IrisProps {
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
  /** Blade fill colour. Overrides the default Tailwind dark/light class. */
  bladeColor?: string;
  /** Blade gap stroke colour. Overrides the default Tailwind dark/light class. */
  strokeColor?: string;
  /** Blade gap stroke width in SVG units. Default 1.5. */
  strokeWidth?: number;
  /** Show blade drop-shadow. Default true. */
  shadow?: boolean;
}

export default function Iris({
  size = 80,
  uid = "logo",
  className,
  interactive = false,
  bladeColor,
  strokeColor,
  strokeWidth = 1.5,
  shadow = true,
}: IrisProps) {
  const preset = size < LOGO_SM_THRESHOLD ? IRIS_SM : IRIS_LG;
  const DEFAULT_T = preset.t;

  const [t, setT] = useState<number>(DEFAULT_T);
  const tRef = useRef<number>(DEFAULT_T);
  const animRef    = useRef<number | null>(null); // leave ease-out RAF
  const chaseRef   = useRef<number | null>(null); // follow-mouse chase RAF
  const targetTRef = useRef<number>(DEFAULT_T);  // raw desired t written by mousemove
  const lastFrameRef = useRef<number>(0);
  const entryOffsetRef = useRef(0);
  const entryTimeRef = useRef(0);

  // Kinematic derivation — recomputed only when preset changes (size threshold cross).
  const dc = useMemo(() => buildDerivedConfig(preset, R_HOUSING), [preset]);
  const thetaOpen = useMemo(() => computeThetaOpen(dc, R_HOUSING), [dc]);
  const thetaMax  = useMemo(() => thetaRange(dc).max, [dc]);

  // Aperture inradius at fully-open position — used for diameter-linear mapping.
  const inradiusOpen = useMemo(() => apertureInradius(thetaOpen, dc), [thetaOpen, dc]);

  // Per-frame: convert t → theta → blade states.
  const theta = tNormToTheta(t, thetaOpen, thetaMax);
  const blades = useMemo(
    () => solveAllBlades(theta, dc),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theta, dc]
  );
  const shape = useMemo(() => bladeShapePath(dc), [dc]);

  // Cancel all pending animations on unmount.
  useEffect(() => () => {
    if (animRef.current)  cancelAnimationFrame(animRef.current);
    if (chaseRef.current) cancelAnimationFrame(chaseRef.current);
  }, []);

  const { N } = dc;
  const stepDeg = 360 / N;
  const maskCount = Math.floor((N - 1) / 2);

  if (blades.length === 0) return null;

  const b0 = blades[0];
  const b0AngleDeg = (b0.bladeAngle * 180) / Math.PI;
  const b0Transform = `translate(${b0.pivotPos.x.toFixed(3)},${b0.pivotPos.y.toFixed(3)}) rotate(${b0AngleDeg.toFixed(3)})`;

  // ── Mouse interaction ──────────────────────────────────────────────────────
  // Architecture mirrors the Design Lab iris:
  //   mousemove  → writes targetTRef (raw desired t, with entry-offset applied)
  //   chase RAF  → each frame exponentially approaches targetTRef (τ = 60 ms)
  //   leave RAF  → cubic ease-out back to DEFAULT_T over logoEaseOutMs

  const CHASE_TAU_MS = 60;

  function startChase() {
    if (chaseRef.current) return;
    lastFrameRef.current = performance.now();
    function chaseTick(now: number) {
      const dt   = Math.min(now - lastFrameRef.current, 64);
      lastFrameRef.current = now;
      const k    = 1 - Math.exp(-dt / CHASE_TAU_MS);
      const next = tRef.current + (targetTRef.current - tRef.current) * k;
      tRef.current = next;
      setT(next);
      chaseRef.current = requestAnimationFrame(chaseTick);
    }
    chaseRef.current = requestAnimationFrame(chaseTick);
  }

  function stopChase() {
    if (chaseRef.current) { cancelAnimationFrame(chaseRef.current); chaseRef.current = null; }
  }

  // Map raw horizontal position to a normalised t using diameter-linear scaling.
  // Left = most open (t=0, rOpen), right = f/22 (small t value).
  // This is a log transform in f-stop space — mirrors Design Lab behaviour.
  function posToDiameterT(clientX: number, rect: DOMRect): number {
    const rawPos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    if (inradiusOpen <= 0) return rawPos; // fallback: linear
    const r22     = (1.4 * inradiusOpen) / 22;
    const targetR = inradiusOpen + rawPos * (r22 - inradiusOpen);
    const targetTheta = findThetaForInradius(targetR, dc, { min: thetaOpen, max: thetaMax });
    return Math.max(0.02, Math.min(0.98, (targetTheta - thetaOpen) / (thetaMax - thetaOpen)));
  }

  function handleMouseEnter(e: React.MouseEvent<SVGSVGElement>) {
    if (!interactive) return;
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    const rect = e.currentTarget.getBoundingClientRect();
    entryOffsetRef.current = tRef.current - posToDiameterT(e.clientX, rect);
    entryTimeRef.current   = performance.now();
    startChase();
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!interactive) return;
    const rect   = e.currentTarget.getBoundingClientRect();
    const target = posToDiameterT(e.clientX, rect);
    const p      = Math.min(1, (performance.now() - entryTimeRef.current) / ANIMATION.logoCatchupMs);
    const offset = entryOffsetRef.current * (1 - p) ** 2;
    targetTRef.current = Math.max(0.02, Math.min(0.98, target + offset));
  }

  function handleMouseLeave() {
    if (!interactive) return;
    stopChase();
    const startT    = tRef.current;
    const startTime = performance.now();

    function tick(now: number) {
      const p     = Math.min(1, (now - startTime) / ANIMATION.logoEaseOutMs);
      const eased = 1 - (1 - p) ** 3;
      const newT  = startT + (DEFAULT_T - startT) * eased;
      tRef.current = newT;
      setT(newT);
      if (p < 1) animRef.current = requestAnimationFrame(tick);
      else animRef.current = null;
    }

    animRef.current = requestAnimationFrame(tick);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

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
          <circle r={R_HOUSING} />
        </clipPath>
        <filter id={`${uid}-shadow`} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx={0} dy={0} stdDeviation={SHADOW_STD} floodColor="black" floodOpacity={SHADOW_OPACITY} />
        </filter>
        {/* Stroke masks — cyclic forward-half masking (same as iris). */}
        {Array.from({ length: N }, (_, i) => (
          <mask id={`${uid}-sm-${i}`} key={i}>
            <rect x="-120" y="-120" width="240" height="240" fill="white" />
            {Array.from({ length: maskCount }, (_, k) => {
              const j = (i + 1 + k) % N;
              return (
                <g key={j} transform={`rotate(${(stepDeg * j).toFixed(3)})`}>
                  <g transform={b0Transform}>
                    <path d={shape} fill="black" />
                  </g>
                </g>
              );
            })}
          </mask>
        ))}
      </defs>

      {/* Aperture blades — fill pass (flat, no masks) + stroke pass (cyclic). */}
      <g clipPath={`url(#${uid}-clip)`}>
        {/* Fill pass */}
        {Array.from({ length: N }, (_, i) => (
          <g key={i} transform={`rotate(${(stepDeg * i).toFixed(3)})`}>
            <g transform={b0Transform}>
              <path
                d={shape}
                className={bladeColor ? undefined : "fill-zinc-900 dark:fill-zinc-100"}
                fill={bladeColor}
                stroke="none"
                filter={shadow ? `url(#${uid}-shadow)` : undefined}
              />
            </g>
          </g>
        ))}
        {/* Stroke pass — cyclic masks produce the blade-gap lines */}
        {Array.from({ length: N }, (_, i) => (
          <g key={i} mask={`url(#${uid}-sm-${i})`}>
            <g transform={`rotate(${(stepDeg * i).toFixed(3)})`}>
              <g transform={b0Transform}>
                <path
                  d={shape}
                  fill="none"
                  className={strokeColor ? undefined : "stroke-stone-100 dark:stroke-zinc-950"}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                />
              </g>
            </g>
          </g>
        ))}
      </g>

      {/* Housing cover plate — hides blade roots (R_HOUSING−bladeWidth → R_HOUSING). */}
      <circle
        r={R_HOUSING - dc.bladeWidth / 2}
        fill="none"
        className={strokeColor ? undefined : "stroke-stone-100 dark:stroke-zinc-950"}
        stroke={strokeColor}
        strokeWidth={dc.bladeWidth + 1}
      />
    </svg>
  );
}
