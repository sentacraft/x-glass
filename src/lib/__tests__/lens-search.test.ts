import { describe, expect, it } from "vitest";
import type { Lens } from "@/lib/types";
import { normalizeLensSearchText, searchLenses } from "@/lib/lens-search";

const lenses = [
  { id: "a", brand: "fujifilm", series: "XF", model: "XF35mm F1.4 R" },
  { id: "b", brand: "sigma", series: "Contemporary", model: "35mm F1.4 DC DN Contemporary" },
  { id: "c", brand: "fujifilm", series: "XF", model: "XF23mm F2 R WR", generation: 2 },
] as Lens[];

describe("normalizeLensSearchText", () => {
  it("normalizes punctuation and repeated whitespace", () => {
    expect(normalizeLensSearchText(" XF35mm/F1.4   R ")).toBe("xf35mm f1 4 r");
  });
});

describe("searchLenses", () => {
  it("prioritizes prefix matches over substring matches", () => {
    const results = searchLenses(lenses, "xf35");

    expect(results[0]?.id).toBe("a");
  });

  it("returns empty results for blank query", () => {
    expect(searchLenses(lenses, "   ")).toEqual([]);
  });

  it("matches normalized substring queries", () => {
    const results = searchLenses(lenses, "f2 r");

    expect(results.map((lens) => lens.id)).toContain("c");
  });

  it("matches by brand when model does not contain the query", () => {
    const results = searchLenses(lenses, "sigma");

    expect(results[0]?.id).toBe("b");
  });

  it("matches by series name", () => {
    const results = searchLenses(lenses, "contemporary");

    expect(results[0]?.id).toBe("b");
  });

  it("keeps stronger model matches ahead of brand-only matches", () => {
    const results = searchLenses(lenses, "xf");

    expect(results[0]?.id).toBe("a");
  });
});
