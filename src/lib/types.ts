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
 * Wide/Tele breakdown of minimum focus distance for zoom lenses.
 */
export interface FocusDistanceVariants {
  /**
   * Minimum focus distance at the wide end in centimeters.
   * @example 15
   */
  wide?: number;

  /**
   * Minimum focus distance at the tele end in centimeters.
   * @example 24
   */
  tele?: number;
}

/**
 * Wide/Tele breakdown of maximum magnification for zoom lenses.
 */
export interface MagnificationVariants {
  /**
   * Maximum magnification at the wide end.
   * @example 0.25
   */
  wide?: number;

  /**
   * Maximum magnification at the tele end.
   * @example 0.13
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
   * Number of Sigma SLD (Special Low Dispersion) elements.
   * Optically equivalent to ED; kept separate to preserve manufacturer naming.
   * @example 2
   */
  sld?: number;

  /**
   * Number of Sigma FLD (F Low Dispersion / fluorite-grade) elements.
   * Optically equivalent to Super ED; kept separate to preserve manufacturer naming.
   * @example 1
   */
  fld?: number;

  /**
   * Number of high-refractive-index elements (Tamron HR, Sigma HRI, generic high-index).
   * @example 2
   */
  highRefractive?: number;

  /**
   * Raw source wording kept for traceability and future parser refinement.
   * @example "10组14片(包括4片非球面镜片和4片ED镜片)"
   */
  sourceText?: string;
}

export type ApertureValue = number | [number, number];

/**
 * All valid specialty tag values. Defined as a const tuple so that
 * lens-schema.ts can derive its Zod enum without duplicating the list.
 */
export const SPECIALTY_TAGS = [
  "cine",
  "anamorphic",
  "tilt",
  "shift",
  "macro",
  "ultra_macro",
  "fisheye",
  "probe",
] as const;
export type SpecialtyTag = (typeof SPECIALTY_TAGS)[number];

/**
 * All valid keys for {@link Lens.fieldNotes}. Defined as a const tuple so that
 * lens-schema.ts can derive its Zod enum without duplicating the list.
 *
 * Only structured fields where the typed value cannot fully express the source
 * information are eligible. Free-form string fields (e.g. angleOfView, lensMaterial)
 * are excluded because they carry their own context directly.
 */
export const FIELD_NOTE_KEYS = [
  "wr",
  "weightG",
  "filterMm",
  "minFocusDistanceCm",
  "minFocusDistanceMacroCm",
  "maxMagnification",
  "lensConfiguration",
  "ois",
  "focusMotor",
] as const;
export type FieldNoteKey = (typeof FIELD_NOTE_KEYS)[number];

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
   * @example "Sigma"
   */
  brand: string;

  /**
   * Product line or series name as used by the manufacturer.
   * Omit (undefined or empty string) when the brand does not expose a formal series name.
   *
   * @example "XF"       // Fujifilm XF prime/zoom
   * @example "XC"       // Fujifilm XC budget line
   * @example "Art"      // Sigma Art line
   * @example "Contemporary" // Sigma Contemporary line
   */
  series?: string;

  /**
   * Official marketing model name.
   * @example "XF35mmF1.4 R"
   */
  model: string;

  /**
   * Numeric generation marker for lenses that supersede an earlier version
   * under the same brand and model line. Set this when the manufacturer uses
   * "II", "Mark II", "2nd generation", or a clearly updated model name for
   * the same focal-length / aperture combination.
   * Omit for first-generation or single-generation lenses. 
   *
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
   * Largest available aperture as a bare f-number (numeric value only, no
   * "f/" prefix). A smaller number means a wider aperture.
   * - Prime or constant-aperture zoom: single number (e.g. 1.4).
   * - Variable-aperture zoom: [wideEnd, teleEnd] tuple (e.g. [3.5, 6.3]).
   *
   * Source text like "F1.4", "f/1.4", "1:1.4" should all be stored as 1.4.
   *
   * @example 1.4
   * @example [3.5, 6.3]
   */
  maxAperture: ApertureValue;

  /**
   * Smallest available aperture as a bare f-number (numeric value only, no
   * "f/" prefix). A larger number means a narrower aperture.
   * - Prime or constant-aperture zoom: single number (e.g. 16).
   * - Variable-aperture zoom: [wideEnd, teleEnd] tuple (e.g. [16, 22]).
   *
   * @example 16
   * @example [16, 22]
   */
  minAperture: ApertureValue;

  /**
   * Largest available transmission stop as a bare T-number (numeric only).
   * Only populate when the source explicitly publishes T-stop data (common
   * for cine lenses). Omit for stills-only lenses that only list f-numbers.
   * - Constant T-stop: single number. Variable: [wideEnd, teleEnd] tuple.
   *
   * @example 2.9
   * @example [2.9, 4]
   */
  maxTStop?: ApertureValue;

  /**
   * Smallest available transmission stop as a bare T-number (numeric only).
   * Same population rules as maxTStop.
   * - Constant T-stop: single number. Variable: [wideEnd, teleEnd] tuple.
   *
   * @example 22
   * @example [22, 32]
   */
  minTStop?: ApertureValue;

  /**
   * Optional special-purpose capability tags used for filtering and UX badges.
   * Tags are additive — a lens can carry more than one.
   *
   * Tag definitions (apply when the source or model name explicitly indicates):
   * - "macro"       — marketed as a macro lens, typically ≥0.5x magnification.
   * - "ultra_macro" — exceeds 1:1 (>1.0x) magnification at closest focus.
   *                   Always pair with "macro" (i.e. ["macro", "ultra_macro"]).
   * - "cine"        — marketed as a cinema / video lens (T-stop rated, geared
   *                   rings, standardized front diameter, etc.).
   * - "anamorphic"  — uses anamorphic optics for cinematic squeeze.
   * - "tilt"        — supports tilt movements (tilt-shift or Lensbaby-style).
   * - "shift"       — supports shift movements.
   * - "fisheye"     — fisheye projection (≥180° diagonal or circular).
   * - "probe"       — probe / periscope macro lens (e.g. Laowa Probe).
   *
   * Omit the field entirely when no tags apply (do not store an empty array).
   *
   * @example ["macro"]
   * @example ["macro", "ultra_macro"]
   * @example ["cine", "anamorphic"]
   */
  specialtyTags?: SpecialtyTag[];

  /**
   * Whether the lens supports autofocus.
   * @example true
   */
  af: boolean;

  /**
   * Whether the lens includes optical image stabilization.
   * Set to true when the source mentions OIS, IS, VC, OS, VR, 光学防抖,
   * "Image Stabilization", or equivalent terminology.
   *
   * @example true
   */
  ois: boolean;

  /**
   * OIS effectiveness in stops of compensation, when the source explicitly
   * states a numeric value (e.g. "6.0-stop", "5.5档"). Store the number only.
   * Omit when the source says OIS is present but does not quantify stops.
   *
   * @example 6
   */
  oisStops?: number;

  /**
   * Whether the lens is weather-resistant / weather-sealed.
   * - `true`     — full weather sealing; source uses WR, "Weather Resistant",
   *                "Weather Sealed", "防滴防尘", or equivalent.
   * - `"partial"` — some environmental protection but not full sealing (e.g.
   *                dust-resistant only, splash-resistant, a subset of seals).
   *                Always add a {@link fieldNotes} entry for "wr" explaining
   *                the specific protection level in the source's own terms.
   * - `false`    — no weather protection stated.
   *
   * @example true
   * @example "partial"
   */
  wr: boolean | "partial";

  /**
   * Whether the lens has a physical aperture ring.
   * This is intentionally separate from autofocus and motor metadata.
   * @example true
   */
  apertureRing: boolean;

  /**
   * Whether the lens uses a power zoom (motorized zoom) mechanism.
   * Optional until pipeline backfills this field for all lenses.
   * @example true
   */
  powerZoom?: boolean;

  /**
   * Brand's official AF motor or actuator name, normalized to a short canonical
   * label during pipeline parsing. Store the brand-specific marketing name so
   * the display layer can show it verbatim while also mapping to broader
   * categories (e.g. linear motor, stepping motor) when needed.
   *
   * Common canonical values by brand:
   * - Fujifilm: "LM" (linear motor), "STM" (stepping motor),
   *   "High-Precision Motor"
   * - Sigma: "HLA" (High-response Linear Actuator)
   * - Tamron: "RXD" (stepping drive), "VXD" (linear drive)
   * - Viltrox: "STM", "VCM" (voice coil motor)
   * - TTArtisan: "STM"
   * - 7Artisans: "STM"
   *
   * For lenses whose source only mentions a generic drive mechanism without a
   * brand-specific name, use the most descriptive term available:
   * "Lead Screw", "DC Motor", "Focus Motor", etc.
   *
   * Manual-focus-only lenses should omit this field entirely (undefined).
   *
   * @example "LM"
   * @example "HLA"
   * @example "STM"
   * @example "VXD"
   * @example "Lead Screw"
   */
  focusMotor?: string;

  /**
   * Whether the lens uses internal focusing — the overall barrel length does
   * not change and the front element does not rotate during focus.
   * This matters for video shooters (no focus breathing artifacts from length
   * change) and macro/filter users (polarizer orientation stays fixed).
   *
   * Set to true only when the source explicitly states "internal focusing" or
   * equivalent wording. Omit (undefined) when the information is not available.
   *
   * @example true
   */
  internalFocusing?: boolean;

  /**
   * Total weight of the lens body only, in grams. Exclude lens hood, caps,
   * and other detachable accessories. When the source lists multiple weights,
   * use the "body only" or "without hood" figure.
   *
   * Convert from other units if needed: 1 oz ≈ 28.35 g.
   *
   * - Single `number`: the common case.
   * - `[min, max]` tuple: use when the source gives a weight range (e.g.
   *   weight differs across mount variants or optional accessories). Always
   *   add a {@link fieldNotes} entry for "weightG" explaining what drives
   *   the range.
   *
   * @example 187
   * @example [340, 395]
   */
  weightG?: number | [number, number];

  /**
   * Maximum outer diameter in millimeters.
   * @example 65
   */
  diameterMm?: number;

  /**
   * Physical length of the lens body in millimeters, measured from the lens
   * mount flange to the front of the barrel (excluding hood and caps).
   * For zoom or collapsible lenses that list multiple values, store the
   * "standard" or "extended-ready" length here, and put retracted / wide /
   * tele variants in {@link lengthVariantsMm}.
   *
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
   * - Use the numeric diameter when the source lists a standard filter size.
   * - Use "N/A" (SPEC_NA) when the lens explicitly has no front filter thread
   *   (e.g. bulbous fisheye, rear-filter-only designs).
   * - Omit (undefined) when the information is not available in the source.
   *
   * @example 52
   * @example "N/A"
   */
  filterMm?: number | typeof SPEC_NA;

  /**
   * Minimum focus distance in normal shooting mode, in centimeters.
   * Convert from other units: 1 m = 100 cm, 1 ft ≈ 30.48 cm.
   * For zoom lenses, store the shortest (best) value across all focal lengths;
   * use {@link minFocusDistanceVariantsCm} for the per-focal-length breakdown.
   *
   * When the source lists both a normal and a macro focus distance, store the
   * normal-mode value here and the macro-mode value in
   * {@link minFocusDistanceMacroCm}.
   *
   * @example 15
   */
  minFocusDistanceCm?: number;

  /**
   * Minimum focus distance when the lens is switched to a dedicated macro mode,
   * in centimeters. Only populate when the source explicitly distinguishes a
   * separate macro focusing range from the normal range.
   *
   * @example 30
   */
  minFocusDistanceMacroCm?: number;

  /**
   * Optional Wide/Tele breakdown of minimum focus distance for zoom lenses.
   * The top-level minFocusDistanceCm remains the "best" (shortest) value for sorting/filtering.
   * @example { wide: 15, tele: 24 }
   */
  minFocusDistanceVariantsCm?: FocusDistanceVariants;

  /**
   * Maximum magnification ratio stored as a positive decimal.
   * Convert from common source notations:
   * - "0.15x" or "0.15倍" → 0.15
   * - "1:6.7" → 1 / 6.7 ≈ 0.149 (round to reasonable precision)
   * - "1:1" → 1.0
   * - "2:1" or "2x" → 2.0
   *
   * For zoom lenses, store the highest (best) value across all focal lengths;
   * use {@link maxMagnificationVariants} for the per-focal-length breakdown.
   *
   * @example 0.15
   * @example 1.0
   */
  maxMagnification?: number;

  /**
   * Optional Wide/Tele breakdown of maximum magnification for zoom lenses.
   * The top-level maxMagnification remains the "best" (highest) value for sorting/filtering.
   * @example { wide: 0.25, tele: 0.13 }
   */
  maxMagnificationVariants?: MagnificationVariants;

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
   * Year the lens was first officially announced or released by the
   * manufacturer. When announcement and shipping years differ, prefer the
   * announcement year. Omit when the year cannot be determined.
   *
   * @example 2012
   */
  releaseYear?: number;

  /**
   * Mount systems this lens is available for, as stated by the manufacturer.
   * Use short canonical names to ensure consistency across all lenses:
   * "Fujifilm X", "Sony E", "Nikon Z", "Nikon F", "Canon RF", "Canon EF",
   * "Canon EF-M", "Leica L", "Micro Four Thirds".
   *
   * Omit when only a single mount is available and it is Fujifilm X (implied
   * by this being an X-mount lens database).
   *
   * @example ["Fujifilm X", "Sony E", "Nikon Z"]
   */
  compatibleMounts?: string[];

  /**
   * Accessories included with the lens as listed by the manufacturer.
   * @example ["Lens cap", "Lens hood", "Wrapping cloth"]
   */
  accessories?: string[];

  /**
   * Lens body material as described by the manufacturer.
   * @example "Aluminum alloy"
   */
  lensMaterial?: string;

  /**
   * Per-field supplementary notes for cases where the structured field value
   * does not fully capture what the source says. Keys must match field names
   * in this interface. Values are concise English sentences describing the
   * caveat, special condition, or extra context.
   *
   * Only populate when the note carries information that the field value
   * itself cannot express — not as a restatement of the value.
   *
   * Fields that commonly need a note:
   * - `"wr"` when `wr` is `"partial"` — describe the specific protection level.
   * - `"weightG"` when `weightG` is a range — explain what drives the variance.
   * - `"filterMm"` when a non-standard filter attachment is required (e.g.
   *   external holder, rear gel slot).
   * - `"minFocusDistanceCm"` when the value applies only at a specific focal
   *   length of a zoom lens.
   *
   * @example { wr: "Dust and splash resistant only; not fully sealed.", filterMm: "Requires external 72mm filter holder; no front thread." }
   */
  fieldNotes?: Partial<Record<FieldNoteKey, string>>;

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
 * Flat lens catalog stored in src/data/lenses.json.
 */
export type LensCatalog = Lens[];
