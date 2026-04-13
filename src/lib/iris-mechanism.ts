// Physical iris diaphragm mechanism — kinematic engine.
//
// Models a 2-point constrained iris: each blade has a fixed pivot pin on the
// base plate, and a guide pin that slides inside a radial slot on the rotating
// actuator ring. A single actuator rotation angle theta drives all N blades
// simultaneously through this constraint.
//
// Coordinate convention: SVG space, origin at iris center, +x right, +y down.
// Angles increase clockwise (SVG convention).
//
// Key distinction from src/lib/aperture.ts:
//   aperture.ts  — parametric / physical-approximation model for the logo mark.
//   iris-mechanism.ts — full 3-body kinematic model: base plate (fixed) +
//                       actuator ring (rotates) + N rigid blades (constrained).

// ── Types ─────────────────────────────────────────────────────────────────────

/** Full configuration for the iris mechanism and blade visual shape. */
export interface IrisMechanismConfig {
  // Mechanism topology
  /** Number of blades (5–9). */
  N: number;
  /** Radius of the pivot-pin circle on the base plate (px). */
  pivotRadius: number;
  /** Rigid distance from pivot hole to guide-pin hole on each blade (px). */
  pinDistance: number;
  /**
   * Angular offset δ of the actuator-ring slot relative to its corresponding
   * pivot pin direction (rad). Controls the coupling ratio and range of motion.
   *
   * The slot for blade i points in world-frame direction φ_i + δ + θ,
   * where φ_i = i·2π/N is the pivot's angular position and θ is the actuator
   * ring rotation. δ ≠ 0 ensures the slot is not collinear with the pivot,
   * which would produce degenerate (zero-coupling) motion.
   */
  slotOffset: number;

  // Blade visual shape
  /** Total blade length from pivot to tip (px). Should be > pinDistance. */
  bladeLength: number;
  /** Blade body width at its widest point (px). */
  bladeWidth: number;
  /**
   * Curvature of the blade's inner (aperture-facing) edge.
   * 0 = straight edges (polygonal aperture), 1 = maximally curved.
   */
  bladeCurvature: number;
}

/** Kinematic state of a single blade at a given actuator angle. */
export interface BladeState {
  /** Blade index (0 … N-1). */
  index: number;
  /** Fixed pivot-pin world position. */
  pivotPos: { x: number; y: number };
  /** Guide-pin world position (lies on the actuator-ring slot). */
  guidePinPos: { x: number; y: number };
  /**
   * Blade orientation angle in world frame (rad).
   * Defined as atan2(guidePinPos - pivotPos), i.e. the direction the blade
   * points from pivot toward guide pin (and onward to the tip).
   */
  bladeAngle: number;
}

// ── Kinematic solver ──────────────────────────────────────────────────────────

/**
 * Solve the guide-pin radial position r for blade 0 given actuator angle theta.
 *
 * The actuator ring carries N radial slots. Slot i points in world direction
 *   β_i = φ_i + δ + θ
 * where φ_i = i·2π/N and δ = config.slotOffset.
 *
 * The guide pin G must simultaneously:
 *   (a) lie on the slot: G = r · (cos β, sin β)
 *   (b) maintain rigid distance d from pivot P: |G - P|² = d²
 *
 * Substituting (a) into (b) yields the quadratic:
 *   r² - 2r · Rp · cos(δ + θ) + Rp² - d² = 0
 *
 * Solution (larger root — physically meaningful):
 *   Δ = d² - Rp² · sin²(δ + θ)
 *   r = Rp · cos(δ + θ) + √Δ
 *
 * Returns null when Δ < 0 (theta outside valid range).
 */
function solveGuidePinRadius(
  theta: number,
  config: IrisMechanismConfig
): number | null {
  const { pivotRadius: Rp, pinDistance: d, slotOffset: delta } = config;
  const angle = delta + theta; // β - φ_i  (same for all blades)
  const discriminant = d * d - Rp * Rp * Math.sin(angle) * Math.sin(angle);
  if (discriminant < 0) return null;
  return Rp * Math.cos(angle) + Math.sqrt(discriminant);
}

/**
 * Compute the kinematic state for all N blades at actuator angle theta.
 * Returns an empty array if theta is outside the valid range.
 */
export function solveAllBlades(
  theta: number,
  config: IrisMechanismConfig
): BladeState[] {
  const { N, pivotRadius: Rp, slotOffset: delta } = config;
  const r = solveGuidePinRadius(theta, config);
  if (r === null || r <= 0) return [];

  const step = (2 * Math.PI) / N;
  const slotDir = delta + theta; // β_0 = φ_0 + δ + θ = 0 + δ + θ (blade 0)

  return Array.from({ length: N }, (_, i) => {
    const phi = i * step; // pivot angular position for blade i

    // Pivot pin — fixed on base plate
    const pivotPos = {
      x: Rp * Math.cos(phi),
      y: Rp * Math.sin(phi),
    };

    // Guide pin — on slot (β_i = phi + delta + theta = phi + slotDir)
    const beta = phi + slotDir;
    const guidePinPos = {
      x: r * Math.cos(beta),
      y: r * Math.sin(beta),
    };

    // Blade orientation: direction from pivot to guide pin
    const bladeAngle = Math.atan2(
      guidePinPos.y - pivotPos.y,
      guidePinPos.x - pivotPos.x
    );

    return { index: i, pivotPos, guidePinPos, bladeAngle };
  });
}

// ── Range of motion ───────────────────────────────────────────────────────────

/**
 * Compute the valid theta range based on the discriminant condition:
 *   Δ = d² - Rp² · sin²(δ + θ) ≥ 0
 *   ⟹  |sin(δ + θ)| ≤ d / Rp
 *
 * If d ≥ Rp, the full [−π, π] circle is valid (no constraint from Δ).
 * Otherwise the valid interval centred on δ + θ = 0 is:
 *   θ ∈ [−δ − arcsin(d/Rp), −δ + arcsin(d/Rp)]
 *
 * The returned range is then further clipped so that:
 *   - theta_min produces a near-closed aperture (blade tip near center)
 *   - theta_max produces a near-open aperture (blade tip near housing edge)
 */
export function thetaRange(config: IrisMechanismConfig): {
  min: number;
  max: number;
} {
  const { pivotRadius: Rp, pinDistance: d, slotOffset: delta } = config;
  const ratio = d / Rp;

  // Theoretical limits from discriminant
  if (ratio >= 1) {
    // Discriminant never negative — full rotation possible
    return { min: -delta - Math.PI / 2, max: -delta + Math.PI / 2 };
  }

  const halfSpan = Math.asin(Math.min(1, ratio));
  return {
    min: -delta - halfSpan,
    max: -delta + halfSpan,
  };
}

// ── Blade shape ───────────────────────────────────────────────────────────────

/**
 * Generate the SVG path d-string for a single blade in local coordinates.
 *
 * Local frame: pivot hole at origin (0, 0), guide pin direction along +x axis.
 * The blade body extends from near the origin to bladeLength along +x.
 *
 * Shape: a symmetrical elongated petal (upper/lower halves mirrored).
 *   - Outer edge (away from aperture center when assembled): gentle arc
 *   - Inner edge (faces aperture center): Bézier curve, curvature controlled
 *     by bladeCurvature ∈ [0, 1]. Higher values → rounder aperture opening.
 */
export function bladeShapePath(config: IrisMechanismConfig): string {
  const { pinDistance: d, bladeLength: L, bladeWidth: W, bladeCurvature: C } =
    config;

  const hw = W / 2; // half-width

  // Key x positions along the blade centerline
  const xStart = -hw * 0.3; // slightly behind pivot (rounded tail)
  const xTip = L;            // blade tip

  // Bézier control points for the inner (aperture-facing) edge.
  // bladeCurvature=0 → straight (cp at midpoint), =1 → strongly bowed outward.
  const innerBow = hw * C * 1.4;
  const outerBow = hw * C * 0.5;
  const midX = (xStart + xTip) / 2;

  // Upper half path (y < 0 in SVG = visually "up")
  // Lower half is the mirror (y > 0)
  //
  // Path: M start-upper → C curve to tip-upper → round tip → C curve back to start-lower → round tail → Z

  // Tip: small arc connecting upper and lower edges at the tip
  const tipR = hw * 0.45;

  // Tail: small arc at the pivot end
  const tailR = hw * 0.35;

  const fmt = (n: number) => n.toFixed(3);

  return [
    // Start at tail upper
    `M ${fmt(xStart)} ${fmt(-hw + tailR)}`,
    // Inner (upper) edge to tip: Bézier bow outward (away from aperture center = negative y)
    `C ${fmt(midX)} ${fmt(-hw - innerBow)}, ${fmt(midX)} ${fmt(-hw - innerBow)}, ${fmt(xTip)} ${fmt(-hw + tipR)}`,
    // Round tip arc (clockwise in SVG = CW)
    `A ${fmt(tipR)} ${fmt(tipR)} 0 0 1 ${fmt(xTip)} ${fmt(hw - tipR)}`,
    // Outer (lower) edge back to tail: Bézier bow slightly outward
    `C ${fmt(midX)} ${fmt(hw + outerBow)}, ${fmt(midX)} ${fmt(hw + outerBow)}, ${fmt(xStart)} ${fmt(hw - tailR)}`,
    // Round tail arc
    `A ${fmt(tailR)} ${fmt(tailR)} 0 0 1 ${fmt(xStart)} ${fmt(-hw + tailR)}`,
    "Z",
  ].join(" ");
}

// ── Default config ────────────────────────────────────────────────────────────

/** Reasonable starting configuration for a 7-blade iris. */
export const DEFAULT_IRIS_CONFIG: IrisMechanismConfig = {
  N: 7,
  pivotRadius: 78,
  pinDistance: 68,
  slotOffset: Math.PI / 5, // 36°
  bladeLength: 115,
  bladeWidth: 48,
  bladeCurvature: 0.55,
};
