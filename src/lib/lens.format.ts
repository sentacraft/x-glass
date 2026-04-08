import type {
  Lens,
  LensConfiguration,
  LensLengthVariants,
  FocusDistanceVariants,
  MagnificationVariants,
} from "./types";
import { SPEC_NA } from "./types";

const CROP_FACTOR = 1.5;

export function oisDisplay(
  ois: boolean,
  oisStops: number | undefined,
  labels: { yes: string; no: string }
): string {
  if (!ois) return labels.no;
  return oisStops !== undefined ? `${labels.yes} (${oisStops}-stop)` : labels.yes;
}

export function focalEquiv(n: number): number {
  return Math.round(n * CROP_FACTOR);
}

export function focalRangeDisplay(min: number, max: number): string {
  return min === max ? `${min}mm` : `${min}–${max}mm`;
}

export function apertureDisplay(aperture: Lens["maxAperture"]): string {
  return Array.isArray(aperture)
    ? `f/${aperture[0]}–${aperture[1]}`
    : `f/${aperture}`;
}

export function optionalNumber(
  value: number | undefined,
  unit: string
): string | undefined {
  return value === undefined ? undefined : `${value}${unit}`;
}

export function dimensionsDisplay(
  diameterMm: number | undefined,
  lengthMm: number | undefined
): string | undefined {
  if (diameterMm === undefined || lengthMm === undefined) {
    return undefined;
  }
  return `⌀${diameterMm} × ${lengthMm}mm`;
}

export function filterSizeDisplay(
  filterMm: Lens["filterMm"]
): string | undefined {
  if (filterMm === undefined) {
    return undefined;
  }
  if (filterMm === SPEC_NA) {
    return SPEC_NA;
  }
  return `${filterMm}mm`;
}

export function lengthVariantsDisplay(
  variants: LensLengthVariants | undefined,
  labels: { retracted: string; wide: string; tele: string }
): string | undefined {
  if (!variants) {
    return undefined;
  }

  const parts = [
    variants.retracted !== undefined
      ? `${labels.retracted} ${variants.retracted}mm`
      : null,
    variants.wide !== undefined ? `${labels.wide} ${variants.wide}mm` : null,
    variants.tele !== undefined ? `${labels.tele} ${variants.tele}mm` : null,
  ].filter((value): value is string => value !== null);

  return parts.length > 0 ? parts.join("\n") : undefined;
}

/**
 * Merge manufacturer-specific low-dispersion counts into a unified display line.
 * e.g. ed=3 + sld=2 → "5 ED (incl. 2 SLD)"
 */
function mergedElementLine(
  base: number | undefined,
  baseLabel: string,
  vendor: number | undefined,
  vendorLabel: string
): string | null {
  if (base === undefined && vendor === undefined) return null;
  const baseCount = base ?? 0;
  const vendorCount = vendor ?? 0;
  const total = baseCount + vendorCount;
  if (total === 0) return null;
  if (vendorCount === 0) return `${total} ${baseLabel}`;
  if (baseCount === 0) return `${total} ${baseLabel} (${vendorCount} ${vendorLabel})`;
  return `${total} ${baseLabel} (incl. ${vendorCount} ${vendorLabel})`;
}

export function lensConfigurationDisplay(
  configuration: LensConfiguration | undefined
): string | undefined {
  if (!configuration) {
    return undefined;
  }

  const parts = [
    `${configuration.groups} groups / ${configuration.elements} elements`,
    configuration.aspherical !== undefined
      ? `${configuration.aspherical} aspherical`
      : null,
    mergedElementLine(configuration.ed, "ED", configuration.sld, "SLD"),
    mergedElementLine(
      configuration.superEd,
      "Super ED",
      configuration.fld,
      "FLD"
    ),
    configuration.highRefractive !== undefined
      ? `${configuration.highRefractive} high refractive`
      : null,
    configuration.otherNotes ?? null,
  ].filter((value): value is string => value !== null);

  return parts.join("\n");
}

export function focusDistanceVariantsDisplay(
  variants: FocusDistanceVariants | undefined,
  labels: { wide: string; tele: string }
): string | undefined {
  if (!variants) return undefined;

  const parts = [
    variants.wide !== undefined ? `${labels.wide} ${variants.wide}cm` : null,
    variants.tele !== undefined ? `${labels.tele} ${variants.tele}cm` : null,
  ].filter((value): value is string => value !== null);

  return parts.length > 0 ? parts.join("\n") : undefined;
}

export function magnificationVariantsDisplay(
  variants: MagnificationVariants | undefined,
  labels: { wide: string; tele: string }
): string | undefined {
  if (!variants) return undefined;

  const parts = [
    variants.wide !== undefined ? `${labels.wide} ${variants.wide}x` : null,
    variants.tele !== undefined ? `${labels.tele} ${variants.tele}x` : null,
  ].filter((value): value is string => value !== null);

  return parts.length > 0 ? parts.join("\n") : undefined;
}
