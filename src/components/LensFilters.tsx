"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Aperture, Droplet, Focus, SlidersHorizontal, Waves } from "lucide-react";
import { FILTER_FEATURE_KEYS, FOCAL_CATEGORIES, LENS_TYPES } from "@/lib/lens";
import type { FilterState, LensType, SpecialtyTag } from "@/lib/lens";
import { cn } from "@/lib/utils";
import FeatureToggleGroup from "./lens-filters/FeatureToggleGroup";
import FilterRow from "./lens-filters/FilterRow";
import MultiSelectChipGroup from "./lens-filters/MultiSelectChipGroup";
import TypeSegmentedControl from "./lens-filters/TypeSegmentedControl";

interface Props {
  filters: FilterState;
  brands: string[];
  availableSpecialtyTags: SpecialtyTag[];
  onFiltersChange: (filters: FilterState) => void;
}

export default function LensFilters({
  filters,
  brands,
  availableSpecialtyTags,
  onFiltersChange,
}: Props) {
  const t = useTranslations("LensList");
  const tBrand = useTranslations("Brands");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const featureMeta = {
    af: { label: t("featureAutofocus"), icon: Focus },
    ois: { label: t("featureOis"), icon: Waves },
    wr: { label: t("featureWr"), icon: Droplet },
    apertureRing: { label: t("featureApertureRing"), icon: Aperture },
  } as const;

  function updateFilters<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    onFiltersChange({ ...filters, [key]: value });
  }

  function toggleValue<T extends string>(values: T[], value: T) {
    return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
  }

  function toggleMultiFilter<T extends string>(
    currentValues: T[],
    value: T,
    allValues: readonly T[],
  ) {
    const next = toggleValue(currentValues, value);
    return next.length === 0 || next.length === allValues.length ? [] : next;
  }

  const tagLabels: Record<SpecialtyTag, string> = {
    cine: t("tagCine"),
    anamorphic: t("tagAnamorphic"),
    tilt: t("tagTilt"),
    shift: t("tagShift"),
    macro: t("tagMacro"),
    ultra_macro: t("tagUltraMacro"),
    fisheye: t("tagFisheye"),
    probe: t("tagProbe"),
  };

  const typeOptions = [
    { value: null, label: t("allTypes") },
    ...LENS_TYPES.map((type) => ({
      value: type,
      label: t(type === "prime" ? "primes" : "zooms"),
    })),
  ] as { value: LensType | null; label: string }[];

  const specialtyOptions = [
    { value: null as SpecialtyTag | null, label: t("allSpecialty") },
    ...availableSpecialtyTags.map((tag) => ({
      value: tag as SpecialtyTag | null,
      label: tagLabels[tag],
    })),
  ];

  const hasHiddenActiveFilters =
    filters.typeFilter !== null ||
    filters.specialtyTag !== null ||
    filters.features.length > 0;

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

  const filtersButton = (
    <button
      type="button"
      className={cn(
        "relative flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium transition-colors sm:hidden",
        mobileFiltersOpen
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700",
      )}
      onClick={() => setMobileFiltersOpen((v) => !v)}
      aria-expanded={mobileFiltersOpen}
      aria-label={t("moreFilters")}
    >
      <SlidersHorizontal className="size-3.5" />
      <span>{t("filtersButton")}</span>
      {hasHiddenActiveFilters && !mobileFiltersOpen && (
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-blue-500" />
      )}
    </button>
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Primary filters: always visible on all viewports */}
      <div className="flex flex-col gap-3">
        <FilterRow label={t("brand")} trailing={filtersButton}>
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
      </div>

      {/* Secondary filters: collapsed on mobile by default, always open on desktop */}
      <div
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows] duration-500 ease-in-out",
          mobileFiltersOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr] sm:grid-rows-[1fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-3 pt-3 pb-1">
            <FilterRow label={t("lensType")}>
              <TypeSegmentedControl
                ariaLabel={t("lensType")}
                options={typeOptions}
                value={filters.typeFilter}
                onChange={(v) => updateFilters("typeFilter", v)}
              />
            </FilterRow>

            {availableSpecialtyTags.length > 0 && (
              <FilterRow label={t("specialtyFilter")}>
                <TypeSegmentedControl
                  ariaLabel={t("specialtyFilter")}
                  options={specialtyOptions}
                  value={filters.specialtyTag}
                  onChange={(v) => updateFilters("specialtyTag", v)}
                  wrap
                />
              </FilterRow>
            )}

            <FilterRow label={t("features")}>
              <FeatureToggleGroup options={featureOptions} />
            </FilterRow>
          </div>
        </div>
      </div>
    </div>
  );
}
