"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Lens } from "@/lib/types";
import * as fmt from "@/lib/lens.format";

interface Props {
  lens: Lens;
  isSelected: boolean;
  selectionDisabled: boolean;
  onToggle: () => void;
}

export default function LensCard({
  lens,
  isSelected,
  selectionDisabled,
  onToggle,
}: Props) {
  const t = useTranslations("LensList");
  const focalDisplay = fmt.focalDisplay(lens);
  const equivDisplay = fmt.equivDisplay(lens);

  return (
    <div
      className={`h-full rounded-xl border bg-white dark:bg-zinc-900 flex flex-col transition-all ${
        isSelected
          ? "border-blue-500 ring-1 ring-blue-500"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      {/* Clickable detail area */}
      <Link
        href={`/lenses/${lens.id}`}
        className="flex-1 p-4 flex flex-col gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors rounded-t-xl"
      >
        {/* Header */}
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            {lens.brand}
            {lens.series ? ` · ${lens.series}` : ""}
          </p>
          <h3
            className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 leading-snug truncate"
            title={`${lens.model}${lens.generation !== undefined ? ` gen${lens.generation}` : ""}`}
          >
            {lens.model}
            {lens.generation !== undefined && (
              <span className="font-normal text-zinc-400 dark:text-zinc-500">
                {" "}
                gen{lens.generation}
              </span>
            )}
          </h3>
          <div className="flex gap-1 flex-wrap min-h-[20px]">
            {lens.af && <Badge>AF</Badge>}
            {lens.ois && <Badge>OIS</Badge>}
            {lens.wr && <Badge>WR</Badge>}
            {lens.apertureRing && <Badge>AR</Badge>}
          </div>
        </div>

        {/* Specs */}
        <dl className="text-xs text-zinc-600 dark:text-zinc-400 grid grid-cols-2 gap-y-1">
          <div>{equivDisplay} {t("equivSuffix")}</div>
          <div className="text-right">f/{lens.maxAperture}</div>
          <div>{lens.weightG}g</div>
          <div className="text-right">{lens.releaseYear}</div>
        </dl>
      </Link>

      {/* Compare toggle */}
      <div className="mt-auto px-4 pb-4">
        <button
          onClick={onToggle}
          disabled={selectionDisabled}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg w-full transition-colors ${
            isSelected
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : selectionDisabled
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          }`}
        >
          {isSelected ? t("removeFromCompare") : t("addToCompare")}
        </button>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
      {children}
    </span>
  );
}
