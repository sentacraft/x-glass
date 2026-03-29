"use client";

import { useState, useMemo, useEffect } from "react";
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
import { ChevronUp } from "lucide-react";
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
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-[200px]">
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

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-24 right-6 z-40 w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          aria-label="Back to top"
        >
          <ChevronUp size={16} />
        </button>
      )}
    </>
  );
}
