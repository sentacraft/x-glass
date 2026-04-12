"use client";

import React, {
  startTransition,
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import { ExternalLink } from "@/components/ui/external-link";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Flag, X } from "lucide-react";
import { LensPlaceholderIcon } from "@/components/ui/lens-placeholder-icon";
import { BoolCell } from "@/components/ui/bool-cell";
import { FieldNotePopover } from "@/components/ui/field-note-popover";
import { useRouter } from "@/i18n/navigation";
import FeedbackTrigger from "@/components/FeedbackTrigger";
import type { FeedbackField } from "@/components/FeedbackDialog";
import { useCompare } from "@/context/CompareProvider";
import { allLenses, getLensUrl } from "@/lib/lens";
import { lensImageStyle } from "@/lib/lens-image";
import { buildSpecGroups } from "@/lib/lens-spec-groups";
import type { SpecRow, SpecGroup, StructuredLine } from "@/lib/lens-spec-groups";
import type { Lens } from "@/lib/types";

// --- LensHeaderContent: shared inner card content ---

function LensHeaderContent({
  lens,
  officialSiteLabel,
  reportLabel,
  fields,
}: {
  lens: Lens;
  officialSiteLabel: string;
  reportLabel: string;
  fields?: FeedbackField[];
}) {
  const tBrand = useTranslations("Brands");
  const url = getLensUrl(lens);

  return (
    <>
      <div className="mb-2 flex w-full max-w-[88px] items-center justify-center overflow-hidden rounded-xl bg-zinc-50/70 p-2 dark:bg-zinc-900/50">
        {lens.imageUrl ? (
          <div className="relative aspect-square w-full overflow-hidden">
            <Image
              src={lens.imageUrl}
              alt={lens.model}
              fill
              sizes="112px"
              style={lensImageStyle}
              className="object-contain"
            />
          </div>
        ) : (
          <LensPlaceholderIcon className="h-12 w-12 text-zinc-300 dark:text-zinc-600" />
        )}
      </div>

      <p className="text-center text-xs font-normal text-zinc-500 dark:text-zinc-400">
        {tBrand(lens.brand)}
        {lens.series ? ` · ${lens.series}` : ""}
      </p>
      <p className="text-center font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
        {lens.model}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        {url && (
          <ExternalLink
            href={url}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-blue-500 transition-colors hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {officialSiteLabel}
          </ExternalLink>
        )}
        <FeedbackTrigger
          type="data_issue"
          context={{ lensId: lens.id, lensModel: lens.model }}
          fields={fields}
          stopPropagation
          className="inline-flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          <Flag className="h-3 w-3" />
          {reportLabel}
        </FeedbackTrigger>
      </div>
    </>
  );
}

// --- LensHeader ---

function LensHeader({
  lens,
  officialSiteLabel,
  reportLabel,
  fields,
  removeLabel,
  shiftLeftLabel,
  shiftRightLabel,
  canShiftLeft,
  canShiftRight,
  onRemove,
  onShiftLeft,
  onShiftRight,
}: {
  lens: Lens;
  officialSiteLabel: string;
  reportLabel: string;
  fields?: FeedbackField[];
  removeLabel: string;
  shiftLeftLabel: string;
  shiftRightLabel: string;
  canShiftLeft: boolean;
  canShiftRight: boolean;
  onRemove: () => void;
  onShiftLeft: () => void;
  onShiftRight: () => void;
}) {
  return (
    <th className="sticky top-0 z-20 bg-zinc-50 px-3 py-2 text-left dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-1">
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            onClick={onShiftLeft}
            disabled={!canShiftLeft}
            aria-label={shiftLeftLabel}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onShiftRight}
            disabled={!canShiftRight}
            aria-label={shiftRightLabel}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="mt-1 flex flex-col items-center text-center">
        <LensHeaderContent
          lens={lens}
          officialSiteLabel={officialSiteLabel}
          reportLabel={reportLabel}
          fields={fields}
        />
      </div>
    </th>
  );
}

// --- CompareTable ---

interface Props {
  lenses: Lens[];
}

const LABEL_COLUMN_WIDTH = "6rem";
const LENS_COLUMN_MIN_WIDTH = "9rem";

export default function CompareTable({ lenses: initialLenses }: Props) {
  const t = useTranslations("Compare");
  const td = useTranslations("LensDetail");
  const router = useRouter();
  const { replaceCompare } = useCompare();
  const initialLensIds = useMemo(
    () => initialLenses.map((lens) => lens.id),
    [initialLenses]
  );
  const [orderedIds, setOrderedIds] = useState(initialLensIds);

  useEffect(() => {
    replaceCompare(initialLensIds);
    setOrderedIds(initialLensIds);
  }, [initialLensIds, replaceCompare]);

  const orderedLenses = orderedIds
    .map((id) => allLenses.find((lens) => lens.id === id))
    .filter((lens): lens is Lens => lens !== undefined);

  const valueCellLabels = {
    yes: td("yes"),
    no: td("no"),
    unknown: td("unknown"),
    missing: td("missing"),
  };

  function updateCompare(nextIds: string[]) {
    replaceCompare(nextIds);
    setOrderedIds(nextIds);
    startTransition(() => {
      router.replace(`/lenses/compare?ids=${nextIds.join(",")}`);
    });
  }

  function handleRemoveLens(lensId: string) {
    updateCompare(orderedIds.filter((id) => id !== lensId));
  }

  function handleShiftLens(lensId: string, direction: -1 | 1) {
    const index = orderedIds.indexOf(lensId);
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= orderedIds.length) return;
    const next = [...orderedIds];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    updateCompare(next);
  }

  const allGroups = useMemo(
    () =>
      buildSpecGroups({
        groupOptics: td("groupOptics"),
        groupFocus: td("groupFocus"),
        groupStabilization: td("groupStabilization"),
        groupPhysical: td("groupPhysical"),
        groupFeatures: td("groupFeatures"),
        groupRelease: td("groupRelease"),
        focalLength: td("focalLength"),
        focalLengthEquiv: td("focalLengthEquiv"),
        maxAperture: td("maxAperture"),
        minAperture: td("minAperture"),
        maxTStop: td("maxTStop"),
        minTStop: td("minTStop"),
        angleOfView: td("angleOfView"),
        angleOfViewEstNote: td("angleOfViewEstNote"),
        apertureBladeCount: td("apertureBladeCount"),
        lensConfiguration: td("lensConfiguration"),
        af: td("af"),
        focusMotor: td("focusMotor"),
        internalFocusing: td("internalFocusing"),
        minFocusDist: td("minFocusDist"),
        maxMagnification: td("maxMagnification"),
        ois: td("ois"),
        weight: td("weight"),
        dimensions: td("dimensions"),
        filterSize: td("filterSize"),
        lensMaterial: td("lensMaterial"),
        wr: td("wr"),
        apertureRing: td("apertureRing"),
        powerZoom: td("powerZoom"),
        specialtyTags: td("specialtyTags"),
        releaseYear: td("releaseYear"),
        accessories: td("accessories"),
        yes: td("yes"),
        no: td("no"),
        partial: td("partial"),
        retracted: td("lengthRetracted"),
        wide: td("lengthWide"),
        tele: td("lengthTele"),
        macro: td("macroLabel"),
        lc: {
          groups: td("lcGroups"),
          elements: td("lcElements"),
          aspherical: td("lcAspherical"),
          ed: td("lcEd"),
          superEd: td("lcSuperEd"),
          sld: td("lcSld"),
          fld: td("lcFld"),
          highRefractive: td("lcHighRefractive"),
          incl: td("lcIncl"),
        },
        tags: {
          cine: td("tagCine"),
          anamorphic: td("tagAnamorphic"),
          tilt: td("tagTilt"),
          shift: td("tagShift"),
          macro: td("tagMacro"),
          ultra_macro: td("tagUltraMacro"),
          fisheye: td("tagFisheye"),
          probe: td("tagProbe"),
        },
        motorClass: {
          linear: td("motorLinear"),
          stepping: td("motorStepping"),
          other: td("motorOther"),
        },
      }),
    [td]
  );

  // Per-view suppression: hide rows where no compared lens has data.
  const visibleGroups = useMemo(
    () =>
      allGroups
        .map((group) => ({
          ...group,
          rows: group.rows.filter((row) =>
            orderedLenses.some((l) => row.hasData(l))
          ),
        }))
        .filter((group) => group.rows.length > 0),
    [allGroups, orderedLenses]
  );

  // Per-lens reportable fields: only rows visible for each specific lens.
  const lensFields = useMemo(() => {
    const map = new Map<string, FeedbackField[]>();
    for (const lens of orderedLenses) {
      const fields = allGroups
        .flatMap((group) => group.rows)
        .filter((row) => row.hasData(lens))
        .map((row) => {
          let currentValue: string | undefined;
          if (row.kind === "bool") {
            const v = row.getValue(lens);
            currentValue =
              v === true
                ? valueCellLabels.yes
                : v === false
                  ? valueCellLabels.no
                  : valueCellLabels.unknown;
          } else {
            currentValue = row.getDisplayValue(lens) ?? undefined;
          }
          return { label: row.label, currentValue };
        });
      map.set(lens.id, fields);
    }
    return map;
  }, [allGroups, orderedLenses, valueCellLabels]);

  const totalColSpan = orderedLenses.length + 1;

  return (
    <div className="isolate overflow-auto max-h-[calc(100svh-7rem)] sm:max-h-[calc(100svh-11rem)] rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table
        className="w-full min-w-max table-fixed text-sm border-collapse"
        style={{
          minWidth: `calc(${LABEL_COLUMN_WIDTH} + ${orderedLenses.length} * ${LENS_COLUMN_MIN_WIDTH})`,
        }}
      >
        <colgroup>
          <col style={{ width: LABEL_COLUMN_WIDTH }} />
          {orderedLenses.map((lens) => (
            <col key={lens.id} style={{ width: LENS_COLUMN_MIN_WIDTH }} />
          ))}
        </colgroup>

        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th className="sticky top-0 left-0 z-30 bg-zinc-50 px-3 py-3 dark:bg-zinc-900" />
            {orderedLenses.map((lens, index) => (
              <LensHeader
                key={lens.id}
                lens={lens}
                officialSiteLabel={t("officialSite")}
                reportLabel={t("reportIssue")}
                fields={lensFields.get(lens.id)}
                removeLabel={t("removeLens", { model: lens.model })}
                shiftLeftLabel={t("shiftLeft")}
                shiftRightLabel={t("shiftRight")}
                canShiftLeft={index > 0}
                canShiftRight={index < orderedLenses.length - 1}
                onRemove={() => handleRemoveLens(lens.id)}
                onShiftLeft={() => handleShiftLens(lens.id, -1)}
                onShiftRight={() => handleShiftLens(lens.id, 1)}
              />
            ))}
          </tr>
        </thead>

        <tbody>
          {visibleGroups.map((group) => {
            return (
              <React.Fragment key={group.label}>
                {/* Group header row */}
                <tr className="border-b border-zinc-100 dark:border-zinc-800/60">
                  <td
                    colSpan={totalColSpan}
                    className="sticky left-0 z-10 px-4 py-2 bg-zinc-100/80 dark:bg-zinc-800/60"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      {group.label}
                    </span>
                  </td>
                </tr>

                {/* Data rows */}
                {group.rows.map((row) => {
                  // Compute best value for numeric rows
                  let bestVal: number | null = null;
                  if (row.kind === "numeric" && row.bestDir) {
                    const vals = orderedLenses
                      .map(row.toComparable)
                      .filter((v): v is number => v !== undefined);
                    if (vals.length > 1) {
                      bestVal =
                        row.bestDir === "min"
                          ? Math.min(...vals)
                          : Math.max(...vals);
                    }
                  }

                  return (
                    <tr
                      key={row.label}
                      className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0"
                    >
                      {/* Label cell */}
                      <td className="sticky left-0 z-10 px-3 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 break-words">
                        {row.label}
                      </td>

                      {/* Value cells */}
                      {orderedLenses.map((lens) => {
                        const fieldNote =
                          (row.fieldNoteKey ? lens.fieldNotes?.[row.fieldNoteKey] : undefined) ??
                          row.getNote?.(lens);

                        if (row.kind === "bool") {
                          return (
                            <td
                              key={lens.id}
                              className="px-3 py-3 text-center text-zinc-700 dark:text-zinc-300"
                            >
                              <div className="flex items-center justify-center gap-1">
                                <BoolCell
                                  value={row.getValue(lens)}
                                  yes={valueCellLabels.yes}
                                  no={valueCellLabels.no}
                                  unknown={valueCellLabels.unknown}
                                />
                                {fieldNote && (
                                  <FieldNotePopover note={fieldNote} />
                                )}
                              </div>
                            </td>
                          );
                        }

                        if (row.kind === "numeric") {
                          const comparable = row.toComparable(lens);
                          const isBest =
                            bestVal !== null && comparable === bestVal;
                          const fragment = isBest
                            ? row.getHighlightFragment?.(lens)
                            : undefined;
                          const subVal = row.getSubValue?.(lens);
                          const structuredLines = row.getStructuredLines?.(lens);

                          // --- Structured multi-line rendering ---
                          if (structuredLines && structuredLines.length > 0) {
                            return (
                              <td
                                key={lens.id}
                                className="px-3 py-3 text-center font-medium tabular-nums text-zinc-700 dark:text-zinc-300 break-words"
                              >
                                <div className="flex items-start justify-center gap-1">
                                  <div className="flex flex-col items-center gap-0.5">
                                    {structuredLines.map(
                                      (line: StructuredLine, i: number) => {
                                        const lineHighlighted =
                                          isBest && fragment === line.value;
                                        return (
                                          <div
                                            key={i}
                                            className={`flex items-baseline gap-1 ${lineHighlighted ? "text-blue-600 dark:text-blue-400" : ""}`}
                                          >
                                            <span>{line.value}</span>
                                            {lineHighlighted && (
                                              <span className="text-[10px] font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wide">
                                                ★
                                              </span>
                                            )}
                                            {line.label && (
                                              <span
                                                className={`text-[11px] ${lineHighlighted ? "text-blue-400/70 dark:text-blue-400/60" : "text-zinc-400 dark:text-zinc-500"}`}
                                              >
                                                ({line.label})
                                              </span>
                                            )}
                                          </div>
                                        );
                                      }
                                    )}
                                    {subVal && (
                                      <p className="mt-0.5 whitespace-pre-line text-[11px] leading-relaxed font-normal text-zinc-400 dark:text-zinc-500">
                                        {subVal}
                                      </p>
                                    )}
                                  </div>
                                  {fieldNote && (
                                    <FieldNotePopover note={fieldNote} />
                                  )}
                                </div>
                              </td>
                            );
                          }

                          // --- Plain string rendering ---
                          const displayVal = row.getDisplayValue(lens);
                          const usePartialHighlight =
                            isBest &&
                            fragment !== undefined &&
                            displayVal !== undefined &&
                            displayVal.includes(fragment) &&
                            displayVal !== fragment;

                          let primaryNode: React.ReactNode;
                          if (displayVal === undefined) {
                            primaryNode = valueCellLabels.unknown;
                          } else if (usePartialHighlight && fragment) {
                            const idx = displayVal.indexOf(fragment);
                            const before = displayVal.slice(0, idx);
                            const after = displayVal.slice(
                              idx + fragment.length
                            );
                            primaryNode = (
                              <>
                                {before}
                                <span className="text-blue-600 dark:text-blue-400">
                                  {fragment}
                                </span>
                                <span className="ml-0.5 text-[10px] font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wide">
                                  ★
                                </span>
                                {after}
                              </>
                            );
                          } else {
                            primaryNode = (
                              <>
                                {displayVal}
                                {isBest && (
                                  <span className="ml-1.5 text-[10px] font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wide">
                                    ★
                                  </span>
                                )}
                              </>
                            );
                          }

                          return (
                            <td
                              key={lens.id}
                              className={`px-3 py-3 text-center font-medium tabular-nums break-words ${
                                isBest && !usePartialHighlight
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-zinc-700 dark:text-zinc-300"
                              }`}
                            >
                              <div className="flex items-start justify-center gap-1">
                                <div>
                                  <span className="whitespace-pre-line">
                                    {primaryNode}
                                  </span>
                                  {subVal && (
                                    <p className="mt-0.5 whitespace-pre-line text-[11px] leading-relaxed font-normal text-zinc-400 dark:text-zinc-500">
                                      {subVal}
                                    </p>
                                  )}
                                </div>
                                {fieldNote && (
                                  <FieldNotePopover note={fieldNote} />
                                )}
                              </div>
                            </td>
                          );
                        }

                        // text row
                        const displayVal = row.getDisplayValue(lens);
                        const subVal = row.getSubValue?.(lens);
                        return (
                          <td
                            key={lens.id}
                            className="px-3 py-3 text-center text-zinc-700 dark:text-zinc-300 break-words"
                          >
                            <div className="flex items-start justify-center gap-1">
                              <div>
                                <span className="whitespace-pre-line">
                                  {displayVal ?? valueCellLabels.missing}
                                </span>
                                {subVal && (
                                  <p className="mt-0.5 whitespace-pre-line text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
                                    {subVal}
                                  </p>
                                )}
                              </div>
                              {fieldNote && (
                                <FieldNotePopover note={fieldNote} />
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
