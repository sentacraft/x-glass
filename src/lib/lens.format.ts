import type { Lens, LensConfiguration, LensLengthVariants } from "./types";
import { SPEC_NA } from "./types";

const CROP_FACTOR = 1.5;

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
    configuration.ed !== undefined ? `${configuration.ed} ED` : null,
    configuration.superEd !== undefined
      ? `${configuration.superEd} Super ED`
      : null,
    configuration.otherNotes ?? null,
  ].filter((value): value is string => value !== null);

  return parts.join("\n");
}
