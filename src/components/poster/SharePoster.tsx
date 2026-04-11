"use client";

import type { Ref } from "react";
import QRCode from "react-qr-code";
import { Droplets, Hand, Focus, Aperture, ArrowLeftRight } from "lucide-react";
import type { Lens } from "@/lib/types";
import { cn } from "@/lib/utils";
import { classifyFocusMotor } from "@/lib/lens";
import {
  apertureDisplay,
  weightDisplay,
  filterSizeDisplay,
  dimensionsPrimaryDisplay,
  specialtyTagsDisplay,
} from "@/lib/lens.format";
import type { SpecialtyTag, FieldNoteKey } from "@/lib/types";
import { PosterSection } from "./PosterSection";
import { PosterStatBlock } from "./PosterStatBlock";
import { PosterFeatureItem } from "./PosterFeatureItem";
import { PosterWeightBar } from "./PosterWeightBar";

// ── Labels ─────────────────────────────────────────────────────────

export interface PosterLabels {
  appName: string;
  siteUrl: string;
  /** Short CTA / tagline shown in the header top-right. */
  cta: string;
  /** Fallback title when no custom title is set. */
  comparison: string;
  // Section titles
  sectionFocalCoverage: string;
  sectionFocus: string;
  sectionSizeWeight: string;
  sectionFeatures: string;
  sectionDetails: string;
  // Stat labels (shown below values)
  minFocusLabel: string;
  maxMagLabel: string;
  weightLabel: string;
  dimensionsLabel: string;
  filterLabel: string;
  focusMotorLabel: string;
  lensConfigLabel: string;
  // Feature names
  featureWR: string;
  featureOIS: string;
  featureAF: string;
  featureApertureRing: string;
  featureInternalFocusing: string;
  // Focus motor canonical classes
  motorLinear: string;
  motorStepping: string;
  motorOther: string;
  // Sub-labels used by format functions
  wide: string;
  tele: string;
  // Specialty tags
  tagCine: string;
  tagAnamorphic: string;
  tagTilt: string;
  tagShift: string;
  tagMacro: string;
  tagUltraMacro: string;
  tagFisheye: string;
  tagProbe: string;
  // Fallback
  na: string;
}

export interface PosterCustom {
  title?: string;
  slogan?: string;
}

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Returns structured wide/tele lines only when BOTH variants are present.
 * Single-variant lenses fall back to plain primary value (no Wide/Tele prefix).
 */
function getFocusVariantLines(
  data: { variants?: { wide?: number; tele?: number } } | undefined,
  format: (v: number) => string,
  labels: { wide: string; tele: string }
): Array<{ label: string; value: string }> | null {
  const wide = data?.variants?.wide;
  const tele = data?.variants?.tele;
  if (wide !== undefined && tele !== undefined) {
    return [
      { label: labels.wide, value: format(wide) },
      { label: labels.tele, value: format(tele) },
    ];
  }
  return null;
}

// ── Constants ──────────────────────────────────────────────────────

const POSTER_W = 750;
const POSTER_PX = 40; // horizontal padding
const COL_GAP = 16;

// ── Helpers ────────────────────────────────────────────────────────

function gridStyle(n: number): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: `repeat(${n}, 1fr)`,
    gap: COL_GAP,
  };
}

/** Primary weight value for normalisation (use lower bound for ranges). */
function primaryWeight(w: Lens["weightG"]): number | undefined {
  if (w === undefined) return undefined;
  return Array.isArray(w) ? w[0] : w;
}

// ── Component ──────────────────────────────────────────────────────

interface SharePosterProps {
  lenses: Lens[];
  labels: PosterLabels;
  custom?: PosterCustom;
  /** Full URL of the current comparison page — used to generate the QR code. */
  shareUrl?: string;
  ref?: Ref<HTMLDivElement>;
}

export function SharePoster({ lenses, labels, custom, shareUrl, ref }: SharePosterProps) {
  const n = lenses.length;
  const title = custom?.title?.trim() || labels.comparison;
  const slogan = custom?.slogan?.trim();

  // Hero font sizes — scale down as more lenses are added
  const focalSize = n <= 2 ? "text-5xl" : n === 3 ? "text-4xl" : "text-3xl";
  const apertureSize = n <= 2 ? "text-3xl" : "text-2xl";
  const statSize = n <= 3 ? "text-xl" : "text-lg";

  // Section label helpers
  const wideTeleLabels = { wide: labels.wide, tele: labels.tele };

  const specialtyTagLabels: Record<SpecialtyTag, string> = {
    cine: labels.tagCine,
    anamorphic: labels.tagAnamorphic,
    tilt: labels.tagTilt,
    shift: labels.tagShift,
    macro: labels.tagMacro,
    ultra_macro: labels.tagUltraMacro,
    fisheye: labels.tagFisheye,
    probe: labels.tagProbe,
  };

  // ── Feature row visibility ─────────────────────────────────────
  // A feature row is shown only when at least one lens has a defined value.
  const showInternalFocusing = lenses.some((l) => l.internalFocusing !== undefined);

  // ── Conditional Details visibility ────────────────────────────
  const focusMotorValues = lenses.map((l) => {
    const cls = classifyFocusMotor(l);
    if (!cls) return undefined;
    return cls === "linear"
      ? labels.motorLinear
      : cls === "stepping"
      ? labels.motorStepping
      : labels.motorOther;
  });
  const specialtyValues = lenses.map((l) =>
    specialtyTagsDisplay(l.specialtyTags, specialtyTagLabels)
  );

  const showFocusMotorRow = focusMotorValues.some(Boolean);
  const showSpecialtyRow = specialtyValues.some(Boolean);
  // Details section now only contains specialty tags (focus motor moved to Focus section)
  const showDetailsSection = showSpecialtyRow;

  // ── Focus section visibility ───────────────────────────────────
  const showMinFocus = lenses.some((l) => l.minFocusDistance !== undefined);
  const showMaxMag = lenses.some((l) => l.maxMagnification !== undefined);

  // ── Size & Weight visibility ───────────────────────────────────
  const weights = lenses.map((l) => primaryWeight(l.weightG));
  const maxWeightG = Math.max(0, ...weights.filter((w): w is number => w !== undefined));
  const showWeight = weights.some((w) => w !== undefined);
  const showDimensions = lenses.some(
    (l) => l.diameterMm !== undefined || l.length !== undefined
  );
  const showFilter = lenses.some((l) => l.filterMm !== undefined);

  // ── Field notes collection ─────────────────────────────────────
  // Notes with identical text for the same field are aggregated under one
  // superscript. The footnote block then lists all lens models together.
  interface CollectedNote {
    sup: number;
    lensModels: string[];
    fieldLabel: string;
    note: string;
  }
  const noteMap = new Map<string, number>(); // `${lensIndex}:${fieldKey}` → sup
  // Dedup key → index in footnotes array for aggregation
  const dedupMap = new Map<string, number>(); // `${fieldKey}::${noteText}` → footnotes index
  const footnotes: CollectedNote[] = [];
  let _supCounter = 1;

  const collectNote = (lensIndex: number, key: FieldNoteKey, fieldLabel: string) => {
    const note = lenses[lensIndex].fieldNotes?.[key];
    if (!note) return;
    const lensMapKey = `${lensIndex}:${key}`;
    if (noteMap.has(lensMapKey)) return;
    // Aggregate: if an identical note already exists for this field, reuse its sup
    const dedupKey = `${key}::${note}`;
    const existingIdx = dedupMap.get(dedupKey);
    if (existingIdx !== undefined) {
      noteMap.set(lensMapKey, footnotes[existingIdx].sup);
      footnotes[existingIdx].lensModels.push(lenses[lensIndex].model);
    } else {
      noteMap.set(lensMapKey, _supCounter);
      const idx = footnotes.length;
      footnotes.push({ sup: _supCounter, lensModels: [lenses[lensIndex].model], fieldLabel, note });
      dedupMap.set(dedupKey, idx);
      _supCounter++;
    }
  };

  // Collect in section display order, lenses left-to-right within each field
  // Weight is now in the hero block — collect first
  if (showWeight)        lenses.forEach((_, i) => collectNote(i, "weightG", labels.weightLabel));
  if (showMinFocus)      lenses.forEach((_, i) => collectNote(i, "minFocusDistance", labels.minFocusLabel));
  if (showMaxMag)        lenses.forEach((_, i) => collectNote(i, "maxMagnification", labels.maxMagLabel));
  if (showFilter)        lenses.forEach((_, i) => collectNote(i, "filterMm", labels.filterLabel));
  /* Features always rendered */    lenses.forEach((_, i) => collectNote(i, "ois", labels.featureOIS));
  /* Features always rendered */    lenses.forEach((_, i) => collectNote(i, "wr", labels.featureWR));
  if (showFocusMotorRow) lenses.forEach((_, i) => collectNote(i, "focusMotor", labels.focusMotorLabel));

  // Helper: look up superscript for a given lens + field (undefined if no note)
  const noteSup = (lensIndex: number, key: FieldNoteKey): number | undefined =>
    noteMap.get(`${lensIndex}:${key}`);

  // ── OIS stops helper ───────────────────────────────────────────
  const oisSub = (l: Lens) =>
    l.ois && l.oisStops !== undefined ? `${l.oisStops}-stop` : undefined;

  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      style={{ width: POSTER_W, background: "#ffffff" }}
    >
      {/* ── Header ────────────────────────────────────────────── */}
      <div style={{ padding: `24px ${POSTER_PX}px 20px`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        {/* Left: app badge + title + optional slogan */}
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#a1a1aa",
              marginBottom: 8,
            }}
          >
            {labels.appName}
          </div>
          <div
            style={{
              fontSize: slogan ? 22 : 36,
              fontWeight: 600,
              color: "#18181b",
              lineHeight: 1.2,
              marginBottom: slogan ? 6 : 0,
            }}
          >
            {title}
          </div>
          {slogan && (
            <div style={{ fontSize: 13, color: "#71717a" }}>
              {slogan}
            </div>
          )}
        </div>

        {/* Right: QR code + CTA below */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0, paddingLeft: 24, gap: 8 }}>
          {/* QR code */}
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 6,
              border: "1.5px solid #e4e4e7",
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {shareUrl ? (
              <QRCode value={shareUrl} size={64} level="M" style={{ display: "block" }} />
            ) : (
              <span style={{ fontSize: 8, color: "#d4d4d8", letterSpacing: 1 }}>QR</span>
            )}
          </div>
          {/* CTA tagline */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#18181b", lineHeight: 1.5 }}>
              {labels.cta}
            </div>
            <div style={{ fontSize: 9, color: "#a1a1aa", marginTop: 2 }}>
              {labels.siteUrl}
            </div>
          </div>
        </div>
      </div>

      {/* separator */}
      <div style={{ height: 1, background: "#e4e4e7" }} />

      {/* ── Product Row ───────────────────────────────────────── */}
      <div style={{ padding: `16px ${POSTER_PX}px` }}>
        <div style={gridStyle(n)}>
          {lenses.map((lens, i) => {
            const imgH = n <= 2 ? 140 : 100;
            return (
              <div
                key={i}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
              >
                {/* Image */}
                <div
                  style={{
                    width: "100%",
                    height: imgH,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {lens.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={lens.imageUrl}
                      alt={lens.model}
                      crossOrigin="anonymous"
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "#f4f4f5",
                        borderRadius: 8,
                      }}
                    />
                  )}
                </div>
                {/* Brand */}
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#a1a1aa",
                    textAlign: "center",
                  }}
                >
                  {lens.brand}
                </div>
                {/* Model */}
                <div
                  style={{
                    fontSize: n <= 3 ? 12 : 11,
                    fontWeight: 600,
                    color: "#18181b",
                    textAlign: "center",
                    lineHeight: 1.3,
                  }}
                >
                  {lens.model}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* separator */}
      <div style={{ height: 1, background: "#e4e4e7" }} />

      {/* ── Hero Block ────────────────────────────────────────── */}
      <div style={{ padding: `20px ${POSTER_PX}px` }}>
        {/* Row 1: Focal length numbers */}
        <div style={{ ...gridStyle(n), marginBottom: 20 }}>
          {lenses.map((lens, i) => (
            <div
              key={i}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}
            >
              <span className={cn("font-semibold tabular-nums text-zinc-900 leading-none", focalSize)}>
                {lens.focalLengthMin === lens.focalLengthMax
                  ? lens.focalLengthMin
                  : `${lens.focalLengthMin}–${lens.focalLengthMax}`}
              </span>
              <span style={{ fontSize: 11, color: "#a1a1aa", letterSpacing: "0.05em" }}>mm</span>
            </div>
          ))}
        </div>

        {/* Row 2: Aperture + Weight side-by-side within each lens column */}
        <div style={gridStyle(n)}>
          {lenses.map((lens, i) => {
            const weightDisplay_ = weightDisplay(lens.weightG, "g");
            const sup = noteSup(i, "weightG");
            return (
              <div
                key={i}
                style={{ display: "flex", justifyContent: "center", gap: 20, alignItems: "flex-start" }}
              >
                {/* Aperture */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <span className={cn("font-semibold tabular-nums text-zinc-900 leading-none", apertureSize)}>
                    {apertureDisplay(lens.maxAperture)}
                  </span>
                  <span style={{ fontSize: 9, color: "#a1a1aa", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Aperture
                  </span>
                </div>

                {/* Weight */}
                {showWeight && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    {weightDisplay_ ? (
                      <>
                        <span className={cn("font-semibold tabular-nums text-zinc-900 leading-none", apertureSize)}>
                          {weightDisplay_}
                          {sup !== undefined && (
                            <span style={{ fontSize: "0.55em", verticalAlign: "super", marginLeft: 1, color: "#a1a1aa", fontWeight: 500 }}>
                              {sup}
                            </span>
                          )}
                        </span>
                        <div style={{ width: 48 }}>
                          <PosterWeightBar weightG={lens.weightG} maxWeightG={maxWeightG} lensIndex={i} />
                        </div>
                        <span style={{ fontSize: 9, color: "#a1a1aa", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                          {labels.weightLabel}
                        </span>
                      </>
                    ) : (
                      <span style={{ fontSize: 9, color: "#d4d4d8" }}>—</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Focus & Size Section ──────────────────────────────── */}
      {(showMinFocus || showMaxMag || showFocusMotorRow || showDimensions || showFilter) && (
        <>
          <div style={{ height: 1, background: "#e4e4e7" }} />
          <div style={{ padding: `20px ${POSTER_PX}px` }}>
            <PosterSection title={labels.sectionFocus}>
              {/* Min focus distance */}
              {showMinFocus && (
                <div style={{ ...gridStyle(n), alignItems: "center" }}>
                  {lenses.map((lens, i) => {
                    const lines = getFocusVariantLines(
                      lens.minFocusDistance,
                      (v) => `${v}cm`,
                      wideTeleLabels
                    );
                    const sup = noteSup(i, "minFocusDistance");
                    if (lines) {
                      return (
                        <div
                          key={i}
                          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}
                        >
                          {lines.map((line, j) => (
                            <div key={j} style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                              <span style={{ fontSize: 9, fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                {line.label}
                              </span>
                              <span className={cn("font-semibold tabular-nums text-zinc-900 leading-tight", statSize)}>
                                {line.value}
                              </span>
                            </div>
                          ))}
                          <span style={{ fontSize: 9, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            {labels.minFocusLabel}
                            {sup !== undefined && (
                              <span style={{ fontSize: "0.7em", verticalAlign: "super", marginLeft: 1 }}>{sup}</span>
                            )}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <PosterStatBlock
                        key={i}
                        value={lens.minFocusDistance ? `${lens.minFocusDistance.cm}cm` : undefined}
                        label={labels.minFocusLabel}
                        valueClassName={statSize}
                        sup={sup}
                      />
                    );
                  })}
                </div>
              )}

              {/* Max magnification */}
              {showMaxMag && (
                <div style={{ ...gridStyle(n), alignItems: "center" }}>
                  {lenses.map((lens, i) => {
                    const lines = getFocusVariantLines(
                      lens.maxMagnification,
                      (v) => `${v}x`,
                      wideTeleLabels
                    );
                    const sup = noteSup(i, "maxMagnification");
                    if (lines) {
                      return (
                        <div
                          key={i}
                          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}
                        >
                          {lines.map((line, j) => (
                            <div key={j} style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                              <span style={{ fontSize: 9, fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                {line.label}
                              </span>
                              <span className={cn("font-semibold tabular-nums text-zinc-900 leading-tight", statSize)}>
                                {line.value}
                              </span>
                            </div>
                          ))}
                          <span style={{ fontSize: 9, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            {labels.maxMagLabel}
                            {sup !== undefined && (
                              <span style={{ fontSize: "0.7em", verticalAlign: "super", marginLeft: 1 }}>{sup}</span>
                            )}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <PosterStatBlock
                        key={i}
                        value={lens.maxMagnification ? `${lens.maxMagnification.value}x` : undefined}
                        label={labels.maxMagLabel}
                        valueClassName={statSize}
                        sup={sup}
                      />
                    );
                  })}
                </div>
              )}

              {/* Focus motor — moved from Details */}
              {showFocusMotorRow && (
                <div style={gridStyle(n)}>
                  {focusMotorValues.map((val, i) => (
                    <PosterStatBlock
                      key={i}
                      value={val}
                      label={labels.focusMotorLabel}
                      valueClassName="text-sm font-medium"
                      sup={noteSup(i, "focusMotor")}
                    />
                  ))}
                </div>
              )}

              {/* Subtle divider between focus and size sub-groups */}
              {(showMinFocus || showMaxMag || showFocusMotorRow) && (showDimensions || showFilter) && (
                <div style={{ height: 1, background: "#f4f4f5", margin: `4px 0` }} />
              )}

              {/* Dimensions */}
              {showDimensions && (
                <div style={gridStyle(n)}>
                  {lenses.map((lens, i) => (
                    <PosterStatBlock
                      key={i}
                      value={dimensionsPrimaryDisplay(lens.diameterMm, lens.length)}
                      label={labels.dimensionsLabel}
                      valueClassName={cn("text-sm font-medium")}
                    />
                  ))}
                </div>
              )}

              {/* Filter size */}
              {showFilter && (
                <div style={gridStyle(n)}>
                  {lenses.map((lens, i) => (
                    <PosterStatBlock
                      key={i}
                      value={filterSizeDisplay(lens.filterMm) ?? undefined}
                      label={labels.filterLabel}
                      valueClassName={cn("text-sm font-medium")}
                      sup={noteSup(i, "filterMm")}
                    />
                  ))}
                </div>
              )}
            </PosterSection>
          </div>
        </>
      )}

      {/* ── Features Section ──────────────────────────────────── */}
      <>
        <div style={{ height: 1, background: "#e4e4e7" }} />
        <div style={{ padding: `20px ${POSTER_PX}px` }}>
          <PosterSection title={labels.sectionFeatures}>
            <div style={gridStyle(n)}>
              {lenses.map((lens, i) => (
                // Outer div centers the block within the grid cell (matching PosterStatBlock alignment).
                // Inner div stays left-aligned so icon + text baseline stays consistent.
                <div key={i} style={{ display: "flex", justifyContent: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <PosterFeatureItem present={lens.wr} label={labels.featureWR} sup={noteSup(i, "wr")} icon={Droplets} />
                  <PosterFeatureItem
                    present={lens.ois}
                    label={labels.featureOIS}
                    sub={oisSub(lens)}
                    sup={noteSup(i, "ois")}
                    icon={Hand}
                  />
                  <PosterFeatureItem present={lens.af} label={labels.featureAF} icon={Focus} />
                  <PosterFeatureItem present={lens.apertureRing} label={labels.featureApertureRing} icon={Aperture} />
                  {showInternalFocusing && (
                    <PosterFeatureItem
                      present={lens.internalFocusing}
                      label={labels.featureInternalFocusing}
                      icon={ArrowLeftRight}
                    />
                  )}
                  </div>
                </div>
              ))}
            </div>
          </PosterSection>
        </div>
      </>

      {/* ── Details Section (specialty tags only, rarely shown) ── */}
      {showDetailsSection && (
        <>
          <div style={{ height: 1, background: "#e4e4e7" }} />
          <div style={{ padding: `20px ${POSTER_PX}px` }}>
            <PosterSection title={labels.sectionDetails}>
              {showSpecialtyRow && (
                <div style={gridStyle(n)}>
                  {specialtyValues.map((val, i) => (
                    <PosterStatBlock
                      key={i}
                      value={val}
                      label="Type"
                      valueClassName="text-sm font-medium"
                    />
                  ))}
                </div>
              )}
            </PosterSection>
          </div>
        </>
      )}

      {/* ── Footnotes ─────────────────────────────────────────── */}
      {footnotes.length > 0 && (
        <>
          <div style={{ height: 1, background: "#f4f4f5" }} />
          <div style={{ padding: `10px ${POSTER_PX}px`, display: "flex", flexDirection: "column", gap: 4 }}>
            {footnotes.map((fn) => (
              <div key={fn.sup} style={{ display: "flex", gap: 5, alignItems: "flex-start" }}>
                <span style={{ fontSize: 7, color: "#a1a1aa", lineHeight: 1.6, flexShrink: 0, fontWeight: 600 }}>
                  {fn.sup}
                </span>
                <span style={{ fontSize: 8, color: "#a1a1aa", lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 600 }}>{fn.lensModels.join(", ")}</span>
                  {" · "}
                  <span>{fn.fieldLabel}</span>
                  {": "}
                  {fn.note}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
}
