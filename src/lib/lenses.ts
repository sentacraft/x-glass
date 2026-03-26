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

export type FocalRange = "wide" | "standard" | "tele";
export type LensType = "prime" | "zoom";

export interface FilterState {
  brand: string;
  type: LensType | "";
  focalRange: FocalRange | "";
  afOnly: boolean;
  wrOnly: boolean;
  sort: SortKey;
}

export const defaultFilters: FilterState = {
  brand: "",
  type: "",
  focalRange: "",
  afOnly: false,
  wrOnly: false,
  sort: "focalLengthMin",
};

export function filterLenses(lenses: Lens[], filters: FilterState): Lens[] {
  return lenses.filter((lens) => {
    if (filters.brand && lens.brand !== filters.brand) {
      return false;
    }
    if (filters.type === "prime" && isZoom(lens)) {
      return false;
    }
    if (filters.type === "zoom" && !isZoom(lens)) {
      return false;
    }
    if (filters.focalRange) {
      const equiv = focalEquivMin(lens);
      if (filters.focalRange === "wide" && equiv > 35) {
        return false;
      }
      if (filters.focalRange === "standard" && (equiv <= 35 || equiv > 85)) {
        return false;
      }
      if (filters.focalRange === "tele" && equiv <= 85) {
        return false;
      }
    }
    if (filters.afOnly && !lens.af) {
      return false;
    }
    if (filters.wrOnly && !lens.wr) {
      return false;
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

// releaseYear: newest first; everything else: ascending
export function sortLenses(lenses: Lens[], key: SortKey): Lens[] {
  return [...lenses].sort((a, b) => {
    if (key === "releaseYear") {
      return b.releaseYear - a.releaseYear;
    }
    return a[key] - b[key];
  });
}
