import type { Lens, FieldNoteKey, SpecialtyTag } from "./types";
import type { LensConfigurationLabels } from "./lens.format";
import * as fmt from "./lens.format";

// ---------------------------------------------------------------------------
// Structured line type
// ---------------------------------------------------------------------------

/**
 * A single display line with a primary value and an optional context label.
 * Rendered as: `value (label)` where label is smaller and muted.
 * Used when a row contains multiple values (e.g. Wide / Tele variants).
 */
export interface StructuredLine {
  value: string;
  label?: string;
}

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

interface BaseRow {
  /** Resolved label string (pre-translated by the caller). */
  label: string;
  /** If set, look up lens.fieldNotes[fieldNoteKey] and show a ⓘ popover. */
  fieldNoteKey?: FieldNoteKey;
  /**
   * Returns a note string to show in a ⓘ popover, computed from the lens.
   * Use when the note is not stored in lens.fieldNotes (e.g. a fixed
   * methodology note that applies whenever a derived value is displayed).
   * Takes precedence after fieldNoteKey when both are defined.
   */
  getNote?: (l: Lens) => string | undefined;
  /**
   * Returns true when this lens has meaningful data for this row.
   * Used for per-view suppression: a row is hidden when no displayed lens has data.
   */
  hasData: (l: Lens) => boolean;
}

export interface TextRow extends BaseRow {
  kind: "text";
  getDisplayValue: (l: Lens) => string | undefined;
  /**
   * Optional secondary value rendered smaller and muted below the primary.
   * Use for supplemental details (e.g. length variants, macro mode).
   */
  getSubValue?: (l: Lens) => string | undefined;
}

export interface NumericRow extends BaseRow {
  kind: "numeric";
  /**
   * Plain-text display value. Used as fallback when getStructuredLines is
   * undefined or returns nothing, and in text-only contexts (e.g. drag ghost).
   */
  getDisplayValue: (l: Lens) => string | undefined;
  /** Optional secondary value rendered smaller and muted below the primary. */
  getSubValue?: (l: Lens) => string | undefined;
  /**
   * Structured lines for rich per-line rendering.
   * When defined and returns data, replaces getDisplayValue in the UI.
   * Each line renders `value` prominently with an optional `label` in lighter
   * color: "13cm (Wide)". getDisplayValue still serves as a plain-text fallback.
   */
  getStructuredLines?: (l: Lens) => StructuredLine[] | undefined;
  /** Returns a number for best-value comparison in the compare table. */
  toComparable: (l: Lens) => number | undefined;
  /** Which direction is "best": min (lower = better) or max (higher = better). */
  bestDir?: "min" | "max";
  /**
   * When this row wins best-value comparison:
   * - Structured mode: matched exactly against StructuredLine.value to find
   *   which line to highlight.
   * - Plain string mode: matched as substring to find which portion to highlight.
   * When omitted the full display value / whole cell is highlighted.
   */
  getHighlightFragment?: (l: Lens) => string | undefined;
}

export interface BoolRow extends BaseRow {
  kind: "bool";
  getValue: (l: Lens) => boolean | undefined;
}

export type SpecRow = TextRow | NumericRow | BoolRow;

export interface SpecGroup {
  /** Resolved group header label (pre-translated by the caller). */
  label: string;
  rows: SpecRow[];
}

// ---------------------------------------------------------------------------
// Labels interface — caller passes all pre-translated strings
// ---------------------------------------------------------------------------

export interface SpecGroupLabels {
  // Group headers
  groupOptics: string;
  groupFocus: string;
  groupStabilization: string;
  groupPhysical: string;
  groupFeatures: string;
  groupRelease: string;

  // Row labels
  focalLength: string;
  focalLengthEquiv: string;
  maxAperture: string;
  minAperture: string;
  maxTStop: string;
  minTStop: string;
  angleOfView: string;
  angleOfViewEstNote: string;
  apertureBladeCount: string;
  lensConfiguration: string;
  af: string;
  focusMotor: string;
  internalFocusing: string;
  minFocusDist: string;
  maxMagnification: string;
  ois: string;
  weight: string;
  dimensions: string;
  filterSize: string;
  lensMaterial: string;
  wr: string;
  apertureRing: string;
  powerZoom: string;
  specialtyTags: string;
  releaseYear: string;
  accessories: string;

  // Sub-labels used inside formatters
  yes: string;
  no: string;
  partial: string;
  retracted: string;
  wide: string;
  tele: string;
  macro: string;

  // Lens configuration sub-labels
  lc: LensConfigurationLabels;

  // Specialty tag labels
  tags: Record<SpecialtyTag, string>;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Builds the full list of spec groups with all rows.
 * Call once per render (or memoize) with pre-translated labels.
 *
 * Per-view suppression: filter each group's rows with `row.hasData(lens)`
 * (detail page) or `lenses.some(l => row.hasData(l))` (compare table),
 * then drop groups where no rows remain.
 */
export function buildSpecGroups(labels: SpecGroupLabels): SpecGroup[] {
  const {
    yes,
    no,
    partial,
    retracted,
    wide,
    tele,
    macro,
    angleOfViewEstNote,
    lc,
    tags,
  } = labels;

  return [
    // -----------------------------------------------------------------------
    // Optics
    // -----------------------------------------------------------------------
    {
      label: labels.groupOptics,
      rows: [
        {
          kind: "text",
          label: labels.focalLength,
          hasData: () => true,
          getDisplayValue: (l) =>
            fmt.focalRangeDisplay(l.focalLengthMin, l.focalLengthMax),
        },
        {
          kind: "text",
          label: labels.focalLengthEquiv,
          hasData: () => true,
          getDisplayValue: (l) =>
            fmt.focalRangeDisplay(
              fmt.focalEquiv(l.focalLengthMin),
              fmt.focalEquiv(l.focalLengthMax)
            ),
        },
        {
          kind: "numeric",
          label: labels.maxAperture,
          hasData: () => true,
          getDisplayValue: (l) => fmt.apertureDisplay(l.maxAperture),
          toComparable: (l) =>
            Array.isArray(l.maxAperture) ? l.maxAperture[0] : l.maxAperture,
          bestDir: "min",
        },
        {
          kind: "text",
          label: labels.minAperture,
          hasData: () => true,
          getDisplayValue: (l) => fmt.apertureDisplay(l.minAperture),
        },
        {
          kind: "text",
          label: labels.maxTStop,
          hasData: (l) => l.maxTStop !== undefined,
          getDisplayValue: (l) => fmt.tStopDisplay(l.maxTStop),
        },
        {
          kind: "text",
          label: labels.minTStop,
          hasData: (l) => l.minTStop !== undefined,
          getDisplayValue: (l) => fmt.tStopDisplay(l.minTStop),
        },
        {
          kind: "text",
          label: labels.angleOfView,
          hasData: (l) =>
            l.angleOfView !== undefined || l.angleOfViewCalc !== undefined,
          getDisplayValue: (l) =>
            fmt.angleOfViewDisplay(l.angleOfView ?? l.angleOfViewCalc),
          getNote: (l) =>
            l.angleOfView === undefined && l.angleOfViewCalc !== undefined
              ? angleOfViewEstNote
              : undefined,
        },
        {
          kind: "numeric",
          label: labels.apertureBladeCount,
          hasData: (l) => l.apertureBladeCount !== undefined,
          getDisplayValue: (l) => fmt.optionalNumber(l.apertureBladeCount, ""),
          toComparable: (l) => l.apertureBladeCount,
        },
        {
          kind: "text",
          label: labels.lensConfiguration,
          fieldNoteKey: "lensConfiguration" as FieldNoteKey,
          hasData: (l) => l.lensConfiguration !== undefined,
          getDisplayValue: (l) =>
            fmt.lensConfigurationPrimaryDisplay(l.lensConfiguration, lc),
          getSubValue: (l) =>
            fmt.lensConfigurationSecondaryDisplay(l.lensConfiguration, lc),
        },
      ] satisfies SpecRow[],
    },

    // -----------------------------------------------------------------------
    // Autofocus
    // -----------------------------------------------------------------------
    {
      label: labels.groupFocus,
      rows: [
        {
          kind: "bool",
          label: labels.af,
          hasData: () => true,
          getValue: (l) => l.af,
        },
        {
          kind: "text",
          label: labels.focusMotor,
          fieldNoteKey: "focusMotor" as FieldNoteKey,
          hasData: (l) => l.focusMotor !== undefined,
          getDisplayValue: (l) => l.focusMotor,
        },
        {
          kind: "bool",
          label: labels.internalFocusing,
          hasData: (l) => l.internalFocusing !== undefined,
          getValue: (l) => l.internalFocusing,
        },
        {
          kind: "numeric",
          label: labels.minFocusDist,
          fieldNoteKey: "minFocusDistance" as FieldNoteKey,
          hasData: (l) => l.minFocusDistance !== undefined,
          getDisplayValue: (l) =>
            fmt.minFocusDistancePrimaryDisplay(l.minFocusDistance, {
              wide,
              tele,
            }),
          getStructuredLines: (l) => {
            const mfd = l.minFocusDistance;
            if (!mfd?.variants) return undefined;
            const lines: StructuredLine[] = [];
            if (mfd.variants.wide !== undefined)
              lines.push({ value: `${mfd.variants.wide}cm`, label: wide });
            if (mfd.variants.tele !== undefined)
              lines.push({ value: `${mfd.variants.tele}cm`, label: tele });
            return lines.length > 0 ? lines : undefined;
          },
          getSubValue: (l) =>
            fmt.minFocusDistanceSecondaryDisplay(l.minFocusDistance, {
              wide,
              tele,
              macro,
            }),
          toComparable: (l) => l.minFocusDistance?.cm,
          bestDir: "min",
          getHighlightFragment: (l) =>
            l.minFocusDistance ? `${l.minFocusDistance.cm}cm` : undefined,
        },
        {
          kind: "numeric",
          label: labels.maxMagnification,
          fieldNoteKey: "maxMagnification" as FieldNoteKey,
          hasData: (l) => l.maxMagnification !== undefined,
          getDisplayValue: (l) =>
            fmt.maxMagnificationPrimaryDisplay(l.maxMagnification, {
              wide,
              tele,
            }),
          getStructuredLines: (l) => {
            const mag = l.maxMagnification;
            if (!mag?.variants) return undefined;
            const lines: StructuredLine[] = [];
            if (mag.variants.wide !== undefined)
              lines.push({ value: `${mag.variants.wide}x`, label: wide });
            if (mag.variants.tele !== undefined)
              lines.push({ value: `${mag.variants.tele}x`, label: tele });
            return lines.length > 0 ? lines : undefined;
          },
          toComparable: (l) => l.maxMagnification?.value,
          bestDir: "max",
          getHighlightFragment: (l) =>
            l.maxMagnification ? `${l.maxMagnification.value}x` : undefined,
        },
      ] satisfies SpecRow[],
    },

    // -----------------------------------------------------------------------
    // Stabilization
    // -----------------------------------------------------------------------
    {
      label: labels.groupStabilization,
      rows: [
        {
          kind: "text",
          label: labels.ois,
          fieldNoteKey: "ois" as FieldNoteKey,
          hasData: () => true,
          getDisplayValue: (l) =>
            fmt.oisDisplay(l.ois, l.oisStops, { yes, no }),
        },
      ] satisfies SpecRow[],
    },

    // -----------------------------------------------------------------------
    // Physical
    // -----------------------------------------------------------------------
    {
      label: labels.groupPhysical,
      rows: [
        {
          kind: "numeric",
          label: labels.weight,
          fieldNoteKey: "weightG" as FieldNoteKey,
          hasData: (l) => l.weightG !== undefined,
          getDisplayValue: (l) => fmt.weightDisplay(l.weightG, "g"),
          toComparable: (l) =>
            Array.isArray(l.weightG) ? l.weightG[0] : l.weightG,
          bestDir: "min",
        },
        {
          kind: "text",
          label: labels.dimensions,
          hasData: (l) =>
            l.diameterMm !== undefined || l.length !== undefined,
          getDisplayValue: (l) =>
            fmt.dimensionsPrimaryDisplay(l.diameterMm, l.length),
          getSubValue: (l) =>
            fmt.dimensionsVariantsDisplay(l.length, { retracted, wide, tele }),
        },
        {
          kind: "text",
          label: labels.filterSize,
          fieldNoteKey: "filterMm" as FieldNoteKey,
          hasData: (l) => l.filterMm !== undefined,
          getDisplayValue: (l) => fmt.filterSizeDisplay(l.filterMm),
        },
        {
          kind: "text",
          label: labels.lensMaterial,
          hasData: (l) => l.lensMaterial !== undefined,
          getDisplayValue: (l) => l.lensMaterial,
        },
      ] satisfies SpecRow[],
    },

    // -----------------------------------------------------------------------
    // Features
    // -----------------------------------------------------------------------
    {
      label: labels.groupFeatures,
      rows: [
        {
          kind: "text",
          label: labels.wr,
          fieldNoteKey: "wr" as FieldNoteKey,
          hasData: () => true,
          getDisplayValue: (l) =>
            fmt.wrDisplay(l.wr, { yes, no, partial }),
        },
        {
          kind: "bool",
          label: labels.apertureRing,
          hasData: () => true,
          getValue: (l) => l.apertureRing,
        },
        {
          kind: "bool",
          label: labels.powerZoom,
          hasData: (l) => l.powerZoom !== undefined,
          getValue: (l) => l.powerZoom,
        },
        {
          kind: "text",
          label: labels.specialtyTags,
          hasData: (l) =>
            l.specialtyTags !== undefined && l.specialtyTags.length > 0,
          getDisplayValue: (l) => fmt.specialtyTagsDisplay(l.specialtyTags, tags),
        },
      ] satisfies SpecRow[],
    },

    // -----------------------------------------------------------------------
    // Release
    // -----------------------------------------------------------------------
    {
      label: labels.groupRelease,
      rows: [
        {
          kind: "numeric",
          label: labels.releaseYear,
          hasData: (l) => l.releaseYear !== undefined,
          getDisplayValue: (l) => fmt.optionalNumber(l.releaseYear, ""),
          toComparable: (l) => l.releaseYear,
        },
        {
          kind: "text",
          label: labels.accessories,
          hasData: (l) =>
            l.accessories !== undefined && l.accessories.length > 0,
          getDisplayValue: (l) => l.accessories?.join(", "),
        },
      ] satisfies SpecRow[],
    },
  ];
}
