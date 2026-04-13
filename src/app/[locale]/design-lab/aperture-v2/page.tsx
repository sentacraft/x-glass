"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  solveAllBlades,
  thetaRange,
  bladeShapePath,
  DEFAULT_IRIS_CONFIG,
  type IrisMechanismConfig,
} from "@/lib/iris-mechanism";

// SVG coordinate space: origin at iris center, R_HOUSING = outer display radius.
// viewBox is larger to accommodate the actuator ring sitting outside R_HOUSING.
const R_HOUSING = 100;
const VIEWBOX = "-150 -150 300 300";

// ── Physical range computation ────────────────────────────────────────────────

/**
 * Find θ_open: the largest theta at which the outer arc apex (OMid) is still
 * flush with the housing circle.
 *
 * OMid = (cx, cy−Ro) is the topmost point of the outer arc in local frame — the
 * only point we use as the reference, because OTail/OTip endpoints extend beyond
 * the blade's physical length (OTipX = cx·(2+f) > L) and dominate the radius
 * sample for wide blades, giving a wrong open position.
 *
 * Search interval: apexRadius is monotonically decreasing on [−δ, kinRange.max].
 *   • d ≥ Rp: kinRange.min = −δ (blades radially outward, apex radius >> housing).
 *   • d  < Rp: kinRange is a hump centred at −δ; −δ is still the most-open point
 *     and lies exactly at (kinRange.min + kinRange.max) / 2.
 * In both cases lo = −δ is the correct starting point.
 */
function computeThetaOpen(
  config: IrisMechanismConfig,
  housingRadius: number
): number {
  const { bladeLength: L, bladeWidth: W, bladeCurvature: C } = config;
  const hw = W / 2;
  const cx = L / 2;
  const s = C * hw * 1.2;
  const Rarc = (cx * cx + s * s) / (2 * s);
  const cy = Rarc - s;
  const Ro = Rarc + hw;

  // Outer arc apex in local frame — the point that should visually align with the housing.
  const OMidX = cx;
  const OMidY = cy - Ro; // negative (above chord) whenever Ro > cy

  function apexRadius(theta: number): number {
    const blades = solveAllBlades(theta, config);
    if (!blades.length) return 0;
    const b = blades[0];
    const ca = Math.cos(b.bladeAngle), sa = Math.sin(b.bladeAngle);
    const wx = b.pivotPos.x + ca * OMidX - sa * OMidY;
    const wy = b.pivotPos.y + sa * OMidX + ca * OMidY;
    return Math.sqrt(wx * wx + wy * wy);
  }

  const kinRange = thetaRange(config);
  // Most-open position is always at θ = −δ (blades radially outward, apex at max radius).
  const lo = -config.slotOffset;
  const hi = kinRange.max;

  // Edge cases
  if (apexRadius(lo) < housingRadius) return lo;
  if (apexRadius(hi) >= housingRadius) return hi;

  // Binary search on [lo, hi]: apexRadius is monotonically decreasing.
  // Find the largest theta where apexRadius >= housingRadius.
  let a = lo, b_var = hi;
  for (let i = 0; i < 60; i++) {
    const m = (a + b_var) / 2;
    if (apexRadius(m) >= housingRadius) a = m; else b_var = m;
  }
  return a;
}

// ── Derived blade curvature ───────────────────────────────────────────────────

/**
 * Derive bladeCurvature so the outer arc radius exactly equals housingRadius.
 *
 * Constraint: Ro = R + hw = housingRadius  →  R = housingRadius - hw
 * Chord-sagitta: R = (cx² + s²) / (2s), s = C · hw · 1.2
 *
 * Solving for C (smaller root = less extreme curvature):
 *   C = (Rt - √(Rt² - cx²)) / (hw · 1.2)
 *   where Rt = housingRadius - hw, cx = L / 2
 *
 * Requires Rt ≥ cx; falls back to 0 if not satisfiable.
 */
function computeBladeCurvature(L: number, W: number, housingRadius: number): number {
  const hw = W / 2;
  const cx = L / 2;
  const Rt = housingRadius - hw;
  const disc = Rt * Rt - cx * cx;
  if (disc < 0) return 0;
  return (Rt - Math.sqrt(disc)) / (hw * 1.2);
}

// ── IrisVisualization ─────────────────────────────────────────────────────────

function IrisVisualization({
  config,
  theta,
  showMechanics,
  uid,
}: {
  config: IrisMechanismConfig;
  theta: number;
  showMechanics: boolean;
  uid: string;
}) {
  const { N } = config;
  const stepDeg = 360 / N;

  // All blade states — only blade[0] transform is needed for the SVG trick:
  // blade i = rotate(stepDeg * i) ∘ blade[0] transform (proved analytically).
  const blades = useMemo(
    () => solveAllBlades(theta, config),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theta, config.N, config.pivotRadius, config.pinDistance, config.slotOffset]
  );
  const shape = useMemo(
    () => bladeShapePath(config),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.bladeLength, config.bladeWidth, config.bladeCurvature, config.pinDistance]
  );

  if (blades.length === 0) return null;

  const b0 = blades[0];
  const b0AngleDeg = (b0.bladeAngle * 180) / Math.PI;
  // blade[0] base transform (pivot at P0, rotated to α_0)
  const b0Transform = `translate(${b0.pivotPos.x.toFixed(3)},${b0.pivotPos.y.toFixed(3)}) rotate(${b0AngleDeg.toFixed(3)})`;

  return (
    <svg
      viewBox={VIEWBOX}
      style={{ display: "block", width: "100%", height: "100%" }}
    >
      <defs>
        {/* Housing clip — blades stay inside R_HOUSING */}
        <clipPath id={`clip-${uid}`}>
          <circle r={R_HOUSING} />
        </clipPath>

        {/*
          Stroke masks — cyclic overlap, all higher layers.

          Blade i's stroke is hidden wherever ANY blade above it in the cyclic
          stack is present: blades (i+1)%N, (i+2)%N, ..., (i+N-1)%N.
          Masking only by the immediate successor ((i+1)%N) leaves ghost strokes
          when a tightly closed iris causes blade i to extend under blades two or
          more steps ahead in the stack.
        */}
        {Array.from({ length: N }, (_, i) => (
          <mask id={`mask-stroke-${i}-${uid}`} key={i}>
            <rect x="-150" y="-150" width="300" height="300" fill="white" />
            {Array.from({ length: N - 1 }, (_, k) => {
              const j = (i + 1 + k) % N;
              return (
                <g key={k} transform={`rotate(${(stepDeg * j).toFixed(3)})`}>
                  <g transform={b0Transform}>
                    <path d={shape} fill="black" />
                  </g>
                </g>
              );
            })}
          </mask>
        ))}
      </defs>

      {/* ── Background ── */}
      <circle r="150" fill="#090909" />
      {/* Inner cavity (slightly lighter than outer background) */}
      <circle r={R_HOUSING} fill="#0d0d0d" />

      {/* ── Mechanics overlay: base plate (fixed) ── */}
      {showMechanics && (
        <g opacity="0.8">
          {/* Pivot-pin circle */}
          <circle
            r={config.pivotRadius}
            fill="none"
            stroke="#1a3a5c"
            strokeWidth="0.6"
            strokeDasharray="3 3"
          />
          {/* Pivot pins */}
          {blades.map((blade, i) => (
            <g key={i}>
              <circle
                cx={blade.pivotPos.x}
                cy={blade.pivotPos.y}
                r="3"
                fill="#0d1f33"
                stroke="#1e4976"
                strokeWidth="0.8"
              />
              <circle
                cx={blade.pivotPos.x}
                cy={blade.pivotPos.y}
                r="1"
                fill="#3a7fc1"
              />
            </g>
          ))}
        </g>
      )}

      {/*
        ── Blade layer: fill (flat) + stroke (cyclic) ──

        Fill: all blades rendered flat with no masks. Since every blade shares
        the same fill color, z-order is invisible — only edges carry depth.

        Stroke: each blade i is stroked with a mask that hides the edge wherever
        blade (i+1)%N sits on top. Cyclic masking is safe here because a 1-D
        edge cannot produce the triple-overlap fill paradox.
      */}
      <g clipPath={`url(#clip-${uid})`}>
        {/* Fill pass — flat, no masks */}
        {Array.from({ length: N }, (_, i) => (
          <g key={i} transform={`rotate(${(stepDeg * i).toFixed(3)})`}>
            <g transform={b0Transform}>
              <path d={shape} fill="#1d1d1d" stroke="none" />
            </g>
          </g>
        ))}
        {/* Stroke pass — cyclic masks */}
        {Array.from({ length: N }, (_, i) => (
          <g key={i} mask={`url(#mask-stroke-${i}-${uid})`}>
            <g transform={`rotate(${(stepDeg * i).toFixed(3)})`}>
              <g transform={b0Transform}>
                <path d={shape} fill="none" stroke="#303030" strokeWidth="0.5" />
              </g>
            </g>
          </g>
        ))}
      </g>

      {/* ── Mechanics overlay: actuator ring (rotates with theta) ── */}
      {showMechanics && (
        <g
          transform={`rotate(${((theta * 180) / Math.PI).toFixed(3)})`}
          opacity="0.7"
        >
          {/* Actuator ring body */}
          <circle
            r={R_HOUSING + 20}
            fill="none"
            stroke="#2a3a2a"
            strokeWidth="16"
            opacity="0.4"
          />
          {/* Radial slots (one per blade) */}
          {Array.from({ length: N }, (_, i) => {
            const slotAngle =
              (i * 2 * Math.PI) / N + config.slotOffset + theta;
            const r1 = 30;
            const r2 = R_HOUSING + 28;
            return (
              <line
                key={i}
                x1={r1 * Math.cos(slotAngle)}
                y1={r1 * Math.sin(slotAngle)}
                x2={r2 * Math.cos(slotAngle)}
                y2={r2 * Math.sin(slotAngle)}
                stroke="#3a5c3a"
                strokeWidth="1.5"
              />
            );
          })}
          {/* Guide pins (current position in world frame, shown on actuator ring) */}
          {blades.map((blade, i) => (
            <circle
              key={i}
              cx={blade.guidePinPos.x}
              cy={blade.guidePinPos.y}
              r="2.5"
              fill="#0d330d"
              stroke="#2a6b2a"
              strokeWidth="0.8"
            />
          ))}
        </g>
      )}

      {/* ── Housing ring ── */}
      <circle
        r={R_HOUSING}
        fill="none"
        stroke="#252525"
        strokeWidth="0.8"
      />
      <circle
        r={R_HOUSING + 5}
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="2"
      />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ApertureV2Lab() {
  const [config, setConfig] = useState<IrisMechanismConfig>(DEFAULT_IRIS_CONFIG);
  const setField = (patch: Partial<IrisMechanismConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }));
    setIsPlaying(false);
    startRef.current = undefined;
  };

  // Derive geometry-constrained parameters (not free parameters):
  //   pivotRadius = R_HOUSING - bladeWidth/2  → outer arc center coincides with world
  //                  origin at open position, so the entire outer arc lies on the housing
  //                  circle (blades are flush with the housing wall when fully open).
  //   bladeCurvature = derived so outer arc radius Ro exactly equals R_HOUSING.
  const derivedConfig = useMemo(
    () => ({
      ...config,
      pivotRadius: R_HOUSING - config.bladeWidth / 2,
      bladeCurvature: computeBladeCurvature(config.bladeLength, config.bladeWidth, R_HOUSING),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.N, config.pinDistance, config.slotOffset,
     config.bladeLength, config.bladeWidth]
  );

  // Physical range: [θ_open, kinRange.max]
  //   θ_open = theta where outer arc is flush with R_HOUSING (fully open, blades at housing wall)
  //   max    = kinematic limit (most closed achievable position)
  const range = useMemo(
    () => ({
      min: computeThetaOpen(derivedConfig, R_HOUSING),
      max: thetaRange(derivedConfig).max,
    }),
    [derivedConfig]
  );

  // Start fully open (range.min = outer arc apex flush with housing wall).
  // Use derived curvature for consistency with the live range computation.
  const [theta, setTheta] = useState(() => {
    const initDerived = {
      ...DEFAULT_IRIS_CONFIG,
      pivotRadius: R_HOUSING - DEFAULT_IRIS_CONFIG.bladeWidth / 2,
      bladeCurvature: computeBladeCurvature(
        DEFAULT_IRIS_CONFIG.bladeLength,
        DEFAULT_IRIS_CONFIG.bladeWidth,
        R_HOUSING
      ),
    };
    return computeThetaOpen(initDerived, R_HOUSING);
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(0.35); // Hz
  const [showMechanics, setShowMechanics] = useState(false);

  // Animation: theta oscillates between range.min and range.max
  const rafRef = useRef<number>();
  const startRef = useRef<number>();
  const thetaRef = useRef(theta);

  useEffect(() => {
    thetaRef.current = theta;
  }, [theta]);

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startRef.current = undefined;
      return;
    }

    function tick(now: number) {
      if (!startRef.current) {
        // Phase-align so animation starts from current theta position
        const { min, max } = range;
        const mid = (min + max) / 2;
        const amp = (max - min) / 2;
        const normalised = (thetaRef.current - mid) / amp; // [-1, 1]
        const phase = Math.asin(Math.max(-1, Math.min(1, normalised)));
        startRef.current = now - (phase / (speed * 2 * Math.PI)) * 1000;
      }
      const elapsed = (now - startRef.current) / 1000;
      const { min, max } = range;
      const mid = (min + max) / 2;
      const amp = (max - min) / 2;
      const newTheta = mid + amp * Math.sin(elapsed * speed * 2 * Math.PI);
      thetaRef.current = newTheta;
      setTheta(newTheta);
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, speed, range]);

  // Reset theta to fully-open (range.min) whenever any design parameter changes.
  // Clamping to the new range would leave theta at an arbitrary relative position,
  // which is confusing when e.g. slotOffset shifts the entire valid range.
  useEffect(() => {
    setTheta(range.min);
    thetaRef.current = range.min;
    startRef.current = undefined;
  }, [range]);

  // Opening percentage: 0% = fully open (range.min), 100% = fully closed (range.max).
  const openPct = Math.round(
    ((theta - range.min) / (range.max - range.min)) * 100
  );

  return (
    <main
      style={{ background: "#080808", minHeight: "100vh" }}
      className="flex flex-col"
    >
      {/* Header */}
      <div className="px-8 pt-8 pb-4">
        <div className="text-xs text-zinc-600 uppercase tracking-wider mb-1">
          Design Lab
        </div>
        <h1 className="text-xl font-semibold text-zinc-200 tracking-tight">
          Aperture v2 — Physical Iris Mechanism
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          3-body kinematic model · base plate + actuator ring + {config.N}{" "}
          rigid blades · solved analytically
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 flex px-8 pb-8 gap-8 items-start">
        {/* Iris display */}
        <div className="flex flex-col items-center gap-5">
          <div style={{ width: 480, height: 480 }}>
            <IrisVisualization
              config={derivedConfig}
              theta={theta}
              showMechanics={showMechanics}
              uid="main"
            />
          </div>

          {/* Theta slider */}
          <div className="w-full" style={{ maxWidth: 480 }}>
            <input
              type="range"
              min={range.min}
              max={range.max}
              step={0.001}
              value={theta}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setTheta(v);
                thetaRef.current = v;
                startRef.current = undefined;
              }}
              className="w-full"
              style={{ accentColor: "#52525b" }}
            />
            <div className="flex justify-between text-xs font-mono mt-1">
              <span className="text-zinc-600">open</span>
              <span className="text-zinc-400">{openPct}%</span>
              <span className="text-zinc-600">closed</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="w-56 shrink-0 space-y-5 pt-1">
          {/* Animation */}
          <section className="space-y-3">
            <p className="text-xs text-zinc-600 uppercase tracking-wider">
              Animation
            </p>
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="w-full rounded py-2 text-sm font-medium transition-colors"
              style={{
                background: isPlaying ? "#3f3f46" : "#27272a",
                color: isPlaying ? "#e4e4e7" : "#71717a",
              }}
            >
              {isPlaying ? "⏸ Pause" : "▶ Play"}
            </button>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-zinc-600">
                <span>Speed</span>
                <span className="font-mono">{speed.toFixed(2)} Hz</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={1.5}
                step={0.05}
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full"
                style={{ accentColor: "#52525b" }}
              />
            </div>
          </section>

          {/* Overlay */}
          <section className="space-y-2">
            <p className="text-xs text-zinc-600 uppercase tracking-wider">
              Overlay
            </p>
            <button
              onClick={() => setShowMechanics((v) => !v)}
              className="w-full rounded py-2 text-sm font-medium text-left px-3 transition-colors"
              style={{
                background: "#1c1c1c",
                color: showMechanics ? "#93c5fd" : "#52525b",
                border: `1px solid ${showMechanics ? "#1e3a5c" : "#222"}`,
              }}
            >
              {showMechanics ? "◆ " : "◇ "}
              Mechanics
            </button>
          </section>

          {/* Blades */}
          <section className="space-y-2">
            <p className="text-xs text-zinc-600 uppercase tracking-wider">
              Blades
            </p>
            <div className="flex gap-1.5">
              {[5, 6, 7, 9].map((n) => (
                <button
                  key={n}
                  onClick={() => setField({ N: n })}
                  className="flex-1 rounded py-1.5 text-sm font-mono font-medium transition-colors"
                  style={{
                    background: config.N === n ? "#3f3f46" : "#1c1c1c",
                    color: config.N === n ? "#e4e4e7" : "#52525b",
                    border: `1px solid ${config.N === n ? "#52525b" : "#222"}`,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </section>

          {/* Mechanism */}
          <section className="space-y-2.5">
            <p className="text-xs text-zinc-600 uppercase tracking-wider">
              Mechanism
            </p>
            {/* Pivot radius is derived: Rp = R_HOUSING − W/2 */}
            <div className="flex justify-between text-xs">
              <span className="text-zinc-700">Pivot r</span>
              <span className="text-zinc-600 font-mono">
                {derivedConfig.pivotRadius.toFixed(0)} px
                <span className="text-zinc-700"> (auto)</span>
              </span>
            </div>
            {(
              [
                { label: "Pin dist", field: "pinDistance" as const, min: 50,             max: 110,            step: 1,    fmt: (v: number) => v + " px" },
                { label: "Slot δ",   field: "slotOffset"  as const, min: Math.PI / 18,  max: 7 * Math.PI / 18, step: 0.01, fmt: (v: number) => ((v * 180) / Math.PI).toFixed(0) + "°" },
              ] as const
            ).map(({ label, field, min, max, step, fmt }) => (
              <div key={field} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-600">{label}</span>
                  <span className="text-zinc-400 font-mono">{fmt(config[field])}</span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={config[field]}
                  onChange={(e) => setField({ [field]: parseFloat(e.target.value) })}
                  className="w-full"
                  style={{ accentColor: "#52525b" }}
                />
              </div>
            ))}
          </section>

          {/* Blade Shape */}
          <section className="space-y-2.5">
            <p className="text-xs text-zinc-600 uppercase tracking-wider">
              Blade Shape
            </p>
            {(
              [
                { label: "Length", field: "bladeLength" as const, min: 80, max: 160, step: 1, fmt: (v: number) => v + " px" },
                { label: "Width",  field: "bladeWidth"  as const, min: 10, max: 45,  step: 1, fmt: (v: number) => v + " px" },
              ] as const
            ).map(({ label, field, min, max, step, fmt }) => (
              <div key={field} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-600">{label}</span>
                  <span className="text-zinc-400 font-mono">{fmt(config[field])}</span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={config[field]}
                  onChange={(e) => setField({ [field]: parseFloat(e.target.value) })}
                  className="w-full"
                  style={{ accentColor: "#52525b" }}
                />
              </div>
            ))}
          </section>

          {/* Reset */}
          <button
            onClick={() => {
              setConfig(DEFAULT_IRIS_CONFIG);
              setIsPlaying(false);
              startRef.current = undefined;
            }}
            className="w-full rounded py-1.5 text-xs font-medium transition-colors"
            style={{
              background: "#1c1c1c",
              color: "#52525b",
              border: "1px solid #222",
            }}
          >
            Reset defaults
          </button>
        </div>
      </div>
    </main>
  );
}
