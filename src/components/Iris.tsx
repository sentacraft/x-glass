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
  apertureInradius,
  findThetaForInradius,
  findThetaForFStop,
} from "@/lib/iris-kinematics";
import { IRIS_HERO, R_HOUSING, type IrisConfig } from "@/config/brand";


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
    closedFStop = 22,
    chaseTauMs = 60,
    easeOutMs = 700,
    catchupMs = 300,
    bladeColor,
    strokeColor,
    strokeWidth = 1.5,
  } = config;
  const size = sizeProp ?? configSize;

  // Kinematic derivation — must come before DEFAULT_THETA so the f-stop → theta
  // conversion is available when initialising state.
  const dc = useMemo(() => buildDerivedConfig(config, R_HOUSING), [config]);
  const thetaOpen = useMemo(() => computeThetaOpen(dc, R_HOUSING), [dc]);
  const thetaMax  = useMemo(() => thetaRange(dc).max, [dc]);

  // Aperture inradius at fully-open position — used for diameter-linear mapping.
  const inradiusOpen = useMemo(() => apertureInradius(thetaOpen, dc), [thetaOpen, dc]);

  // Theta at defaultFStop — the resting position for state initialisation and leave ease-out.
  const DEFAULT_THETA = useMemo(() =>
    findThetaForFStop(config.defaultFStop, dc, { min: thetaOpen, max: thetaMax }, config.openFStop),
  [config.defaultFStop, config.openFStop, dc, thetaOpen, thetaMax]);

  // State is theta directly — no normalised-t layer.
  const [theta, setTheta] = useState<number>(DEFAULT_THETA);
  const thetaRef    = useRef<number>(DEFAULT_THETA);
  const animRef     = useRef<number | null>(null); // leave ease-out RAF
  const chaseRef    = useRef<number | null>(null); // follow-mouse / init chase RAF
  const initAnimRef = useRef<number | null>(null); // init animation sequencer RAF
  const targetThetaRef = useRef<number>(DEFAULT_THETA); // desired theta written by mousemove/init
  const lastFrameRef   = useRef<number>(0);
  const entryOffsetRef = useRef(0);
  const entryTimeRef   = useRef(0);
  // Kept in sync each render so the mount-only init effect can read DEFAULT_THETA.
  const defaultThetaRef = useRef(DEFAULT_THETA);
  defaultThetaRef.current = DEFAULT_THETA;

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
  // Drives targetThetaRef through keyframes; the existing chase RAF does smoothing.
  useEffect(() => {
    if (!initAnimation) return;

    const INIT_DURATION_MS = 1000;

    // Jump to fully open immediately.
    thetaRef.current = thetaOpen;
    targetThetaRef.current = thetaOpen;
    setTheta(thetaOpen);

    startChase();

    const startTime = performance.now();
    function sequenceTick(now: number) {
      const p = Math.min(1, (now - startTime) / INIT_DURATION_MS);

      // Sweep from fully open (thetaOpen) → fully closed (thetaMax) over the full duration.
      targetThetaRef.current = thetaOpen + p * (thetaMax - thetaOpen);

      if (p < 1) {
        initAnimRef.current = requestAnimationFrame(sequenceTick);
      } else {
        initAnimRef.current = null;
        // Snap immediately to defaultFStop once the sweep completes.
        stopChase();
        thetaRef.current = defaultThetaRef.current;
        setTheta(defaultThetaRef.current);
      }
    }

    initAnimRef.current = requestAnimationFrame(sequenceTick);

    return () => {
      if (initAnimRef.current) { cancelAnimationFrame(initAnimRef.current); initAnimRef.current = null; }
      stopChase();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount-only — thetaOpen/thetaMax captured via refs

  const { N } = dc;
  const stepDeg = 360 / N;
  const maskCount = Math.floor((N - 1) / 2);

  if (blades.length === 0) return null;

  const b0 = blades[0];
  const b0AngleDeg = (b0.bladeAngle * 180) / Math.PI;
  const b0Transform = `translate(${b0.pivotPos.x.toFixed(3)},${b0.pivotPos.y.toFixed(3)}) rotate(${b0AngleDeg.toFixed(3)})`;

  // ── Mouse interaction ──────────────────────────────────────────────────────
  // Architecture mirrors the Design Lab iris:
  //   mousemove  → writes targetThetaRef (raw desired theta, with entry-offset applied)
  //   chase RAF  → each frame exponentially approaches targetThetaRef (τ = chaseTauMs)
  //   leave RAF  → cubic ease-out back to DEFAULT_THETA over easeOutMs

  function startChase() {
    if (chaseRef.current) return;
    lastFrameRef.current = performance.now();
    function chaseTick(now: number) {
      const dt   = Math.min(now - lastFrameRef.current, 64);
      lastFrameRef.current = now;
      const k    = 1 - Math.exp(-dt / chaseTauMs);
      const next = thetaRef.current + (targetThetaRef.current - thetaRef.current) * k;
      thetaRef.current = next;
      setTheta(next);
      chaseRef.current = requestAnimationFrame(chaseTick);
    }
    chaseRef.current = requestAnimationFrame(chaseTick);
  }

  function stopChase() {
    if (chaseRef.current) { cancelAnimationFrame(chaseRef.current); chaseRef.current = null; }
  }

  // Map raw horizontal position to theta using diameter-linear scaling.
  // Left = most open (thetaOpen), right = f/22. Log transform in f-stop space.
  function posToDiameterTheta(clientX: number, rect: DOMRect): number {
    const rawPos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    if (inradiusOpen <= 0) return thetaOpen + rawPos * (thetaMax - thetaOpen); // fallback: linear
    const r22     = (config.openFStop * inradiusOpen) / closedFStop;
    const targetR = inradiusOpen + rawPos * (r22 - inradiusOpen);
    return findThetaForInradius(targetR, dc, { min: thetaOpen, max: thetaMax });
  }

  function handleMouseEnter(e: React.MouseEvent<SVGSVGElement>) {
    if (!interactive) return;
    if (animRef.current)     { cancelAnimationFrame(animRef.current);     animRef.current = null; }
    if (initAnimRef.current) { cancelAnimationFrame(initAnimRef.current); initAnimRef.current = null; }
    const rect = e.currentTarget.getBoundingClientRect();
    entryOffsetRef.current = thetaRef.current - posToDiameterTheta(e.clientX, rect);
    entryTimeRef.current   = performance.now();
    startChase();
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!interactive) return;
    const rect   = e.currentTarget.getBoundingClientRect();
    const target = posToDiameterTheta(e.clientX, rect);
    const p      = Math.min(1, (performance.now() - entryTimeRef.current) / catchupMs);
    const offset = entryOffsetRef.current * (1 - p) ** 2;
    targetThetaRef.current = Math.max(thetaOpen, Math.min(thetaMax, target + offset));
  }

  function handleMouseLeave() {
    if (!interactive) return;
    stopChase();
    const startTheta = thetaRef.current;
    const startTime  = performance.now();

    function tick(now: number) {
      const p        = Math.min(1, (now - startTime) / easeOutMs);
      const eased    = 1 - (1 - p) ** 3;
      const newTheta = startTheta + (DEFAULT_THETA - startTheta) * eased;
      thetaRef.current = newTheta;
      setTheta(newTheta);
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
