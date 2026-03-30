import type { Lens } from "./types";
import { isZoom } from "./lens";

const CROP_FACTOR = 1.5;

export function focalEquivMin(lens: Lens): number {
  return Math.round(lens.focalLengthMin * CROP_FACTOR);
}

export function focalEquivMax(lens: Lens): number {
  return Math.round(lens.focalLengthMax * CROP_FACTOR);
}

export function focalDisplay(lens: Lens): string {
  return isZoom(lens)
    ? `${lens.focalLengthMin}–${lens.focalLengthMax}mm`
    : `${lens.focalLengthMin}mm`;
}

export function equivDisplay(lens: Lens): string {
  return isZoom(lens)
    ? `${focalEquivMin(lens)}–${focalEquivMax(lens)}mm`
    : `${focalEquivMin(lens)}mm`;
}

export function optionalNumber(
  value: number | undefined,
  unit: string,
  unknownLabel: string
): string {
  return value === undefined ? unknownLabel : `${value}${unit}`;
}

export function optionalBoolean(
  value: boolean | undefined,
  yesLabel: string,
  noLabel: string,
  unknownLabel: string
): string {
  if (value === undefined) {
    return unknownLabel;
  }
  return value ? yesLabel : noLabel;
}

export function dimensionsDisplay(lens: Lens): string {
  return `⌀${lens.diameterMm} × ${lens.lengthMm}mm`;
}

export function lengthVariantsDisplay(
  lens: Lens,
  unknownLabel: string,
  labels: { retracted: string; wide: string; tele: string }
): string {
  const variants = lens.lengthVariantsMm;

  if (!variants) {
    return unknownLabel;
  }

  const parts = [
    variants.retracted !== undefined
      ? `${labels.retracted} ${variants.retracted}mm`
      : null,
    variants.wide !== undefined ? `${labels.wide} ${variants.wide}mm` : null,
    variants.tele !== undefined ? `${labels.tele} ${variants.tele}mm` : null,
  ].filter((value): value is string => value !== null);

  return parts.length > 0 ? parts.join("\n") : unknownLabel;
}

export function lensConfigurationDisplay(
  lens: Lens,
  unknownLabel: string
): string {
  const configuration = lens.lensConfiguration;

  if (!configuration) {
    return unknownLabel;
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
