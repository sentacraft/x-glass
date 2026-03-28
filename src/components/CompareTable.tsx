"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
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
import { useRouter } from "@/i18n/navigation";
import { getLensUrl, formatFocalDisplay, formatEquivDisplay } from "@/lib/lenses";
import type { Lens } from "@/lib/types";

// --- Shared row type ---

type Row =
  | { kind: "text"; label: string; getValue: (l: Lens) => string }
  | {
      kind: "numeric";
      label: string;
      getValue: (l: Lens) => number;
      format: (v: number) => string;
      bestDir: "min" | "max";
    }
  | { kind: "bool"; label: string; getValue: (l: Lens) => boolean };

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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            className="w-12 h-12 text-zinc-300 dark:text-zinc-600"
          >
            <circle cx="12" cy="12" r="4" />
            <circle cx="12" cy="12" r="8" />
            <circle cx="12" cy="12" r="10.5" />
            <line x1="2" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="22" y2="12" />
          </svg>
        )}
      </div>

      <p className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
        {lens.brand}
        {lens.series ? ` · ${lens.series}` : ""}
      </p>
      <p className="font-semibold text-zinc-900 dark:text-zinc-50">{lens.model}</p>
      {lens.generation !== undefined && (
        <p className="text-xs font-normal text-zinc-400 dark:text-zinc-500">
          gen{lens.generation}
        </p>
      )}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="mt-2 inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          {officialSiteLabel}
          <ArrowUpRight size={12} />
        </a>
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
      className="px-4 py-4 text-left bg-zinc-50 dark:bg-zinc-900/60 min-w-[180px] select-none"
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
  yesLabel,
  noLabel,
}: {
  lens: Lens;
  rows: Row[];
  officialSiteLabel: string;
  yesLabel: string;
  noLabel: string;
}) {
  return (
    <div className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl min-w-[180px] overflow-hidden opacity-95 cursor-grabbing">
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
          content = (
            <>
              <span
                className={`inline-block w-2 h-2 rounded-full mr-2 align-middle ${
                  val ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-600"
                }`}
              />
              {val ? yesLabel : noLabel}
            </>
          );
        } else if (row.kind === "numeric") {
          content = (
            <span className="font-medium tabular-nums">
              {row.format(row.getValue(lens))}
            </span>
          );
        } else {
          content = row.getValue(lens);
        }

        return (
          <div
            key={i}
            className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0"
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

  function handleDragEnd(_event: DragEndEvent) {
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
      kind: "text",
      label: td("focalLength"),
      getValue: (l) => formatFocalDisplay(l),
    },
    {
      kind: "text",
      label: td("focalLengthEquiv"),
      getValue: (l) => formatEquivDisplay(l),
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
      getValue: (l) => `⌀${l.diameterMm} × ${l.lengthMm}mm`,
    },
    {
      kind: "text",
      label: td("filterSize"),
      getValue: (l) => `${l.filterMm}mm`,
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
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="w-36 px-4 py-3 bg-zinc-50 dark:bg-zinc-900/60" />
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
            {rows.map((row, i) => (
              <tr
                key={i}
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
                        className="px-4 py-3 text-zinc-700 dark:text-zinc-300"
                        style={{ opacity: isActive ? 0 : 1 }}
                      >
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-2 align-middle ${
                            val ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-600"
                          }`}
                        />
                        {val ? td("yes") : td("no")}
                      </td>
                    );
                  }

                  if (row.kind === "numeric") {
                    const val = row.getValue(lens);
                    const vals = orderedLenses.map(row.getValue);
                    const bestVal =
                      row.bestDir === "min" ? Math.min(...vals) : Math.max(...vals);
                    const isBest = val === bestVal;
                    return (
                      <td
                        key={lens.id}
                        className={`px-4 py-3 font-medium tabular-nums ${
                          isBest
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                        style={{ opacity: isActive ? 0 : 1 }}
                      >
                        {row.format(val)}
                        {isBest && (
                          <span className="ml-1.5 text-[10px] font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wide">
                            ★
                          </span>
                        )}
                      </td>
                    );
                  }

                  return (
                    <td
                      key={lens.id}
                      className="px-4 py-3 text-zinc-700 dark:text-zinc-300"
                      style={{ opacity: isActive ? 0 : 1 }}
                    >
                      {row.getValue(lens)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <DragOverlay>
          {activeLens && (
            <ColumnOverlay
              lens={activeLens}
              rows={rows}
              officialSiteLabel={t("officialSite")}
              yesLabel={td("yes")}
              noLabel={td("no")}
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
