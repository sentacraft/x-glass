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
import { GripVertical, X } from "lucide-react";
import { LensPlaceholderIcon } from "@/components/ui/lens-placeholder-icon";
import { useRouter } from "@/i18n/navigation";
import LensSearchDialog from "@/components/LensSearchDialog";
import { useCompare } from "@/context/CompareProvider";
import { MAX_COMPARE, allLenses, getLensUrl } from "@/lib/lens";
import { lensImageStyle } from "@/lib/lens-image";
import * as fmt from "@/lib/lens.format";
import type { Lens } from "@/lib/types";
import { BoolCell } from "@/components/ui/bool-cell";

// --- Shared row type ---

type Row =
  | { kind: "text"; label: string; getDisplayValue: (l: Lens) => string | undefined }
  | {
      kind: "numeric";
      label: string;
      getDisplayValue: (l: Lens) => string | undefined;
      toComparable: (l: Lens) => number | undefined;
      bestDir?: "min" | "max";
    }
  | { kind: "bool"; label: string; getValue: (l: Lens) => boolean | undefined };

// --- LensHeaderContent: shared between SortableLensHeader and ColumnOverlay ---

function LensHeaderContent({
  lens,
  officialSiteLabel,
}: {
  lens: Lens;
  officialSiteLabel: string;
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
      {url && (
        <ExternalLink
          href={url}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="mt-2 inline-flex items-center gap-1 self-center text-xs text-blue-500 transition-colors hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {officialSiteLabel}
        </ExternalLink>
      )}
    </>
  );
}

// --- SortableLensHeader ---

function SortableLensHeader({
  lens,
  officialSiteLabel,
  removeLabel,
  onRemove,
}: {
  lens: Lens;
  officialSiteLabel: string;
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
        <LensHeaderContent lens={lens} officialSiteLabel={officialSiteLabel} />
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
  primaryRows,
  advancedRows,
  officialSiteLabel,
}: {
  lens: Lens;
  primaryRows: Row[];
  advancedRows: Row[];
  officialSiteLabel: string;
}) {
  const td = useTranslations("LensDetail");

  function renderRow(row: Row, i: number) {
    let content: React.ReactNode;

    if (row.kind === "bool") {
      content = (
        <BoolCell
          value={row.getValue(lens)}
          yes={td("yes")}
          no={td("no")}
          unknown={td("unknown")}
        />
      );
    } else if (row.kind === "numeric") {
      const val = row.getDisplayValue(lens);
      content =
        val === undefined ? (
          td("missing")
        ) : (
          <span className="font-medium tabular-nums">{val}</span>
        );
    } else {
      content = row.getDisplayValue(lens) ?? td("unknown");
    }

    return (
      <div
        key={i}
        className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line border-b border-zinc-100 dark:border-zinc-800/60 last:border-0"
      >
        {content}
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
        <LensHeaderContent lens={lens} officialSiteLabel={officialSiteLabel} />
      </div>

      {primaryRows.map(renderRow)}

      <div className="px-4 py-3 bg-amber-50/70 dark:bg-amber-950/20 border-b border-zinc-100 dark:border-zinc-800/60">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
            {td("advancedSpecs")}
          </span>
          <span className="text-xs text-amber-700 dark:text-amber-200/80">
            {td("advancedSpecsNote")}
          </span>
        </div>
      </div>

      {advancedRows.map(renderRow)}
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

  const primaryRows: Row[] = [
    {
      kind: "text",
      label: td("focalLength"),
      getDisplayValue: (l) => fmt.focalRangeDisplay(l.focalLengthMin, l.focalLengthMax),
    },
    {
      kind: "text",
      label: td("focalLengthEquiv"),
      getDisplayValue: (l) => fmt.focalRangeDisplay(fmt.focalEquiv(l.focalLengthMin), fmt.focalEquiv(l.focalLengthMax)),
    },
    {
      kind: "numeric",
      label: td("maxAperture"),
      getDisplayValue: (l) => fmt.apertureDisplay(l.maxAperture),
      toComparable: (l) => Array.isArray(l.maxAperture) ? l.maxAperture[0] : l.maxAperture,
      bestDir: "min",
    },
    { kind: "bool", label: td("af"), getValue: (l) => l.af },
    { kind: "bool", label: td("ois"), getValue: (l) => l.ois },
    { kind: "bool", label: td("wr"), getValue: (l) => l.wr },
    { kind: "bool", label: td("apertureRing"), getValue: (l) => l.apertureRing },
    {
      kind: "numeric",
      label: td("apertureBladeCount"),
      getDisplayValue: (l) => fmt.optionalNumber(l.apertureBladeCount, ""),
      toComparable: (l) => l.apertureBladeCount,
    },
    {
      kind: "numeric",
      label: td("weight"),
      getDisplayValue: (l) => fmt.optionalNumber(l.weightG, "g"),
      toComparable: (l) => l.weightG,
      bestDir: "min",
    },
    {
      kind: "text",
      label: td("dimensions"),
      getDisplayValue: (l) => fmt.dimensionsDisplay(l.diameterMm, l.lengthMm),
    },
    {
      kind: "text",
      label: td("filterSize"),
      getDisplayValue: (l) => fmt.filterSizeDisplay(l.filterMm),
    },
    {
      kind: "numeric",
      label: td("minFocusDist"),
      getDisplayValue: (l) => fmt.optionalNumber(l.minFocusDistanceCm, "cm"),
      toComparable: (l) => l.minFocusDistanceCm,
      bestDir: "min",
    },
    {
      kind: "numeric",
      label: td("maxMagnification"),
      getDisplayValue: (l) => fmt.optionalNumber(l.maxMagnification, "x"),
      toComparable: (l) => l.maxMagnification,
      bestDir: "max",
    },
  ];

  const advancedRows: Row[] = [
    {
      kind: "text",
      label: td("lengthVariants"),
      getDisplayValue: (l) =>
        fmt.lengthVariantsDisplay(l.lengthVariantsMm, {
          retracted: td("lengthRetracted"),
          wide: td("lengthWide"),
          tele: td("lengthTele"),
        }),
    },
    {
      kind: "numeric",
      label: td("minFocusDistMacro"),
      getDisplayValue: (l) => fmt.optionalNumber(l.minFocusDistanceMacroCm, "cm"),
      toComparable: (l) => l.minFocusDistanceMacroCm,
      bestDir: "min",
    },
    {
      kind: "text",
      label: td("lensConfiguration"),
      getDisplayValue: (l) => fmt.lensConfigurationDisplay(l.lensConfiguration),
    },
    {
      kind: "numeric",
      label: td("releaseYear"),
      getDisplayValue: (l) => fmt.optionalNumber(l.releaseYear, ""),
      toComparable: (l) => l.releaseYear,
      bestDir: "max",
    },
  ];

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
            minWidth: `calc(${LABEL_COLUMN_WIDTH} + ${(orderedLenses.length + (canAddMore ? 1 : 0))} * ${LENS_COLUMN_MIN_WIDTH})`,
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
            {[...primaryRows, ...advancedRows].map((row, groupOffset) => {
              const isSectionBoundary = groupOffset === primaryRows.length;
              let bestVal: number | null = null;
              if (row.kind === "numeric" && row.bestDir) {
                const vals = orderedLenses
                  .map(row.toComparable)
                  .filter((v): v is number => v !== undefined);
                if (vals.length > 0) {
                  bestVal =
                    row.bestDir === "min" ? Math.min(...vals) : Math.max(...vals);
                }
              }
              return (
                <React.Fragment key={row.label}>
                  {isSectionBoundary && (
                    <tr className="border-b border-zinc-100 dark:border-zinc-800/60">
                      <td
                        colSpan={orderedLenses.length + 1 + (canAddMore ? 1 : 0)}
                        className="px-4 py-3 bg-amber-50/70 dark:bg-amber-950/20"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                            {td("advancedSpecs")}
                          </span>
                          <span className="text-xs text-amber-700 dark:text-amber-200/80">
                            {td("advancedSpecsNote")}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
                    <td className="px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50/60 dark:bg-zinc-900/30 whitespace-nowrap">
                      {row.label}
                    </td>

                    {orderedLenses.map((lens) => {
                      const isActive = lens.id === activeId;

                      if (row.kind === "bool") {
                        return (
                          <td
                            key={lens.id}
                            className="px-3 py-3 text-center text-zinc-700 dark:text-zinc-300 whitespace-normal break-words"
                            style={{ opacity: isActive ? 0 : 1 }}
                          >
                            <BoolCell
                              value={row.getValue(lens)}
                              yes={td("yes")}
                              no={td("no")}
                              unknown={td("unknown")}
                            />
                          </td>
                        );
                      }

                      if (row.kind === "numeric") {
                        const displayVal = row.getDisplayValue(lens);
                        const comparable = row.toComparable(lens);
                        const isBest = bestVal !== null && comparable === bestVal;
                        return (
                          <td
                            key={lens.id}
                            className={`px-3 py-3 text-center font-medium tabular-nums whitespace-normal break-words ${
                              isBest
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-zinc-700 dark:text-zinc-300"
                            }`}
                            style={{ opacity: isActive ? 0 : 1 }}
                          >
                            {displayVal === undefined ? (
                              td("unknown")
                            ) : (
                              <>
                                {displayVal}
                                {isBest && (
                                  <span className="ml-1.5 text-[10px] font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wide">
                                    ★
                                  </span>
                                )}
                              </>
                            )}
                          </td>
                        );
                      }

                      return (
                        <td
                          key={lens.id}
                          className="px-3 py-3 text-center text-zinc-700 dark:text-zinc-300 whitespace-pre-line break-words"
                          style={{ opacity: isActive ? 0 : 1 }}
                        >
                          {row.getDisplayValue(lens) ?? td("missing")}
                        </td>
                      );
                    })}

                    {canAddMore ? (
                      <td className="bg-zinc-50/40 dark:bg-zinc-900/20" />
                    ) : null}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        <DragOverlay>
          {activeLens && (
            <ColumnOverlay
              lens={activeLens}
              primaryRows={primaryRows}
              advancedRows={advancedRows}
              officialSiteLabel={t("officialSite")}
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
