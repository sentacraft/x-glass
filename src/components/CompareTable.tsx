"use client";

import React, {
  useCallback,
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { ExternalLink } from "@/components/ui/external-link";
import { useTranslations } from "next-intl";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { Flag, GripVertical, X } from "lucide-react";
import { LensPlaceholderIcon } from "@/components/ui/lens-placeholder-icon";
import { BoolCell } from "@/components/ui/bool-cell";
import { FieldNotePopover } from "@/components/ui/field-note-popover";
import { useRouter } from "@/i18n/navigation";
import LensSearchDialog from "@/components/LensSearchDialog";
import FeedbackTrigger from "@/components/FeedbackTrigger";
import { useCompare } from "@/context/CompareProvider";
import { MAX_COMPARE, allLenses, getLensUrl } from "@/lib/lens";
import { lensImageStyle } from "@/lib/lens-image";
import { buildSpecGroups } from "@/lib/lens-spec-groups";
import type { SpecRow, SpecGroup, StructuredLine } from "@/lib/lens-spec-groups";
import type { Lens } from "@/lib/types";

// --- LensHeaderContent: shared between SortableLensHeader and ColumnOverlay ---

function LensHeaderContent({
  lens,
  officialSiteLabel,
  reportLabel,
}: {
  lens: Lens;
  officialSiteLabel: string;
  reportLabel: string;
}) {
  const tBrand = useTranslations("Brands");
  const url = getLensUrl(lens);

  return (
    <>
      <div className="mb-3 flex w-full max-w-[112px] items-center justify-center overflow-hidden rounded-xl bg-zinc-50/70 p-3 dark:bg-zinc-900/50">
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
      <div className="mt-2 flex items-center justify-center gap-3">
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

// --- SortableLensHeader ---

function SortableLensHeader({
  lens,
  officialSiteLabel,
  reportLabel,
  removeLabel,
  onRemove,
}: {
  lens: Lens;
  officialSiteLabel: string;
  reportLabel: string;
  removeLabel: string;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: lens.id,
  });

  return (
    <th
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0 : 1 }}
      className="bg-zinc-50 px-3 py-4 text-left select-none dark:bg-zinc-900/60"
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div
          {...attributes}
          {...listeners}
          className="ml-auto cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
        </div>
      </div>
      <div className="mt-1 flex flex-col items-center text-center">
        <LensHeaderContent
          lens={lens}
          officialSiteLabel={officialSiteLabel}
          reportLabel={reportLabel}
        />
      </div>
    </th>
  );
}

function AddLensHeader({
  onSelectLens,
  getResultState,
}: {
  onSelectLens: (lens: Lens) => void;
  getResultState: (lens: Lens) => {
    actionLabel?: string;
    disabled?: boolean;
  };
}) {
  const t = useTranslations("Compare");

  return (
    <th className="bg-zinc-50 px-3 py-4 text-left dark:bg-zinc-900/60">
      <div className="flex min-h-[15rem] flex-col items-center justify-center gap-2.5 px-2 py-5 text-center">
        <LensSearchDialog
          onSelectLens={onSelectLens}
          getResultState={getResultState}
          triggerVariant="button"
          triggerLabel={t("addLens")}
          triggerClassName="h-9 rounded-full border-zinc-300 bg-white px-3.5 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
        />
        <div className="space-y-1">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("addLensHint")}
          </p>
        </div>
      </div>
    </th>
  );
}

// --- ColumnOverlay: full column card shown during drag ---

function ColumnOverlay({
  lens,
  visibleGroups,
  officialSiteLabel,
  reportLabel,
  valueCellLabels,
}: {
  lens: Lens;
  visibleGroups: SpecGroup[];
  officialSiteLabel: string;
  reportLabel: string;
  valueCellLabels: { yes: string; no: string; unknown: string; missing: string };
}) {
  function renderRowValue(row: SpecRow) {
    if (row.kind === "bool") {
      return (
        <BoolCell
          value={row.getValue(lens)}
          yes={valueCellLabels.yes}
          no={valueCellLabels.no}
          unknown={valueCellLabels.unknown}
        />
      );
    }
    const primary = row.getDisplayValue(lens);
    const sub = row.getSubValue?.(lens);
    return (
      <div>
        <span className="whitespace-pre-line font-medium tabular-nums">
          {primary ?? valueCellLabels.missing}
        </span>
        {sub && (
          <p className="mt-0.5 whitespace-pre-line text-[11px] leading-relaxed font-normal text-zinc-400 dark:text-zinc-500">
            {sub}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl overflow-hidden opacity-95 cursor-grabbing">
      {/* Header */}
      <div className="px-4 py-4 bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex justify-end mb-1">
          <GripVertical className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
        </div>
        <LensHeaderContent
          lens={lens}
          officialSiteLabel={officialSiteLabel}
          reportLabel={reportLabel}
        />
      </div>

      {visibleGroups.map((group) => (
        <React.Fragment key={group.label}>
          <div className="px-4 py-2 bg-zinc-100/80 dark:bg-zinc-800/60 border-t border-zinc-100 dark:border-zinc-800/60">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {group.label}
            </span>
          </div>
          {group.rows.map((row) => (
            <div
              key={row.label}
              className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0"
            >
              {renderRowValue(row)}
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

// --- CompareTable ---

interface Props {
  lenses: Lens[];
}

const LABEL_COLUMN_WIDTH = "14rem";
const LENS_COLUMN_MIN_WIDTH = "12rem";

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
  const orderedIdsRef = useRef(orderedIds);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    replaceCompare(initialLensIds);
    setOrderedIds(initialLensIds);
    orderedIdsRef.current = initialLensIds;
  }, [initialLensIds, replaceCompare]);

  const orderedLenses = orderedIds
    .map((id) => allLenses.find((lens) => lens.id === id))
    .filter((lens): lens is Lens => lens !== undefined);

  const activeLens = activeId ? orderedLenses.find((l) => l.id === activeId) : null;
  const canAddMore = orderedLenses.length < MAX_COMPARE;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    setOrderedIds((ids) => {
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over.id as string);
      const nextIds = arrayMove(ids, oldIndex, newIndex);
      orderedIdsRef.current = nextIds;
      return nextIds;
    });
  }

  function handleDragEnd() {
    setActiveId(null);
    replaceCompare(orderedIdsRef.current);
    router.replace(`/lenses/compare?ids=${orderedIdsRef.current.join(",")}`);
  }

  function updateCompare(nextIds: string[]) {
    replaceCompare(nextIds);
    setOrderedIds(nextIds);
    orderedIdsRef.current = nextIds;
    startTransition(() => {
      router.replace(`/lenses/compare?ids=${nextIds.join(",")}`);
    });
  }

  function handleAddLens(lens: Lens) {
    if (orderedIds.includes(lens.id) || orderedIds.length >= MAX_COMPARE) {
      return;
    }
    updateCompare([...orderedIds, lens.id]);
  }

  function handleRemoveLens(lensId: string) {
    updateCompare(orderedIds.filter((id) => id !== lensId));
  }

  const valueCellLabels = {
    yes: td("yes"),
    no: td("no"),
    unknown: td("unknown"),
    missing: td("missing"),
  };

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

  const totalColSpan =
    orderedLenses.length + 1 + (canAddMore ? 1 : 0);

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
      <DndContext
        id="compare-table-dnd"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <table
          className="w-full min-w-max table-fixed text-sm border-collapse"
          style={{
            minWidth: `calc(${LABEL_COLUMN_WIDTH} + ${orderedLenses.length + (canAddMore ? 1 : 0)} * ${LENS_COLUMN_MIN_WIDTH})`,
          }}
        >
          <colgroup>
            <col style={{ width: LABEL_COLUMN_WIDTH }} />
            {orderedLenses.map((lens) => (
              <col key={lens.id} style={{ width: LENS_COLUMN_MIN_WIDTH }} />
            ))}
            {canAddMore ? <col style={{ width: LENS_COLUMN_MIN_WIDTH }} /> : null}
          </colgroup>

          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="bg-zinc-50 px-4 py-3 dark:bg-zinc-900/60" />
              <SortableContext
                items={orderedIds}
                strategy={horizontalListSortingStrategy}
              >
                {orderedLenses.map((lens) => (
                  <SortableLensHeader
                    key={lens.id}
                    lens={lens}
                    officialSiteLabel={t("officialSite")}
                    reportLabel={td("reportIssue")}
                    removeLabel={t("removeLens", { model: lens.model })}
                    onRemove={() => handleRemoveLens(lens.id)}
                  />
                ))}
              </SortableContext>
              {canAddMore ? (
                <AddLensHeader
                  onSelectLens={handleAddLens}
                  getResultState={useCallback(
                    (candidate: Lens) => ({
                      actionLabel: orderedIds.includes(candidate.id)
                        ? t("alreadyAdded")
                        : orderedLenses.length >= MAX_COMPARE
                          ? t("compareFull")
                          : t("addToCompareAction"),
                      disabled:
                        orderedIds.includes(candidate.id) ||
                        orderedLenses.length >= MAX_COMPARE,
                    }),
                    [orderedIds, orderedLenses.length, t]
                  )}
                />
              ) : null}
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
                      className="px-4 py-2 bg-zinc-100/80 dark:bg-zinc-800/60"
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
                        <td className="px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50/60 dark:bg-zinc-900/30 whitespace-nowrap">
                          {row.label}
                        </td>

                        {/* Value cells */}
                        {orderedLenses.map((lens) => {
                          const isActive = lens.id === activeId;
                          const fieldNote =
                            (row.fieldNoteKey ? lens.fieldNotes?.[row.fieldNoteKey] : undefined) ??
                            row.getNote?.(lens);

                          if (row.kind === "bool") {
                            return (
                              <td
                                key={lens.id}
                                className="px-3 py-3 text-center text-zinc-700 dark:text-zinc-300"
                                style={{ opacity: isActive ? 0 : 1 }}
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
                                  style={{ opacity: isActive ? 0 : 1 }}
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
                                style={{ opacity: isActive ? 0 : 1 }}
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
                              style={{ opacity: isActive ? 0 : 1 }}
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

                        {canAddMore ? (
                          <td className="bg-zinc-50/40 dark:bg-zinc-900/20" />
                        ) : null}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        <DragOverlay>
          {activeLens && (
            <ColumnOverlay
              lens={activeLens}
              visibleGroups={visibleGroups}
              officialSiteLabel={t("officialSite")}
              reportLabel={td("reportIssue")}
              valueCellLabels={valueCellLabels}
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
