"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Aperture, Droplet, Focus, Waves } from "lucide-react";
import { FILTER_FEATURE_KEYS, FOCAL_CATEGORIES, LENS_TYPES } from "@/lib/lens";
import type { FilterState, LensType } from "@/lib/lens";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import FeatureToggleGroup from "./lens-filters/FeatureToggleGroup";
import FilterRow from "./lens-filters/FilterRow";
import MultiSelectChipGroup from "./lens-filters/MultiSelectChipGroup";
import TypeSegmentedControl from "./lens-filters/TypeSegmentedControl";

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
    value: FilterState[K],
  ) {
    onFiltersChange({ ...filters, [key]: value });
  }

  function toggleValue<T extends string>(values: T[], value: T) {
    return values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value];
  }

  function setTypeFilter(value: LensType | null) {
    updateFilters("typeFilter", value);
  }

  function toggleMultiFilter<T extends string>(
    currentValues: T[],
    value: T,
    allValues: readonly T[],
  ) {
    const nextValues = toggleValue(currentValues, value);

    if (nextValues.length === 0 || nextValues.length === allValues.length) {
      return [];
    }

    return nextValues;
  }

  const typeOptions = [
    { value: null, label: t("allTypes") },
    ...LENS_TYPES.map((type) => ({
      value: type,
      label: t(type === "prime" ? "primes" : "zooms"),
    })),
  ] as { value: LensType | null; label: string }[];

  const allOptionLabel = t("allTypes");

  const brandOptions = brands.map((brand) => ({
    key: brand,
    label: tBrand(brand),
    selected: filters.brands.includes(brand),
    onClick: () =>
      updateFilters("brands", toggleMultiFilter(filters.brands, brand, brands)),
  }));

  const focalOptions = FOCAL_CATEGORIES.map((category) => ({
    key: category.key,
    label: t(`category-${category.key}`),
    hint: t(`category-${category.key}Hint`),
    selected: filters.focalCategories.includes(category.key),
    onClick: () =>
      updateFilters(
        "focalCategories",
        toggleMultiFilter(
          filters.focalCategories,
          category.key,
          FOCAL_CATEGORIES.map((item) => item.key),
        ),
      ),
  }));

  const featureOptions = FILTER_FEATURE_KEYS.map((key) => ({
    key,
    label: featureMeta[key].label,
    icon: featureMeta[key].icon,
    selected: filters.features.includes(key),
    onClick: () => updateFilters("features", toggleValue(filters.features, key)),
  }));

  return (
    <div>
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <FilterRow label={t("brand")}>
          <MultiSelectChipGroup
            allLabel={allOptionLabel}
            allSelected={filters.brands.length === 0}
            onSelectAll={() => updateFilters("brands", [])}
            options={brandOptions}
          />
        </FilterRow>

        <FilterRow label={t("focalRange")}>
          <MultiSelectChipGroup
            allLabel={allOptionLabel}
            allSelected={filters.focalCategories.length === 0}
            onSelectAll={() => updateFilters("focalCategories", [])}
            options={focalOptions}
          />
        </FilterRow>

        <FilterRow label={t("lensType")}>
          <TypeSegmentedControl
            ariaLabel={t("lensType")}
            options={typeOptions}
            value={filters.typeFilter}
            onChange={setTypeFilter}
          />
        </FilterRow>
      </div>

      {advancedOpen ? (
        <div className="py-3">
          <FilterRow label={t("features")}>
            <FeatureToggleGroup options={featureOptions} />
          </FilterRow>
        </div>
      ) : null}

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          className="group inline-flex h-8 items-center gap-1 text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          onClick={() => setAdvancedOpen((value) => !value)}
          aria-expanded={advancedOpen}
        >
          <span>{advancedOpen ? t("fewerFilters") : t("moreFilters")}</span>
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-200",
              advancedOpen && "rotate-180",
            )}
          />
        </button>
        <div className="h-px flex-1 bg-zinc-200/80 dark:bg-zinc-800/80" />
      </div>
    </div>
  );
}
