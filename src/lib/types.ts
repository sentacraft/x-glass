/**
 * Sentinel value for a field where the concept does not apply to this lens.
 * For example, filterMm is N/A on fisheye lenses that have no front filter thread.
 */
export const SPEC_NA = "N/A" as const;

/**
 * User-facing official product links grouped by market channel.
 * A lens may expose different official URLs for mainland China and global users.
 */
export interface LensOfficialLinks {
  /**
   * Mainland China official product page.
   * @example "https://www.fujifilm-x.com/zh-cn/products/lenses/xf35mmf14-r/"
   */
  cn?: string;

  /**
   * Global or English official product page.
   * @example "https://www.fujifilm-x.com/en-us/products/lenses/xf35mmf14-r/"
   */
  global?: string;
}

/**
 * Optional length variants for lenses whose physical length changes by state or zoom position.
 */
export interface LensLengthVariants {
  /**
   * Retracted or collapsed length in millimeters.
   * @example 37.5
   */
  retracted?: number;

  /**
   * Physical length at the wide end in millimeters.
   * @example 55.6
   */
  wide?: number;

  /**
   * Physical length at the tele end in millimeters.
   * @example 57.2
   */
  tele?: number;
}

/**
 * Structured optical formula parsed from a source page.
 */
export interface LensConfiguration {
  /**
   * Number of optical groups.
   * @example 10
   */
  groups: number;

  /**
   * Number of optical elements.
   * @example 14
   */
  elements: number;

  /**
   * Number of aspherical elements when explicitly stated.
   * @example 4
   */
  aspherical?: number;

  /**
   * Number of ED elements when explicitly stated.
   * @example 4
   */
  ed?: number;

  /**
   * Number of Super ED elements when explicitly stated.
   * @example 3
   */
  superEd?: number;

  /**
   * Optional free-form note for special optics not covered by the structured fields.
   * @example "Includes 1 XA element"
   */
  otherNotes?: string;

  /**
   * Raw source wording kept for traceability and future parser refinement.
   * @example "10组14片(包括4片非球面镜片和4片ED镜片)"
   */
  sourceText?: string;
}

/**
 * Canonical lens record used by the X-Glass app.
 */
export interface Lens {
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
  series?: string;

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
  apertureRing: boolean;

  /**
   * Total weight in grams.
   * @example 187
   */
  weightG?: number;

  /**
   * Maximum outer diameter in millimeters.
   * @example 65
   */
  diameterMm?: number;

  /**
   * Physical length in millimeters based on the source's stated measurement method.
   * @example 50.4
   */
  lengthMm?: number;

  /**
   * Optional length variants when the source distinguishes multiple physical states.
   * Keep lengthMm as the main display value for the current phase.
   * @example { retracted: 37.5, wide: 55.6, tele: 57.2 }
   */
  lengthVariantsMm?: LensLengthVariants;

  /**
   * Filter thread diameter in millimeters.
   * Use SPEC_NA for lenses with no front filter thread (e.g. fisheye, rear-filter designs).
   * Use null when the value could not be found.
   * @example 52
   */
  filterMm?: number | typeof SPEC_NA;

  /**
   * Minimum focus distance in normal shooting mode, in centimeters.
   * This field is kept to preserve compatibility with the previous schema and existing UI logic.
   * @example 15
   */
  minFocusDistanceCm?: number;

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
   * Structured optical construction data parsed from the source spec.
   * Store sourceText when you need to preserve the original wording.
   * @example { groups: 10, elements: 14, aspherical: 4, ed: 4, sourceText: "10组14片(包括4片非球面镜片和4片ED镜片)" }
   */
  lensConfiguration?: LensConfiguration;

  /**
   * Number of aperture blades.
   * @example 9
   */
  apertureBladeCount?: number;

  /**
   * Release year used by the MVP app for sorting and rough chronology.
   * @example 2012
   */
  releaseYear?: number;

  /**
   * User-facing official product links by market channel.
   * Both at least one (cn or global) must be present.
   * @example { cn: "https://www.fujifilm-x.com/zh-cn/products/lenses/xf35mmf14-r/", global: "https://www.fujifilm-x.com/en-us/products/lenses/xf35mmf14-r/" }
   */
  officialLinks: LensOfficialLinks;

  /**
   * Main product image URL, ideally a clean front or three-quarter product shot.
   * @example "https://example.com/images/xf35mm-f14-r.png"
   */
  imageUrl: string;
}

/**
 * Brand-grouped lens catalog stored in src/data/lenses.json.
 */
export type LensCatalog = Record<string, Lens[]>;
