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
  /** Number of aperture blades. Design Lab: "N" */
  N: 7,

  /**
   * Default aperture openness for all static (non-interactive) renders.
   * 0 = fully closed, 1 = fully open.
   * Design Lab: "aperture"
   */
  t: 0.52,

  /**
   * How far each inner blade tip deviates from the arc midpoint (step/2).
   * Controls the "sweep" / propeller look of the blades.
   *
   * Both tips are placed symmetrically at step/2 ± halfSpread×step, which
   * guarantees all N blade gaps are equal at every value of t.
   *
   * Range: [0, overlap + 0.5)
   *   0   → no sweep (symmetric diamond / lens shape)
   *   0.5 → moderate sweep, widest equal gaps
   *   →max → maximum sweep, gaps narrow toward zero
   *
   * ⚠️  Design Lab uses "skew", which is a DIFFERENT parameterisation
   * (tips placed at skew×step and (1+skew)×step — asymmetric, unequal gaps).
   * Values cannot be transferred directly between the two.
   */
  halfSpread: 0.6,

  /**
   * How many blade-widths each blade extends beyond its own step slot on
   * each side. Higher → blades overlap more, aperture ring looks denser.
   * Design Lab: "overlap"
   */
  overlap: 0.9,

  /**
   * Curvature of the Bézier control points on both blade side-edges.
   * 0 = straight edges (polygonal blades), higher = more bowed / organic.
   * Design Lab: "curve"
   */
  curve: 0.59,

  /**
   * Rotational offset applied to the inner tips as the aperture closes.
   * Creates the characteristic "iris twisting" animation as t → 0.
   * 0 = no twist, higher = more dramatic rotation when closed.
   * Design Lab: "twist"
   */
  twist: 0.5,

  /**
   * Width of the background-coloured stroke drawn on each blade edge.
   * This stroke IS the visible gap between blades — wider = more gap.
   * In SVG units (viewBox is 224 × 224), so physical pixel size scales
   * proportionally with the rendered size.
   * Design Lab: "bladeStroke"
   */
  bladeStrokeWidth: 4.4,

  /**
   * Blur radius of the per-blade drop shadow (feDropShadow stdDeviation).
   * Adds depth to the blade stack at larger render sizes.
   * Design Lab: "shadowIntensity" controlled blur + opacity together;
   * here they are split into shadowStdDeviation and shadowOpacity.
   */
  shadowStdDeviation: 2.25,

  /**
   * Opacity of the per-blade drop shadow (feDropShadow floodOpacity).
   * Design Lab: "shadowIntensity" (combined with shadowStdDeviation above).
   */
  shadowOpacity: 0.55,
} as const;

/**
 * Optical small preset — selected automatically when rendered size < LOGO_SM_THRESHOLD.
 *
 * Differences from BRAND_LOGO:
 *  - Fewer blades (5 vs 7) — 7 blades are too dense to read below ~40 px
 *  - Wider bladeStrokeWidth — thin gaps disappear at small physical sizes
 *  - Slightly more open (t 0.3 → 0.35) — helps legibility at small sizes
 *  - Softer shadow — tight blur radius at small sizes just muddies the mark
 */
export const BRAND_LOGO_SM = {
  N: 6,
  t: 0.57,
  halfSpread: 0.6,
  overlap: 0.65,
  curve: 0.98,
  twist: 0.85,
  bladeStrokeWidth: 6.6,
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
