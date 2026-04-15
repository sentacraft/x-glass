// Brand identity configuration — single source of truth for the aperture mark.
// All Iris instances (Navbar, About, OG image, Apple icon) read their
// defaults from here. Update these values via the Aperture V2 Parameter Studio
// at /design-lab/iris and every static usage updates on next build.
//
// Stored fields are the "free parameters" of the iris kinematic model.
// Derived parameters (pivotRadius, bladeCurvature) are always computed at
// render time by buildDerivedConfig() and are never persisted here.

import type { StoredIrisParams } from "@/lib/iris-kinematics";

// ── Shared rendering constant ─────────────────────────────────────────────────
//
// SVG coordinate-space radius of the aperture housing ring. All Iris instances
// (component, OG image, apple icon, Design Lab) use the same scale; the SVG
// viewBox and pixel size control the final rendered size.

export const R_HOUSING = 100;

// ── IrisInitAnimation ─────────────────────────────────────────────────────────
//
// Timing config for the two-phase mount animation:
//   Phase 1 (0 → sweepMs):       open → closedFStop  (linear target drive)
//   Phase 2 (sweepMs → totalMs): closedFStop → defaultFStop  (linear, chase smooths it)
//
// Presence of this object on IrisConfig enables the animation; absence disables it.

export interface IrisInitAnimation {
  /** Duration of the open → closed sweep (ms). */
  sweepMs: number;
  /** Total duration including the closed → defaultFStop ease-back (ms). */
  totalMs: number;
}

// ── IrisConfig ────────────────────────────────────────────────────────────────
//
// Full configuration for an Iris component instance. Extends the kinematic
// StoredIrisParams with size, appearance, and interaction settings. Named
// configs below are the single source of truth — the component does not carry
// separate defaults for these properties.

export interface IrisConfig extends StoredIrisParams {
  // ── Size ────────────────────────────────────────────────────────────────────
  /** Render size in px. */
  size: number;

  // ── Appearance ──────────────────────────────────────────────────────────────
  /** Blade fill colour. Undefined = Tailwind dark/light automatic. */
  bladeColor?: string;
  /** Blade gap stroke colour. Undefined = Tailwind dark/light automatic. */
  strokeColor?: string;
  /** Blade gap stroke width in SVG units. */
  strokeWidth?: number;

  // ── Interactive ─────────────────────────────────────────────────────────────
  /** When true, aperture openness tracks horizontal mouse position. */
  interactive?: boolean;
  /**
   * When true, renders a mobile aperture-ring strip below the iris (hidden on
   * md+ screens). Lets touch users drag through f-stops; "A" snaps back to
   * defaultFStop via releaseControl.
   */
  apertureStrip?: boolean;
  /**
   * When present, plays an entry animation on mount: open → closedFStop →
   * defaultFStop, using the exponential-smoothing chase. The object value
   * controls the two-phase timing. Absence (undefined) disables the animation.
   */
  initAnimation?: IrisInitAnimation;
  /**
   * Hard stop for mouse interaction — the minimum aperture (maximum f-number)
   * the pointer can reach. Paired with openFStop which anchors the open end.
   * Only relevant when interactive is true.
   */
  closedFStop?: number;
  /**
   * Horizontal scale factor applied to the iris diameter to compute the width
   * of the mouse interaction hotzone. Values > 1 widen the area, making the
   * control less sensitive. Only relevant when interactive is true.
   */
  hotzoneScaleH?: number;
  /**
   * Vertical scale factor applied to the iris diameter to compute the height
   * of the mouse interaction hotzone. Only relevant when interactive is true.
   */
  hotzoneScaleV?: number;

  // ── Animation ────────────────────────────────────────────────────────────────
  /** Exponential-smoothing time constant for follow-mouse chase (ms). */
  chaseTauMs?: number;
  /** Duration of the cubic ease-out return after mouse leaves (ms). */
  easeOutMs?: number;
  /** Duration over which the entry jump-offset decays to zero (ms). */
  catchupMs?: number;
}

// ── Named configs ─────────────────────────────────────────────────────────────
//
// Three optical-size tiers:
//   IRIS_HERO  → homepage hero (large, interactive)
//   IRIS_NAV   → navbar icon, OG image, apple icon (small / static renders)
//   IRIS_LAB   → Design Lab workspace (tunable copy of IRIS_HERO)
//
// Every field used by the component must be listed explicitly — there is no
// global defaults object. Optional fields absent from a config (e.g. IRIS_NAV
// has no interactive fields) are handled by the component with inline fallbacks.

export const IRIS_HERO: IrisConfig = {
  // Mechanical
  N: 7,
  pinDistance: 85,
  slotOffset: 0.804533,
  bladeLength: 120,
  bladeWidth: 40,
  openFStop: 1.4,
  defaultFStop: 4,
  // Size — matches the tight viewBox: visible iris ≈ 116 px at this render size
  size: 120,
  // Appearance
  bladeColor: "#181818",
  strokeColor: "#b3b3b3",
  strokeWidth: 1,
  // Interactive
  interactive: true,
  apertureStrip: true,
  initAnimation: { sweepMs: 800, totalMs: 1000 },
  closedFStop: 22,
  hotzoneScaleH: 2,
  hotzoneScaleV: 1.0,
  chaseTauMs: 60,
  easeOutMs: 700,
  catchupMs: 300,
};

export const IRIS_NAV: IrisConfig = {
  // Mechanical
  N: 5,
  pinDistance: 88,
  slotOffset: 0.6283,
  bladeLength: 115,
  bladeWidth: 45,
  openFStop: 1.4,
  defaultFStop: 4,
  // Size
  size: 26,
  // Appearance — explicit colour required for Satori (OG/apple-icon) which
  // cannot evaluate Tailwind classes.
  bladeColor: "#181818",
  strokeColor: "#ffffff",
  strokeWidth: 5,
};

export const IRIS_LAB: IrisConfig = {
  // Mechanical
  N: 7,
  pinDistance: 85,
  slotOffset: 0.804533,
  bladeLength: 120,
  bladeWidth: 40,
  openFStop: 1.4,
  defaultFStop: 4,
  // Size — matches IRIS_HERO
  size: 120,
  // Appearance
  bladeColor: "#181818",
  strokeColor: "#b3b3b3",
  strokeWidth: 1,
  // Interactive
  interactive: true,
  initAnimation: { sweepMs: 800, totalMs: 1000 },
  closedFStop: 22,
  hotzoneScaleH: 2,
  hotzoneScaleV: 1.0,
  chaseTauMs: 60,
  easeOutMs: 700,
  catchupMs: 300,
};

// Site-level metadata (name, description, theme color, PWA display mode, etc.)
// lives in src/config/site.ts — not here. This file is scoped to Iris rendering
// parameters only.
