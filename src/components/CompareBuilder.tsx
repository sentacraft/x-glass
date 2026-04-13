"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { allLenses, MAX_COMPARE } from "@/lib/lens";
import { cn } from "@/lib/utils";
import { ACTION_PRIMARY_CLS, ICON_CLOSE_BTN_CLS } from "@/lib/ui-tokens";
import { X } from "lucide-react";
import LensSearchDialog from "@/components/LensSearchDialog";
import type { Lens } from "@/lib/types";

export default function CompareBuilder() {
  const t = useTranslations("Compare");
  const tList = useTranslations("LensList");
  const tBrand = useTranslations("Brands");
  const router = useRouter();
  const [draftIds, setDraftIds] = useState<string[]>([]);

  const draftLenses = draftIds
    .map((id) => allLenses.find((l) => l.id === id))
    .filter((l): l is Lens => l !== undefined);

  const addLens = useCallback((lens: Lens) => {
    setDraftIds((prev) => {
      if (prev.includes(lens.id) || prev.length >= MAX_COMPARE) return prev;
      return [...prev, lens.id];
    });
  }, []);

  const removeLens = useCallback((id: string) => {
    setDraftIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const getResultState = useCallback(
    (candidate: Lens) => ({
      actionLabel: draftIds.includes(candidate.id)
        ? t("alreadyAdded")
        : draftIds.length >= MAX_COMPARE
          ? t("compareFull")
          : t("addToCompareAction"),
      disabled:
        draftIds.includes(candidate.id) || draftIds.length >= MAX_COMPARE,
    }),
    [draftIds, t]
  );

  function handleCompare() {
    router.push(`/lenses/compare?ids=${draftIds.join(",")}`);
  }

  // Always show at least 3 slots; when slots are filling up, grow by 1 to
  // show the next available empty slot, capped at MAX_COMPARE.
  const totalSlots =
    draftIds.length >= MAX_COMPARE
      ? MAX_COMPARE
      : Math.max(3, draftIds.length + 1);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("builderHint")}
        </p>
      </div>

      <div className="grid grid-cols-1 min-[500px]:grid-cols-3 gap-4">
        {Array.from({ length: totalSlots }).map((_, i) => {
          const lens = draftLenses[i];

          if (lens) {
            return (
              <div
                key={lens.id}
                className="relative flex min-h-[220px] w-full flex-col items-center justify-center gap-2 rounded-[28px] border border-zinc-200 bg-zinc-50/60 px-6 py-8 text-center dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                <button
                  onClick={() => removeLens(lens.id)}
                  className={cn(ICON_CLOSE_BTN_CLS, "absolute right-3 top-3 h-8 w-8")}
                  aria-label={t("removeLens", {
                    model: `${tBrand(lens.brand)} ${lens.model}`,
                  })}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400 dark:text-zinc-500">
                  {tBrand(lens.brand)}
                </p>
                <p className="text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                  {lens.model}
                </p>
              </div>
            );
          }

          return (
            <LensSearchDialog
              key={`empty-${i}`}
              onSelectLens={addLens}
              getResultState={getResultState}
              triggerVariant="card"
              triggerLabel={t("addLens")}
            />
          );
        })}
      </div>

      <div className="flex justify-center">
        <button
          disabled={draftLenses.length < 2}
          onClick={handleCompare}
          className={cn(ACTION_PRIMARY_CLS, "rounded-xl px-8 py-3 text-sm font-medium")}
        >
          {tList("goCompare", { count: draftLenses.length })}
        </button>
      </div>
    </div>
  );
}
