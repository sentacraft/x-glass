import { z } from "zod";

import { SPEC_NA, SPECIALTY_TAGS, FIELD_NOTE_KEYS } from "./types.ts";
import type { ApertureValue } from "./types.ts";

const positiveNumberSchema = z.number().positive();
const nonEmptyStringSchema = z.string().trim().min(1);
const optionalNonEmptyStringSchema = nonEmptyStringSchema.optional();
const lensImagePathSchema = z
  .string()
  .regex(/^\/lenses\/[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/);

function createApertureSchema(fieldName: "maxAperture" | "minAperture" | "maxTStop" | "minTStop") {
  return z.union([
    positiveNumberSchema,
    z.tuple([positiveNumberSchema, positiveNumberSchema]).refine(
      (arr) => arr[0] < arr[1],
      {
        message: `When ${fieldName} is an array, the first value (wide) must be less than the second (tele)`,
      }
    ),
  ]);
}

const maxApertureSchema = createApertureSchema("maxAperture");
const minApertureSchema = createApertureSchema("minAperture");
const maxTStopSchema = createApertureSchema("maxTStop");
const minTStopSchema = createApertureSchema("minTStop");
const specialtyTagSchema = z.enum(SPECIALTY_TAGS);

export const focusDistanceVariantsSchema = z.strictObject({
  wide: positiveNumberSchema.optional(),
  tele: positiveNumberSchema.optional(),
});

export const magnificationVariantsSchema = z.strictObject({
  wide: positiveNumberSchema.optional(),
  tele: positiveNumberSchema.optional(),
});

const lensBaseShape = {
  id: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  brand: nonEmptyStringSchema,
  series: optionalNonEmptyStringSchema,
  model: nonEmptyStringSchema,
  generation: z.number().int().positive().optional(),
  focalLengthMin: positiveNumberSchema,
  focalLengthMax: positiveNumberSchema,
  maxAperture: maxApertureSchema,
  minAperture: minApertureSchema,
  maxTStop: maxTStopSchema.optional(),
  minTStop: minTStopSchema.optional(),
  specialtyTags: z.array(specialtyTagSchema).min(1).optional(),
  af: z.boolean(),
  ois: z.boolean(),
  oisStops: positiveNumberSchema.optional(),
  wr: z.union([z.boolean(), z.literal("partial")]),
  apertureRing: z.boolean(),
  powerZoom: z.boolean().optional(),
  focusMotor: optionalNonEmptyStringSchema,
  internalFocusing: z.boolean().optional(),
  weightG: z.union([
    positiveNumberSchema,
    z.tuple([positiveNumberSchema, positiveNumberSchema]).refine(
      (arr) => arr[0] < arr[1],
      { message: "weightG range: first value (min) must be less than second (max)" }
    ),
  ]).optional(),
  diameterMm: positiveNumberSchema.optional(),
  length: z.strictObject({
    mm: positiveNumberSchema,
    variants: z.strictObject({
      retracted: positiveNumberSchema.optional(),
      wide: positiveNumberSchema.optional(),
      tele: positiveNumberSchema.optional(),
    }).optional(),
  }).optional(),
  minFocusDistance: z.strictObject({
    cm: positiveNumberSchema,
    macroCm: positiveNumberSchema.optional(),
    variants: focusDistanceVariantsSchema.optional(),
  }).optional(),
  maxMagnification: z.strictObject({
    value: positiveNumberSchema,
    variants: magnificationVariantsSchema.optional(),
  }).optional(),
  angleOfView: optionalNonEmptyStringSchema,
  apertureBladeCount: z.number().int().positive().optional(),
  releaseYear: z.number().int().min(1900).max(2100).optional(),
  compatibleMounts: z.array(nonEmptyStringSchema).min(1).optional(),
  accessories: z.array(nonEmptyStringSchema).min(1).optional(),
  lensMaterial: optionalNonEmptyStringSchema,
  imageUrl: lensImagePathSchema,
} as const;

export const specNaSchema = z.literal(SPEC_NA);

export const officialLinksSchema = z
  .strictObject({
    cn: z.url().optional(),
    global: z.url().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.cn && !value.global) {
      ctx.addIssue({
        code: "custom",
        message: "officialLinks must include at least one of cn or global",
        path: [],
      });
    }
  });

export const lensConfigurationSchema = z
  .strictObject({
    groups: z.number().int().positive(),
    elements: z.number().int().positive(),
    aspherical: z.number().int().nonnegative().optional(),
    ed: z.number().int().nonnegative().optional(),
    superEd: z.number().int().nonnegative().optional(),
    sld: z.number().int().nonnegative().optional(),
    fld: z.number().int().nonnegative().optional(),
    highRefractive: z.number().int().nonnegative().optional(),
    sourceText: optionalNonEmptyStringSchema,
  })
  .superRefine((value, ctx) => {
    if (value.groups > value.elements) {
      ctx.addIssue({
        code: "custom",
        message: "lensConfiguration.groups cannot exceed lensConfiguration.elements",
        path: ["groups"],
      });
    }
  });

const fieldNoteKeySchema = z.enum(FIELD_NOTE_KEYS);

const fieldNotesSchema = z.record(fieldNoteKeySchema, nonEmptyStringSchema);

const lensObjectSchema = z.strictObject({
  ...lensBaseShape,
  filterMm: z.union([positiveNumberSchema, specNaSchema]).optional(),
  lensConfiguration: lensConfigurationSchema.optional(),
  fieldNotes: fieldNotesSchema.optional(),
  officialLinks: officialLinksSchema,
});

function getApertureEndpoints(aperture: ApertureValue): {
  wide: number;
  tele: number | undefined;
} {
  return Array.isArray(aperture)
    ? { wide: aperture[0], tele: aperture[1] }
    : { wide: aperture, tele: undefined };
}

function validateAperturePair(
  maxValue: ApertureValue | undefined,
  minValue: ApertureValue | undefined,
  ctx: z.RefinementCtx,
  labels: {
    maxField: "maxAperture" | "maxTStop";
    minField: "minAperture" | "minTStop";
  },
): void {
  if (maxValue === undefined || minValue === undefined) {
    return;
  }

  const maxEndpoints = getApertureEndpoints(maxValue);
  const minEndpoints = getApertureEndpoints(minValue);
  const maxWidePath = Array.isArray(maxValue) ? [labels.maxField, 0] : [labels.maxField];
  const maxTelePath = Array.isArray(maxValue) ? [labels.maxField, 1] : [labels.maxField];

  if (maxEndpoints.wide > minEndpoints.wide) {
    ctx.addIssue({
      code: "custom",
      message: `${labels.maxField} wide-end cannot be greater than ${labels.minField} wide-end`,
      path: maxWidePath,
    });
  }

  if (
    minEndpoints.tele !== undefined &&
    maxEndpoints.wide > minEndpoints.tele
  ) {
    ctx.addIssue({
      code: "custom",
      message: `${labels.maxField} cannot be greater than ${labels.minField} tele-end`,
      path: maxWidePath,
    });
  }

  if (
    maxEndpoints.tele !== undefined &&
    maxEndpoints.tele > (minEndpoints.tele ?? minEndpoints.wide)
  ) {
    ctx.addIssue({
      code: "custom",
      message: minEndpoints.tele !== undefined
        ? `${labels.maxField} tele-end cannot be greater than ${labels.minField} tele-end`
        : `${labels.maxField} tele-end cannot be greater than ${labels.minField}`,
      path: maxTelePath,
    });
  }
}

function applyLensBusinessRules(
  value: {
    focalLengthMin?: number;
    focalLengthMax?: number;
    maxAperture?: ApertureValue;
    minAperture?: ApertureValue;
    maxTStop?: ApertureValue;
    minTStop?: ApertureValue;
    imageUrl?: string;
  },
  ctx: z.RefinementCtx
): void {
  if (
    value.focalLengthMin !== undefined &&
    value.focalLengthMax !== undefined &&
    value.focalLengthMin > value.focalLengthMax
  ) {
    ctx.addIssue({
      code: "custom",
      message: "focalLengthMin cannot be greater than focalLengthMax",
      path: ["focalLengthMin"],
    });
  }

  validateAperturePair(value.maxAperture, value.minAperture, ctx, {
    maxField: "maxAperture",
    minField: "minAperture",
  });

  validateAperturePair(value.maxTStop, value.minTStop, ctx, {
    maxField: "maxTStop",
    minField: "minTStop",
  });
}

export const lensSchema = lensObjectSchema.superRefine((value, ctx) => {
  applyLensBusinessRules(value, ctx);
});

export const lensPatchSchema = lensObjectSchema.partial().superRefine((value, ctx) => {
  applyLensBusinessRules(value, ctx);
});

// Pairs of lens IDs that share identical spec tuples but are confirmed distinct.
// Format: "idA|idB" with IDs sorted alphabetically.
function makeAllowlistKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}
const KNOWN_DISTINCT_SPEC_PAIRS = new Set([
  makeAllowlistKey(
    "fujifilm-xf-56mm-f12-r-xf", 
    "fujifilm-xf-56mm-f12-r-apd-xf"),
]);

export const lensCatalogSchema = z.array(lensSchema).superRefine((lenses, ctx) => {
  const seenIds = new Map<string, number>();
  const seenImageUrls = new Map<string, number>();
  const seenCnLinks = new Map<string, number>();
  const seenGlobalLinks = new Map<string, number>();
  const seenBrandModels = new Map<string, number>();
  const seenSpecTuples = new Map<string, number>();

  lenses.forEach((lens, index) => {
    const previousIndex = seenIds.get(lens.id);
    if (previousIndex !== undefined) {
      ctx.addIssue({
        code: "custom",
        message: `Duplicate lens id "${lens.id}" also appears at index ${previousIndex}`,
        path: [index, "id"],
      });
      return;
    }

    seenIds.set(lens.id, index);

    const previousImageUrlIndex = seenImageUrls.get(lens.imageUrl);
    if (previousImageUrlIndex !== undefined) {
      ctx.addIssue({
        code: "custom",
        message: `Duplicate imageUrl also appears at index ${previousImageUrlIndex}`,
        path: [index, "imageUrl"],
      });
    } else {
      seenImageUrls.set(lens.imageUrl, index);
    }

    if (lens.officialLinks.cn) {
      const previousCnIndex = seenCnLinks.get(lens.officialLinks.cn);
      if (previousCnIndex !== undefined) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate officialLinks.cn also appears at index ${previousCnIndex}`,
          path: [index, "officialLinks", "cn"],
        });
      } else {
        seenCnLinks.set(lens.officialLinks.cn, index);
      }
    }

    if (lens.officialLinks.global) {
      const previousGlobalIndex = seenGlobalLinks.get(lens.officialLinks.global);
      if (previousGlobalIndex !== undefined) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate officialLinks.global also appears at index ${previousGlobalIndex}`,
          path: [index, "officialLinks", "global"],
        });
      } else {
        seenGlobalLinks.set(lens.officialLinks.global, index);
      }
    }

    const brandModelKey = [
      lens.brand,
      lens.model,
      lens.generation ?? "<none>",
    ].join("|");
    const previousBrandModelIndex = seenBrandModels.get(brandModelKey);
    if (previousBrandModelIndex !== undefined) {
      ctx.addIssue({
        code: "custom",
        message: `Duplicate brand/model/generation combination also appears at index ${previousBrandModelIndex}`,
        path: [index, "model"],
      });
    } else {
      seenBrandModels.set(brandModelKey, index);
    }

    const specTupleKey = [
      lens.brand,
      lens.series ?? "<none>",
      lens.focalLengthMin,
      lens.focalLengthMax,
      lens.maxAperture,
      lens.af ? "af" : "no-af",
      lens.ois ? "ois" : "no-ois",
      lens.wr ? "wr" : "no-wr",
      lens.apertureRing ? "aperture-ring" : "no-aperture-ring",
      lens.generation ?? "<none>",
    ].join("|");
    const previousSpecTupleIndex = seenSpecTuples.get(specTupleKey);
    if (previousSpecTupleIndex !== undefined) {
      const prevId = lenses[previousSpecTupleIndex].id;
      const pairKey = makeAllowlistKey(prevId, lens.id);
      if (!KNOWN_DISTINCT_SPEC_PAIRS.has(pairKey)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate brand/spec/features/generation combination also appears at index ${previousSpecTupleIndex}`,
          path: [index, "focalLengthMin"],
        });
      }
    } else {
      seenSpecTuples.set(specTupleKey, index);
    }
  });
});

export function formatZodIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "<root>";
    return `${path}: ${issue.message}`;
  });
}
