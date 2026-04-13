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

// Each slot is a lens ID or null. Position is stable — removing slot i sets it
// to null without shifting other slots, so filled slots stay in their column.
type Slots = (string | null)[];

export default function CompareBuilder() {
  const t = useTranslations("Compare");
  const tList = useTranslations("LensList");
  const tBrand = useTranslations("Brands");
  const router = useRouter();

  const [slots, setSlots] = useState<Slots>(() =>
    Array<string | null>(MAX_COMPARE).fill(null)
  );

  const filledIds = slots.filter((id): id is string => id !== null);
  const filledCount = filledIds.length;
  const allFilled = !slots.includes(null);

  function fillSlot(slotIndex: number, lens: Lens) {
    setSlots((prev) => prev.map((s, i) => (i === slotIndex ? lens.id : s)));
  }

  function clearSlot(slotIndex: number) {
    setSlots((prev) => prev.map((s, i) => (i === slotIndex ? null : s)));
  }

  const getResultState = useCallback(
    (candidate: Lens) => {
      const taken = slots.includes(candidate.id);
      const full = !slots.includes(null);
      return {
        actionLabel: taken
          ? t("alreadyAdded")
          : full
            ? t("compareFull")
            : t("addToCompareAction"),
        disabled: taken || full,
      };
    },
    [slots, t]
  );

  function handleCompare() {
    router.push(`/lenses/compare?ids=${filledIds.join(",")}`);
  }

  return (
    <div className="h-full flex flex-col gap-4 px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col gap-1 shrink-0">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("builderHint")}
        </p>
      </div>

      {/* Slots — flex-1 so they fill remaining viewport height */}
      <div className="flex-1 min-h-0 grid grid-cols-1 min-[500px]:grid-cols-3 gap-4">
        {slots.map((slotId, i) => {
          const lens = slotId
            ? allLenses.find((l) => l.id === slotId)
            : undefined;

          if (lens) {
            return (
              <div
                key={i}
                className="relative flex h-full w-full flex-col items-center justify-center gap-2 rounded-[28px] border border-zinc-200 bg-zinc-50/60 px-6 py-8 text-center dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                <button
                  onClick={() => clearSlot(i)}
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
              key={i}
              onSelectLens={(lens) => fillSlot(i, lens)}
              getResultState={getResultState}
              triggerVariant="card"
              triggerLabel={t("addLens")}
              triggerClassName="h-full"
            />
          );
        })}
      </div>

      {/* Compare CTA */}
      <div className="flex justify-center shrink-0">
        <button
          disabled={filledCount < 2}
          onClick={handleCompare}
          className={cn(ACTION_PRIMARY_CLS, "rounded-xl px-8 py-3 text-sm font-medium")}
        >
          {tList("goCompare", { count: filledCount })}
        </button>
      </div>
    </div>
  );
}
