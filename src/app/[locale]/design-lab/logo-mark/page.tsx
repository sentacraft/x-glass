"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { savePreset, loadPreset, exportToBrand } from "./actions";
import { bladePath, coverPoints, R } from "@/lib/aperture";
import type { ApertureParams } from "@/lib/aperture";
import { LOGO_SM_THRESHOLD } from "@/config/brand";

// ── ApertureMark component ────────────────────────────────────────────────────

interface MarkProps {
  N: number;
  t: number;
  halfSpread: number;
  overlap: number;
  curve: number;
  twist: number;
  shadowIntensity: number;
  bladeStroke: number;
  ringStroke: number;
  showTicks: boolean;
  showDot: boolean;
  showLabel: boolean;
  fill: string;
  gap: string;
  size: number;
  /** Must be unique per mark on the page — SVG clip IDs are document-global. */
  uid: string;
}

function ApertureMark({
  N,
  t,
  halfSpread,
  overlap,
  curve,
  twist,
  shadowIntensity,
  bladeStroke,
  ringStroke,
  showTicks,
  showDot,
  showLabel,
  fill,
  gap,
  size,
  uid,
}: MarkProps) {
  const params: ApertureParams = { N, halfSpread, overlap, curve, twist };
  const stepDeg = 360 / N;
  const rInner = R * (0.08 + 0.72 * t);

  const bp = useMemo(
    () => bladePath(t, params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [N, t, halfSpread, overlap, curve, twist],
  );

  const aperturePolygon = useMemo(
    () => coverPoints(t, params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [N, t, halfSpread, overlap, curve, twist],
  );

  const ticks = useMemo(() => {
    return Array.from({ length: N }, (_, i) => {
      const a = ((stepDeg * i) / 180) * Math.PI;
      return {
        key: i,
        x1: (R - 7) * Math.cos(a),
        y1: (R - 7) * Math.sin(a),
        x2: R * Math.cos(a),
        y2: R * Math.sin(a),
      };
    });
  }, [N, stepDeg]);

  const clipId = `iris-clip-${uid}`;

  return (
    <svg
      viewBox="-120 -120 240 240"
      width={size}
      height={size}
      style={{ display: "block", flexShrink: 0 }}
    >
      <defs>
        <clipPath id={clipId}>
          <circle r={R} />
        </clipPath>
        {shadowIntensity > 0 && (
          <filter id={`bshadow-${uid}`} x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow
              dx={0}
              dy={0}
              stdDeviation={shadowIntensity * 5}
              floodColor="black"
              floodOpacity={0.55}
            />
          </filter>
        )}
        {Array.from({ length: N }, (_, i) => (
          <mask id={`bmask-${i}-${uid}`} key={i}>
            <rect x="-120" y="-120" width="240" height="240" fill="white" />
            <g transform={`rotate(${stepDeg * ((i + 1) % N)})`}>
              <path d={bp} fill="black" />
            </g>
          </mask>
        ))}
      </defs>

      <g clipPath={`url(#${clipId})`}>
        {Array.from({ length: N }, (_, i) => (
          <g key={i} mask={`url(#bmask-${i}-${uid})`}>
            <g transform={`rotate(${stepDeg * i})`}>
              <path
                d={bp}
                fill={fill}
                stroke={gap}
                strokeWidth={bladeStroke}
                strokeLinejoin="miter"
                strokeMiterlimit={10}
                filter={shadowIntensity > 0 ? `url(#bshadow-${uid})` : undefined}
              />
            </g>
          </g>
        ))}
      </g>

      <polygon points={aperturePolygon} fill={gap} />

      {ringStroke > 0 && (
        <circle r={R} fill="none" stroke={fill} strokeWidth={ringStroke} />
      )}

      {ringStroke > 0 && (
        <line
          x1={0} y1={-(R - 10)}
          x2={0} y2={-(R + 8)}
          stroke={fill}
          strokeWidth={2}
          strokeLinecap="round"
        />
      )}

      {showTicks &&
        ticks.map((tk) => (
          <line
            key={tk.key}
            x1={tk.x1}
            y1={tk.y1}
            x2={tk.x2}
            y2={tk.y2}
            stroke={fill}
            strokeWidth={1}
          />
        ))}

      {showDot && (
        <rect
          x={R + 4}
          y={-1.5}
          width={8}
          height={3}
          rx={0.5}
          fill="#C0452D"
        />
      )}

      {showLabel && (
        <text
          x={5}
          y={-(R + 5)}
          fontSize={9}
          fontWeight="bold"
          fill="#C0452D"
          fontFamily="sans-serif"
          dominantBaseline="auto"
          textAnchor="start"
        >
          A
        </text>
      )}
    </svg>
  );
}

// ── Slider ────────────────────────────────────────────────────────────────────

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span className="font-mono tabular-nums">{display ?? value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-gray-800"
      />
    </div>
  );
}

// ── Aperture ring ─────────────────────────────────────────────────────────────

const RING_SPACING = 64; // px between value labels

const RING_VALUES = [
  { label: "A",   t: 1.00 },
  { label: "16",  t: 0.30 },
  { label: "11",  t: 0.40 },
  { label: "8",   t: 0.50 },
  { label: "5.6", t: 0.60 },
  { label: "4",   t: 0.70 },
  { label: "2.8", t: 0.80 },
  { label: "2",   t: 0.90 },
  { label: "1.4", t: 1.00 },
] as const;

function ApertureRingControl({
  value,
  onChange,
  isAnimating,
}: {
  value: number;
  onChange: (t: number) => void;
  isAnimating: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [snapping, setSnapping] = useState(false);
  const isDragging = useRef(false);
  const dragStart = useRef<{ x: number; offset: number } | null>(null);

  function indexForValue(v: number) {
    let best = 0, bestDist = Infinity;
    RING_VALUES.forEach((rv, i) => {
      const d = Math.abs(rv.t - v);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }

  function offsetForIndex(i: number) {
    const w = containerRef.current?.offsetWidth ?? 400;
    return w / 2 - (i + 0.5) * RING_SPACING;
  }

  function nearestIndex(rawOffset: number) {
    const w = containerRef.current?.offsetWidth ?? 400;
    const idx = Math.round((w / 2 - rawOffset) / RING_SPACING - 0.5);
    return Math.max(0, Math.min(RING_VALUES.length - 1, idx));
  }

  function tFromOffset(rawOffset: number) {
    const w = containerRef.current?.offsetWidth ?? 400;
    const pos = (w / 2 - rawOffset) / RING_SPACING - 0.5;
    if (pos <= 0) return RING_VALUES[0].t;
    if (pos >= RING_VALUES.length - 1) return RING_VALUES[RING_VALUES.length - 1].t;
    const lo = Math.floor(pos);
    const frac = pos - lo;
    return RING_VALUES[lo].t + (RING_VALUES[lo + 1].t - RING_VALUES[lo].t) * frac;
  }

  useEffect(() => {
    if (isDragging.current || isAnimating) return;
    setOffset(offsetForIndex(indexForValue(value)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isAnimating]);

  useEffect(() => {
    setOffset(offsetForIndex(indexForValue(value)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    dragStart.current = { x: e.clientX, offset };
    setSnapping(false);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging.current || !dragStart.current) return;
    const newOffset = dragStart.current.offset + (e.clientX - dragStart.current.x);
    setOffset(newOffset);
    onChange(tFromOffset(newOffset));
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging.current || !dragStart.current) return;
    const newOffset = dragStart.current.offset + (e.clientX - dragStart.current.x);
    isDragging.current = false;
    dragStart.current = null;
    const idx = nearestIndex(newOffset);
    setSnapping(true);
    setOffset(offsetForIndex(idx));
    onChange(RING_VALUES[idx].t);
    setTimeout(() => setSnapping(false), 220);
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden select-none cursor-grab active:cursor-grabbing"
        style={{ height: 52, backgroundColor: "#1a1a1a" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div
          className="absolute inset-0"
          style={{
            maskImage: "linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)",
          }}
        >
          <div
            className="absolute top-0 h-full flex items-center"
            style={{
              left: offset,
              transition: snapping ? "left 0.2s ease-out" : "none",
              willChange: "left",
            }}
          >
            {RING_VALUES.map((v) => (
              <div
                key={v.label}
                className="flex items-center justify-center font-bold text-sm tabular-nums"
                style={{
                  width: RING_SPACING,
                  color: v.label === "A" ? "#C0452D" : "white",
                  letterSpacing: "0.02em",
                }}
              >
                {v.label}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div
        className="absolute pointer-events-none"
        style={{
          left: "50%",
          top: -10,
          transform: "translateX(-50%)",
          width: 2,
          height: 18,
          backgroundColor: "white",
          zIndex: 1,
        }}
      />
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BLADE_OPTIONS = [5, 6, 7, 9] as const;
const PREVIEW_SIZES = [16, 24, 32, 48, 64, 128] as const;

const LIGHT_BG = "#f3f4f6";
const DARK_BG  = "#111827";

function bladeColors(lightness: number) {
  const lFill = Math.round(31 + lightness * 100);
  const dFill = Math.round(229 - lightness * 100);
  const lHex = `rgb(${lFill},${lFill + 4},${lFill + 8})`;
  const dHex = `rgb(${dFill},${dFill + 2},${dFill + 3})`;
  return {
    light: { fill: lHex, gap: LIGHT_BG, bg: LIGHT_BG },
    dark:  { fill: dHex, gap: DARK_BG,  bg: DARK_BG },
  };
}

function fStop(t: number): string {
  return "f/" + (1.4 * Math.pow(2, (1 - t) * 5)).toFixed(1);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LogoMarkLab() {
  const [N, setN] = useState<number>(9);
  const [aperture, setAperture] = useState(0.65);
  const [bladeStroke, setBladeStroke] = useState(1.5);
  const [ringStroke, setRingStroke] = useState(2);
  const [halfSpread, setHalfSpread] = useState(0.6);
  const [overlap, setOverlap] = useState(0.15);
  const [curve, setCurve] = useState(0);
  const [twist, setTwist] = useState(0.5);
  const [shadowIntensity, setShadowIntensity] = useState(0);
  const [bladeLightness, setBladeLightness] = useState(0);
  const [showTicks, setShowTicks] = useState(false);
  const [showDot, setShowDot] = useState(true);
  const [showLabel, setShowLabel] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const animRef = useRef<number | null>(null);
  const startTRef = useRef(aperture);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAnimate = useCallback(() => {
    if (isAnimating) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = null;
      setIsAnimating(false);
      return;
    }

    setIsAnimating(true);
    startTRef.current = aperture;
    const startTime = performance.now();
    const CLOSE_MS = 900;
    const PAUSE_MS = 250;
    const OPEN_MS  = 900;
    const TOTAL_MS = CLOSE_MS + PAUSE_MS + OPEN_MS;

    function easeInOut(p: number) {
      return p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
    }

    function tick(now: number) {
      const elapsed = now - startTime;

      if (elapsed >= TOTAL_MS) {
        setAperture(startTRef.current);
        setIsAnimating(false);
        animRef.current = null;
        return;
      }

      let newT: number;
      if (elapsed < CLOSE_MS) {
        newT = startTRef.current * (1 - easeInOut(elapsed / CLOSE_MS));
      } else if (elapsed < CLOSE_MS + PAUSE_MS) {
        newT = 0;
      } else {
        newT = startTRef.current * easeInOut((elapsed - CLOSE_MS - PAUSE_MS) / OPEN_MS);
      }

      setAperture(newT);
      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);
  }, [aperture, isAnimating]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Load preset from disk on mount
  useEffect(() => {
    loadPreset().then((data) => {
      if (!data) { setLoaded(true); return; }
      if (typeof data.N === "number") setN(data.N);
      if (typeof data.aperture === "number") setAperture(data.aperture);
      if (typeof data.bladeStroke === "number") setBladeStroke(data.bladeStroke);
      if (typeof data.ringStroke === "number") setRingStroke(data.ringStroke);
      if (typeof data.halfSpread === "number") setHalfSpread(data.halfSpread);
      if (typeof data.overlap === "number") setOverlap(data.overlap);
      if (typeof data.curve === "number") setCurve(data.curve);
      if (typeof data.twist === "number") setTwist(data.twist);
      if (typeof data.shadowIntensity === "number") setShadowIntensity(data.shadowIntensity);
      if (typeof data.bladeLightness === "number") setBladeLightness(data.bladeLightness);
      if (typeof data.showTicks === "boolean") setShowTicks(data.showTicks);
      if (typeof data.showDot === "boolean") setShowDot(data.showDot);
      if (typeof data.showLabel === "boolean") setShowLabel(data.showLabel);
      setLoaded(true);
    });
  }, []);

  // Debounced save: persist all params 500ms after last change
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      savePreset({ N, aperture, bladeStroke, ringStroke, halfSpread, overlap, curve, twist, shadowIntensity, bladeLightness, showTicks, showDot, showLabel });
    }, 500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [loaded, N, aperture, bladeStroke, ringStroke, halfSpread, overlap, curve, twist, shadowIntensity, bladeLightness, showTicks, showDot, showLabel]);

  async function handleExport(presetName: "BRAND_LOGO" | "BRAND_LOGO_SM") {
    setExportStatus("Saving…");
    const result = await exportToBrand(presetName, {
      N,
      t: aperture,
      halfSpread,
      overlap,
      curve,
      twist,
      bladeStrokeWidth: bladeStroke,
      // Design Lab uses shadowIntensity (0–1) → stdDeviation = intensity × 5
      shadowStdDeviation: shadowIntensity * 5,
    });
    if (result.ok) {
      setExportStatus(`✓ Written to ${presetName}`);
      setTimeout(() => setExportStatus(null), 3000);
    } else {
      setExportStatus(`✗ ${result.error}`);
    }
  }

  const colors = bladeColors(bladeLightness);
  const themes = [colors.light, colors.dark] as const;
  const markProps = { N, t: aperture, halfSpread, overlap, curve, twist, shadowIntensity, bladeStroke, ringStroke, showTicks, showDot, showLabel };

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-1 text-xs text-gray-400 tracking-wide uppercase">
        Design Lab
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Logo Mark — Mechanical Aperture
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Parametric iris explorer. Adjust controls to find the right balance of
        mechanical precision vs. readability.
      </p>

      <div className="mt-8 flex gap-6 items-start">
        {/* ── Preview ──────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Main preview: light + dark cards */}
          <div className="flex gap-4">
            {themes.map((theme, idx) => (
              <div
                key={idx}
                className="flex-1 flex items-center justify-center rounded-xl py-12"
                style={{ backgroundColor: theme.bg }}
              >
                <ApertureMark
                  {...markProps}
                  fill={theme.fill}
                  gap={theme.gap}
                  size={200}
                  uid={`main-${idx}`}
                />
              </div>
            ))}
          </div>

          {/* Aperture ring control */}
          <ApertureRingControl
            value={aperture}
            onChange={setAperture}
            isAnimating={isAnimating}
          />

          {/* Favicon size row */}
          <div className="rounded-xl border border-gray-200 p-5">
            <p className="mb-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
              Favicon / icon size preview
            </p>
            {themes.map((theme, tidx) => (
              <div key={tidx} className={`flex items-end gap-5 flex-wrap ${tidx === 1 ? "mt-4" : ""}`}>
                {PREVIEW_SIZES.map((sz) => (
                  <div key={sz} className="flex flex-col items-center gap-1.5">
                    <div
                      className="flex items-center justify-center rounded"
                      style={{ background: theme.bg, padding: sz < 32 ? 4 : 6 }}
                    >
                      <ApertureMark
                        {...markProps}
                        fill={theme.fill}
                        gap={theme.gap}
                        size={sz}
                        uid={`fav-${tidx}-${sz}`}
                      />
                    </div>
                    <span className="text-xs text-gray-400 tabular-nums">{sz}</span>
                  </div>
                ))}
                <span className="text-xs text-gray-300 self-end pb-4">
                  {tidx === 0 ? "light" : "dark"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Controls ─────────────────────────────────────────────────── */}
        <aside className="w-72 shrink-0 space-y-6 rounded-xl border border-gray-200 p-5">
          {/* Blade count */}
          <div>
            <p className="mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
              Blade count
            </p>
            <div className="flex gap-2">
              {BLADE_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setN(n)}
                  className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                    N === n
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {N === 9 && (
              <p className="mt-1.5 text-xs text-gray-400">
                ↑ 9-blade = common Fuji prime spec
              </p>
            )}
          </div>

          {/* Sliders */}
          <div className="space-y-4">
            <Slider
              label="Aperture openness"
              value={aperture}
              min={0}
              max={1}
              step={0.01}
              onChange={setAperture}
              display={fStop(aperture)}
            />
            <Slider
              label="Blade gap stroke"
              value={bladeStroke}
              min={0}
              max={4}
              step={0.1}
              onChange={setBladeStroke}
              display={`${bladeStroke.toFixed(1)}px`}
            />
            <Slider
              label="Outer ring stroke"
              value={ringStroke}
              min={0}
              max={6}
              step={0.25}
              onChange={setRingStroke}
              display={`${ringStroke.toFixed(2)}px`}
            />
            <Slider
              label="Half-spread (sweep)"
              value={halfSpread}
              min={0}
              max={0.95}
              step={0.01}
              onChange={setHalfSpread}
              display={halfSpread.toFixed(2)}
            />
            <p className="text-xs text-gray-400 -mt-2">
              Equal gaps guaranteed at any value. 0 = symmetric, higher = more swept.
            </p>
            <Slider
              label="Blade overlap"
              value={overlap}
              min={0.02}
              max={0.9}
              step={0.01}
              onChange={setOverlap}
              display={`${(overlap * 100).toFixed(0)}%`}
            />
            <Slider
              label="Side edge curve"
              value={curve}
              min={0}
              max={1.0}
              step={0.01}
              onChange={setCurve}
              display={curve === 0 ? "off" : curve.toFixed(2)}
            />
            <Slider
              label="Closing twist"
              value={twist}
              min={0}
              max={2}
              step={0.05}
              onChange={setTwist}
              display={twist === 0 ? "off" : `${twist.toFixed(2)}×`}
            />
            <Slider
              label="Shadow intensity"
              value={shadowIntensity}
              min={0}
              max={1}
              step={0.01}
              onChange={setShadowIntensity}
              display={shadowIntensity === 0 ? "off" : shadowIntensity.toFixed(2)}
            />
            <Slider
              label="Blade lightness"
              value={bladeLightness}
              min={0}
              max={1}
              step={0.01}
              onChange={setBladeLightness}
              display={bladeLightness === 0 ? "default" : `+${(bladeLightness * 100).toFixed(0)}%`}
            />
            <p className="text-xs text-gray-400 -mt-2">
              Lighten blades to make shadow visible on dark fills. Try 0.3–0.5 with shadow on.
            </p>
          </div>

          {/* Toggles */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showTicks}
                onChange={(e) => setShowTicks(e.target.checked)}
                className="rounded"
              />
              Show pivot tick marks
            </label>
            <label className="flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showDot}
                onChange={(e) => setShowDot(e.target.checked)}
                className="rounded"
              />
              Show red alignment marker
            </label>
            <label className="flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showLabel}
                onChange={(e) => setShowLabel(e.target.checked)}
                className="rounded"
              />
              Show &ldquo;A&rdquo; label (≥32px)
            </label>
          </div>

          {/* Animate */}
          <button
            onClick={handleAnimate}
            className={`w-full rounded-md py-2 text-sm font-medium transition-colors ${
              isAnimating
                ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                : "bg-gray-900 text-white hover:bg-gray-700"
            }`}
          >
            {isAnimating ? "■ Stop" : "▶ Animate aperture"}
          </button>

          <hr className="border-gray-100" />

          {/* Current state readout */}
          <div className="space-y-1 text-xs font-mono text-gray-400">
            <div className="flex justify-between">
              <span>blades</span><span>{N}</span>
            </div>
            <div className="flex justify-between">
              <span>t</span><span>{aperture.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span>r_inner</span>
              <span>{(R * (0.08 + 0.72 * aperture)).toFixed(1)}px</span>
            </div>
            <div className="flex justify-between">
              <span>halfSpread</span><span>{halfSpread.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>overlap</span><span>{overlap.toFixed(2)} × step</span>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Export to brand.ts */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Export to brand.ts
            </p>
            <p className="text-xs text-gray-400">
              Writes current params directly into{" "}
              <span className="font-mono">src/config/brand.ts</span>.
            </p>
            <button
              onClick={() => handleExport("BRAND_LOGO")}
              className="w-full rounded-md py-1.5 text-sm font-medium bg-gray-900 text-white hover:bg-gray-700 transition-colors"
            >
              → BRAND_LOGO <span className="text-gray-400 font-normal">(≥{LOGO_SM_THRESHOLD}px)</span>
            </button>
            <button
              onClick={() => handleExport("BRAND_LOGO_SM")}
              className="w-full rounded-md py-1.5 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              → BRAND_LOGO_SM <span className="text-gray-400 font-normal">(&lt;{LOGO_SM_THRESHOLD}px)</span>
            </button>
            {exportStatus && (
              <p className={`text-xs font-mono ${exportStatus.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>
                {exportStatus}
              </p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
