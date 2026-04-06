"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Aperture, Droplet, Focus, Waves, X } from "lucide-react";
import { FILTER_FEATURE_KEYS, FOCAL_CATEGORIES, LENS_TYPES } from "@/lib/lens";
import type { FilterState, LensType, SortKey } from "@/lib/lens";
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

  function toggleValue<T extends string>(values: T[], value: T) {
    return values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value];
  }

  function toggleType(value: LensType) {
    const nextTypes = filters.types.includes(value)
      ? filters.types.filter((item) => item !== value)
      : [...filters.types, value];

    updateFilters(
      "types",
      nextTypes.length === LENS_TYPES.length ? [] : nextTypes
    );
  }

  const inlineLabelClass =
    "text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400";
  const rowClass = "flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3";
  const rowLabelClass = `${inlineLabelClass} sm:flex sm:h-8 sm:w-20 sm:shrink-0 sm:items-center`;
  const chipClass = "rounded-full";
  const filterChipClass = `${chipClass} h-8 border-zinc-200 bg-white/80 px-3 text-[13px] text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-zinc-900`;
  const activeChipClass = `${chipClass} h-8 bg-zinc-900 px-3 text-[13px] text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200`;

  const hasActiveFilters =
    filters.brands.length > 0 ||
    filters.types.length > 0 ||
    filters.focalCategories.length > 0 ||
    filters.features.length > 0;

  const activeFilterItems = [
    ...filters.brands.map((brand) => ({
      key: `brand-${brand}`,
      label: tBrand(brand),
      onRemove: () =>
        updateFilters(
          "brands",
          filters.brands.filter((item) => item !== brand)
        ),
    })),
    ...filters.types.map((type) => ({
      key: `type-${type}`,
      label: t(type === "prime" ? "primes" : "zooms"),
      onRemove: () =>
        updateFilters(
          "types",
          filters.types.filter((item) => item !== type)
        ),
    })),
    ...filters.focalCategories.map((category) => ({
      key: `focal-${category}`,
      label: t(`category-${category}`),
      onRemove: () =>
        updateFilters(
          "focalCategories",
          filters.focalCategories.filter((item) => item !== category)
        ),
    })),
    ...filters.features.map((feature) => ({
      key: `feature-${feature}`,
      label: featureMeta[feature].label,
      onRemove: () =>
        updateFilters(
          "features",
          filters.features.filter((item) => item !== feature)
        ),
    })),
  ];

  function clearAllFilters() {
    onFiltersChange({
      ...filters,
      brands: [],
      types: [],
      focalCategories: [],
      features: [],
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-3 shadow-sm shadow-zinc-950/[0.02] backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/40 sm:p-4">
      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
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
                        toggleValue(filters.brands, b)
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
              {LENS_TYPES.map((type) => {
                const selected = filters.types.includes(type);
                return (
                  <Button
                    key={type}
                    size="sm"
                    variant={selected ? "default" : "outline"}
                    className={selected ? activeChipClass : filterChipClass}
                    onClick={() => toggleType(type)}
                  >
                    {t(type === "prime" ? "primes" : "zooms")}
                  </Button>
                );
              })}
              <div className="flex h-8 items-center px-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                {filters.types.length === 0 ? t("typeAny") : t("typeMultiHint")}
              </div>
            </div>
          </div>

          <div className={rowClass}>
            <span className={rowLabelClass}>{t("focalRange")}</span>
            <div className="-mx-1 overflow-x-auto px-1 pb-0.5">
              <div className="flex min-w-max flex-nowrap gap-1.5">
                {FOCAL_CATEGORIES.map((cat) => {
                  const selected = filters.focalCategories.includes(cat.key);
                  return (
                    <Button
                      key={cat.key}
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      className={`${selected ? activeChipClass : filterChipClass} shrink-0 px-4`}
                      onClick={() =>
                        updateFilters(
                          "focalCategories",
                          toggleValue(filters.focalCategories, cat.key)
                        )
                      }
                    >
                      <span>{t(`category-${cat.key}`)}</span>
                      <span className="text-[9px] font-normal opacity-60">
                        {t(`category-${cat.key}Hint`)}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 xl:w-auto xl:min-w-fit xl:items-end">
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
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
                <SelectTrigger
                  id="filter-sort"
                  size="sm"
                  className="min-w-36 rounded-full bg-white/80 dark:bg-zinc-950/40"
                >
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

      <div className="relative mt-3 border-t border-zinc-200/80 pt-5 dark:border-zinc-800/80">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 rounded-full border-zinc-200 bg-white px-3 text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-500 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
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
          <div className="pt-2.5">
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
                          toggleValue(filters.features, key)
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

      <div className="mt-3 pt-1">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
          <div className="sm:flex sm:min-h-8 sm:w-20 sm:shrink-0 sm:items-center">
            <div className={inlineLabelClass}>{t("activeFilters")}</div>
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {hasActiveFilters ? (
              activeFilterItems.map((item) => (
                <Button
                  key={item.key}
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-full border-zinc-200 bg-white/75 px-3 text-[13px] text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950/30 dark:text-zinc-100 dark:hover:bg-zinc-900"
                  onClick={item.onRemove}
                >
                  {item.label}
                  <X className="size-3.5 text-zinc-500 dark:text-zinc-400" />
                </Button>
              ))
            ) : (
              <div className="flex h-8 items-center text-[13px] text-zinc-400 dark:text-zinc-500">
                {t("noActiveFilters")}
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 self-start rounded-full px-2 text-[11px] text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 disabled:text-zinc-400 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            onClick={clearAllFilters}
            disabled={!hasActiveFilters}
          >
            {t("clearFilters")}
          </Button>
        </div>
      </div>
    </div>
  );
}
