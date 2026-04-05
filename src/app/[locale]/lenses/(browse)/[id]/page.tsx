import { Fragment } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { allLenses, getLensUrl } from "@/lib/lens";
import { lensImageStyle } from "@/lib/lens-image";
import * as fmt from "@/lib/lens.format";
import { ExternalLink } from "@/components/ui/external-link";
import { LensPlaceholderIcon } from "@/components/ui/lens-placeholder-icon";
import { Link } from "@/i18n/navigation";
import AddToCompareButton from "@/components/AddToCompareButton";
import { BoolCell } from "@/components/ui/bool-cell";

type Params = Promise<{ locale: string; id: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const lens = allLenses.find((l) => l.id === id);
  if (!lens) {
    return { title: "Lens Not Found" };
  }
  return {
    title: lens.model,
    openGraph: { title: `${lens.model} | X Glass` },
  };
}

export default async function LensDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const lens = allLenses.find((l) => l.id === id);

  if (!lens) {
    notFound();
  }

  const t = await getTranslations("LensDetail");
  const tBrand = await getTranslations("Brands");
  const url = getLensUrl(lens);
  const unknown = t("unknown");

  type SpecRow =
    | { label: string; value: string | undefined }
    | { label: string; bool: boolean | undefined };

  const primarySpecs: SpecRow[] = [
    { label: t("focalLength"), value: fmt.focalRangeDisplay(lens.focalLengthMin, lens.focalLengthMax) },
    { label: t("focalLengthEquiv"), value: fmt.focalRangeDisplay(fmt.focalEquiv(lens.focalLengthMin), fmt.focalEquiv(lens.focalLengthMax)) },
    { label: t("maxAperture"), value: fmt.apertureDisplay(lens.maxAperture) },
    { label: t("minAperture"), value: `f/${lens.minAperture}` },
    { label: t("af"), bool: lens.af },
    { label: t("ois"), bool: lens.ois },
    { label: t("wr"), bool: lens.wr },
    { label: t("apertureRing"), bool: lens.apertureRing },
    {
      label: t("apertureBladeCount"),
      value: fmt.optionalNumber(lens.apertureBladeCount, ""),
    },
    { label: t("weight"), value: fmt.optionalNumber(lens.weightG, "g") },
    { label: t("dimensions"), value: fmt.dimensionsDisplay(lens.diameterMm, lens.lengthMm) },
    {
      label: t("filterSize"),
      value: fmt.filterSizeDisplay(lens.filterMm),
    },
    { label: t("minFocusDist"), value: fmt.optionalNumber(lens.minFocusDistanceCm, "cm") },
    {
      label: t("maxMagnification"),
      value: fmt.optionalNumber(lens.maxMagnification, "x"),
    },
    { label: t("releaseYear"), value: fmt.optionalNumber(lens.releaseYear, "") },
  ];

  const advancedSpecs: SpecRow[] = [
    {
      label: t("lengthVariants"),
      value: fmt.lengthVariantsDisplay(lens.lengthVariantsMm, {
        retracted: t("lengthRetracted"),
        wide: t("lengthWide"),
        tele: t("lengthTele"),
      }),
    },
    {
      label: t("minFocusDistMacro"),
      value: fmt.optionalNumber(lens.minFocusDistanceMacroCm, "cm"),
    },
    {
      label: t("lensConfiguration"),
      value: fmt.lensConfigurationDisplay(lens.lensConfiguration),
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
      {/* Back link */}
      <Link
        href="/lenses"
        className="self-start text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
      >
        ← {t("backToLenses")}
      </Link>

      {/* Main content */}
      <div className="flex flex-col sm:flex-row gap-8">
        {/* Image */}
        <div className="w-full shrink-0 sm:w-56">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50/70 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
            {lens.imageUrl ? (
              <div className="relative aspect-square w-full overflow-hidden">
                <Image
                  src={lens.imageUrl}
                  alt={lens.model}
                  fill
                  sizes="224px"
                  style={lensImageStyle}
                  className="object-contain"
                />
              </div>
            ) : (
              <LensPlaceholderIcon className="h-20 w-20 text-zinc-300 dark:text-zinc-600" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col gap-5">
          {/* Title */}
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {tBrand(lens.brand)}
              {lens.series ? ` · ${lens.series}` : ""}
            </p>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
              {lens.model}
            </h1>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <AddToCompareButton lensId={lens.id} />
            {url && (
              <ExternalLink
                href={url}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                {t("officialSite")}
              </ExternalLink>
            )}
          </div>

          {/* Spec table */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {[...primarySpecs, ...advancedSpecs].map((row, i) => (
                  <Fragment key={row.label}>
                    {i === primarySpecs.length && (
                      <tr className="border-b border-zinc-100 dark:border-zinc-800/60">
                        <td
                          colSpan={2}
                          className="px-4 py-3 bg-amber-50/70 dark:bg-amber-950/20"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                              {t("advancedSpecs")}
                            </span>
                            <span className="text-xs text-amber-700 dark:text-amber-200/80">
                              {t("advancedSpecsNote")}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                    <tr className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
                      <td className="px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50/60 dark:bg-zinc-900/30 w-40 whitespace-nowrap">
                        {row.label}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
                        {"bool" in row ? (
                          <BoolCell
                            value={row.bool}
                            yes={t("yes")}
                            no={t("no")}
                            unknown={unknown}
                          />
                        ) : (
                          row.value ?? t("missing")
                        )}
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
