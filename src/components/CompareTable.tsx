"use client";

import React, {
  startTransition,
  useEffect,
  useMemo,
  useRef,
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
}: {
  lens: Lens;
}) {
  const tBrand = useTranslations("Brands");

  return (
    <>
      <div className="mb-1 flex w-full max-w-[72px] items-center justify-center overflow-hidden rounded-xl bg-zinc-50/70 p-1.5 sm:mb-2 sm:max-w-[84px] sm:p-2 dark:bg-zinc-900/50">
        {lens.imageUrl ? (
          <div className="relative aspect-square w-full overflow-hidden">
            <Image
              src={lens.imageUrl}
              alt={lens.model}
              fill
              sizes="96px"
              style={lensImageStyle}
              className="object-contain"
            />
          </div>
        ) : (
          <LensPlaceholderIcon className="h-10 w-10 sm:h-12 sm:w-12 text-zinc-300 dark:text-zinc-600" />
        )}
      </div>

      <p className="text-center text-xs font-normal text-zinc-500 dark:text-zinc-400">
        {tBrand(lens.brand)}
        {lens.series ? ` · ${lens.series}` : ""}
      </p>
      <p className="line-clamp-3 text-center font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
        {lens.model}
      </p>
    </>
  );
}

// --- LensHeader ---

function LensHeader({
  lens,
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
    <th className="group relative z-20 align-top border-l border-zinc-200 bg-zinc-50 px-3 py-1 text-left transition-colors sm:py-1.5 sm:group-hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:sm:group-hover:bg-zinc-800">
      <div className="flex items-start justify-between gap-1 transition-opacity sm:absolute sm:inset-x-3 sm:top-1.5 sm:z-10 sm:opacity-0 sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors active:bg-red-50 active:text-red-500 hover:bg-red-50 hover:text-red-500 dark:text-zinc-400 dark:active:bg-red-950/30 dark:active:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="ml-auto flex items-center gap-3 sm:gap-2">
          <button
            type="button"
            onClick={onShiftLeft}
            disabled={!canShiftLeft}
            aria-label={shiftLeftLabel}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-600 transition-colors active:bg-zinc-200 active:text-zinc-800 hover:bg-zinc-200 hover:text-zinc-700 disabled:cursor-default disabled:opacity-30 disabled:active:bg-transparent disabled:hover:bg-transparent sm:text-zinc-500 dark:text-zinc-300 dark:active:bg-zinc-700 dark:active:text-zinc-100 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 dark:sm:text-zinc-400"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onShiftRight}
            disabled={!canShiftRight}
            aria-label={shiftRightLabel}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-600 transition-colors active:bg-zinc-200 active:text-zinc-800 hover:bg-zinc-200 hover:text-zinc-700 disabled:cursor-default disabled:opacity-30 disabled:active:bg-transparent disabled:hover:bg-transparent sm:text-zinc-500 dark:text-zinc-300 dark:active:bg-zinc-700 dark:active:text-zinc-100 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 dark:sm:text-zinc-400"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="mt-1 flex flex-col items-center text-center sm:mt-0">
        <LensHeaderContent lens={lens} />
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
  const tBrand = useTranslations("Brands");
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
    partial: td("partial"),
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
                : v === "partial"
                  ? valueCellLabels.partial
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

  // --- Phantom sticky header ---
  const theadRef = useRef<HTMLTableSectionElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const phantomInnerRef = useRef<HTMLDivElement>(null);
  const [showPhantom, setShowPhantom] = useState(false);
  const [colWidths, setColWidths] = useState<number[]>([]);

  useEffect(() => {
    const thead = theadRef.current;
    if (!thead) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowPhantom(!entry.isIntersecting),
      { rootMargin: "-56px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(thead);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const thead = theadRef.current;
    if (!container || !thead) return;

    const updateSectionCenter = () => {
      // Center of the visible content pane (everything right of the sticky label
      // column), expressed as a position in table coordinate space so that
      // absolutely-positioned section labels always appear in the middle of the
      // non-sticky viewport area regardless of horizontal scroll.
      const firstTh = thead.querySelector("th");
      const labelColW = firstTh ? firstTh.offsetWidth : 96;
      const center =
        container.scrollLeft + labelColW + (container.clientWidth - labelColW) / 2;
      container.style.setProperty("--section-center", `${center}px`);
    };

    const update = () => {
      const row = thead.querySelector("tr");
      if (row) {
        const cells = row.querySelectorAll("th");
        setColWidths(Array.from(cells).map((c) => c.getBoundingClientRect().width));
      }
      updateSectionCenter();
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [orderedIds]);

  useEffect(() => {
    const container = containerRef.current;
    const thead = theadRef.current;
    if (!container || !thead) return;
    const onScroll = () => {
      if (phantomInnerRef.current) {
        phantomInnerRef.current.style.transform = `translateX(-${container.scrollLeft}px)`;
      }
      // Keep section labels centered in the visible content pane
      const firstTh = thead.querySelector("th");
      const labelColW = firstTh ? firstTh.offsetWidth : 96;
      const center =
        container.scrollLeft + labelColW + (container.clientWidth - labelColW) / 2;
      container.style.setProperty("--section-center", `${center}px`);
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
    {/* Phantom sticky header: h-0 so it takes no layout space; sticky (not fixed)
        so it bounces with content during iOS overscroll instead of staying put */}
    <div className="sticky top-14 z-20 h-0 overflow-x-clip">
      <div
        className={`absolute left-0 right-0 top-0 transition-all duration-200 ${
          showPhantom
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-1 pointer-events-none"
        }`}
      >
      <div className="overflow-hidden border-b border-zinc-200 bg-white/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="flex">
        {/* Fixed blank area matching the sticky label column — never scrolls */}
        {colWidths[0] != null && (
          <div style={{ width: colWidths[0], flexShrink: 0 }} />
        )}
        {/* Lens columns only — translateX syncs with table horizontal scroll */}
        <div className="flex-1 overflow-hidden">
          <div ref={phantomInnerRef} className="flex">
            {orderedLenses.map((lens, i) => (
              <div
                key={lens.id}
                style={{ width: colWidths[i + 1], flexShrink: 0 }}
                className="px-2 py-1.5 text-center"
              >
                <p className="truncate text-[10px] text-zinc-400 dark:text-zinc-500">
                  {tBrand(lens.brand)}
                </p>
                <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                  {lens.model}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
      </div>
    </div>
    <div ref={containerRef} className="isolate overflow-x-auto overflow-y-clip rounded-xl border border-zinc-200 dark:border-zinc-800">
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

        <thead ref={theadRef}>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th className="sticky left-0 z-30 bg-zinc-50 px-3 py-3 dark:bg-zinc-900" />
            {orderedLenses.map((lens, index) => (
              <LensHeader
                key={lens.id}
                lens={lens}
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
                {/* Group header row.
                    The label is absolutely positioned at --section-center (updated
                    on scroll/resize) so it stays centered in the visible content
                    pane regardless of horizontal scroll position. */}
                <tr className="border-b border-zinc-100 bg-zinc-100/80 dark:border-zinc-800/60 dark:bg-zinc-800/60">
                  <td colSpan={totalColSpan} className="relative h-8">
                    <span
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "var(--section-center, 50%)",
                        transform: "translate(-50%, -50%)",
                        whiteSpace: "nowrap",
                      }}
                      className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
                    >
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
                          const subVal = row.getSubValue?.(lens);
                          return (
                            <td
                              key={lens.id}
                              className="px-3 py-3 text-center text-zinc-700 dark:text-zinc-300"
                            >
                              <div className="flex items-center justify-center gap-1">
                                <div>
                                  <BoolCell
                                    value={row.getValue(lens)}
                                    yes={valueCellLabels.yes}
                                    no={valueCellLabels.no}
                                    partial={valueCellLabels.partial}
                                    unknown={valueCellLabels.unknown}
                                  />
                                  {subVal && (
                                    <p className="mt-0.5 text-[11px] leading-relaxed font-normal text-zinc-400 dark:text-zinc-500">
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
                                <div className="flex items-center justify-center gap-1">
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
                              <div className="flex items-center justify-center gap-1">
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
                            <div className="flex items-center justify-center gap-1">
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

        <tfoot>
          {/* Footer row: official site + report links per lens */}
          <tr className="border-t border-zinc-200 bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-800/60">
            <td className="sticky left-0 z-10 bg-zinc-100 px-3 py-2 dark:bg-zinc-800" />
            {orderedLenses.map((lens) => {
              const url = getLensUrl(lens);
              const fields = lensFields.get(lens.id);
              return (
                <td key={lens.id} className="px-3 py-2">
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                    {url && (
                      <ExternalLink
                        href={url}
                        className="inline-flex items-center gap-1 text-xs text-blue-500 transition-colors hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {t("officialSite")}
                      </ExternalLink>
                    )}
                    <FeedbackTrigger
                      type="data_issue"
                      context={{ lensId: lens.id, lensModel: lens.model }}
                      fields={fields}
                      className="inline-flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                      <Flag className="h-3 w-3" />
                      {t("reportIssue")}
                    </FeedbackTrigger>
                  </div>
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
    </>
  );
}
