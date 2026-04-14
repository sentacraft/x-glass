// Brand identity configuration — single source of truth for the aperture mark.
// All Iris instances (Navbar, About, OG image, Apple icon) read their
// defaults from here. Update these values via the Aperture V2 Parameter Studio
// at /design-lab/iris and every static usage updates on next build.
//
// Stored fields are the "free parameters" of the iris kinematic model.
// Derived parameters (pivotRadius, bladeCurvature) are always computed at
// render time by buildDerivedConfig() and are never persisted here.

import type { StoredIrisParams } from "@/lib/iris-kinematics";

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
  /** Show blade drop-shadow. Default true. */
  shadow?: boolean;

  // ── Interactive ─────────────────────────────────────────────────────────────
  /** When true, aperture openness tracks horizontal mouse position. */
  interactive?: boolean;
}

// ── Named configs ─────────────────────────────────────────────────────────────
//
// Two optical-size tiers — analogous to font optical sizing:
//   IRIS_HERO  → large renders: homepage hero, OG image, apple icon
//   IRIS_NAV   → small renders: navbar icon, favicon
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
  t: 0.4917,
  // Size
  size: 208,
  // Appearance
  bladeColor: "#181818",
  strokeColor: "#b3b3b3",
  strokeWidth: 1.0,
  shadow: false,
  // Interactive
  interactive: true,
};

export const IRIS_NAV: IrisConfig = {
  // Mechanical
  N: 5,
  pinDistance: 88,
  slotOffset: 0.6283,
  bladeLength: 115,
  bladeWidth: 36,
  t: 0.45,
  // Size
  size: 26,
  // Appearance: Tailwind dark/light automatic (no colour overrides)
  strokeWidth: 1.5,
  shadow: true,
  // Interactive
  interactive: false,
};

// ── TODO: App name / tagline strings ─────────────────────────────────────────
// TODO: Move appName, appDesc out of i18n if they need to appear in non-intl
// contexts (e.g. OG image generation, metadata).

// ── TODO: OG / social metadata ───────────────────────────────────────────────
// TODO: canonical site URL, OG image dimensions, Twitter card type, etc.

// ── TODO: Favicon / PWA manifest params ──────────────────────────────────────
// TODO: theme color, background color, display mode
