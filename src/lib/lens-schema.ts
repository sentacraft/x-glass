import { z } from "zod";

import { SPEC_NA } from "./types.ts";

const positiveNumberSchema = z.number().positive();
const nonEmptyStringSchema = z.string().trim().min(1);
const optionalNonEmptyStringSchema = nonEmptyStringSchema.optional();
const lensImagePathSchema = z
  .string()
  .regex(/^\/lenses\/[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/);

// maxAperture can be a single positive number or a tuple of two positive numbers [wide, tele]
const maxApertureSchema = z.union([
  positiveNumberSchema,
  z.tuple([positiveNumberSchema, positiveNumberSchema]).refine(
    (arr) => arr[0] < arr[1],
    {
      message: "When maxAperture is an array, the first value (wide) must be less than the second (tele)",
    }
  ),
]);

const lensBaseShape = {
  id: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  brand: nonEmptyStringSchema,
  series: optionalNonEmptyStringSchema,
  model: nonEmptyStringSchema,
  generation: z.number().int().positive().optional(),
  focalLengthMin: positiveNumberSchema,
  focalLengthMax: positiveNumberSchema,
  maxAperture: maxApertureSchema,
  minAperture: positiveNumberSchema,
  af: z.boolean(),
  ois: z.boolean(),
  wr: z.boolean(),
  apertureRing: z.boolean(),
  weightG: positiveNumberSchema.optional(),
  diameterMm: positiveNumberSchema.optional(),
  lengthMm: positiveNumberSchema.optional(),
  minFocusDistanceCm: positiveNumberSchema.optional(),
  minFocusDistanceMacroCm: positiveNumberSchema.optional(),
  maxMagnification: positiveNumberSchema.optional(),
  angleOfView: optionalNonEmptyStringSchema,
  apertureBladeCount: z.number().int().positive().optional(),
  releaseYear: z.number().int().min(1900).max(2100).optional(),
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

export const lengthVariantsSchema = z
  .strictObject({
    retracted: positiveNumberSchema.optional(),
    wide: positiveNumberSchema.optional(),
    tele: positiveNumberSchema.optional(),
  });

export const lensConfigurationSchema = z
  .strictObject({
    groups: z.number().int().positive(),
    elements: z.number().int().positive(),
    aspherical: z.number().int().nonnegative().optional(),
    ed: z.number().int().nonnegative().optional(),
    superEd: z.number().int().nonnegative().optional(),
    otherNotes: optionalNonEmptyStringSchema,
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

const lensObjectSchema = z.strictObject({
  ...lensBaseShape,
  lengthVariantsMm: lengthVariantsSchema.optional(),
  filterMm: z.union([positiveNumberSchema, specNaSchema]).optional(),
  lensConfiguration: lensConfigurationSchema.optional(),
  officialLinks: officialLinksSchema,
});

function applyLensBusinessRules(
  value: {
    focalLengthMin?: number;
    focalLengthMax?: number;
    maxAperture?: number | [number, number];
    minAperture?: number;
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

  // Validate maxAperture relative to minAperture
  if (value.maxAperture !== undefined && value.minAperture !== undefined) {
    if (Array.isArray(value.maxAperture)) {
      // For variable-aperture zooms: check the wide-end value (index 0)
      const [wideAperture] = value.maxAperture;
      if (wideAperture > value.minAperture) {
        ctx.addIssue({
          code: "custom",
          message: "maxAperture[0] (wide-end) cannot be greater than minAperture",
          path: ["maxAperture", 0],
        });
      }
    } else {
      // For constant-aperture lenses: simple check
      if (value.maxAperture > value.minAperture) {
        ctx.addIssue({
          code: "custom",
          message: "maxAperture cannot be greater than minAperture",
          path: ["maxAperture"],
        });
      }
    }
  }
}

export const lensSchema = lensObjectSchema.superRefine((value, ctx) => {
  applyLensBusinessRules(value, ctx);
});

export const lensPatchSchema = lensObjectSchema.partial().superRefine((value, ctx) => {
  applyLensBusinessRules(value, ctx);
});

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
      ctx.addIssue({
        code: "custom",
        message: `Duplicate brand/spec/features/generation combination also appears at index ${previousSpecTupleIndex}`,
        path: [index, "focalLengthMin"],
      });
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
