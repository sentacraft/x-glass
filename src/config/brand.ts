// Brand identity configuration — single source of truth for the aperture mark.
// All Iris instances (Navbar, About, OG image, Apple icon) read their
// defaults from here. Update these values via the Aperture V2 Parameter Studio
// at /design-lab/iris and every static usage updates on next build.
//
// Stored fields are the "free parameters" of the iris kinematic model.
// Derived parameters (pivotRadius, bladeCurvature) are always computed at
// render time by buildDerivedConfig() and are never persisted here.

import type { StoredIrisParams } from "@/lib/iris-kinematics";

// ── Optical size presets ──────────────────────────────────────────────────────
//
// Two presets — analogous to font optical sizing:
//   BRAND_LOGO     → ≥ LOGO_SM_THRESHOLD px renders (hero, about page, OG image)
//   BRAND_LOGO_SM  → <  LOGO_SM_THRESHOLD px renders (nav icon, favicon)
//
// Iris picks the preset automatically based on the `size` prop.

export const LOGO_SM_THRESHOLD = 40; // px

export const BRAND_LOGO: StoredIrisParams = {
  /** Number of aperture blades. */
  N: 7,
  /** Rigid pivot-to-guide-pin distance (px). Must satisfy Rp ≤ d < bladeLength. */
  pinDistance: 88,
  /** Actuator slot angular offset δ (rad, decimal). π/5 ≈ 0.6283 ≈ 36°. */
  slotOffset: 0.6283,
  /** Blade length from pivot to tip (px). */
  bladeLength: 115,
  /** Blade width at widest point (px). Also determines pivotRadius = 100 − W/2. */
  bladeWidth: 30,
  /** Default aperture openness: 0 = wide open, 1 = fully closed. */
  t: 0.5,
};

export const BRAND_LOGO_SM: StoredIrisParams = {
  N: 5,
  pinDistance: 88,
  slotOffset: 0.6283,
  bladeLength: 115,
  /** Wider blades (36 vs 30) — fewer, chunkier blades read better below 40 px. */
  bladeWidth: 36,
  t: 0.45,
};

// ── TODO: App name / tagline strings ─────────────────────────────────────────
// TODO: Move appName, appDesc out of i18n if they need to appear in non-intl
// contexts (e.g. OG image generation, metadata).

// ── TODO: OG / social metadata ───────────────────────────────────────────────
// TODO: canonical site URL, OG image dimensions, Twitter card type, etc.

// ── TODO: Favicon / PWA manifest params ──────────────────────────────────────
// TODO: theme color, background color, display mode
