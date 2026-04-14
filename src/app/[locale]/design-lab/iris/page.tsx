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

// ── F-stop ring constants ─────────────────────────────────────────────────────
const FSTOP_RING_R = 120;                                    // ring circle radius (SVG units)
const FSTOP_LABEL_R = 130;                                   // label radius (outside ring)
const FSTOP_SEQUENCE = [1, 1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22];
const FSTOP_ANGLE_STEP = 360 / FSTOP_SEQUENCE.length;       // 36° per stop

// Continuous angle (degrees) in ring frame for a given f-stop value.
// f/1 → 0°, f/1.4 → 36°, f/2 → 72°, …, f/22 → ~324°
function fStopToRingAngle(f: number): number {
  return Math.log2(Math.max(0.5, f)) * 2 * FSTOP_ANGLE_STEP;
}

// ── IrisStage ─────────────────────────────────────────────────────────

function IrisStage({
  config,
  theta,
  showMechanics,
  showFStopRing = false,
  fStop = 1.4,
  strokeWidth,
  shadowOpacity,
  bladeColor,
  strokeColor,
  uid,
}: {
  config: IrisMechanismConfig;
  theta: number;
  showMechanics: boolean;
  showFStopRing?: boolean;
  fStop?: number;
  strokeWidth: number;
  shadowOpacity: number;
  bladeColor: string;
  strokeColor: string;
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
        <filter id={`shadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="black" floodOpacity={shadowOpacity} />
        </filter>

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
      <circle r="150" fill="#f5f5f4" />
      {/* Inner cavity — slightly warmer tone to differentiate aperture opening */}
      <circle r={R_HOUSING} fill="#ede9e4" />

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
              <path d={shape} fill={bladeColor} stroke="none" filter={shadowOpacity > 0 ? `url(#shadow-${uid})` : undefined} />
            </g>
          </g>
        ))}
        {/* Stroke pass — cyclic masks */}
        {Array.from({ length: N }, (_, i) => (
          <g key={i} mask={`url(#mask-stroke-${i}-${uid})`}>
            <g transform={`rotate(${(stepDeg * i).toFixed(3)})`}>
              <g transform={b0Transform}>
                <path d={shape} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
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
          stroke="#f5f5f4"
          strokeWidth={config.bladeWidth + 1}
        />
      )}

      {/* ── Housing ring ── */}
      <circle
        r={R_HOUSING}
        fill="none"
        stroke="#d6d3d1"
        strokeWidth="0.8"
      />
      <circle
        r={R_HOUSING + 5}
        fill="none"
        stroke="#e7e5e4"
        strokeWidth="2"
      />

      {/* ── F-stop ring overlay ── */}
      {showFStopRing && (() => {
        const isValid = isFinite(fStop) && fStop >= 1;
        // Rotate ring so that the current f-stop lands at 12 o'clock (-90° in SVG).
        const ringRot = isValid ? -90 - fStopToRingAngle(fStop) : -90;
        const ringRotStr = ringRot.toFixed(3);
        return (
          <g>
            {/* Fixed index mark at 12 o'clock, just outside the ring */}
            <line
              x1="0" y1={-(FSTOP_RING_R + 3)}
              x2="0" y2={-(FSTOP_RING_R + 13)}
              stroke="#52525b" strokeWidth="1.5" strokeLinecap="round"
            />
            {/* Rotating group: ring circle + ticks + labels */}
            <g transform={`rotate(${ringRotStr})`}>
              <circle r={FSTOP_RING_R} fill="none" stroke="#d4d4d8" strokeWidth="0.6" />
              {FSTOP_SEQUENCE.map((f, i) => {
                const deg = i * FSTOP_ANGLE_STEP;
                const rad = (deg * Math.PI) / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);
                const tx = FSTOP_LABEL_R * cos;
                const ty = FSTOP_LABEL_R * sin;
                const t1x = (FSTOP_RING_R - 6) * cos;
                const t1y = (FSTOP_RING_R - 6) * sin;
                const t2x = FSTOP_RING_R * cos;
                const t2y = FSTOP_RING_R * sin;
                // Counter-rotate each label so it stays upright in world frame.
                const label = f === 1.4 || f === 2.8 || f === 5.6
                  ? f.toFixed(1)
                  : String(f);
                return (
                  <g key={f}>
                    <line
                      x1={t1x.toFixed(3)} y1={t1y.toFixed(3)}
                      x2={t2x.toFixed(3)} y2={t2y.toFixed(3)}
                      stroke="#a1a1aa" strokeWidth="0.8"
                    />
                    <text
                      x={tx.toFixed(3)} y={ty.toFixed(3)}
                      textAnchor="middle" dominantBaseline="central"
                      fontSize="8.5" fill="#71717a"
                      fontFamily="ui-monospace, SFMono-Regular, monospace"
                      transform={`rotate(${(-ringRot).toFixed(3)}, ${tx.toFixed(3)}, ${ty.toFixed(3)})`}
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
            </g>
          </g>
        );
      })()}
    </svg>
  );
}

// ── F-stop helpers ────────────────────────────────────────────────────────────

/**
 * Compute the aperture inradius by finding where two adjacent blades' inner
 * arcs intersect. That intersection point is the corner of the aperture polygon;
 * its distance from the iris centre equals the inscribed-circle radius.
 *
 * Each blade has a circular inner arc of radius Ri = R − hw centred at local
 * (cx, cy_local). We transform both blade-0 and blade-1 arc centres to world
 * frame, then solve the two-equal-radius circle intersection. The nearer of the
 * two solutions to the iris centre is the aperture vertex.
 *
 * This is the only correct approach: blade-tip or perpendicular-to-centreline
 * approximations both fail because the blade tip crosses the iris centre during
 * closure and the inner-arc curvature is not captured by a straight-line proxy.
 */
function apertureInradius(theta: number, dc: IrisMechanismConfig): number {
  const blades = solveAllBlades(theta, dc);
  if (blades.length < 2) return 0;

  const { bladeLength: L, bladeWidth: W, bladeCurvature: C } = dc;
  const hw = W / 2;
  const cx = L / 2;

  if (C < 0.005) return 0;

  const s    = C * hw * 1.2;
  const R    = (cx * cx + s * s) / (2 * s);
  const cyL  = R - s;   // inner-arc centre y in local frame (positive = below chord)
  const Ri   = R - hw;  // inner-arc radius

  if (Ri <= 0) return 0;

  // World-frame inner-arc centre for blade b
  function arcCenter(b: (typeof blades)[0]) {
    const ca = Math.cos(b.bladeAngle), sa = Math.sin(b.bladeAngle);
    return {
      x: b.pivotPos.x + cx * ca - cyL * sa,
      y: b.pivotPos.y + cx * sa + cyL * ca,
    };
  }

  const c0 = arcCenter(blades[0]);
  const c1 = arcCenter(blades[1]);

  const dx = c1.x - c0.x;
  const dy = c1.y - c0.y;
  const d  = Math.sqrt(dx * dx + dy * dy);

  // When arc centers coincide (d ≈ 0), all inner arcs are concentric at the
  // iris origin — this is the fully-open state where Ro = R_HOUSING forces every
  // arc centre to land exactly at origin. The aperture is then the inner-arc
  // circle itself, so inradius = Ri.
  if (d < 0.001) return Ri;
  if (d >= 2 * Ri) return 0;

  // Midpoint + perpendicular offset for equal-radius circle intersection
  const mx = (c0.x + c1.x) / 2;
  const my = (c0.y + c1.y) / 2;
  const h  = Math.sqrt(Math.max(0, Ri * Ri - (d / 2) * (d / 2)));

  const px = (-dy / d) * h;
  const py = ( dx / d) * h;

  const r1 = Math.hypot(mx + px, my + py);
  const r2 = Math.hypot(mx - px, my - py);

  return Math.min(r1, r2);
}

function formatFStop(f: number): string {
  if (!isFinite(f) || f > 22) return "f/—";
  return `f/${f.toFixed(1)}`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ApertureV2Lab() {
  const [config, setConfig] = useState<IrisMechanismConfig>(DEFAULT_IRIS_CONFIG);

  // Studio profiles: "lab" is in-memory only; the two production profiles
  // read/write brand.ts via server actions.
  type StudioProfile = "lab" | "production:large" | "production:small";
  const [selectedProfile, setSelectedProfile] = useState<StudioProfile>("production:large");
  const [labConfig, setLabConfig] = useState<StoredIrisParams | null>(null);
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

  // Load the selected profile's params into the workspace.
  async function handleLoad() {
    if (selectedProfile === "lab") {
      if (!labConfig) return;
      setConfig(buildDerivedConfig(labConfig, R_HOUSING));
    } else {
      const key = selectedProfile === "production:large" ? "IRIS_LG" : "IRIS_SM";
      const v = await readFromBrand(key);
      if (!v) return;
      setConfig(buildDerivedConfig(v, R_HOUSING));
    }
    setIsPlaying(false);
    startRef.current = undefined;
  }

  // Export current workspace params to the selected profile.
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
    if (selectedProfile === "lab") {
      setLabConfig(stored);
      setExportStatus("✓ Saved to Lab");
      setTimeout(() => setExportStatus(null), 3000);
    } else {
      const key = selectedProfile === "production:large" ? "IRIS_LG" : "IRIS_SM";
      const res = await exportToBrand(key, stored);
      setExportStatus(res.ok ? `✓ Written to ${key}` : `✗ ${res.error}`);
      if (res.ok) setTimeout(() => setExportStatus(null), 3000);
    }
  }

  // Seed the workspace from production:large on first mount only.
  useEffect(() => {
    readFromBrand("IRIS_LG").then(v => {
      if (!v) return;
      setConfig(buildDerivedConfig(v, R_HOUSING));
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
  const [showFStopRing, setShowFStopRing] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(0.5);
  const [shadowOpacity, setShadowOpacity] = useState(0);
  const [bladeGray, setBladeGray] = useState(24);   // 0=black … 255=white; default ≈ zinc-900
  const [strokeGray, setStrokeGray] = useState(63); // default ≈ zinc-700

  function grayHex(v: number) {
    const h = Math.round(v).toString(16).padStart(2, "0");
    return `#${h}${h}${h}`;
  }

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

  // F-stop: physics-derived from the arc-arc intersection aperture inradius.
  // f = 1.4 × (r_open / r_current). Displays f/— when r_current < 0.5 px.
  const inradiusCurrent = useMemo(
    () => apertureInradius(theta, derivedConfig),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theta, derivedConfig.N, derivedConfig.pivotRadius, derivedConfig.pinDistance,
     derivedConfig.slotOffset, derivedConfig.bladeLength, derivedConfig.bladeWidth,
     derivedConfig.bladeCurvature]
  );
  const inradiusOpen = useMemo(
    () => apertureInradius(range.min, derivedConfig),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [range.min, derivedConfig.N, derivedConfig.pivotRadius, derivedConfig.pinDistance,
     derivedConfig.slotOffset, derivedConfig.bladeLength, derivedConfig.bladeWidth,
     derivedConfig.bladeCurvature]
  );
  const fStop = inradiusCurrent > 0.5
    ? 1.4 * (inradiusOpen / inradiusCurrent)
    : Infinity;

  return (
    <main
      style={{ background: "#f5f5f4", minHeight: "100vh" }}
      className="flex flex-col"
    >
      {/* Header */}
      <div className="px-8 pt-8 pb-4">
        <div className="text-xs text-zinc-600 uppercase tracking-wider mb-1">
          Design Lab
        </div>
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
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
              showFStopRing={showFStopRing}
              fStop={fStop}
              strokeWidth={strokeWidth}
              shadowOpacity={shadowOpacity}
              bladeColor={grayHex(bladeGray)}
              strokeColor={grayHex(strokeGray)}
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
              <span className="text-zinc-500">open</span>
              <span className="text-zinc-600">
                {openPct}%
                <span className="text-zinc-400 ml-2">·</span>
                <span className="ml-2">{formatFStop(fStop)}</span>
              </span>
              <span className="text-zinc-500">closed</span>
            </div>
          </div>
        </div>

        {/* Controls — 3-column grid */}
        <div style={{ flexShrink: 0, width: 580, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", columnGap: 32, paddingTop: 4 }}>

          {/* ── Col 1: Playback & View ── */}
          <div className="space-y-5">
            <section className="space-y-2.5">
              <p className="text-sm font-semibold text-zinc-800 uppercase tracking-wide pt-3">Studio</p>
              {/* Profile selector — switching does not load; only Load/Export act */}
              <div className="flex gap-1.5">
                {(["lab", "production:large", "production:small"] as const).map((profile) => (
                  <button
                    key={profile}
                    onClick={() => setSelectedProfile(profile)}
                    className="flex-1 rounded py-1.5 text-xs font-mono font-medium transition-colors"
                    style={selectedProfile === profile
                      ? { background: "#18181b", color: "#fff", border: "1px solid #18181b" }
                      : { background: "#fff", color: "#3f3f46", border: "1px solid #d4d4d8" }}
                  >
                    {profile === "lab" ? "Lab"
                      : profile === "production:large" ? "Prod LG"
                      : "Prod SM"}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={handleLoad}
                  disabled={selectedProfile === "lab" && labConfig === null}
                  className="flex-1 rounded py-1.5 text-xs font-medium transition-colors"
                  style={selectedProfile === "lab" && labConfig === null
                    ? { background: "#fff", color: "#a1a1aa", border: "1px solid #e4e4e7", cursor: "not-allowed" }
                    : { background: "#fff", color: "#3f3f46", border: "1px solid #d4d4d8" }}
                >
                  Load
                </button>
                <button
                  onClick={handleExport}
                  className="flex-1 rounded py-1.5 text-xs font-medium transition-colors"
                  style={{ background: "#18181b", color: "#fff", border: "1px solid #18181b" }}
                >
                  → Export
                </button>
              </div>
              {exportStatus && (
                <p className={`text-xs font-mono ${exportStatus.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>
                  {exportStatus}
                </p>
              )}
            </section>

            <section className="space-y-3">
              <p className="text-sm font-semibold text-zinc-800 uppercase tracking-wide pt-3">Animation</p>
              <button
                onClick={() => setIsPlaying((p) => !p)}
                className="w-full rounded py-2 text-sm font-medium transition-colors"
                style={isPlaying
                  ? { background: "#18181b", color: "#fff", border: "1px solid #18181b" }
                  : { background: "#fff", color: "#3f3f46", border: "1px solid #d4d4d8" }}
              >
                {isPlaying ? "⏸ Pause" : "▶ Play"}
              </button>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Speed</span>
                  <span className="font-mono">{speed.toFixed(2)} Hz</span>
                </div>
                <input type="range" min={0.05} max={1.5} step={0.05} value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full" style={{ accentColor: "#18181b" }}
                />
              </div>
            </section>

            <section className="space-y-2">
              <p className="text-sm font-semibold text-zinc-800 uppercase tracking-wide pt-3">Overlay</p>
              <button
                onClick={() => setShowMechanics((v) => !v)}
                className="w-full rounded py-2 text-sm font-medium text-left px-3 transition-colors"
                style={showMechanics
                  ? { background: "#18181b", color: "#fff", border: "1px solid #18181b" }
                  : { background: "#fff", color: "#3f3f46", border: "1px solid #d4d4d8" }}
              >
                {showMechanics ? "◆ " : "◇ "}Mechanics
              </button>
              <button
                onClick={() => setShowFStopRing((v) => !v)}
                className="w-full rounded py-2 text-sm font-medium text-left px-3 transition-colors"
                style={showFStopRing
                  ? { background: "#18181b", color: "#fff", border: "1px solid #18181b" }
                  : { background: "#fff", color: "#3f3f46", border: "1px solid #d4d4d8" }}
              >
                {showFStopRing ? "◆ " : "◇ "}F-stop Ring
              </button>
            </section>
          </div>

          {/* ── Col 2: Mechanism ── */}
          <div className="space-y-5">
            <section className="space-y-2.5">
              <p className="text-sm font-semibold text-zinc-800 uppercase tracking-wide pt-3">Blades</p>
              <div className="flex gap-1.5">
                {[5, 6, 7, 9].map((n) => (
                  <button
                    key={n}
                    onClick={() => setField({ N: n })}
                    className="flex-1 rounded py-1.5 text-sm font-mono font-medium transition-colors"
                    style={config.N === n
                      ? { background: "#18181b", color: "#fff", border: "1px solid #18181b" }
                      : { background: "#fff", color: "#3f3f46", border: "1px solid #d4d4d8" }}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {([
                { label: "Length", field: "bladeLength" as const, min: 80, max: 160, step: 1, fmt: (v: number) => v + " px" },
                { label: "Width",  field: "bladeWidth"  as const, min: 10, max: 45,  step: 1, fmt: (v: number) => v + " px" },
              ] as const).map(({ label, field, min, max, step, fmt }) => (
                <div key={field} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">{label}</span>
                    <span className="text-zinc-700 font-mono">{fmt(config[field])}</span>
                  </div>
                  <input type="range" min={min} max={max} step={step} value={config[field]}
                    onChange={(e) => setField({ [field]: parseFloat(e.target.value) })}
                    className="w-full" style={{ accentColor: "#18181b" }}
                  />
                </div>
              ))}
            </section>

            <section className="space-y-2.5">
              <p className="text-sm font-semibold text-zinc-800 uppercase tracking-wide pt-3">Mechanism</p>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Pivot r</span>
                <span className="text-zinc-500 font-mono">
                  {derivedConfig.pivotRadius.toFixed(0)} px
                  <span className="text-zinc-400"> (auto)</span>
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Pin dist</span>
                  <span className="text-zinc-700 font-mono">{config.pinDistance} px</span>
                </div>
                <input type="range"
                  min={derivedConfig.pivotRadius} max={config.bladeLength - 1} step={1}
                  value={config.pinDistance}
                  onChange={(e) => setField({ pinDistance: parseFloat(e.target.value) })}
                  className="w-full" style={{ accentColor: "#18181b" }}
                />
                <div className="flex justify-between text-xs text-zinc-400 font-mono">
                  <span>{Math.ceil(derivedConfig.pivotRadius)}</span>
                  <span>{config.bladeLength - 1}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Slot δ</span>
                  <span className="text-zinc-700 font-mono">{((config.slotOffset * 180) / Math.PI).toFixed(0)}°</span>
                </div>
                <input type="range"
                  min={Math.PI / 18} max={7 * Math.PI / 18} step={0.01}
                  value={config.slotOffset}
                  onChange={(e) => setField({ slotOffset: parseFloat(e.target.value) })}
                  className="w-full" style={{ accentColor: "#18181b" }}
                />
              </div>
            </section>
          </div>

          {/* ── Col 3: Shape & Appearance ── */}
          <div className="space-y-5">
            <section className="space-y-2.5">
              <p className="text-sm font-semibold text-zinc-800 uppercase tracking-wide pt-3">Appearance</p>

              {/* Blade fill gray */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs items-center">
                  <span className="text-zinc-500">Fill</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-700 font-mono">{grayHex(bladeGray)}</span>
                    <div style={{ width: 12, height: 12, borderRadius: 2, background: grayHex(bladeGray), border: "1px solid #d4d4d8" }} />
                  </div>
                </div>
                <input type="range" min={0} max={255} step={1} value={bladeGray}
                  onChange={(e) => setBladeGray(parseFloat(e.target.value))}
                  className="w-full" style={{ accentColor: "#18181b" }}
                />
              </div>

              {/* Blade stroke gray */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs items-center">
                  <span className="text-zinc-500">Stroke color</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-700 font-mono">{grayHex(strokeGray)}</span>
                    <div style={{ width: 12, height: 12, borderRadius: 2, background: grayHex(strokeGray), border: "1px solid #d4d4d8" }} />
                  </div>
                </div>
                <input type="range" min={0} max={255} step={1} value={strokeGray}
                  onChange={(e) => setStrokeGray(parseFloat(e.target.value))}
                  className="w-full" style={{ accentColor: "#18181b" }}
                />
              </div>

              {/* Stroke width */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Stroke width</span>
                  <span className="text-zinc-700 font-mono">{strokeWidth.toFixed(1)} px</span>
                </div>
                <input type="range" min={0} max={3} step={0.1} value={strokeWidth}
                  onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
                  className="w-full" style={{ accentColor: "#18181b" }}
                />
              </div>

              {/* Shadow */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Shadow</span>
                  <span className="text-zinc-700 font-mono">
                    {shadowOpacity === 0 ? "off" : shadowOpacity.toFixed(2)}
                  </span>
                </div>
                <input type="range" min={0} max={1} step={0.01} value={shadowOpacity}
                  onChange={(e) => setShadowOpacity(parseFloat(e.target.value))}
                  className="w-full" style={{ accentColor: "#18181b" }}
                />
              </div>
            </section>

            <button
              onClick={() => {
                setConfig(DEFAULT_IRIS_CONFIG);
                setIsPlaying(false);
                startRef.current = undefined;
              }}
              className="w-full rounded py-1.5 text-xs font-medium transition-colors"
              style={{ background: "#fff", color: "#71717a", border: "1px solid #d4d4d8" }}
            >
              Reset defaults
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}
