import type { Lens } from "./types";

const NON_WORD_PATTERN = /[^a-z0-9]+/g;

export function normalizeLensSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(NON_WORD_PATTERN, " ")
    .trim()
    .replace(/\s+/g, " ");
}

interface ScoredField {
  text: string;
  exact: number;
  prefix: number;
  wordPrefix: number;
  includes: number;
}

interface SearchableLensEntry {
  lens: Lens;
  model: string;
  brand: string;
  series: string;
  aggregate: string;
}

export type LensSearchIndex = SearchableLensEntry[];

function scoreField(field: string, query: string, weights: ScoredField): number {
  if (!field || !query) {
    return 0;
  }

  if (field === query) {
    return weights.exact;
  }

  if (field.startsWith(query)) {
    return weights.prefix;
  }

  const words = field.split(" ");
  if (words.some((word) => word.startsWith(query))) {
    return weights.wordPrefix;
  }

  if (field.includes(query)) {
    return weights.includes;
  }

  return 0;
}

function createSearchableLensEntry(lens: Lens): SearchableLensEntry {
  const brand = normalizeLensSearchText(lens.brand);
  const series = normalizeLensSearchText(lens.series ?? "");
  const model = normalizeLensSearchText(lens.model);

  return {
    lens,
    model,
    brand,
    series,
    aggregate: [brand, series, model].filter(Boolean).join(" "),
  };
}

export function buildLensSearchIndex(lenses: Lens[]): LensSearchIndex {
  return lenses.map(createSearchableLensEntry);
}

function scoreLens(entry: SearchableLensEntry, query: string): number {
  const modelScore = scoreField(entry.model, query, {
    text: entry.model,
    exact: 600,
    prefix: 500,
    wordPrefix: 400,
    includes: 280,
  });

  const brandScore = scoreField(entry.brand, query, {
    text: entry.brand,
    exact: 260,
    prefix: 220,
    wordPrefix: 180,
    includes: 120,
  });

  const seriesScore = scoreField(entry.series, query, {
    text: entry.series,
    exact: 210,
    prefix: 180,
    wordPrefix: 160,
    includes: 110,
  });

  const aggregateScore = scoreField(entry.aggregate, query, {
    text: entry.aggregate,
    exact: 90,
    prefix: 70,
    wordPrefix: 55,
    includes: 40,
  });

  return modelScore + brandScore + seriesScore + aggregateScore;
}

export function searchLensIndex(
  index: LensSearchIndex,
  query: string,
  limit = 8
): Lens[] {
  const normalizedQuery = normalizeLensSearchText(query);

  if (!normalizedQuery) {
    return [];
  }

  return index
    .map((entry) => ({
      entry,
      score: scoreLens(entry, normalizedQuery),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      if (a.entry.model.length !== b.entry.model.length) {
        return a.entry.model.length - b.entry.model.length;
      }

      return a.entry.model.localeCompare(b.entry.model);
    })
    .slice(0, limit)
    .map((entry) => entry.entry.lens);
}

export function searchLenses(
  lenses: Lens[],
  query: string,
  limit = 8
): Lens[] {
  return searchLensIndex(buildLensSearchIndex(lenses), query, limit);
}
