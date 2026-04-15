"use client";

// Lightweight aperture strip for mobile touch interaction.
// Renders a horizontally scrollable row of f-stop labels with feathered edges,
// mimicking the visible portion of a physical aperture ring. Drives an IrisHandle
// imperatively on each pointer frame — no React state updates on move events.
//
// Design principles:
//   - No background — floats over the page
//   - Feathered left/right edges (CSS mask gradient)
//   - Auto-hides after inactivity; reappears on touch
//   - Snaps to nearest f-stop on release

import { useRef, useState, useEffect, type RefObject } from "react";
import type { IrisHandle } from "@/components/Iris";

// ── F-stop marks ──────────────────────────────────────────────────────────────

const FSTOP_MARKS = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22] as const;
type FStop = typeof FSTOP_MARKS[number];

// Pixel spacing between consecutive marks. Chosen so ~3 marks are visible in
// the unfeathered centre zone of a 208px container.
const SPACING = 48;

function nearestMarkIndex(fStop: number): number {
  return FSTOP_MARKS.reduce(
    (best, v, i) => (Math.abs(v - fStop) < Math.abs(FSTOP_MARKS[best] - fStop) ? i : best),
    0,
  );
}

// Map a strip scroll offset (px) to a continuous f-stop value.
// Positive offset = strip moved right = smaller f-number (more open).
function offsetToFStop(offset: number, defaultIdx: number): number {
  const continuous = defaultIdx - offset / SPACING;
  const clamped    = Math.max(0, Math.min(FSTOP_MARKS.length - 1, continuous));
  const lo         = Math.floor(clamped);
  const hi         = Math.min(lo + 1, FSTOP_MARKS.length - 1);
  return FSTOP_MARKS[lo] + (FSTOP_MARKS[hi] - FSTOP_MARKS[lo]) * (clamped - lo);
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ApertureStripProps {
  /** Ref to the Iris instance this strip controls. */
  irisRef: RefObject<IrisHandle | null>;
  /** F-stop the iris rests at (defines strip centre). */
  defaultFStop: number;
  /** Delay before first appearance (ms). Use initAnimation.totalMs + buffer. */
  showDelay?: number;
  /** Inactivity duration before auto-hide (ms). */
  hideAfterMs?: number;
  className?: string;
}

export default function ApertureStrip({
  irisRef,
  defaultFStop,
  showDelay = 0,
  hideAfterMs = 3500,
  className,
}: ApertureStripProps) {
  const defaultIdx = nearestMarkIndex(defaultFStop);

  const [visible,  setVisible]  = useState(false);
  const [offset,   setOffset]   = useState(0);
  const [snapping, setSnapping] = useState(false);

  const dragRef      = useRef<{ startX: number; startOffset: number } | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clamp limits so the strip can't scroll past f/1.4 or f/22.
  const maxOffset =  defaultIdx * SPACING;
  const minOffset = -(FSTOP_MARKS.length - 1 - defaultIdx) * SPACING;

  function scheduleHide() {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setVisible(false), hideAfterMs);
  }

  function bringIntoView() {
    setVisible(true);
    scheduleHide();
  }

  // Initial appearance after showDelay.
  useEffect(() => {
    const t = setTimeout(bringIntoView, showDelay);
    return () => {
      clearTimeout(t);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startOffset: offset };
    setSnapping(false);
    bringIntoView();
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const raw     = dragRef.current.startOffset + (e.clientX - dragRef.current.startX);
    const clamped = Math.max(minOffset, Math.min(maxOffset, raw));
    setOffset(clamped);
    irisRef.current?.driveToFStop(offsetToFStop(clamped, defaultIdx));
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const raw     = dragRef.current.startOffset + (e.clientX - dragRef.current.startX);
    dragRef.current = null;

    // Snap to nearest mark.
    const continuous  = defaultIdx - Math.max(minOffset, Math.min(maxOffset, raw)) / SPACING;
    const nearestIdx  = Math.max(0, Math.min(FSTOP_MARKS.length - 1, Math.round(continuous)));
    const snappedOff  = (defaultIdx - nearestIdx) * SPACING;
    const snappedFStop: FStop = FSTOP_MARKS[nearestIdx];

    setSnapping(true);
    setOffset(snappedOff);
    setTimeout(() => setSnapping(false), 220);

    if (snappedFStop === defaultFStop) {
      irisRef.current?.releaseControl();
    } else {
      irisRef.current?.driveToFStop(snappedFStop);
    }
  }

  // Total pixel width of the marks row.
  const rowWidth = FSTOP_MARKS.length * SPACING;
  // Left edge of the row so that mark[defaultIdx] sits at the container centre
  // when offset = 0: centre_x - (defaultIdx + 0.5) * SPACING.
  const rowLeft = `calc(50% - ${(defaultIdx + 0.5) * SPACING}px)`;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        opacity:  visible ? 1 : 0,
        transition: "opacity 0.6s ease",
        // Block pointer events while hidden so the invisible strip doesn't
        // intercept taps on elements below it.
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {/* Centre indicator — a subtle tick above the scrolling labels */}
      <div
        aria-hidden="true"
        className="text-zinc-500 dark:text-zinc-400"
        style={{
          position:  "absolute",
          left:      "50%",
          top:       0,
          transform: "translateX(-50%)",
          width:     1,
          height:    8,
          background: "currentColor",
          opacity:   0.5,
        }}
      />

      {/* Scrollable label track */}
      <div
        className="cursor-grab active:cursor-grabbing"
        style={{
          marginTop:  10,
          height:     28,
          overflow:   "hidden",
          // Feathered edges — recreates the "visible section of a curved ring"
          // effect: only the central portion of the strip is fully opaque.
          maskImage:
            "linear-gradient(to right, transparent 0%, black 22%, black 78%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 22%, black 78%, transparent 100%)",
          // Allow vertical page scroll but capture horizontal drags.
          touchAction: "pan-y",
          userSelect:  "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="text-zinc-500 dark:text-zinc-400"
          style={{
            position:   "absolute",
            display:    "flex",
            alignItems: "center",
            height:     "100%",
            width:      rowWidth,
            left:       rowLeft,
            transform:  `translateX(${offset}px)`,
            transition: snapping ? "transform 0.22s ease-out" : "none",
            willChange: "transform",
          }}
        >
          {FSTOP_MARKS.map((f) => (
            <div
              key={f}
              style={{
                width:             SPACING,
                textAlign:         "center",
                fontSize:          12,
                fontWeight:        500,
                letterSpacing:     "0.03em",
                fontVariantNumeric: "tabular-nums",
                opacity:           0.6,
              }}
            >
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
