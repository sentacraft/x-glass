import lensesData from "../data/lenses.json";
import type { Lens, LensCatalog } from "./types";

export const allLenses: Lens[] = lensesData as unknown as LensCatalog;

export type LensType = "prime" | "zoom";

export function isZoom(lens: Lens): boolean {
  return lens.focalLengthMin !== lens.focalLengthMax;
}

// Boolean Lens fields that can be used as filter conditions.
// satisfies (keyof Lens)[] enforces at compile time that each key exists on Lens.
export const FILTER_FEATURE_KEYS = [
  "af",
  "ois",
  "wr",
  "apertureRing",
] as const satisfies readonly (keyof Lens)[];

export type FilterFeatureKey = (typeof FILTER_FEATURE_KEYS)[number];

export interface FilterState {
  brands: string[]; // empty = all brands
  type: LensType | "";
  features: FilterFeatureKey[]; // empty = no requirement
  weightRange: [number, number] | null; // null = no filter
  yearRange: [number, number] | null; // null = no filter
  sort: SortKey;
  sortDir: "asc" | "desc";
}

export const defaultFilters: FilterState = {
  brands: [],
  type: "",
  features: [],
  weightRange: null,
  yearRange: null,
  sort: "focalLength",
  sortDir: "asc",
};

export function filterLenses(lenses: Lens[], filters: FilterState): Lens[] {
  return lenses.filter((lens) => {
    if (filters.brands.length > 0 && !filters.brands.includes(lens.brand)) {
      return false;
    }
    if (filters.type === "prime" && isZoom(lens)) {
      return false;
    }
    if (filters.type === "zoom" && !isZoom(lens)) {
      return false;
    }
    for (const field of FILTER_FEATURE_KEYS) {
      if (filters.features.includes(field) && !lens[field]) {
        return false;
      }
    }
    if (filters.weightRange && lens.weightG !== undefined) {
      const [wMin, wMax] = filters.weightRange;
      if (lens.weightG < wMin || lens.weightG > wMax) {
        return false;
      }
    }
    if (filters.yearRange && lens.releaseYear !== undefined) {
      const [yMin, yMax] = filters.yearRange;
      if (lens.releaseYear < yMin || lens.releaseYear > yMax) {
        return false;
      }
    }
    return true;
  });
}

export function getUniqueBrands(lenses: Lens[]): string[] {
  return [...new Set(lenses.map((l) => l.brand))].sort();
}

// Brand-level catalog URLs (English/global). Used as fallback when official links are absent.
const BRAND_URLS: Record<string, string> = {
  fujifilm: "https://fujifilm-x.com/global/products/lenses/",
  viltrox: "https://viltrox.com/",
  sigma:
    "https://www.sigma-global.com/en/lenses/categories/mirrorless/fujifilm-x.html",
  tamron: "https://www.tamron.com/en/lenses/",
};

// Prioritize global official links for now. Can adjust logic later if we want to show region-specific links based on user locale or other signals.
export function getLensUrl(lens: Lens): string | undefined {
  return lens.officialLinks?.global ?? lens.officialLinks?.cn ?? BRAND_URLS[lens.brand];
}

const MAX_COMPARE = 4;

export function parseLensIds(ids: string | undefined): Lens[] {
  return (ids ?? "")
    .split(",")
    .filter(Boolean)
    .slice(0, MAX_COMPARE)
    .map((id) => allLenses.find((l) => l.id === id))
    .filter((l): l is Lens => l !== undefined);
}

export type SortKey = "focalLength" | "maxAperture" | "weightG" | "releaseYear";

export function sortLenses(
  lenses: Lens[],
  key: SortKey,
  dir: "asc" | "desc"
): Lens[] {
  return [...lenses].sort((a, b) => {
    const field: keyof Lens =
      key === "focalLength"
        ? dir === "asc"
          ? "focalLengthMin"
          : "focalLengthMax"
        : key;
    const delta = (a[field] as number) - (b[field] as number);
    return dir === "asc" ? delta : -delta;
  });
}
