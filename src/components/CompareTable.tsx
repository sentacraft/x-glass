"use client";

import { useRef, useState } from "react";
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
import { GripVertical } from "lucide-react";
import { LensPlaceholderIcon } from "@/components/ui/lens-placeholder-icon";
import { useRouter } from "@/i18n/navigation";
import { getLensUrl } from "@/lib/lenses";
import * as fmt from "@/lib/lens-format";
import type { Lens } from "@/lib/types";

// --- Shared row type ---

type Row =
  | { kind: "text"; label: string; getValue: (l: Lens) => string }
  | {
      kind: "numeric";
      label: string;
      getValue: (l: Lens) => number | undefined;
      format: (v: number) => string;
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
  const url = getLensUrl(lens);

  return (
    <>
      <div className="mb-3 w-full aspect-square max-w-[140px] rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        {lens.imageUrl ? (
          <Image
            src={lens.imageUrl}
            alt={lens.model}
            width={140}
            height={140}
            className="object-contain w-full h-full"
          />
        ) : (
          <LensPlaceholderIcon className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
        )}
      </div>

      <p className="text-xs font-normal text-zinc-500 dark:text-zinc-400 truncate">
        {lens.brand}
        {lens.series ? ` · ${lens.series}` : ""}
      </p>
      <p className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">
        {lens.model}
      </p>
      {lens.generation !== undefined && (
        <p className="text-xs font-normal text-zinc-400 dark:text-zinc-500">
          gen{lens.generation}
        </p>
      )}
      {url && (
        <ExternalLink
          href={url}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="mt-2 inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
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
}: {
  lens: Lens;
  officialSiteLabel: string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: lens.id,
  });

  return (
    <th
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0 : 1 }}
      className="px-4 py-4 text-left bg-zinc-50 dark:bg-zinc-900/60 select-none"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <div className="flex justify-end mb-1">
          <GripVertical className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
        </div>
        <LensHeaderContent lens={lens} officialSiteLabel={officialSiteLabel} />
      </div>
    </th>
  );
}

// --- ColumnOverlay: full column card shown during drag ---

function ColumnOverlay({
  lens,
  rows,
  officialSiteLabel,
}: {
  lens: Lens;
  rows: Row[];
  officialSiteLabel: string;
}) {
  const td = useTranslations("LensDetail");
  return (
    <div className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl overflow-hidden opacity-95 cursor-grabbing">
      {/* Header */}
      <div className="px-4 py-4 bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex justify-end mb-1">
          <GripVertical className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
        </div>
        <LensHeaderContent lens={lens} officialSiteLabel={officialSiteLabel} />
      </div>

      {/* Spec rows */}
      {rows.map((row, i) => {
        let content: React.ReactNode;

        if (row.kind === "bool") {
          const val = row.getValue(lens);
          content =
            val === undefined ? (
              td("unknown")
            ) : (
              <>
                <span
                  className={`inline-block w-2 h-2 rounded-full mr-2 align-middle ${
                    val ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-600"
                  }`}
                />
                {val ? td("yes") : td("no")}
              </>
            );
        } else if (row.kind === "numeric") {
          const val = row.getValue(lens);
          content =
            val === undefined ? (
              td("unknown")
            ) : (
              <span className="font-medium tabular-nums">{row.format(val)}</span>
            );
        } else {
          content = row.getValue(lens);
        }

        return (
          <div
            key={i}
            className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 truncate border-b border-zinc-100 dark:border-zinc-800/60 last:border-0"
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}

// --- CompareTable ---

interface Props {
  lenses: Lens[];
}

const LABEL_COLUMN_WIDTH = "14rem";
const LENS_COLUMN_MIN_WIDTH = "16rem";

export default function CompareTable({ lenses: initialLenses }: Props) {
  const t = useTranslations("Compare");
  const td = useTranslations("LensDetail");
  const router = useRouter();
  const [orderedIds, setOrderedIds] = useState(initialLenses.map((l) => l.id));
  const orderedIdsRef = useRef(orderedIds);
  orderedIdsRef.current = orderedIds;

  const [activeId, setActiveId] = useState<string | null>(null);

  const orderedLenses = orderedIds
    .map((id) => initialLenses.find((l) => l.id === id)!)
    .filter(Boolean);

  const activeLens = activeId ? orderedLenses.find((l) => l.id === activeId) : null;

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
      return arrayMove(ids, oldIndex, newIndex);
    });
  }

  function handleDragEnd() {
    setActiveId(null);
    router.replace(`/lenses/compare?ids=${orderedIdsRef.current.join(",")}`);
  }

  const rows: Row[] = [
    {
      kind: "text",
      label: td("brand"),
      getValue: (l) => `${l.brand}${l.series ? ` ${l.series}` : ""}`,
    },
    {
      kind: "numeric",
      label: td("generation"),
      getValue: (l) => l.generation,
      format: String,
    },
    {
      kind: "text",
      label: td("focalLength"),
      getValue: (l) => fmt.focalDisplay(l),
    },
    {
      kind: "text",
      label: td("focalLengthEquiv"),
      getValue: (l) => fmt.equivDisplay(l),
    },
    {
      kind: "numeric",
      label: td("maxAperture"),
      getValue: (l) => l.maxAperture,
      format: (v) => `f/${v}`,
      bestDir: "min",
    },
    { kind: "bool", label: td("af"), getValue: (l) => l.af },
    { kind: "bool", label: td("ois"), getValue: (l) => l.ois },
    { kind: "bool", label: td("wr"), getValue: (l) => l.wr },
    { kind: "bool", label: td("apertureRing"), getValue: (l) => l.apertureRing },
    {
      kind: "numeric",
      label: td("apertureBladeCount"),
      getValue: (l) => l.apertureBladeCount,
      format: String,
    },
    {
      kind: "numeric",
      label: td("weight"),
      getValue: (l) => l.weightG,
      format: (v) => `${v}g`,
      bestDir: "min",
    },
    {
      kind: "text",
      label: td("dimensions"),
      getValue: (l) => fmt.dimensionsDisplay(l),
    },
    {
      kind: "text",
      label: td("lengthVariants"),
      getValue: (l) =>
        fmt.lengthVariantsDisplay(l, td("unknown"), {
          retracted: td("lengthRetracted"),
          wide: td("lengthWide"),
          tele: td("lengthTele"),
        }),
    },
    {
      kind: "numeric",
      label: td("filterSize"),
      getValue: (l) => l.filterMm,
      format: (v) => `${v}mm`,
    },
    {
      kind: "numeric",
      label: td("minFocusDist"),
      getValue: (l) => l.minFocusDistanceCm,
      format: (v) => `${v}cm`,
      bestDir: "min",
    },
    {
      kind: "numeric",
      label: td("minFocusDistMacro"),
      getValue: (l) => l.minFocusDistanceMacroCm,
      format: (v) => `${v}cm`,
      bestDir: "min",
    },
    {
      kind: "numeric",
      label: td("maxMagnification"),
      getValue: (l) => l.maxMagnification,
      format: (v) => `${v}x`,
      bestDir: "max",
    },
    {
      kind: "text",
      label: td("lensConfiguration"),
      getValue: (l) => fmt.lensConfigurationDisplay(l, td("unknown")),
    },
    {
      kind: "numeric",
      label: td("releaseYear"),
      getValue: (l) => l.releaseYear,
      format: (v) => String(v),
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
              <th className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/60" />
              <SortableContext
                items={orderedIds}
                strategy={horizontalListSortingStrategy}
              >
                {orderedLenses.map((lens) => (
                  <SortableLensHeader
                    key={lens.id}
                    lens={lens}
                    officialSiteLabel={t("officialSite")}
                  />
                ))}
              </SortableContext>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              let bestVal: number | null = null;
              if (row.kind === "numeric" && row.bestDir) {
                const vals = orderedLenses
                  .map(row.getValue)
                  .filter((v): v is number => v !== undefined);
                if (vals.length > 0) {
                  bestVal =
                    row.bestDir === "min" ? Math.min(...vals) : Math.max(...vals);
                }
              }
              return (
                <tr
                  key={row.label}
                  className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0"
                >
                  <td className="px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50/60 dark:bg-zinc-900/30 whitespace-nowrap">
                    {row.label}
                  </td>

                  {orderedLenses.map((lens) => {
                    const isActive = lens.id === activeId;

                    if (row.kind === "bool") {
                      const val = row.getValue(lens);
                      return (
                        <td
                          key={lens.id}
                          className="px-4 py-3 text-zinc-700 dark:text-zinc-300 truncate"
                          style={{ opacity: isActive ? 0 : 1 }}
                        >
                          {val === undefined ? (
                            td("unknown")
                          ) : (
                            <>
                              <span
                                className={`inline-block w-2 h-2 rounded-full mr-2 align-middle ${
                                  val
                                    ? "bg-green-500"
                                    : "bg-zinc-300 dark:bg-zinc-600"
                                }`}
                              />
                              {val ? td("yes") : td("no")}
                            </>
                          )}
                        </td>
                      );
                    }

                    if (row.kind === "numeric") {
                      const val = row.getValue(lens);
                      const isBest = bestVal !== null && val === bestVal;
                      return (
                        <td
                          key={lens.id}
                          className={`px-4 py-3 font-medium tabular-nums truncate ${
                            isBest
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-zinc-700 dark:text-zinc-300"
                          }`}
                          style={{ opacity: isActive ? 0 : 1 }}
                        >
                          {val === undefined ? (
                            td("unknown")
                          ) : (
                            <>
                              {row.format(val)}
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
                        className="px-4 py-3 text-zinc-700 dark:text-zinc-300 truncate"
                        style={{ opacity: isActive ? 0 : 1 }}
                      >
                        {row.getValue(lens)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        <DragOverlay>
          {activeLens && (
            <ColumnOverlay
              lens={activeLens}
              rows={rows}
              officialSiteLabel={t("officialSite")}
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
