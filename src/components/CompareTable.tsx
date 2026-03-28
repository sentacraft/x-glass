"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "@/i18n/navigation";
import { getLensUrl, formatFocalDisplay, formatEquivDisplay } from "@/lib/lenses";
import type { Lens } from "@/lib/types";

// --- SortableLensHeader ---

function SortableLensHeader({
  lens,
  officialSiteLabel,
}: {
  lens: Lens;
  officialSiteLabel: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lens.id });

  const url = getLensUrl(lens);

  return (
    <th
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      className="px-4 py-4 text-left bg-zinc-50 dark:bg-zinc-900/60 min-w-[180px] select-none"
      {...attributes}
      {...listeners}
    >
      {/* Product image */}
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

      {/* Brand / series */}
      <p className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
        {lens.brand}
        {lens.series ? ` · ${lens.series}` : ""}
      </p>

      {/* Model name */}
      <p className="font-semibold text-zinc-900 dark:text-zinc-50">{lens.model}</p>

      {lens.generation !== undefined && (
        <p className="text-xs font-normal text-zinc-400 dark:text-zinc-500">
          gen{lens.generation}
        </p>
      )}

      {/* Official site link — stop propagation so click doesn't trigger drag */}
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-3 h-3"
          >
            <path d="M2 10L10 2M10 2H5M10 2v5" />
          </svg>
        </a>
      )}
    </th>
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

  const orderedLenses = orderedIds
    .map((id) => initialLenses.find((l) => l.id === id))
    .filter((l): l is Lens => l !== undefined);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = orderedIds.indexOf(active.id as string);
    const newIndex = orderedIds.indexOf(over.id as string);
    const newIds = arrayMove(orderedIds, oldIndex, newIndex);
    setOrderedIds(newIds);
    router.replace(`/lenses/compare?ids=${newIds.join(",")}`);
  }

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
      format: (v) => `${v}`,
      bestDir: "max",
    },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
      <DndContext
        id="compare-table-dnd"
        sensors={sensors}
        collisionDetection={closestCenter}
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
            {rows.map((row) => (
              <tr
                key={row.label}
                className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0"
              >
                <td className="px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50/60 dark:bg-zinc-900/30 whitespace-nowrap">
                  {row.label}
                </td>

                {orderedLenses.map((lens) => {
                  if (row.kind === "bool") {
                    const val = row.getValue(lens);
                    return (
                      <td
                        key={lens.id}
                        className="px-4 py-3 text-zinc-700 dark:text-zinc-300"
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
                    >
                      {row.getValue(lens)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </DndContext>
    </div>
  );
}
