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
// Use DEFAULT_INIT_ANIMATION for the standard 800/1000 ms timing.

export interface IrisInitAnimation {
  /** Duration of the open → closed sweep (ms). */
  sweepMs: number;
  /** Total duration including the closed → defaultFStop ease-back (ms). */
  totalMs: number;
}

/** Standard init-animation timing. Reference this instead of hardcoding values. */
export const DEFAULT_INIT_ANIMATION: IrisInitAnimation = {
  sweepMs: 800,
  totalMs: 1000,
};

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
   * When present, plays an entry animation on mount: open → closedFStop →
   * defaultFStop, using the exponential-smoothing chase. The object value
   * controls the two-phase timing. Absence (undefined) disables the animation.
   */
  initAnimation?: IrisInitAnimation;
  /**
   * Hard stop for mouse interaction — the minimum aperture (maximum f-number)
   * the pointer can reach. Paired with openFStop which anchors the open end.
   */
  closedFStop?: number;
  /**
   * Scale factor applied to the iris diameter to compute the mouse interaction
   * hotzone (Design Lab follow-mouse mode).
   */
  hotzoneScale?: number;

  // ── Animation ────────────────────────────────────────────────────────────────
  /** Exponential-smoothing time constant for follow-mouse chase (ms). */
  chaseTauMs?: number;
  /** Duration of the cubic ease-out return after mouse leaves (ms). */
  easeOutMs?: number;
  /** Duration over which the entry jump-offset decays to zero (ms). */
  catchupMs?: number;
}

// ── Defaults ──────────────────────────────────────────────────────────────────
//
// Default values for every optional IrisConfig field. bladeColor / strokeColor
// are intentionally absent: their default is undefined (Tailwind auto switching).
//
// Use withIrisDefaults() to merge a partial config with these values so that
// the component receives a fully-populated config with no ?? fallbacks.

export const IRIS_DEFAULTS = {
  strokeWidth:  1.5,
  interactive:  false,
  closedFStop:  22,
  hotzoneScale: 1.5,
  chaseTauMs:   60,
  easeOutMs:    700,
  catchupMs:    300,
} satisfies Partial<IrisConfig>;

/**
 * IrisConfig with all IRIS_DEFAULTS fields guaranteed non-undefined.
 * Returned by withIrisDefaults() so callers can destructure without fallbacks.
 */
export type FilledIrisConfig = IrisConfig & Required<Pick<IrisConfig, keyof typeof IRIS_DEFAULTS>>;

/**
 * Merge an IrisConfig with IRIS_DEFAULTS. Optional fields not supplied in
 * `config` are filled from IRIS_DEFAULTS; explicit values override the defaults.
 *
 * Use this when defining named configs (IRIS_HERO, IRIS_NAV) so that the
 * objects passed to <Iris> always carry fully-populated configs.
 */
export function withIrisDefaults(config: IrisConfig): FilledIrisConfig {
  return { ...IRIS_DEFAULTS, ...config } as FilledIrisConfig;
}

// ── Named configs ─────────────────────────────────────────────────────────────
//
// Two optical-size tiers — analogous to font optical sizing:
//   IRIS_HERO  → homepage hero (large, interactive)
//   IRIS_NAV   → navbar icon, OG image, apple icon (small / static renders)
//
// Only fields that differ from IRIS_DEFAULTS need to be listed here.

export const IRIS_HERO: IrisConfig = withIrisDefaults({
  // Mechanical
  N: 7,
  pinDistance: 85,
  slotOffset: 0.804533,
  bladeLength: 120,
  bladeWidth: 40,
  openFStop: 1.4,
  defaultFStop: 4,
  // Size
  size: 208,
  // Appearance
  bladeColor: "#181818",
  strokeColor: "#b3b3b3",
  strokeWidth: 1,
  // Interactive — non-default values only
  interactive: true,
  initAnimation: DEFAULT_INIT_ANIMATION,
  closedFStop: 22,
  hotzoneScale: 1.5,
  chaseTauMs: 60,
  easeOutMs: 700,
  catchupMs: 300,
});

export const IRIS_NAV: IrisConfig = withIrisDefaults({
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
});

// Site-level metadata (name, description, theme color, PWA display mode, etc.)
// lives in src/config/site.ts — not here. This file is scoped to Iris rendering
// parameters only.
