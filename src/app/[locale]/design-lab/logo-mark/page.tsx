"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { savePreset, loadPreset } from "./actions";

// ── Geometry ──────────────────────────────────────────────────────────────────

const R = 100;

function fmt(x: number, y: number): string {
  return `${x.toFixed(3)},${y.toFixed(3)}`;
}

/**
 * Build the SVG path for a single blade template positioned at angle 0.
 * All N blades are created by rotating this template by i*(360/N) degrees.
 *
 * Outer edge: a true circular arc following the outer ring — eliminates all
 * gaps between blades and the outer circle. Each blade's arc spans
 * (1 + 2*overlap) * step, so adjacent blades overlap by `overlap*step` on
 * each side, fully covering the outer annulus.
 *
 * Inner tiling proof: P3 of blade i is at global angle (i*step + skew*step).
 * P2 of blade (i-1) is at ((i-1)*step + (1+skew)*step) = (i+skew)*step. They
 * match exactly → adjacent blades share their inner corner for any skew and t,
 * producing a clean N-gon aperture opening.
 *
 * @param N     Number of blades
 * @param t     Aperture openness [0, 1] — 0 = closed, 1 = fully open
 * @param skew  Inner-edge rake angle as fraction of step [0.05, 0.5]
 */
function buildBladePath(
  N: number,
  t: number,
  skew: number,
  overlap: number,
  curve: number,
  twist: number,
): string {
  const step = (2 * Math.PI) / N;
  const rInner = R * (0.08 + 0.72 * t);

  // Outer arc: each blade extends `overlap` steps past each end of its slot.
  // Keep overlap small (0.1–0.2) so adjacent blades don't massively cover each
  // other — all blades stay visually similar in shape.
  // sweep=1 = clockwise in SVG (y-down), matching increasing-angle direction.
  const arcStart = -overlap * step;
  const arcEnd   =  step * (1 + overlap);
  const arcSpan  = arcEnd - arcStart;
  const largeArc = arcSpan > Math.PI ? 1 : 0;

  const ax0 = R * Math.cos(arcStart);
  const ay0 = R * Math.sin(arcStart);
  const ax1 = R * Math.cos(arcEnd);
  const ay1 = R * Math.sin(arcEnd);

  // Twist: as the aperture closes (t→0) the inner polygon rotates by
  // twist×step extra radians. Adjacent blades still share inner corners
  // because the same offset is applied to both P2 and P3 of every blade.
  const innerOffset = twist * (1 - t) * step;

  // Inner trailing corner (p2) and leading corner (p3).
  const p2x = rInner * Math.cos(step * (1 + skew) + innerOffset);
  const p2y = rInner * Math.sin(step * (1 + skew) + innerOffset);
  const p3x = rInner * Math.cos(step * skew + innerOffset);
  const p3y = rInner * Math.sin(step * skew + innerOffset);

  // Side-edge curves: each blade's two side edges (trailing: arcEnd→p2, leading:
  // p3→arcStart) get a quadratic bezier whose control point is pushed AWAY from
  // the centre relative to the edge midpoint. pull > 1 means the midpoint is
  // scaled outward, creating a convex bulge — matching the outward-bowing side
  // edges visible on real aperture blades in the reference image.
  // curve=0 → straight sides; higher values → more convex (outward) sides.
  const pull = 1 + curve * 0.85;
  const cpTrailX = ((ax1 + p2x) / 2) * pull;
  const cpTrailY = ((ay1 + p2y) / 2) * pull;
  const cpLeadX  = ((p3x + ax0) / 2) * pull;
  const cpLeadY  = ((p3y + ay0) / 2) * pull;

  const trailingEdge = curve > 0
    ? `Q ${fmt(cpTrailX, cpTrailY)} ${fmt(p2x, p2y)}`
    : `L ${fmt(p2x, p2y)}`;

  // When curve>0 the leading edge is explicit so Z just closes the path cleanly.
  const leadingEdge = curve > 0
    ? `Q ${fmt(cpLeadX, cpLeadY)} ${fmt(ax0, ay0)}`
    : ``;

  return [
    `M ${fmt(ax0, ay0)}`,
    `A ${R} ${R} 0 ${largeArc} 1 ${fmt(ax1, ay1)}`,
    trailingEdge,
    `L ${fmt(p3x, p3y)}`,
    leadingEdge,
    `Z`,
  ].join(" ");
}

// ── ApertureMark component ────────────────────────────────────────────────────

interface MarkProps {
  N: number;
  t: number;
  skew: number;
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
  skew,
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
  const bladePath = useMemo(
    () => buildBladePath(N, t, skew, overlap, curve, twist),
    [N, t, skew, overlap, curve, twist],
  );
  const stepDeg = 360 / N;
  // Aperture opening radius — mirrors the formula in buildBladePath.
  const rInner = R * (0.08 + 0.72 * t);

  // The aperture opening is an N-gon whose vertices are the P3 inner-leading
  // corners of each blade after rotation. Blade i's P3 sits at global angle
  // (i * step + skew * step). Connecting them with straight lines gives the
  // correct polygonal opening — matching the reference aperture geometry where
  // the inner edges are straight chords, not arcs.
  const aperturePolygon = useMemo(() => {
    const step = (2 * Math.PI) / N;
    const innerOffset = twist * (1 - t) * step;
    return Array.from({ length: N }, (_, i) => {
      const a = i * step + skew * step + innerOffset;
      return `${(rInner * Math.cos(a)).toFixed(3)},${(rInner * Math.sin(a)).toFixed(3)}`;
    }).join(" ");
  }, [N, rInner, skew, twist, t]);

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
        {/* Per-blade masks for circular overlap: each blade is masked to
            exclude the next blade's footprint. This makes every blade show
            only its un-covered portion, eliminating all z-order issues from
            the circular stacking chain — works for any overlap/curve value. */}
        {Array.from({ length: N }, (_, i) => (
          <mask id={`bmask-${i}-${uid}`} key={i}>
            <rect x="-120" y="-120" width="240" height="240" fill="white" />
            <g transform={`rotate(${stepDeg * ((i + 1) % N)})`}>
              <path d={bladePath} fill="black" />
            </g>
          </mask>
        ))}
      </defs>

      {/* Blades, clipped to the outer disc */}
      <g clipPath={`url(#${clipId})`}>
        {Array.from({ length: N }, (_, i) => (
          <g key={i} mask={`url(#bmask-${i}-${uid})`}>
            <g transform={`rotate(${stepDeg * i})`}>
              <path
                d={bladePath}
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

      {/* Aperture cover polygon — paints the N-gon opening with the background
          colour to erase any shadow bleed or inner-edge stroke from the blade
          paths. Vertices are the P3 inner-leading corners of each blade,
          producing a polygon that exactly matches the aperture shape and
          preserves the straight-edged polygonal opening geometry. */}
      <polygon points={aperturePolygon} fill={gap} />

      {/* Outer ring — drawn on top for a crisp circular boundary */}
      {ringStroke > 0 && (
        <circle r={R} fill="none" stroke={fill} strokeWidth={ringStroke} />
      )}

      {/* Single index mark at 12 o'clock — bridges inside/outside the ring,
          mimicking the reference line on a real Fuji aperture ring. Shown
          whenever the outer ring is visible. */}
      {ringStroke > 0 && (
        <line
          x1={0} y1={-(R - 10)}
          x2={0} y2={-(R + 8)}
          stroke={fill}
          strokeWidth={2}
          strokeLinecap="round"
        />
      )}

      {/* Pivot tick marks at each blade pivot position */}
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

      {/* Fuji-style red alignment tab at 3 o'clock (lens mount index) */}
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

      {/* Fuji "A" (Auto) label next to the 12 o'clock index mark.
          Visible at ≥32px render sizes; naturally disappears at favicon scale. */}
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

// f-stop values displayed on the ring, left → right (closed → open).
// "A" = auto/full-open, numeric values match standard Fuji aperture ring markings.
// t values are derived from the fStop() formula inverted: t = 1 - log2(f/1.4)/5
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

  // Each label slot is RING_SPACING wide; the label text is centered within
  // that slot. So label i's visual center is at: offset + (i + 0.5) * RING_SPACING.
  // To center label i under the indicator (at w/2):
  //   offset = w/2 - (i + 0.5) * RING_SPACING
  function offsetForIndex(i: number) {
    const w = containerRef.current?.offsetWidth ?? 400;
    return w / 2 - (i + 0.5) * RING_SPACING;
  }

  // Nearest label index for a given strip offset.
  function nearestIndex(rawOffset: number) {
    const w = containerRef.current?.offsetWidth ?? 400;
    const idx = Math.round((w / 2 - rawOffset) / RING_SPACING - 0.5);
    return Math.max(0, Math.min(RING_VALUES.length - 1, idx));
  }

  // Stepless aperture value for any strip offset: linearly interpolates t
  // between the two neighboring ring stops that straddle the indicator.
  // This gives smooth, continuous aperture response while dragging.
  function tFromOffset(rawOffset: number) {
    const w = containerRef.current?.offsetWidth ?? 400;
    // Continuous index position: 0 = indicator on label 0 centre, 1 = label 1, …
    const pos = (w / 2 - rawOffset) / RING_SPACING - 0.5;
    if (pos <= 0) return RING_VALUES[0].t;
    if (pos >= RING_VALUES.length - 1) return RING_VALUES[RING_VALUES.length - 1].t;
    const lo = Math.floor(pos);
    const frac = pos - lo;
    return RING_VALUES[lo].t + (RING_VALUES[lo + 1].t - RING_VALUES[lo].t) * frac;
  }

  // Sync strip position when value is changed externally (slider, preset load)
  useEffect(() => {
    if (isDragging.current || isAnimating) return;
    setOffset(offsetForIndex(indexForValue(value)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isAnimating]);

  // Set initial offset once container is measured
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
    // Stepless real-time update — interpolates between stops
    onChange(tFromOffset(newOffset));
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging.current || !dragStart.current) return;
    const newOffset = dragStart.current.offset + (e.clientX - dragStart.current.x);
    isDragging.current = false;
    dragStart.current = null;
    // Snap strip to nearest named stop on release
    const idx = nearestIndex(newOffset);
    setSnapping(true);
    setOffset(offsetForIndex(idx));
    onChange(RING_VALUES[idx].t);
    setTimeout(() => setSnapping(false), 220);
  }

  return (
    // Outer wrapper: `relative` so the indicator tick (rendered after the ring)
    // can use absolute positioning that straddles the ring's top edge.
    <div className="relative">
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden select-none cursor-grab active:cursor-grabbing"
        style={{ height: 52, backgroundColor: "#1a1a1a" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Subtle top highlight for depth */}
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />

        {/* Labels strip — masked at edges for cylinder-wrap illusion */}
        <div
          className="absolute inset-0"
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)",
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

      {/* Fixed indicator tick: rendered AFTER the ring so it paints on top.
          Straddles the ring's top edge — bottom 8px is inside the dark ring
          (white-on-dark, clearly visible); top 10px protrudes above the ring.
          `overflow:hidden` on the ring only clips the ring's own children,
          not this sibling element, so the full tick is rendered. */}
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
  // lightness 0 = original dark/light fills; 1 = much lighter/darker
  const lFill = Math.round(31 + lightness * 100);  // #1f(31) → ~131
  const dFill = Math.round(229 - lightness * 100);  // #e5(229) → ~129
  const lHex = `rgb(${lFill},${lFill + 4},${lFill + 8})`;
  const dHex = `rgb(${dFill},${dFill + 2},${dFill + 3})`;
  return {
    light: { fill: lHex, gap: LIGHT_BG, bg: LIGHT_BG },
    dark:  { fill: dHex, gap: DARK_BG,  bg: DARK_BG },
  };
}

// Approximate displayed f-stop from openness parameter
function fStop(t: number): string {
  // Maps t=1 → f/1.4, t=0 → f/45 on a log scale
  return "f/" + (1.4 * Math.pow(2, (1 - t) * 5)).toFixed(1);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LogoMarkLab() {
  const [N, setN] = useState<number>(9);
  const [aperture, setAperture] = useState(0.65);
  const [bladeStroke, setBladeStroke] = useState(1.5);
  const [ringStroke, setRingStroke] = useState(2);
  const [skew, setSkew] = useState(0.3);
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
      if (typeof data.skew === "number") setSkew(data.skew);
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
      savePreset({ N, aperture, bladeStroke, ringStroke, skew, overlap, curve, twist, shadowIntensity, bladeLightness, showTicks, showDot, showLabel });
    }, 500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [loaded, N, aperture, bladeStroke, ringStroke, skew, overlap, curve, twist, shadowIntensity, bladeLightness, showTicks, showDot, showLabel]);

  const colors = bladeColors(bladeLightness);
  const themes = [colors.light, colors.dark] as const;
  const markProps = { N, t: aperture, skew, overlap, curve, twist, shadowIntensity, bladeStroke, ringStroke, showTicks, showDot, showLabel };

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
              label="Blade rake"
              value={skew}
              min={0.05}
              max={0.5}
              step={0.01}
              onChange={setSkew}
              display={`${(skew * 100).toFixed(0)}%`}
            />
            <Slider
              label="Blade overlap"
              value={overlap}
              min={0.02}
              max={0.65}
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
              Show "A" label (≥32px)
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
              <span>rake</span><span>{skew.toFixed(2)} × step</span>
            </div>
            <div className="flex justify-between">
              <span>overlap</span><span>{overlap.toFixed(2)} × step</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
