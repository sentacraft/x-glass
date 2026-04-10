"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Aperture, Droplet, Focus, Waves } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { LensPlaceholderIcon } from "@/components/ui/lens-placeholder-icon";
import type { Lens } from "@/lib/types";
import { lensImageStyle } from "@/lib/lens-image";
import { useUiHookAttr } from "@/context/TestHookProvider";
import * as fmt from "@/lib/lens.format";
import { Button } from "@/components/ui/button";

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
  const tBrand = useTranslations("Brands");
  const hookAttr = useUiHookAttr();
  const equivDisplay = fmt.focalRangeDisplay(fmt.focalEquiv(lens.focalLengthMin), fmt.focalEquiv(lens.focalLengthMax));
  const badges = [
    lens.af
      ? {
          label: "AF",
          description: t("featureAutofocusDesc"),
          icon: Focus,
        }
      : null,
    lens.ois
      ? {
          label: "OIS",
          description: t("featureOisDesc"),
          icon: Waves,
        }
      : null,
    lens.wr
      ? {
          label: "WR",
          description: t("featureWrDesc"),
          icon: Droplet,
        }
      : null,
    lens.apertureRing
      ? {
          label: t("badgeRing"),
          description: t("featureApertureRingDesc"),
          icon: Aperture,
        }
      : null,
  ].filter((badge) => badge !== null);

  return (
    <div
      {...hookAttr("card")}
      className={`rounded-2xl border bg-white dark:bg-zinc-900 flex flex-col overflow-hidden transition-all ${
        isSelected
          ? "border-blue-500 ring-1 ring-blue-500 shadow-lg shadow-blue-500/10"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      {/* Clickable detail area */}
      <Link
        href={`/lenses/${lens.id}`}
        className="flex-1 flex flex-col hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <div
          {...hookAttr("cardMedia")}
          className="relative aspect-[5/4] overflow-hidden border-b border-zinc-100/80 bg-zinc-50/40 dark:border-zinc-800 dark:bg-zinc-900/40"
        >
          <div
            {...hookAttr("cardMediaInner")}
            className="absolute inset-0 p-4 sm:p-7"
          >
            <div className="relative h-full w-full overflow-hidden rounded-xl">
              {lens.imageUrl ? (
                <Image
                  src={lens.imageUrl}
                  alt={lens.model}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  style={lensImageStyle}
                  className="object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center overflow-hidden rounded-xl bg-white/80 dark:bg-zinc-950/70">
                  <LensPlaceholderIcon className="h-16 w-16 text-zinc-300 dark:text-zinc-600" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          {...hookAttr("cardBody")}
          className="flex flex-1 flex-col gap-2 p-3 sm:gap-2.5 sm:p-4"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
              <p className="truncate">
                {tBrand(lens.brand)}
                {lens.series ? ` · ${lens.series}` : ""}
              </p>
              <span className="shrink-0">{lens.releaseYear}</span>
            </div>
            <h3
              className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 leading-snug line-clamp-2 min-h-[2.5rem]"
              title={lens.model}
            >
              {lens.model}
            </h3>
          </div>

          <div className="flex gap-1 flex-wrap min-h-[20px]">
            {badges.map((badge) => (
              <Badge
                key={badge.label}
                label={badge.label}
                description={badge.description}
                icon={<badge.icon className="h-3 w-3" />}
              />
            ))}
          </div>

          <dl className="mt-auto flex items-baseline justify-between gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="min-w-0 truncate">
              {equivDisplay} {t("equivSuffix")}
            </div>
            <div className="shrink-0">{lens.weightG}g</div>
          </dl>
        </div>
      </Link>

      {/* Compare toggle */}
      <div
        {...hookAttr("cardFooter")}
        className="mt-auto px-3 pb-3 sm:px-4 sm:pb-4"
      >
        <Button
          size="sm"
          onClick={onToggle}
          disabled={selectionDisabled}
          className={`w-full h-8 sm:h-9 text-xs font-medium ${
            isSelected
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : selectionDisabled
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          }`}
        >
          {isSelected ? t("removeFromCompare") : t("addToCompare")}
        </Button>
      </div>
    </div>
  );
}

function Badge({
  label,
  description,
  icon,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <span
      title={description}
      aria-label={description}
      className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
    >
      {icon}
      {label}
    </span>
  );
}
