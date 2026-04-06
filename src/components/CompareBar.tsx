"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { allLenses } from "@/lib/lens";
import { useCompare } from "@/context/CompareProvider";

export default function CompareBar() {
  const t = useTranslations("LensList");
  const tBrand = useTranslations("Brands");
  const tCompare = useTranslations("Compare");
  const router = useRouter();
  const { compareIds, toggleCompare, clearCompare } = useCompare();

  const selectedLenses = useMemo(
    () =>
      compareIds
        .map((id) => allLenses.find((l) => l.id === id))
        .filter((lens) => lens !== undefined),
    [compareIds]
  );

  if (selectedLenses.length === 0) {
    return null;
  }

  function handleCompare() {
    const ids = selectedLenses.map((l) => l.id).join(",");
    router.push(`/lenses/compare?ids=${ids}`);
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-black/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 sm:pb-0">
          {selectedLenses.map((lens) => {
            const brandName = tBrand(lens.brand);
            const displayName = `${brandName} ${lens.model}`;

            return (
              <div
                key={lens.id}
                className="flex items-start gap-1.5 shrink-0 rounded-lg bg-zinc-100 px-2.5 py-1.5 dark:bg-zinc-800"
              >
                <span className="flex max-w-[132px] min-w-0 flex-col leading-tight sm:max-w-[168px]">
                  <span className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                    {brandName}
                  </span>
                  <span className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">
                    {lens.model}
                  </span>
                </span>
                <button
                  onClick={() => toggleCompare(lens.id)}
                  className="mt-0.5 text-base leading-none text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  aria-label={tCompare("removeLens", { model: displayName })}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between gap-3 sm:shrink-0 sm:justify-end">
          <button
            onClick={clearCompare}
            className="shrink-0 text-sm font-medium px-3 py-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            {t("clearCompare")}
          </button>
          <button
            onClick={handleCompare}
            disabled={selectedLenses.length < 2}
            className="shrink-0 text-sm font-medium px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t("goCompare", { count: selectedLenses.length })}
          </button>
        </div>
      </div>
    </div>
  );
}
