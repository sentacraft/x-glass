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
  /** Blade gap stroke width in SVG units. Default 1.5. */
  strokeWidth?: number;

  // ── Interactive ─────────────────────────────────────────────────────────────
  /** When true, aperture openness tracks horizontal mouse position. */
  interactive?: boolean;
  /**
   * When true, plays an entry animation on mount: open → closedFStop →
   * defaultFStop over 1 second, using the exponential-smoothing chase.
   */
  initAnimation?: boolean;
  /**
   * Hard stop for mouse interaction — the minimum aperture (maximum f-number)
   * the pointer can reach. Paired with openFStop which anchors the open end.
   * Default 22.
   */
  closedFStop?: number;
  /**
   * Scale factor applied to the iris diameter to compute the mouse interaction
   * hotzone (Design Lab follow-mouse mode). Default 1.5.
   */
  hotzoneScale?: number;

  // ── Animation ────────────────────────────────────────────────────────────────
  /** Exponential-smoothing time constant for follow-mouse chase (ms). Default 60. */
  chaseTauMs?: number;
  /** Duration of the cubic ease-out return after mouse leaves (ms). Default 700. */
  easeOutMs?: number;
  /** Duration over which the entry jump-offset decays to zero (ms). Default 300. */
  catchupMs?: number;
}

// ── Named configs ─────────────────────────────────────────────────────────────
//
// Two optical-size tiers — analogous to font optical sizing:
//   IRIS_HERO  → homepage hero (large, interactive)
//   IRIS_NAV   → navbar icon, OG image, apple icon (small / static renders)
//
// Pass the config directly to <Iris config={…} /> — no size-threshold logic
// lives in the component itself.

export const IRIS_HERO: IrisConfig = {
  // Mechanical
  N: 7,
  pinDistance: 85,
  slotOffset: 0.804533,
  bladeLength: 120,
  bladeWidth: 40,
  openFStop: 1.4,
  defaultFStop: 5.6,
  // Size
  size: 208,
  // Appearance
  bladeColor: "#181818",
  strokeColor: "#b3b3b3",
  strokeWidth: 1.0,
  // Interactive
  interactive: true,
  initAnimation: false,
  closedFStop: 22,
  hotzoneScale: 1.5,
  // Animation
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
  bladeWidth: 36,
  openFStop: 1.4,
  defaultFStop: 5.6,
  // Size
  size: 26,
  // Appearance — explicit colour required for Satori (OG/apple-icon) which
  // cannot evaluate Tailwind classes.
  bladeColor: "#18181b",
  strokeWidth: 1.5,
  // Interactive
  interactive: false,
  initAnimation: false,
};

// ── TODO: App name / tagline strings ─────────────────────────────────────────
// TODO: Move appName, appDesc out of i18n if they need to appear in non-intl
// contexts (e.g. OG image generation, metadata).

// ── TODO: OG / social metadata ───────────────────────────────────────────────
// TODO: canonical site URL, OG image dimensions, Twitter card type, etc.

// ── TODO: Favicon / PWA manifest params ──────────────────────────────────────
// TODO: theme color, background color, display mode
