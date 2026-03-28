"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import type { Lens } from "@/lib/types";
import {
  filterLenses,
  sortLenses,
  defaultFilters,
  getUniqueBrands,
  type FilterState,
} from "@/lib/lenses";
import { useCompare } from "@/context/CompareContext";
import LensCard from "./LensCard";
import LensFilters from "./LensFilters";
import CompareBar from "./CompareBar";

interface Props {
  lenses: Lens[];
}

export default function LensListClient({ lenses }: Props) {
  const t = useTranslations("LensList");
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const { compareIds, toggleCompare, canToggle } = useCompare();

  const brands = useMemo(() => getUniqueBrands(lenses), [lenses]);

  const displayed = useMemo(
    () =>
      sortLenses(filterLenses(lenses, filters), filters.sort, filters.sortDir),
    [lenses, filters]
  );

  const selectedLenses = useMemo(
    () =>
      compareIds
        .map((id) => lenses.find((l) => l.id === id))
        .filter((lens): lens is Lens => lens !== undefined),
    [compareIds, lenses]
  );

  return (
    <>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6 pb-24">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h1>
          <LensFilters
            filters={filters}
            brands={brands}
            onFiltersChange={setFilters}
          />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("resultsCount", { count: displayed.length })}
          </p>
        </div>

        {displayed.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("noResults")}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayed.map((lens) => (
              <LensCard
                key={lens.id}
                lens={lens}
                isSelected={compareIds.includes(lens.id)}
                selectionDisabled={!canToggle(lens.id)}
                onToggle={() => toggleCompare(lens.id)}
              />
            ))}
          </div>
        )}
      </div>

      <CompareBar selectedLenses={selectedLenses} onRemove={toggleCompare} />
    </>
  );
}
