"use client";

// Lightweight aperture strip for mobile touch interaction.
// Renders a horizontally scrollable row of f-stop labels with feathered edges,
// mimicking the visible portion of a physical aperture ring.
//
// Semi-controlled: the external `fStop` prop drives the display position when
// the user is not actively dragging (e.g. during init animation or after snap).
// During drag, the strip manages its own offset from pointer delta and fires
// onDrive/onRelease to report the user's intent to the parent Iris component.

import { useRef, useState, useEffect } from "react";

// ── Marks ─────────────────────────────────────────────────────────────────────

type Mark = number | "A";

// "A" at index 0 is the Auto stop. All other marks are numeric f-stops.
const MARKS: Mark[] = ["A", 1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22];

// Pixel spacing between consecutive marks. Chosen so ~3 marks are visible in
// the unfeathered centre zone.
const SPACING = 48;

// Index of the nearest numeric mark to a given f-stop value.
function nearestNumericIndex(fStop: number): number {
  let best = 1;
  for (let i = 2; i < MARKS.length; i++) {
    if (Math.abs((MARKS[i] as number) - fStop) < Math.abs((MARKS[best] as number) - fStop)) {
      best = i;
    }
  }
  return best;
}

// Continuous mark index for a given scroll offset.
// Positive offset = strip moved right = lower index (toward A).
function offsetToIndex(offset: number, defaultIdx: number): number {
  return Math.max(0, Math.min(MARKS.length - 1, defaultIdx - offset / SPACING));
}

// Interpolated f-stop value for a continuous index ≥ 1 (numeric zone).
function indexToFStop(idx: number): number {
  const lo = Math.max(1, Math.floor(idx));
  const hi = Math.min(MARKS.length - 1, lo + 1);
  return (MARKS[lo] as number) + ((MARKS[hi] as number) - (MARKS[lo] as number)) * (idx - lo);
}

// Continuous mark index for a given f-stop value (inverse of indexToFStop).
function fStopToIndex(fStop: number): number {
  if (fStop <= (MARKS[1] as number)) return 1;
  for (let i = 1; i < MARKS.length - 1; i++) {
    const lo = MARKS[i] as number;
    const hi = MARKS[i + 1] as number;
    if (fStop <= hi) return i + (fStop - lo) / (hi - lo);
  }
  return MARKS.length - 1;
}

function formatMark(mark: Mark): string {
  if (mark === "A") return "A";
  return (mark === 1.4 || mark === 2.8 || mark === 5.6)
    ? (mark as number).toFixed(1)
    : String(mark);
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ApertureStripProps {
  /** F-stop the iris rests at — defines the strip centre (offset = 0). */
  defaultFStop: number;
  /**
   * Current f-stop from the parent Iris. Drives the strip position when the
   * user is not actively dragging. Undefined = strip stays at its last position.
   */
  fStop?: number;
  /** Delay before first appearance (ms). */
  showDelay?: number;
  /** Called on every pointer-move frame with the current f-stop. */
  onDrive: (fStop: number) => void;
  /** Called when the user snaps to "A" — iris should ease back to defaultFStop. */
  onRelease: () => void;
}

export default function ApertureStrip({
  defaultFStop,
  fStop,
  showDelay = 0,
  onDrive,
  onRelease,
}: ApertureStripProps) {
  // defaultIdx: the mark index that sits at centre when offset = 0.
  const defaultIdx = nearestNumericIndex(defaultFStop);

  const [visible,  setVisible]  = useState(false);
  const [offset,   setOffset]   = useState(0);
  const [snapping, setSnapping] = useState(false);

  const dragRef           = useRef<{ startX: number; startOffset: number } | null>(null);
  const lastValidOffsetRef = useRef(0);
  const snappingRef        = useRef(false);
  const lockedAtARef       = useRef(false);

  // Clamp limits: rightmost = "A" at index 0, leftmost = f/22 at last index.
  const maxOffset =  defaultIdx * SPACING;
  const minOffset = -(MARKS.length - 1 - defaultIdx) * SPACING;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), showDelay);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync offset from external fStop when not dragging, snapping, or locked at A.
  useEffect(() => {
    if (fStop === undefined || dragRef.current || snappingRef.current || lockedAtARef.current) return;
    const idx    = fStopToIndex(fStop);
    const target = Math.max(minOffset, Math.min(maxOffset, (defaultIdx - idx) * SPACING));
    setOffset(target);
  }, [fStop, defaultIdx, minOffset, maxOffset]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startOffset: offset };
    lockedAtARef.current = false;
    setSnapping(false);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const raw     = dragRef.current.startOffset + (e.clientX - dragRef.current.startX);
    const clamped = Math.max(minOffset, Math.min(maxOffset, raw));
    lastValidOffsetRef.current = clamped;
    setOffset(clamped);
    const idx = offsetToIndex(clamped, defaultIdx);
    // In the A zone (index < 0.5) don't drive — let snap handle it.
    if (idx >= 0.5) onDrive(indexToFStop(idx));
  }

  function snapToNearest(clamped: number) {
    const continuous = offsetToIndex(clamped, defaultIdx);
    const nearestIdx = Math.round(continuous);
    setSnapping(true);
    snappingRef.current = true;
    setTimeout(() => { setSnapping(false); snappingRef.current = false; }, 220);
    // (defaultIdx - nearestIdx) * SPACING positions nearestIdx at the centre
    // indicator; this formula is correct for all marks including A (idx=0).
    setOffset((defaultIdx - nearestIdx) * SPACING);
    if (nearestIdx === 0) {
      lockedAtARef.current = true;
      onRelease();
    } else {
      onDrive(MARKS[nearestIdx] as number);
    }
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const raw = dragRef.current.startOffset + (e.clientX - dragRef.current.startX);
    dragRef.current = null;
    snapToNearest(Math.max(minOffset, Math.min(maxOffset, raw)));
  }

  function onPointerCancel() {
    if (!dragRef.current) return;
    dragRef.current = null;
    // clientX is unreliable on cancel — snap using the last valid pointer position.
    snapToNearest(lastValidOffsetRef.current);
  }

  // Total pixel width of the marks row.
  const rowWidth = MARKS.length * SPACING;
  // Left edge so that mark[defaultIdx] sits at container centre when offset = 0.
  const rowLeft  = `calc(50% - ${(defaultIdx + 0.5) * SPACING}px)`;

  return (
    <div
      className="relative"
      style={{
        opacity:       visible ? 1 : 0,
        transition:    "opacity 0.6s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {/* Centre indicator tick */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 -translate-x-1/2 w-px h-2 bg-current opacity-50 text-zinc-500 dark:text-zinc-400"
      />

      {/* Scrollable label track — overflow clips the marks row */}
      <div
        className="mt-2.5 h-7 overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none text-zinc-500 dark:text-zinc-400"
        style={{
          maskImage:       "linear-gradient(to right, transparent 0%, black 22%, black 78%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 22%, black 78%, transparent 100%)",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {/* Marks row — absolutely positioned so the overflow clip works */}
        <div
          className="absolute flex items-center h-full will-change-transform"
          style={{
            width:      rowWidth,
            left:       rowLeft,
            transform:  `translateX(${offset}px)`,
            transition: snapping ? "transform 0.22s ease-out" : "none",
          }}
        >
          {MARKS.map((mark, i) => (
            mark === "A" ? (
              <div
                key={i}
                className="w-12 text-center text-xs font-semibold tracking-[0.03em]"
                style={{ opacity: 0.85, color: "#C0452D" }}
              >
                A
              </div>
            ) : (
              <div
                key={i}
                className="w-12 text-center text-xs font-medium tracking-[0.03em] tabular-nums opacity-60"
              >
                {formatMark(mark)}
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}
