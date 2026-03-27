"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { LENS_FEATURES } from "@/lib/lenses";
import type { FilterState, LensType, SortKey } from "@/lib/lenses";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  const [advancedOpen, setAdvancedOpen] = useState(false);

  function updateFilters<K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) {
    onFiltersChange({ ...filters, [key]: value });
  }

  const labelClass = "text-xs font-medium text-zinc-500 dark:text-zinc-400";

  return (
    <div className="flex flex-col gap-3">
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
            onValueChange={(v) =>
              updateFilters("type", (v ?? "") as LensType | "")
            }
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
              <SelectTrigger id="filter-sort">
                <SelectValue placeholder={t("sortFocalLength")} />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="focalLength">
                  {t("sortFocalLength")}
                </SelectItem>
                <SelectItem value="maxAperture">{t("sortAperture")}</SelectItem>
                <SelectItem value="weightG">{t("sortWeight")}</SelectItem>
                <SelectItem value="releaseYear">{t("sortYear")}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="icon"
              variant="outline"
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

        {/* Advanced filters toggle */}
        <div className="flex flex-col gap-1">
          <span className={labelClass}>&nbsp;</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setAdvancedOpen((v) => !v)}
          >
            {advancedOpen ? t("fewerFilters") : t("moreFilters")}
            {advancedOpen ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>
      </div>

      {/* Advanced filters panel */}
      {advancedOpen && (
        <div className="flex flex-wrap gap-4 items-end pt-3 border-t border-zinc-200 dark:border-zinc-800">
          {/* Feature toggles */}
          <div className="flex flex-col gap-1">
            <span className={labelClass}>{t("features")}</span>
            <div className="flex gap-1.5 py-0.5">
              {LENS_FEATURES.map((key) => {
                const active = filters.features.includes(key);
                return (
                  <Button
                    key={key}
                    size="sm"
                    variant={active ? "default" : "outline"}
                    onClick={() =>
                      updateFilters(
                        "features",
                        active
                          ? filters.features.filter((f) => f !== key)
                          : [...filters.features, key]
                      )
                    }
                  >
                    {t(key)}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
