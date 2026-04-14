"use client";

// Aperture mark component — renders the X-Glass logo using the physical
// iris kinematic model (iris-kinematics.ts).
//
// Accepts a single IrisConfig (from brand.ts) covering kinematic params,
// render size, appearance, and interactive behaviour. Two named configs are
// exported from brand.ts: IRIS_HERO (homepage, OG) and IRIS_NAV (navbar).
//
// Theming: bladeColor/strokeColor in the config override the Tailwind
// fill-*/stroke-* utilities used for automatic light/dark switching.

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
  findThetaForFStop,
} from "@/lib/iris-kinematics";
import { IRIS_HERO, type IrisConfig } from "@/config/brand";
import { ANIMATION } from "@/config/ui";

const R_HOUSING = 100;
const SHADOW_STD = 1.5;
const SHADOW_OPACITY = 0.55;

// ── Component ─────────────────────────────────────────────────────────────────

interface IrisProps {
  /** Full config: kinematic params + size + appearance + interactive settings. */
  config?: IrisConfig;
  /**
   * Render size override in px. Falls back to config.size when omitted.
   * Use this only when you need a one-off size that differs from the named
   * config (e.g. about page, poster). For the standard hero/nav sizes, rely
   * on config.size.
   */
  size?: number;
  /** Must be unique per page — used as SVG def ID prefix. */
  uid?: string;
  className?: string;
}

export default function Iris({
  config = IRIS_HERO,
  size: sizeProp,
  uid = "logo",
  className,
}: IrisProps) {
  const {
    size: configSize,
    interactive = false,
    initAnimation = false,
    bladeColor,
    strokeColor,
    strokeWidth = 1.5,
    shadow = true,
  } = config;
  const size = sizeProp ?? configSize;

  // Kinematic derivation — must come before DEFAULT_T so the f-stop → theta
  // conversion is available when initialising state.
  const dc = useMemo(() => buildDerivedConfig(config, R_HOUSING), [config]);
  const thetaOpen = useMemo(() => computeThetaOpen(dc, R_HOUSING), [dc]);
  const thetaMax  = useMemo(() => thetaRange(dc).max, [dc]);

  // Aperture inradius at fully-open position — used for diameter-linear mapping.
  const inradiusOpen = useMemo(() => apertureInradius(thetaOpen, dc), [thetaOpen, dc]);

  // Convert defaultFStop → normalised t for state initialisation.
  const DEFAULT_T = useMemo(() => {
    const thetaAtFStop = findThetaForFStop(config.defaultFStop, dc, { min: thetaOpen, max: thetaMax }, config.openFStop);
    return Math.max(0.02, Math.min(0.98, (thetaAtFStop - thetaOpen) / (thetaMax - thetaOpen)));
  }, [config.defaultFStop, config.openFStop, dc, thetaOpen, thetaMax]);

  const [t, setT] = useState<number>(DEFAULT_T);
  const tRef = useRef<number>(DEFAULT_T);
  const animRef    = useRef<number | null>(null); // leave ease-out RAF
  const chaseRef   = useRef<number | null>(null); // follow-mouse chase RAF
  const initAnimRef = useRef<number | null>(null); // init animation sequencer RAF
  const targetTRef = useRef<number>(DEFAULT_T);  // raw desired t written by mousemove/init
  const lastFrameRef = useRef<number>(0);
  const entryOffsetRef = useRef(0);
  const entryTimeRef = useRef(0);
  // Keep DEFAULT_T accessible to the mount-only init animation effect.
  const defaultTRef = useRef(DEFAULT_T);
  defaultTRef.current = DEFAULT_T;

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
    if (animRef.current)     cancelAnimationFrame(animRef.current);
    if (chaseRef.current)    cancelAnimationFrame(chaseRef.current);
    if (initAnimRef.current) cancelAnimationFrame(initAnimRef.current);
  }, []);

  // Init animation: open → f/22 → defaultFStop over 1000 ms on mount.
  // Drives targetTRef through keyframes; the existing chase RAF does smoothing.
  useEffect(() => {
    if (!initAnimation) return;

    const INIT_DURATION_MS = 1000;

    // Jump to fully open immediately.
    tRef.current = 0.02;
    targetTRef.current = 0.02;
    setT(0.02);

    startChase();

    const startTime = performance.now();
    function sequenceTick(now: number) {
      const p = Math.min(1, (now - startTime) / INIT_DURATION_MS);

      let keyframeT: number;
      if (p < 0.5) {
        // Phase 1: fully open → f/22
        keyframeT = p / 0.5;
      } else {
        // Phase 2: f/22 → defaultFStop
        keyframeT = 1 + ((p - 0.5) / 0.5) * (defaultTRef.current - 1);
      }

      targetTRef.current = Math.max(0.02, Math.min(0.98, keyframeT));

      if (p < 1) {
        initAnimRef.current = requestAnimationFrame(sequenceTick);
      } else {
        initAnimRef.current = null;
        // Chase has had 500 ms to converge (τ=60 ms → error ≈ 0.02 %); stop cleanly.
        stopChase();
        tRef.current = defaultTRef.current;
        setT(defaultTRef.current);
      }
    }

    initAnimRef.current = requestAnimationFrame(sequenceTick);

    return () => {
      if (initAnimRef.current) { cancelAnimationFrame(initAnimRef.current); initAnimRef.current = null; }
      stopChase();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount-only

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
    const r22     = (config.openFStop * inradiusOpen) / 22;
    const targetR = inradiusOpen + rawPos * (r22 - inradiusOpen);
    const targetTheta = findThetaForInradius(targetR, dc, { min: thetaOpen, max: thetaMax });
    return Math.max(0.02, Math.min(0.98, (targetTheta - thetaOpen) / (thetaMax - thetaOpen)));
  }

  function handleMouseEnter(e: React.MouseEvent<SVGSVGElement>) {
    if (!interactive) return;
    if (animRef.current)     { cancelAnimationFrame(animRef.current);     animRef.current = null; }
    if (initAnimRef.current) { cancelAnimationFrame(initAnimRef.current); initAnimRef.current = null; }
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
          {/* Clip radius shrunk to R_HOUSING - bladeWidth to hide blade roots without
              relying on a background-colour cover plate. Works on any background. */}
          <circle r={R_HOUSING - dc.bladeWidth} />
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



    </svg>
  );
}
