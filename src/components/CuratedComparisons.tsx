"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useCompare } from "@/context/CompareProvider";
import { trendingPresets, type TrendingPreset } from "@/lib/trending";
import { allLenses } from "@/lib/lens";

export function PresetCard({ preset, onSelect }: { preset: TrendingPreset; onSelect?: () => void }) {
  const router = useRouter();
  const locale = useLocale();
  const lang = locale === "zh" ? "zh" : "en";

  const lenses = preset.lensIds
    .map((id) => allLenses.find((l) => l.id === id))
    .filter(Boolean);

  function handleClick() {
    const idsParam = preset.lensIds.join(",");
    router.replace(`/lenses/compare?ids=${idsParam}&preset=${preset.slug}`);
    onSelect?.();
  }

  return (
    <button
      onClick={handleClick}
      className="group text-left w-full h-full flex flex-col rounded-xl border border-zinc-200 bg-white px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-500 dark:hover:bg-zinc-900"
    >
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
        {preset.title[lang]}
      </p>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 leading-snug">
        {preset.subtitle[lang]}
      </p>

      {/* Lens model badge strip */}
      <div className="mt-2.5 flex flex-wrap gap-1">
        {lenses.map((lens) => (
          lens && (
            <span
              key={lens.id}
              className="inline-block rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            >
              {lens.model}
            </span>
          )
        ))}
      </div>

      {/* CTA — fades in on hover */}
      <p className="mt-auto pt-3 text-xs font-medium text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 dark:text-zinc-500">
        Compare Now →
      </p>
    </button>
  );
}

export default function CuratedComparisons() {
  const { compareIds } = useCompare();
  const t = useTranslations("Compare");

  if (compareIds.length > 0) return null;

  return (
    <div className="mb-2">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">
        {t("curatedTitle")}
      </p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
        {t("curatedHint")}
      </p>
      {/* Mobile: horizontal snap carousel showing ~1.5 cards to signal swipeability */}
      <div className="sm:hidden -mx-4 overflow-x-auto snap-x snap-mandatory scroll-pl-4">
        <div className="flex items-stretch gap-2 px-4 pb-0.5">
          {trendingPresets.map((preset) => (
            <div key={preset.slug} className="shrink-0 snap-start w-[calc((100vw-2.5rem)/1.5)]">
              <PresetCard preset={preset} />
            </div>
          ))}
          {/* Trailing spacer so the last card can reach its snap point */}
          <div className="shrink-0 w-2" aria-hidden="true" />
        </div>
      </div>

      {/* Desktop: grid */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {trendingPresets.map((preset) => (
          <PresetCard key={preset.slug} preset={preset} />
        ))}
      </div>
    </div>
  );
}
