// Brand identity configuration — single source of truth for the aperture mark.
// All static LogoMark instances (Navbar, About, OG image, share poster) read
// their defaults from here. Update these values and every static usage updates.

// ── Aperture geometry ─────────────────────────────────────────────────────────

export const BRAND_LOGO = {
  // Number of blades
  N: 7,
  // Default aperture openness for static instances (0 = fully closed, 1 = fully open)
  t: 0.3,
  // Blade geometry
  skew: 0.5,
  overlap: 0.65,
  curve: 1.0,
  twist: 0.35,
  // Rendering
  bladeStrokeWidth: 0.5,
  shadowStdDeviation: 4,
  shadowOpacity: 0.55,
} as const;

// ── TODO: App name / tagline strings ─────────────────────────────────────────
// TODO: Move appName, appDesc out of i18n if they need to appear in non-intl
// contexts (e.g. OG image generation, metadata).

// ── TODO: OG / social metadata ───────────────────────────────────────────────
// TODO: canonical site URL, OG image dimensions, Twitter card type, etc.

// ── TODO: Favicon / PWA manifest params ──────────────────────────────────────
// TODO: theme color, background color, display mode
