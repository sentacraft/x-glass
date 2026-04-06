import { describe, expect, it } from "vitest";
import type { Lens } from "@/lib/types";
import { normalizeLensSearchText, searchLensesByModel } from "@/lib/lens-search";

const lenses = [
  { id: "a", brand: "fujifilm", model: "XF35mm F1.4 R" },
  { id: "b", brand: "sigma", model: "35mm F1.4 DC DN Contemporary" },
  { id: "c", brand: "fujifilm", model: "XF23mm F2 R WR" },
] as Lens[];

describe("normalizeLensSearchText", () => {
  it("normalizes punctuation and repeated whitespace", () => {
    expect(normalizeLensSearchText(" XF35mm/F1.4   R ")).toBe("xf35mm f1 4 r");
  });
});

describe("searchLensesByModel", () => {
  it("prioritizes prefix matches over substring matches", () => {
    const results = searchLensesByModel(lenses, "xf35");

    expect(results[0]?.id).toBe("a");
  });

  it("returns empty results for blank query", () => {
    expect(searchLensesByModel(lenses, "   ")).toEqual([]);
  });

  it("matches normalized substring queries", () => {
    const results = searchLensesByModel(lenses, "f2 r");

    expect(results.map((lens) => lens.id)).toContain("c");
  });
});
