"use client";

import { useTranslations } from "next-intl";
import type { FilterState, LensType, SortKey } from "@/lib/lenses";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

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

  function updateFilters<K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) {
    onFiltersChange({ ...filters, [key]: value });
  }

  const labelClass = "text-xs font-medium text-zinc-500 dark:text-zinc-400";

  return (
    <div className="flex flex-wrap gap-4 items-end">
      {/* Brand multi-select chips */}
      <div className="flex flex-col gap-1">
        <span className={labelClass}>{t("brand")}</span>
        <div className="flex flex-wrap gap-1.5 py-0.5">
          {brands.map((b) => {
            const selected = filters.brands.includes(b);
            return (
              <Button
                key={b}
                size="sm"
                variant={selected ? "default" : "outline"}
                onClick={() =>
                  updateFilters(
                    "brands",
                    selected
                      ? filters.brands.filter((x) => x !== b)
                      : [...filters.brands, b]
                  )
                }
              >
                {b}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Lens type */}
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-type" className={labelClass}>
          {t("lensType")}
        </label>
        <Select
          value={filters.type}
          onValueChange={(v) => updateFilters("type", (v ?? "") as LensType | "")}
          items={[
            { value: "", label: t("allTypes") },
            { value: "prime", label: t("primes") },
            { value: "zoom", label: t("zooms") },
          ]}
        >
          <SelectTrigger id="filter-type">
            <SelectValue placeholder={t("allTypes")} />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="">{t("allTypes")}</SelectItem>
            <SelectItem value="prime">{t("primes")}</SelectItem>
            <SelectItem value="zoom">{t("zooms")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort */}
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-sort" className={labelClass}>
          {t("sortBy")}
        </label>
        <Select
          value={filters.sort}
          onValueChange={(v) => updateFilters("sort", (v ?? "focalLengthMin") as SortKey)}
          items={[
            { value: "focalLengthMin", label: t("sortFocalLength") },
            { value: "maxAperture", label: t("sortAperture") },
            { value: "weightG", label: t("sortWeight") },
            { value: "releaseYear", label: t("sortYear") },
          ]}
        >
          <SelectTrigger id="filter-sort">
            <SelectValue placeholder={t("sortFocalLength")} />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="focalLengthMin">
              {t("sortFocalLength")}
            </SelectItem>
            <SelectItem value="maxAperture">{t("sortAperture")}</SelectItem>
            <SelectItem value="weightG">{t("sortWeight")}</SelectItem>
            <SelectItem value="releaseYear">{t("sortYear")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-col gap-1">
        <span className={labelClass}>&nbsp;</span>
        <div className="flex gap-4 py-1.5">
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
            <Checkbox
              checked={filters.afOnly}
              onCheckedChange={(v) => updateFilters("afOnly", v as boolean)}
            />
            {t("afOnly")}
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
            <Checkbox
              checked={filters.wrOnly}
              onCheckedChange={(v) => updateFilters("wrOnly", v as boolean)}
            />
            {t("wrOnly")}
          </label>
        </div>
      </div>
    </div>
  );
}
