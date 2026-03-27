import lensesData from "../data/lenses.json";
import type { Lens } from "./types";

export const allLenses: Lens[] = lensesData as Lens[];

const CROP_FACTOR = 1.5;

export function isZoom(lens: Lens): boolean {
  return lens.focalLengthMin !== lens.focalLengthMax;
}

export function focalEquivMin(lens: Lens): number {
  return Math.round(lens.focalLengthMin * CROP_FACTOR);
}

export function focalEquivMax(lens: Lens): number {
  return Math.round(lens.focalLengthMax * CROP_FACTOR);
}

export function formatFocalDisplay(lens: Lens): string {
  return isZoom(lens)
    ? `${lens.focalLengthMin}–${lens.focalLengthMax}mm`
    : `${lens.focalLengthMin}mm`;
}

export function formatEquivDisplay(lens: Lens): string {
  return isZoom(lens)
    ? `${focalEquivMin(lens)}–${focalEquivMax(lens)}mm`
    : `${focalEquivMin(lens)}mm`;
}

export type LensType = "prime" | "zoom";

export interface FilterState {
  brands: string[];                     // empty = all brands
  type: LensType | "";
  afOnly: boolean;
  oisOnly: boolean;
  wrOnly: boolean;
  weightRange: [number, number] | null; // null = no filter
  yearRange: [number, number] | null;   // null = no filter
  sort: SortKey;
  sortDir: "asc" | "desc";
}

export const defaultFilters: FilterState = {
  brands: [],
  type: "",
  afOnly: false,
  oisOnly: false,
  wrOnly: false,
  weightRange: null,
  yearRange: null,
  sort: "focalLengthMin",
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
    if (filters.afOnly && !lens.af) {
      return false;
    }
    if (filters.oisOnly && !lens.ois) {
      return false;
    }
    if (filters.wrOnly && !lens.wr) {
      return false;
    }
    if (filters.weightRange) {
      const [wMin, wMax] = filters.weightRange;
      if (lens.weightG < wMin || lens.weightG > wMax) return false;
    }
    if (filters.yearRange) {
      const [yMin, yMax] = filters.yearRange;
      if (lens.releaseYear < yMin || lens.releaseYear > yMax) return false;
    }
    return true;
  });
}

export function getUniqueBrands(lenses: Lens[]): string[] {
  return [...new Set(lenses.map((l) => l.brand))].sort();
}

// Brand-level catalog URLs (English/global). Used as fallback when officialUrl is absent.
const BRAND_URLS: Record<string, string> = {
  Fujifilm: "https://fujifilm-x.com/global/products/lenses/",
  Viltrox: "https://viltrox.com/",
  Sigma:
    "https://www.sigma-global.com/en/lenses/categories/mirrorless/fujifilm-x.html",
  Tamron: "https://www.tamron.com/en/lenses/",
};

export function getLensUrl(lens: Lens): string | undefined {
  return lens.officialUrl ?? BRAND_URLS[lens.brand];
}

export type SortKey =
  | "focalLengthMin"
  | "maxAperture"
  | "weightG"
  | "releaseYear";

export function sortLenses(lenses: Lens[], key: SortKey, dir: "asc" | "desc"): Lens[] {
  return [...lenses].sort((a, b) => {
    const delta = a[key] - b[key];
    return dir === "asc" ? delta : -delta;
  });
}
