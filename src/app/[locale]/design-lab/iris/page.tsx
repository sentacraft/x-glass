"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  solveAllBlades,
  thetaRange,
  bladeShapePath,
  buildDerivedConfig,
  computeThetaOpen,
  computeBladeCurvature,
  tNormToTheta,
  DEFAULT_IRIS_CONFIG,
  type IrisMechanismConfig,
  type StoredIrisParams,
} from "@/lib/iris-kinematics";
import { readFromBrand, exportToBrand } from "./actions";

// SVG coordinate space: origin at iris center, R_HOUSING = outer display radius.
// viewBox is larger to accommodate the actuator ring sitting outside R_HOUSING.
const R_HOUSING = 100;
const VIEWBOX = "-150 -150 300 300";

// ── IrisStage ─────────────────────────────────────────────────────────

function IrisStage({
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
        {/* Housing clip — blades stay inside R_HOUSING. The cover plate
            then masks the outer annular ring (R_HOUSING−bladeWidth → R_HOUSING)
            where the blade roots and pivot mechanism sit. */}
        <clipPath id={`clip-${uid}`}>
          <circle r={R_HOUSING} />
        </clipPath>

        {/*
          Stroke masks — cyclic overlap with forward-half masking.

          Blade i's stroke is hidden wherever any of the next floor((N-1)/2)
          blades in the cycle cover it. This handles multi-blade overlaps at
          small apertures while maintaining perfect symmetry (every blade has
          the same number of masking blades) and a consistent pairwise z-order
          with no mutual-masking contradictions.
        */}
        {Array.from({ length: N }, (_, i) => {
          const maskCount = Math.floor((N - 1) / 2);
          return (
            <mask id={`mask-stroke-${i}-${uid}`} key={i}>
              <rect x="-150" y="-150" width="300" height="300" fill="white" />
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
          );
        })}
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

      {/*
        ── Housing cover plate ──
        Physical ring that covers the blade-root / pivot zone:
        inner edge at R_HOUSING − bladeWidth, outer edge at R_HOUSING.
        Hidden when showMechanics is true so the internals are visible.
      */}
      {!showMechanics && (
        <circle
          r={R_HOUSING - config.bladeWidth / 2}
          fill="none"
          stroke="#101010"
          strokeWidth={config.bladeWidth + 1}
        />
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

  // Studio state — preset selection and brand.ts read/write.
  const [selectedPreset, setSelectedPreset] = useState<"IRIS_LG" | "IRIS_SM">("IRIS_LG");
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const setField = (patch: Partial<IrisMechanismConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...patch };
      // Keep pinDistance inside [Rp, bladeLength − 1] after any change.
      // Rp is derived from bladeWidth, so it shifts when bladeWidth changes.
      const rp = R_HOUSING - next.bladeWidth / 2;
      const dMax = next.bladeLength - 1;
      next.pinDistance = Math.max(rp, Math.min(dMax, next.pinDistance));
      return next;
    });
    setIsPlaying(false);
    startRef.current = undefined;
  };

  // Load a preset from brand.ts into the config sliders.
  async function loadPreset(preset: "IRIS_LG" | "IRIS_SM") {
    const v = await readFromBrand(preset);
    if (!v) return;
    const dc = buildDerivedConfig(v, R_HOUSING);
    setConfig(dc);
    setIsPlaying(false);
    startRef.current = undefined;
  }

  // Export current config + current t value back to brand.ts.
  async function handleExport() {
    setExportStatus("Saving…");
    const { min, max } = range;
    const tExport = Math.max(0, Math.min(1, (theta - min) / (max - min)));
    const stored: StoredIrisParams = {
      N: config.N,
      pinDistance: config.pinDistance,
      slotOffset: config.slotOffset,
      bladeLength: config.bladeLength,
      bladeWidth: config.bladeWidth,
      t: tExport,
    };
    const res = await exportToBrand(selectedPreset, stored);
    setExportStatus(res.ok ? `✓ Written to ${selectedPreset}` : `✗ ${res.error}`);
    if (res.ok) setTimeout(() => setExportStatus(null), 3000);
  }

  // Load IRIS_LG on first mount.
  useEffect(() => { loadPreset("IRIS_LG"); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload when preset selector changes.
  useEffect(() => { loadPreset(selectedPreset); }, [selectedPreset]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive geometry-constrained parameters via the shared helper.
  const derivedConfig = useMemo(
    () => buildDerivedConfig(config, R_HOUSING),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.N, config.pinDistance, config.slotOffset,
     config.bladeLength, config.bladeWidth]
  );

  // Physical range: [θ_open, kinRange.max]
  const range = useMemo(
    () => ({
      min: computeThetaOpen(derivedConfig, R_HOUSING),
      max: thetaRange(derivedConfig).max,
    }),
    [derivedConfig]
  );

  // Start at t=0 (fully open) for the default config.
  const [theta, setTheta] = useState(() => {
    const initDerived = buildDerivedConfig(DEFAULT_IRIS_CONFIG, R_HOUSING);
    return computeThetaOpen(initDerived, R_HOUSING);
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(0.35); // Hz
  const [showMechanics, setShowMechanics] = useState(false);

  // Animation: theta oscillates between range.min and range.max
  const rafRef = useRef<number | undefined>(undefined);
  const startRef = useRef<number | undefined>(undefined);
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
          Iris — Kinematic Parameter Studio
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
            <IrisStage
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
          {/* Studio — brand.ts preset read/write */}
          <section className="space-y-2.5">
            <p className="text-xs text-zinc-600 uppercase tracking-wider">
              Studio
            </p>
            <div className="flex gap-1.5">
              {(["IRIS_LG", "IRIS_SM"] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setSelectedPreset(preset)}
                  className="flex-1 rounded py-1.5 text-xs font-mono font-medium transition-colors"
                  style={{
                    background: selectedPreset === preset ? "#3f3f46" : "#1c1c1c",
                    color: selectedPreset === preset ? "#e4e4e7" : "#52525b",
                    border: `1px solid ${selectedPreset === preset ? "#52525b" : "#222"}`,
                  }}
                >
                  {preset === "IRIS_LG" ? "LG" : "SM"}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => loadPreset(selectedPreset)}
                className="flex-1 rounded py-1.5 text-xs font-medium transition-colors"
                style={{ background: "#1c1c1c", color: "#71717a", border: "1px solid #222" }}
              >
                Load
              </button>
              <button
                onClick={handleExport}
                className="flex-1 rounded py-1.5 text-xs font-medium transition-colors"
                style={{ background: "#27272a", color: "#a1a1aa", border: "1px solid #3f3f46" }}
              >
                → Export
              </button>
            </div>
            {exportStatus && (
              <p className={`text-xs font-mono ${exportStatus.startsWith("✓") ? "text-green-500" : "text-red-400"}`}>
                {exportStatus}
              </p>
            )}
          </section>

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
            {/* Pin dist — bounds derived from [Rp, bladeLength − 1] */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-600">Pin dist</span>
                <span className="text-zinc-400 font-mono">{config.pinDistance} px</span>
              </div>
              <input
                type="range"
                min={derivedConfig.pivotRadius}
                max={config.bladeLength - 1}
                step={1}
                value={config.pinDistance}
                onChange={(e) => setField({ pinDistance: parseFloat(e.target.value) })}
                className="w-full"
                style={{ accentColor: "#52525b" }}
              />
              <div className="flex justify-between text-xs text-zinc-700 font-mono">
                <span>{Math.ceil(derivedConfig.pivotRadius)}</span>
                <span>{config.bladeLength - 1}</span>
              </div>
            </div>
            {/* Slot δ */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-600">Slot δ</span>
                <span className="text-zinc-400 font-mono">{((config.slotOffset * 180) / Math.PI).toFixed(0)}°</span>
              </div>
              <input
                type="range"
                min={Math.PI / 18}
                max={7 * Math.PI / 18}
                step={0.01}
                value={config.slotOffset}
                onChange={(e) => setField({ slotOffset: parseFloat(e.target.value) })}
                className="w-full"
                style={{ accentColor: "#52525b" }}
              />
            </div>
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
