import { describe, it, expect } from "vitest";
import type { Lens } from "../types";
import {
  isZoom,
  filterLenses,
  sortLenses,
  getUniqueBrands,
  getLensUrl,
  defaultFilters,
} from "../lens";
import {
  focalEquivMin,
  focalEquivMax,
  focalDisplay,
  equivDisplay,
} from "../lens.format";

// Minimal Lens factory — only fill in fields relevant to each test
function makeLens(
  overrides: Partial<Lens> & Pick<Lens, "focalLengthMin" | "focalLengthMax">
): Lens {
  return {
    id: "test-lens",
    brand: "Fujifilm",
    series: "XF",
    model: "XF35mmF1.4 R",
    maxAperture: 1.4,
    minAperture: 16,
    af: true,
    ois: false,
    wr: false,
    weightG: 187,
    diameterMm: 65,
    lengthMm: 45,
    filterMm: 52,
    minFocusDistanceCm: 28,
    releaseYear: 2012,
    ...overrides,
  };
}

const prime35 = makeLens({ focalLengthMin: 35, focalLengthMax: 35 });
const zoom1835 = makeLens({ focalLengthMin: 18, focalLengthMax: 55 });

// ---------------------------------------------------------------------------
// isZoom
// ---------------------------------------------------------------------------
describe("isZoom", () => {
  it("returns false for a prime", () => {
    expect(isZoom(prime35)).toBe(false);
  });

  it("returns true for a zoom", () => {
    expect(isZoom(zoom1835)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// focalEquivMin / focalEquivMax (crop factor 1.5)
// ---------------------------------------------------------------------------
describe("focalEquivMin / focalEquivMax", () => {
  it("calculates equiv for a prime", () => {
    expect(focalEquivMin(prime35)).toBe(53); // 35 * 1.5 = 52.5 → 53
    expect(focalEquivMax(prime35)).toBe(53);
  });

  it("calculates wide and tele ends for a zoom", () => {
    expect(focalEquivMin(zoom1835)).toBe(27); // 18 * 1.5 = 27
    expect(focalEquivMax(zoom1835)).toBe(83); // 55 * 1.5 = 82.5 → 83
  });
});

// ---------------------------------------------------------------------------
// formatFocalDisplay / formatEquivDisplay
// ---------------------------------------------------------------------------
describe("formatFocalDisplay", () => {
  it("shows single value for prime", () => {
    expect(focalDisplay(prime35)).toBe("35mm");
  });

  it("shows range for zoom", () => {
    expect(focalDisplay(zoom1835)).toBe("18–55mm");
  });
});

describe("formatEquivDisplay", () => {
  it("shows single equiv for prime", () => {
    expect(equivDisplay(prime35)).toBe("53mm");
  });

  it("shows equiv range for zoom", () => {
    expect(equivDisplay(zoom1835)).toBe("27–83mm");
  });
});

// ---------------------------------------------------------------------------
// filterLenses
// ---------------------------------------------------------------------------
const lensPool: Lens[] = [
  makeLens({
    id: "fuji-prime",
    brand: "Fujifilm",
    focalLengthMin: 35,
    focalLengthMax: 35,
    af: true,
    wr: false,
  }),
  makeLens({
    id: "fuji-zoom",
    brand: "Fujifilm",
    focalLengthMin: 18,
    focalLengthMax: 55,
    af: true,
    wr: true,
  }),
  makeLens({
    id: "sigma-prime",
    brand: "Sigma",
    focalLengthMin: 56,
    focalLengthMax: 56,
    af: true,
    wr: false,
  }),
  makeLens({
    id: "mf-prime",
    brand: "Viltrox",
    focalLengthMin: 75,
    focalLengthMax: 75,
    af: false,
    wr: false,
  }),
];

describe("filterLenses", () => {
  it("returns all lenses with default filters", () => {
    expect(filterLenses(lensPool, defaultFilters)).toHaveLength(4);
  });

  it("filters by a single brand", () => {
    const result = filterLenses(lensPool, {
      ...defaultFilters,
      brands: ["Fujifilm"],
    });
    expect(result).toHaveLength(2);
    expect(result.every((l) => l.brand === "Fujifilm")).toBe(true);
  });

  it("filters by multiple brands", () => {
    const result = filterLenses(lensPool, {
      ...defaultFilters,
      brands: ["Fujifilm", "Sigma"],
    });
    expect(result).toHaveLength(3);
    expect(result.map((l) => l.id)).not.toContain("mf-prime");
  });

  it("filters by type: prime", () => {
    const result = filterLenses(lensPool, { ...defaultFilters, type: "prime" });
    expect(result.every((l) => l.focalLengthMin === l.focalLengthMax)).toBe(
      true
    );
  });

  it("filters by type: zoom", () => {
    const result = filterLenses(lensPool, { ...defaultFilters, type: "zoom" });
    expect(result.every((l) => l.focalLengthMin !== l.focalLengthMax)).toBe(
      true
    );
  });

  it("filters by required features (ois)", () => {
    const oisPool = [
      makeLens({
        id: "with-ois",
        focalLengthMin: 18,
        focalLengthMax: 55,
        ois: true,
      }),
      makeLens({
        id: "no-ois",
        focalLengthMin: 35,
        focalLengthMax: 35,
        ois: false,
      }),
    ];
    const result = filterLenses(oisPool, {
      ...defaultFilters,
      features: ["ois"],
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("with-ois");
  });

  it("filters by multiple required features (af + wr)", () => {
    const result = filterLenses(lensPool, {
      ...defaultFilters,
      features: ["af", "wr"],
    });
    expect(result.every((l) => l.af && l.wr)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("fuji-zoom");
  });

  it("filters by weightRange", () => {
    const result = filterLenses(lensPool, {
      ...defaultFilters,
      weightRange: [100, 200],
    });
    // lensPool default weightG is 187, all lenses use the default
    expect(result).toHaveLength(4);
    const result2 = filterLenses(lensPool, {
      ...defaultFilters,
      weightRange: [200, 500],
    });
    expect(result2).toHaveLength(0);
  });

  it("filters by yearRange", () => {
    const yearPool = [
      makeLens({
        id: "old",
        focalLengthMin: 35,
        focalLengthMax: 35,
        releaseYear: 2012,
      }),
      makeLens({
        id: "new",
        focalLengthMin: 35,
        focalLengthMax: 35,
        releaseYear: 2023,
      }),
    ];
    const result = filterLenses(yearPool, {
      ...defaultFilters,
      yearRange: [2020, 2025],
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("new");
  });

  it("filters by required feature: af", () => {
    const result = filterLenses(lensPool, {
      ...defaultFilters,
      features: ["af"],
    });
    expect(result.every((l) => l.af)).toBe(true);
    expect(result.map((l) => l.id)).not.toContain("mf-prime");
  });

  it("filters by required feature: wr", () => {
    const result = filterLenses(lensPool, {
      ...defaultFilters,
      features: ["wr"],
    });
    expect(result.every((l) => l.wr)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("fuji-zoom");
  });

  it("filters by required feature: apertureRing", () => {
    const result = filterLenses(
      [
        makeLens({
          id: "with-ring",
          focalLengthMin: 35,
          focalLengthMax: 35,
          apertureRing: true,
        }),
        makeLens({
          id: "without-ring",
          focalLengthMin: 33,
          focalLengthMax: 33,
          apertureRing: false,
        }),
      ],
      {
        ...defaultFilters,
        features: ["apertureRing"],
      }
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("with-ring");
  });

  it("combines multiple filters", () => {
    const result = filterLenses(lensPool, {
      ...defaultFilters,
      brands: ["Fujifilm"],
      type: "zoom",
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("fuji-zoom");
  });
});

// ---------------------------------------------------------------------------
// sortLenses
// ---------------------------------------------------------------------------
const sortPool: Lens[] = [
  makeLens({
    id: "a",
    focalLengthMin: 56,
    focalLengthMax: 56,
    maxAperture: 1.4,
    weightG: 300,
    releaseYear: 2020,
  }),
  makeLens({
    id: "b",
    focalLengthMin: 18,
    focalLengthMax: 18,
    maxAperture: 2.8,
    weightG: 150,
    releaseYear: 2015,
  }),
  makeLens({
    id: "c",
    focalLengthMin: 35,
    focalLengthMax: 35,
    maxAperture: 2.0,
    weightG: 200,
    releaseYear: 2018,
  }),
];

describe("sortLenses", () => {
  it("sorts by focalLengthMin ascending", () => {
    const ids = sortLenses(sortPool, "focalLength", "asc").map((l) => l.id);
    expect(ids).toEqual(["b", "c", "a"]);
  });

  it("sorts by focalLengthMin descending", () => {
    const ids = sortLenses(sortPool, "focalLength", "desc").map((l) => l.id);
    expect(ids).toEqual(["a", "c", "b"]);
  });

  it("sorts by maxAperture ascending (wider aperture = smaller number = first)", () => {
    const ids = sortLenses(sortPool, "maxAperture", "asc").map((l) => l.id);
    expect(ids).toEqual(["a", "c", "b"]);
  });

  it("sorts by weightG ascending", () => {
    const ids = sortLenses(sortPool, "weightG", "asc").map((l) => l.id);
    expect(ids).toEqual(["b", "c", "a"]);
  });

  it("sorts by releaseYear descending", () => {
    const ids = sortLenses(sortPool, "releaseYear", "desc").map((l) => l.id);
    expect(ids).toEqual(["a", "c", "b"]);
  });

  it("does not mutate the original array", () => {
    const original = [...sortPool];
    sortLenses(sortPool, "focalLength", "asc");
    expect(sortPool).toEqual(original);
  });
});

// ---------------------------------------------------------------------------
// getUniqueBrands
// ---------------------------------------------------------------------------
describe("getUniqueBrands", () => {
  it("returns sorted unique brands", () => {
    expect(getUniqueBrands(lensPool)).toEqual(["Fujifilm", "Sigma", "Viltrox"]);
  });

  it("returns empty array for empty input", () => {
    expect(getUniqueBrands([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getLensUrl
// ---------------------------------------------------------------------------
describe("getLensUrl", () => {
  it("returns global official link when present", () => {
    const lens = makeLens({
      focalLengthMin: 35,
      focalLengthMax: 35,
      officialLinks: { global: "https://example.com/lens" },
    });
    expect(getLensUrl(lens)).toBe("https://example.com/lens");
  });

  it("falls back to cn official link when global link is absent", () => {
    const lens = makeLens({
      focalLengthMin: 35,
      focalLengthMax: 35,
      officialLinks: { cn: "https://example.com/cn-lens" },
    });
    expect(getLensUrl(lens)).toBe("https://example.com/cn-lens");
  });

  it("falls back to brand URL for Fujifilm", () => {
    const lens = makeLens({
      focalLengthMin: 35,
      focalLengthMax: 35,
      brand: "Fujifilm",
    });
    expect(getLensUrl(lens)).toBe(
      "https://fujifilm-x.com/global/products/lenses/"
    );
  });

  it("returns undefined for unknown brand without official links", () => {
    const lens = makeLens({
      focalLengthMin: 35,
      focalLengthMax: 35,
      brand: "UnknownBrand",
    });
    expect(getLensUrl(lens)).toBeUndefined();
  });
});
