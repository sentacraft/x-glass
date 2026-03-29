/**
 * Canonical lens record proposed for the next schema version.
 */
export interface LensV2 {
  /**
   * Stable unique slug for routing, comparison state, and cross-file references.
   * @example "xf35mm-f14-r"
   */
  id: string;

  /**
   * Manufacturer brand shown to users.
   * @example "Fujifilm"
   */
  brand: string;

  /**
   * Product line or series name.
   * Use an empty string when the brand does not expose a formal series.
   * @example "XF"
   */
  series: string;

  /**
   * Official marketing model name.
   * @example "XF35mmF1.4 R"
   */
  model: string;

  /**
   * Numeric generation marker when multiple versions share the same focal range.
   * @example 2
   */
  generation?: number;

  /**
   * Wide-end focal length in millimeters.
   * For prime lenses, this should equal {@link focalLengthMax}.
   * @example 35
   */
  focalLengthMin: number;

  /**
   * Tele-end focal length in millimeters.
   * For prime lenses, this should equal {@link focalLengthMin}.
   * @example 35
   */
  focalLengthMax: number;

  /**
   * Largest available aperture expressed as an f-number.
   * For variable-aperture zooms, store the wide-end value.
   * @example 1.4
   */
  maxAperture: number;

  /**
   * Smallest available aperture expressed as an f-number.
   * @example 16
   */
  minAperture: number;

  /**
   * Whether the lens supports autofocus.
   * @example true
   */
  af: boolean;

  /**
   * Whether the lens includes optical image stabilization.
   * @example false
   */
  ois: boolean;

  /**
   * Whether the lens is weather-resistant.
   * @example true
   */
  wr: boolean;

  /**
   * Whether the lens has a physical aperture ring.
   * This is intentionally separate from autofocus and motor metadata.
   * @example true
   */
  apertureRing?: boolean;

  /**
   * Total weight in grams.
   * @example 187
   */
  weightG: number;

  /**
   * Maximum outer diameter in millimeters.
   * @example 65
   */
  diameterMm: number;

  /**
   * Physical length in millimeters based on the source's stated measurement method.
   * @example 50.4
   */
  lengthMm: number;

  /**
   * Filter thread diameter in millimeters.
   * @example 52
   */
  filterMm: number;

  /**
   * Minimum focus distance in normal shooting mode, in centimeters.
   * This field is kept to preserve compatibility with the V1 schema and existing UI logic.
   * @example 15
   */
  minFocusDistanceCm: number;

  /**
   * Minimum focus distance in macro mode, in centimeters.
   * Use this when the source provides a separate macro focusing distance.
   * @example 30
   */
  minFocusDistanceMacroCm?: number;

  /**
   * Maximum magnification ratio stored as a decimal value.
   * For example, 0.15 means 0.15x magnification.
   * @example 0.15
   */
  maxMagnification?: number;

  /**
   * Angle-of-view text from the source spec.
   * Keep the original wording in MVP to avoid premature parsing.
   * @example "44.2 degrees"
   */
  angleOfView?: string;

  /**
   * Optical construction text from the source spec.
   * Keep the original wording in MVP to avoid lossy parsing across brands.
   * @example "8 elements in 6 groups (2 aspherical elements)"
   */
  lensConfiguration?: string;

  /**
   * Number of aperture blades.
   * @example 9
   */
  apertureBladeCount?: number;

  /**
   * Release year used by the MVP app for sorting and rough chronology.
   * @example 2012
   */
  releaseYear: number;

  /**
   * Official product page URL.
   * @example "https://www.fujifilm-x.com/global/products/lenses/xf35mmf14-r/"
   */
  officialUrl?: string;

  /**
   * Main product image URL, ideally a clean front or three-quarter product shot.
   * @example "https://example.com/images/xf35mm-f14-r.png"
   */
  imageUrl?: string;

  /**
   * Optional MTF chart image URL reserved for later phases.
   * @example "https://example.com/images/xf35mm-f14-r-mtf.png"
   */
  mtfImageUrl?: string;
}
