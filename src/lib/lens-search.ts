import type { Lens } from "./types";

const NON_WORD_PATTERN = /[^a-z0-9]+/g;

export function normalizeLensSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(NON_WORD_PATTERN, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function getModelSearchScore(model: string, query: string): number {
  if (!query) {
    return 0;
  }

  if (model === query) {
    return 400;
  }

  if (model.startsWith(query)) {
    return 300;
  }

  const words = model.split(" ");
  if (words.some((word) => word.startsWith(query))) {
    return 200;
  }

  if (model.includes(query)) {
    return 100;
  }

  return 0;
}

export function searchLensesByModel(lenses: Lens[], query: string, limit = 8): Lens[] {
  const normalizedQuery = normalizeLensSearchText(query);

  if (!normalizedQuery) {
    return [];
  }

  return lenses
    .map((lens) => {
      const normalizedModel = normalizeLensSearchText(lens.model);
      return {
        lens,
        score: getModelSearchScore(normalizedModel, normalizedQuery),
        normalizedModel,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      if (a.normalizedModel.length !== b.normalizedModel.length) {
        return a.normalizedModel.length - b.normalizedModel.length;
      }

      return a.normalizedModel.localeCompare(b.normalizedModel);
    })
    .slice(0, limit)
    .map((entry) => entry.lens);
}
