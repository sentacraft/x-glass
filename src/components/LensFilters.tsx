"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Aperture, Droplet, Focus, Waves } from "lucide-react";
import { FILTER_FEATURE_KEYS, FOCAL_CATEGORIES } from "@/lib/lens";
import type { FilterState, LensType, SortKey, FocalCategory } from "@/lib/lens";
import { Button } from "@/components/ui/button";
import {
  ArrowUpNarrowWide,
  ArrowDownNarrowWide,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";

interface Props {
  filters: FilterState;
  brands: string[];
  onFiltersChange: (filters: FilterState) => void;
}

export default function LensFilters({
  filters,
  brands,
  onFiltersChange,
}: Props) {
  const t = useTranslations("LensList");
  const tBrand = useTranslations("Brands");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const featureMeta = {
    af: {
      label: t("featureAutofocus"),
      icon: Focus,
    },
    ois: {
      label: t("featureOis"),
      icon: Waves,
    },
    wr: {
      label: t("featureWr"),
      icon: Droplet,
    },
    apertureRing: {
      label: t("featureApertureRing"),
      icon: Aperture,
    },
  } as const;

  function updateFilters<K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) {
    onFiltersChange({ ...filters, [key]: value });
  }

  const inlineLabelClass =
    "pt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400";
  const rowClass = "flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4";
  const rowLabelClass = `${inlineLabelClass} sm:w-20 sm:shrink-0`;
  const chipClass = "rounded-full";
  const filterChipClass = `${chipClass} bg-white/80 dark:bg-zinc-950/40`;
  const activeChipClass = `${chipClass}`;

  const hasActiveFilters =
    filters.brands.length > 0 ||
    filters.type !== "" ||
    filters.focalCategories.length > 0 ||
    filters.features.length > 0;

  function clearAllFilters() {
    onFiltersChange({
      ...filters,
      brands: [],
      type: "",
      focalCategories: [],
      features: [],
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 shadow-sm shadow-zinc-950/[0.02] backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className={rowClass}>
            <span className={rowLabelClass}>{t("brand")}</span>
            <div className="flex flex-wrap gap-1.5">
              {brands.map((b) => {
                const selected = filters.brands.includes(b);
                return (
                  <Button
                    key={b}
                    size="sm"
                    variant={selected ? "default" : "outline"}
                    className={selected ? activeChipClass : filterChipClass}
                    onClick={() =>
                      updateFilters(
                        "brands",
                        selected
                          ? filters.brands.filter((x) => x !== b)
                          : [...filters.brands, b]
                      )
                    }
                  >
                    {tBrand(b)}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className={rowClass}>
            <span className={rowLabelClass}>{t("lensType")}</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { value: "", label: t("allTypes") },
                { value: "prime", label: t("primes") },
                { value: "zoom", label: t("zooms") },
              ].map((option) => {
                const selected = filters.type === option.value;
                return (
                  <Button
                    key={option.value || "all"}
                    size="sm"
                    variant={selected ? "default" : "outline"}
                    className={selected ? activeChipClass : filterChipClass}
                    onClick={() => updateFilters("type", option.value as LensType | "")}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className={rowClass}>
            <span className={rowLabelClass}>{t("focalRange")}</span>
            <div className="-mx-1 overflow-x-auto px-1 pb-1">
              <div className="flex min-w-max flex-nowrap gap-1.5">
                {FOCAL_CATEGORIES.map((cat) => {
                  const selected = filters.focalCategories.includes(
                    cat.key as FocalCategory
                  );
                  return (
                    <Button
                      key={cat.key}
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      className={`${selected ? activeChipClass : filterChipClass} h-auto min-h-7 shrink-0 px-3 py-1.5`}
                      onClick={() =>
                        updateFilters(
                          "focalCategories",
                          selected
                            ? filters.focalCategories.filter((x) => x !== cat.key)
                            : [...filters.focalCategories, cat.key]
                        )
                      }
                    >
                      <span>{t(`category-${cat.key}`)}</span>
                      <span className="text-[10px] font-normal opacity-70">
                        {t(`category-${cat.key}Hint`)}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 xl:w-auto xl:min-w-fit xl:items-end">
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 rounded-full text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                onClick={clearAllFilters}
              >
                {t("clearFilters")}
              </Button>
            )}
            <div className="flex items-center gap-2">
              <label htmlFor="filter-sort" className={inlineLabelClass}>
                {t("sortBy")}
              </label>
              <div className="flex gap-1.5">
                <Select
                  value={filters.sort}
                  onValueChange={(v) =>
                    updateFilters("sort", (v ?? "focalLength") as SortKey)
                  }
                  items={[
                    { value: "focalLength", label: t("sortFocalLength") },
                    { value: "maxAperture", label: t("sortAperture") },
                    { value: "weightG", label: t("sortWeight") },
                    { value: "releaseYear", label: t("sortYear") },
                  ]}
                >
                  <SelectTrigger id="filter-sort" className="min-w-40 rounded-full bg-white/80 dark:bg-zinc-950/40">
                    <SelectValue placeholder={t("sortFocalLength")} />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="focalLength">
                      {t("sortFocalLength")}
                    </SelectItem>
                    <SelectItem value="maxAperture">
                      {t("sortAperture")}
                    </SelectItem>
                    <SelectItem value="weightG">{t("sortWeight")}</SelectItem>
                    <SelectItem value="releaseYear">{t("sortYear")}</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="icon-sm"
                  variant="outline"
                  className="rounded-full bg-white/80 dark:bg-zinc-950/40"
                  onClick={() =>
                    updateFilters(
                      "sortDir",
                      filters.sortDir === "asc" ? "desc" : "asc"
                    )
                  }
                  aria-label={
                    filters.sortDir === "asc" ? t("sortAsc") : t("sortDesc")
                  }
                >
                  {filters.sortDir === "asc" ? (
                    <ArrowUpNarrowWide />
                  ) : (
                    <ArrowDownNarrowWide />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced filters panel */}
      <div className="relative mt-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-full border-zinc-200 bg-white px-3 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            onClick={() => setAdvancedOpen((v) => !v)}
            aria-expanded={advancedOpen}
          >
            <span>{advancedOpen ? t("fewerFilters") : t("moreFilters")}</span>
            {advancedOpen ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </Button>
        </div>
      </div>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          advancedOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pt-4">
            {/* Feature toggles */}
            <div className={rowClass}>
              <span className={rowLabelClass}>{t("features")}</span>
              <div className="flex flex-wrap gap-1.5">
                {FILTER_FEATURE_KEYS.map((key) => {
                  const active = filters.features.includes(key);
                  const Icon = featureMeta[key].icon;
                  return (
                    <Button
                      key={key}
                      size="sm"
                      variant={active ? "default" : "outline"}
                      className={active ? activeChipClass : filterChipClass}
                      onClick={() =>
                        updateFilters(
                          "features",
                          active
                            ? filters.features.filter((f) => f !== key)
                            : [...filters.features, key]
                        )
                      }
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {featureMeta[key].label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
