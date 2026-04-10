import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { allLenses, getLensUrl } from "@/lib/lens";
import { lensImageStyle } from "@/lib/lens-image";
import { buildSpecGroups } from "@/lib/lens-spec-groups";
import type { SpecRow, StructuredLine } from "@/lib/lens-spec-groups";
import type { Lens } from "@/lib/types";
import { ExternalLink } from "@/components/ui/external-link";
import { LensPlaceholderIcon } from "@/components/ui/lens-placeholder-icon";
import { Link } from "@/i18n/navigation";
import AddToCompareButton from "@/components/AddToCompareButton";
import { BoolCell } from "@/components/ui/bool-cell";
import { FieldNotePopover } from "@/components/ui/field-note-popover";

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

function StructuredLines({ lines }: { lines: StructuredLine[] }) {
  return (
    <div className="flex flex-col gap-0.5">
      {lines.map((line, i) => (
        <div key={i} className="flex items-baseline gap-1">
          <span>{line.value}</span>
          {line.label && (
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
              ({line.label})
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function renderRowValue(
  row: SpecRow,
  lens: Lens,
  labels: { yes: string; no: string; unknown: string; missing: string }
) {
  if (row.kind === "bool") {
    return (
      <BoolCell
        value={row.getValue(lens)}
        yes={labels.yes}
        no={labels.no}
        unknown={labels.unknown}
      />
    );
  }
  const structuredLines = row.kind === "numeric" ? row.getStructuredLines?.(lens) : undefined;
  const sub = row.getSubValue?.(lens);
  if (structuredLines && structuredLines.length > 0) {
    return (
      <div>
        <StructuredLines lines={structuredLines} />
        {sub && (
          <p className="mt-0.5 whitespace-pre-line text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
            {sub}
          </p>
        )}
      </div>
    );
  }
  const primary = row.getDisplayValue(lens);
  return (
    <div>
      <span className="whitespace-pre-line">{primary ?? labels.missing}</span>
      {sub && (
        <p className="mt-0.5 whitespace-pre-line text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
          {sub}
        </p>
      )}
    </div>
  );
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

  const groups = buildSpecGroups({
    groupOptics: t("groupOptics"),
    groupFocus: t("groupFocus"),
    groupStabilization: t("groupStabilization"),
    groupPhysical: t("groupPhysical"),
    groupFeatures: t("groupFeatures"),
    groupRelease: t("groupRelease"),
    focalLength: t("focalLength"),
    focalLengthEquiv: t("focalLengthEquiv"),
    maxAperture: t("maxAperture"),
    minAperture: t("minAperture"),
    maxTStop: t("maxTStop"),
    minTStop: t("minTStop"),
    angleOfView: t("angleOfView"),
    angleOfViewEstNote: t("angleOfViewEstNote"),
    apertureBladeCount: t("apertureBladeCount"),
    lensConfiguration: t("lensConfiguration"),
    af: t("af"),
    focusMotor: t("focusMotor"),
    internalFocusing: t("internalFocusing"),
    minFocusDist: t("minFocusDist"),
    maxMagnification: t("maxMagnification"),
    ois: t("ois"),
    weight: t("weight"),
    dimensions: t("dimensions"),
    filterSize: t("filterSize"),
    lensMaterial: t("lensMaterial"),
    wr: t("wr"),
    apertureRing: t("apertureRing"),
    powerZoom: t("powerZoom"),
    specialtyTags: t("specialtyTags"),
    releaseYear: t("releaseYear"),
    accessories: t("accessories"),
    yes: t("yes"),
    no: t("no"),
    partial: t("partial"),
    retracted: t("lengthRetracted"),
    wide: t("lengthWide"),
    tele: t("lengthTele"),
    macro: t("macroLabel"),
    lc: {
      groups: t("lcGroups"),
      elements: t("lcElements"),
      aspherical: t("lcAspherical"),
      ed: t("lcEd"),
      superEd: t("lcSuperEd"),
      sld: t("lcSld"),
      fld: t("lcFld"),
      highRefractive: t("lcHighRefractive"),
      incl: t("lcIncl"),
    },
    tags: {
      cine: t("tagCine"),
      anamorphic: t("tagAnamorphic"),
      tilt: t("tagTilt"),
      shift: t("tagShift"),
      macro: t("tagMacro"),
      ultra_macro: t("tagUltraMacro"),
      fisheye: t("tagFisheye"),
      probe: t("tagProbe"),
    },
  });

  // Per-view suppression: hide rows where this lens has no data.
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      rows: group.rows.filter((row) => row.hasData(lens)),
    }))
    .filter((group) => group.rows.length > 0);

  const valueCellLabels = {
    yes: t("yes"),
    no: t("no"),
    unknown: t("unknown"),
    missing: t("missing"),
  };

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

          {/* Grouped spec table */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {visibleGroups.map((group, groupIdx) => (
              <div
                key={group.label}
                className={groupIdx > 0 ? "border-t border-zinc-200 dark:border-zinc-800" : ""}
              >
                {/* Group header */}
                <div className="px-4 py-2 bg-zinc-100/80 dark:bg-zinc-800/60">
                  <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {group.label}
                  </span>
                </div>

                {/* Rows */}
                <table className="w-full text-sm">
                  <tbody>
                    {group.rows.map((row) => (
                      <tr
                        key={row.label}
                        className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0"
                      >
                        <td className="px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50/60 dark:bg-zinc-900/30 w-40 whitespace-nowrap align-top">
                          {row.label}
                        </td>
                        <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">
                          <div className="flex items-start gap-1.5">
                            {renderRowValue(row, lens, valueCellLabels)}
                            {(() => {
                              const note =
                                (row.fieldNoteKey ? lens.fieldNotes?.[row.fieldNoteKey] : undefined) ??
                                row.getNote?.(lens);
                              return note ? <FieldNotePopover note={note} /> : null;
                            })()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
