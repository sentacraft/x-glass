"use client";

// Aperture mark component — renders the X-Glass logo using the physical
// iris kinematic model (iris-kinematics.ts).
//
// Accepts a single IrisConfig (from iris-config.ts) covering kinematic params,
// render size, appearance, and interactive behaviour. Three named configs are
// exported from iris-config.ts: IRIS_HERO, IRIS_NAV, IRIS_LAB.
//
// Theming: bladeColor/strokeColor in the config override the Tailwind
// fill-*/stroke-* utilities used for automatic light/dark switching.
//
// Hotzone: when interactive is true, a transparent wrapper div sized to
// size*hotzoneScaleH × size*hotzoneScaleV captures mouse events, giving the
// iris a wider/taller interactive area than its rendered footprint.

import { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
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
import { IRIS_HERO, R_HOUSING, type IrisConfig } from "@/config/iris-config";


// ── IrisHandle ────────────────────────────────────────────────────────────────
//
// Imperative handle exposed via forwardRef. Lets external controls (e.g. the
// mobile ApertureStrip) drive the iris without triggering React re-renders on
// every pointer event frame.

export interface IrisHandle {
  /** Drive iris to this f-stop using the exponential-smoothing chase. */
  driveToFStop: (fStop: number) => void;
  /** Release external control and ease-out back to defaultFStop. */
  releaseControl: () => void;
}

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

const Iris = forwardRef<IrisHandle, IrisProps>(function Iris({
  config: rawConfig = IRIS_HERO,
  size: sizeProp,
  uid = "logo",
  className,
}: IrisProps, ref) {
  const {
    size: configSize,
    interactive = false,
    initAnimation,
    closedFStop = 22,
    hotzoneScaleH = 1,
    hotzoneScaleV = 1,
    chaseTauMs = 60,
    easeOutMs = 700,
    catchupMs = 300,
    bladeColor,
    strokeColor,
    strokeWidth,
  } = rawConfig;
  const size = sizeProp ?? configSize;

  // Kinematic derivation — must come before DEFAULT_THETA so the f-stop → theta
  // conversion is available when initialising state.
  const dc = useMemo(() => buildDerivedConfig(rawConfig, R_HOUSING), [rawConfig]);
  const thetaOpen = useMemo(() => computeThetaOpen(dc, R_HOUSING), [dc]);
  const thetaMax  = useMemo(() => thetaRange(dc).max, [dc]);

  // Aperture inradius at fully-open position — used for diameter-linear mapping.
  const inradiusOpen = useMemo(() => apertureInradius(thetaOpen, dc), [thetaOpen, dc]);

  // Theta at defaultFStop — the resting position for state initialisation and leave ease-out.
  const DEFAULT_THETA = useMemo(() =>
    findThetaForFStop(rawConfig.defaultFStop, dc, { min: thetaOpen, max: thetaMax }, rawConfig.openFStop),
  [rawConfig.defaultFStop, rawConfig.openFStop, dc, thetaOpen, thetaMax]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solveAllBlades is a pure
    // function imported from a stable module; adding it to deps would be noise.
    [theta, dc]
  );
  const shape = useMemo(() => bladeShapePath(dc), [dc]);

  // Cancel all pending animations on unmount.
  useEffect(() => () => {
    if (animRef.current)     cancelAnimationFrame(animRef.current);
    if (chaseRef.current)    cancelAnimationFrame(chaseRef.current);
    if (initAnimRef.current) cancelAnimationFrame(initAnimRef.current);
  }, []);

  // Sync theta to DEFAULT_THETA when config changes (non-interactive static display).
  // Interactive instances own their theta via mouse/animation; static previews should
  // always reflect the resting position implied by the current config props.
  useEffect(() => {
    if (interactive) return;
    thetaRef.current = DEFAULT_THETA;
    setTheta(DEFAULT_THETA);
  }, [DEFAULT_THETA, interactive]);

  // Init animation: two-phase sequence on mount.
  //   Phase 1 (0 → sweepMs):       sweep target from fully open → fully closed (thetaMax).
  //   Phase 2 (sweepMs → totalMs): linearly drive target from thetaMax → defaultFStop.
  //   After totalMs: target pinned to defaultFStop; chase self-terminates once converged.
  // Timing comes from config.initAnimation; absence of the field disables the animation.
  // Drives targetThetaRef through keyframes; the chase RAF provides exponential smoothing.
  useEffect(() => {
    if (!initAnimation) return;

    const { sweepMs: SWEEP_MS, totalMs: TOTAL_MS } = initAnimation;

    // Jump to fully open immediately.
    thetaRef.current = thetaOpen;
    targetThetaRef.current = thetaOpen;
    setTheta(thetaOpen);

    // Safe to call startChase() immediately — hasMovedSignificantly inside the
    // closure prevents the convergence stop from firing while delta is still ~0.
    startChase();

    const startTime = performance.now();
    function sequenceTick(now: number) {
      const elapsed = now - startTime;

      if (elapsed < SWEEP_MS) {
        // Phase 1: close from fully open to thetaMax.
        const p = elapsed / SWEEP_MS;
        targetThetaRef.current = thetaOpen + p * (thetaMax - thetaOpen);
        initAnimRef.current = requestAnimationFrame(sequenceTick);
      } else if (elapsed < TOTAL_MS) {
        // Phase 2: ease target from thetaMax back toward defaultFStop.
        const p2 = (elapsed - SWEEP_MS) / (TOTAL_MS - SWEEP_MS);
        targetThetaRef.current = thetaMax + p2 * (defaultThetaRef.current - thetaMax);
        initAnimRef.current = requestAnimationFrame(sequenceTick);
      } else {
        // Done — pin target to defaultFStop and let the chase converge.
        targetThetaRef.current = defaultThetaRef.current;
        initAnimRef.current = null;
      }
    }

    initAnimRef.current = requestAnimationFrame(sequenceTick);

    return () => {
      if (initAnimRef.current) { cancelAnimationFrame(initAnimRef.current); initAnimRef.current = null; }
      stopChase();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only init effect;
  // thetaOpen/thetaMax are intentionally read through refs to avoid stale closures.
  }, []);

  // Imperative handle for external controls (e.g. mobile ApertureStrip).
  // startChase / stopChase are function declarations and are hoisted to the top
  // of this render function — accessible here even though defined below.
  useImperativeHandle(ref, () => ({
    driveToFStop(fStop: number) {
      if (animRef.current)     { cancelAnimationFrame(animRef.current);     animRef.current = null; }
      if (initAnimRef.current) { cancelAnimationFrame(initAnimRef.current); initAnimRef.current = null; }
      const t = findThetaForFStop(fStop, dc, { min: thetaOpen, max: thetaMax }, rawConfig.openFStop);
      targetThetaRef.current = Math.max(thetaOpen, Math.min(thetaMax, t));
      startChase();
    },
    releaseControl() {
      stopChase();
      const fromTheta = thetaRef.current;
      const toTheta   = DEFAULT_THETA;
      const startMs   = performance.now();
      const duration  = easeOutMs;
      function tick(now: number) {
        const p     = Math.min(1, (now - startMs) / duration);
        const eased = 1 - (1 - p) ** 3;
        const v     = fromTheta + (toTheta - fromTheta) * eased;
        thetaRef.current = v;
        setTheta(v);
        if (p < 1) animRef.current = requestAnimationFrame(tick);
        else animRef.current = null;
      }
      animRef.current = requestAnimationFrame(tick);
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [dc, thetaOpen, thetaMax, rawConfig.openFStop, DEFAULT_THETA, easeOutMs]);

  const { N } = dc;
  const stepDeg = 360 / N;
  const maskCount = Math.floor((N - 1) / 2);

  if (blades.length === 0) return null;

  const b0 = blades[0];
  const b0AngleDeg = (b0.bladeAngle * 180) / Math.PI;
  const b0Transform = `translate(${b0.pivotPos.x.toFixed(3)},${b0.pivotPos.y.toFixed(3)}) rotate(${b0AngleDeg.toFixed(3)})`;

  // ── Mouse interaction ──────────────────────────────────────────────────────
  // Architecture:
  //   mousemove  → writes targetThetaRef (raw desired theta, with entry-offset applied)
  //   chase RAF  → each frame exponentially approaches targetThetaRef (τ = chaseTauMs)
  //   leave RAF  → cubic ease-out back to DEFAULT_THETA over easeOutMs
  //
  // Events fire on the wrapper div (sized by hotzoneScaleH/V), not the SVG,
  // so the interactive area can extend beyond the rendered iris footprint.

  function startChase() {
    if (chaseRef.current) return;
    lastFrameRef.current = performance.now();
    // hasMovedSignificantly: convergence stop is only armed after the chase
    // has seen a non-trivial delta (> 0.01 rad). This prevents the stop from
    // firing at t=0 when target === current (e.g. init animation start).
    let hasMovedSignificantly = false;
    function chaseTick(now: number) {
      const dt   = Math.min(now - lastFrameRef.current, 64);
      lastFrameRef.current = now;
      const k    = 1 - Math.exp(-dt / chaseTauMs);
      const next = thetaRef.current + (targetThetaRef.current - thetaRef.current) * k;
      thetaRef.current = next;
      setTheta(next);
      const delta = Math.abs(next - targetThetaRef.current);
      if (delta > 0.01) hasMovedSignificantly = true;
      // Stop once converged — but only after meaningful movement has occurred.
      if (hasMovedSignificantly && delta < 0.001) {
        thetaRef.current = targetThetaRef.current;
        setTheta(targetThetaRef.current);
        chaseRef.current = null;
      } else {
        chaseRef.current = requestAnimationFrame(chaseTick);
      }
    }
    chaseRef.current = requestAnimationFrame(chaseTick);
  }

  function stopChase() {
    if (chaseRef.current) { cancelAnimationFrame(chaseRef.current); chaseRef.current = null; }
  }

  // Map raw horizontal position within the wrapper rect to theta using
  // diameter-linear aperture scaling. Left = most open, right = f/closedFStop.
  function posToDiameterTheta(clientX: number, rect: DOMRect): number {
    const rawPos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    if (inradiusOpen <= 0) return thetaOpen + rawPos * (thetaMax - thetaOpen); // fallback: linear
    const r22     = (rawConfig.openFStop * inradiusOpen) / closedFStop;
    const targetR = inradiusOpen + rawPos * (r22 - inradiusOpen);
    return findThetaForInradius(targetR, dc, { min: thetaOpen, max: thetaMax });
  }

  function handleMouseEnter(e: React.MouseEvent<HTMLDivElement>) {
    if (!interactive) return;
    if (animRef.current)     { cancelAnimationFrame(animRef.current);     animRef.current = null; }
    if (initAnimRef.current) { cancelAnimationFrame(initAnimRef.current); initAnimRef.current = null; }
    const rect = e.currentTarget.getBoundingClientRect();
    entryOffsetRef.current = thetaRef.current - posToDiameterTheta(e.clientX, rect);
    entryTimeRef.current   = performance.now();
    startChase();
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
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
  //
  // When interactive, a transparent wrapper div sized to the hotzone captures
  // mouse events. The SVG is centered within it. When not interactive, the
  // wrapper collapses to the SVG size (no extra hit area).

  const wrapperW = interactive ? size * hotzoneScaleH : size;
  const wrapperH = interactive ? size * hotzoneScaleV : size;

  return (
    <div
      className={className}
      style={{
        width: wrapperW,
        height: wrapperH,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg
        viewBox="-112 -112 224 224"
        width={size}
        height={size}
        style={{ display: "block", flexShrink: 0, pointerEvents: "none" }}
        aria-hidden="true"
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
    </div>
  );
});

export default Iris;
