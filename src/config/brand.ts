// Brand identity configuration — single source of truth for the aperture mark.
// All static LogoMark instances (Navbar, About, OG image, share poster) read
// their defaults from here. Update these values and every static usage updates.

// ── Aperture geometry ─────────────────────────────────────────────────────────
//
// Two optical presets — same concept as font optical sizing:
//   BRAND_LOGO     → ≥40px renders (hero, about page, OG image)
//   BRAND_LOGO_SM  → <40px renders (nav icon, favicon, share poster header)
//
// At small sizes the blade gap becomes invisible with a thin stroke, and
// 7 blades are too dense to read — so SM uses fewer blades and a wider gap.
//
// LogoMark picks the preset automatically based on the `size` prop.
// Change LOGO_SM_THRESHOLD if the breakpoint needs to shift.

export const LOGO_SM_THRESHOLD = 40; // px

export const BRAND_LOGO = {
  // Number of blades
  N: 7,
  // Default aperture openness for static instances (0 = fully closed, 1 = fully open)
  t: 0.3,
  // Blade geometry — see ApertureParams in src/lib/aperture.ts for full docs
  halfSpread: 0.6,  // sweep strength; equal gaps guaranteed at any value in [0, overlap+0.5)
  overlap: 0.65,
  curve: 1.0,
  twist: 0.35,
  // Rendering
  bladeStrokeWidth: 0.5,
  shadowStdDeviation: 4,
  shadowOpacity: 0.55,
} as const;

/** Optical small preset — used when rendered size < LOGO_SM_THRESHOLD px. */
export const BRAND_LOGO_SM = {
  N: 5,
  t: 0.35,
  halfSpread: 0.6,
  overlap: 0.65,
  curve: 1.0,
  twist: 0.35,
  bladeStrokeWidth: 4,
  shadowStdDeviation: 2,
  shadowOpacity: 0.4,
} as const;

// ── TODO: App name / tagline strings ─────────────────────────────────────────
// TODO: Move appName, appDesc out of i18n if they need to appear in non-intl
// contexts (e.g. OG image generation, metadata).

// ── TODO: OG / social metadata ───────────────────────────────────────────────
// TODO: canonical site URL, OG image dimensions, Twitter card type, etc.

// ── TODO: Favicon / PWA manifest params ──────────────────────────────────────
// TODO: theme color, background color, display mode
