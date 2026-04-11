"use client";

import type { Ref } from "react";
import type { Lens } from "@/lib/types";
import { cn } from "@/lib/utils";
import { classifyFocusMotor } from "@/lib/lens";
import {
  apertureDisplay,
  weightDisplay,
  filterSizeDisplay,
  dimensionsPrimaryDisplay,
  lensConfigurationPrimaryDisplay,
  specialtyTagsDisplay,
} from "@/lib/lens.format";
import type { SpecialtyTag } from "@/lib/types";
import { PosterSection } from "./PosterSection";
import { PosterStatBlock } from "./PosterStatBlock";
import { PosterFeatureItem } from "./PosterFeatureItem";
import { PosterFocalRuler, type FocalLensLabel } from "./PosterFocalRuler";
import { PosterWeightBar } from "./PosterWeightBar";

// ── Labels ─────────────────────────────────────────────────────────

export interface PosterLabels {
  appName: string;
  siteUrl: string;
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
  ref?: Ref<HTMLDivElement>;
}

export function SharePoster({ lenses, labels, custom, ref }: SharePosterProps) {
  const n = lenses.length;
  const title = custom?.title?.trim() || labels.comparison;
  const slogan = custom?.slogan?.trim();

  // Hero font sizes — scale down as more lenses are added
  const focalSize = n <= 2 ? "text-5xl" : n === 3 ? "text-4xl" : "text-3xl";
  const apertureSize = n <= 2 ? "text-3xl" : "text-2xl";
  const statSize = n <= 3 ? "text-xl" : "text-lg";

  // Section label helpers
  const wideTeleLabels = { wide: labels.wide, tele: labels.tele };

  // Focal Coverage ruler labels — brand + focal range + max aperture per lens
  const rulerLabels: FocalLensLabel[] = lenses.map((l) => ({
    brand: l.brand,
    focal: `${l.focalLengthMin === l.focalLengthMax ? l.focalLengthMin : `${l.focalLengthMin}–${l.focalLengthMax}`}mm  ${apertureDisplay(l.maxAperture)}`,
  }));
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
  const lensConfigValues = lenses.map((l) =>
    lensConfigurationPrimaryDisplay(l.lensConfiguration, {
      groups: "groups",
      elements: "elements",
      aspherical: "",
      ed: "",
      superEd: "",
      sld: "",
      fld: "",
      highRefractive: "",
      incl: "",
    })
  );
  const specialtyValues = lenses.map((l) =>
    specialtyTagsDisplay(l.specialtyTags, specialtyTagLabels)
  );

  const showFocusMotorRow = focusMotorValues.some(Boolean);
  const showLensConfigRow = lensConfigValues.some(Boolean);
  const showSpecialtyRow = specialtyValues.some(Boolean);
  const showDetailsSection = showFocusMotorRow || showLensConfigRow || showSpecialtyRow;

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

  // ── OIS stops helper ───────────────────────────────────────────
  const oisSub = (l: Lens) =>
    l.ois && l.oisStops !== undefined ? `${l.oisStops}-stop` : undefined;

  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      style={{ width: POSTER_W, background: "#ffffff" }}
    >
      {/* ── Header ────────────────────────────────────────────── */}
      <div style={{ padding: `32px ${POSTER_PX}px 28px` }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#a1a1aa",
            marginBottom: 10,
          }}
        >
          {labels.appName}
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "#18181b",
            lineHeight: 1.2,
            marginBottom: slogan ? 6 : 8,
          }}
        >
          {title}
        </div>
        {slogan && (
          <div
            style={{
              fontSize: 13,
              color: "#71717a",
              marginBottom: 8,
            }}
          >
            {slogan}
          </div>
        )}
        <div style={{ fontSize: 11, color: "#a1a1aa" }}>
          {lenses.map((l) => l.model).join(" · ")}
        </div>
      </div>

      {/* separator */}
      <div style={{ height: 1, background: "#e4e4e7" }} />

      {/* ── Product Row ───────────────────────────────────────── */}
      <div style={{ padding: `28px ${POSTER_PX}px` }}>
        <div style={gridStyle(n)}>
          {lenses.map((lens, i) => {
            const imgH = n <= 2 ? 160 : 120;
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
      <div style={{ padding: `36px ${POSTER_PX}px` }}>
        {/* Focal length numbers */}
        <div style={{ ...gridStyle(n), marginBottom: 24 }}>
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

        {/* Max aperture */}
        <div style={gridStyle(n)}>
          {lenses.map((lens, i) => (
            <div
              key={i}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}
            >
              <span className={cn("font-semibold tabular-nums text-zinc-900 leading-none", apertureSize)}>
                {apertureDisplay(lens.maxAperture)}
              </span>
              <span
                style={{
                  fontSize: 9,
                  color: "#a1a1aa",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Max Aperture
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Focal Coverage Section ────────────────────────────── */}
      <div style={{ height: 1, background: "#e4e4e7" }} />
      <div style={{ padding: `28px ${POSTER_PX}px` }}>
        <PosterSection title={labels.sectionFocalCoverage}>
          <PosterFocalRuler
            lenses={lenses}
            lensLabels={rulerLabels}
            width={POSTER_W - POSTER_PX * 2}
          />
        </PosterSection>
      </div>

      {/* ── Focus Section ─────────────────────────────────────── */}
      {(showMinFocus || showMaxMag) && (
        <>
          <div style={{ height: 1, background: "#e4e4e7" }} />
          <div style={{ padding: `28px ${POSTER_PX}px` }}>
            <PosterSection title={labels.sectionFocus}>
              {showMinFocus && (
                <div style={{ ...gridStyle(n), alignItems: "center" }}>
                  {lenses.map((lens, i) => {
                    const lines = getFocusVariantLines(
                      lens.minFocusDistance,
                      (v) => `${v}cm`,
                      wideTeleLabels
                    );
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
                      />
                    );
                  })}
                </div>
              )}
              {showMaxMag && (
                <div style={{ ...gridStyle(n), alignItems: "center" }}>
                  {lenses.map((lens, i) => {
                    const lines = getFocusVariantLines(
                      lens.maxMagnification,
                      (v) => `${v}x`,
                      wideTeleLabels
                    );
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
                      />
                    );
                  })}
                </div>
              )}
            </PosterSection>
          </div>
        </>
      )}

      {/* ── Size & Weight Section ─────────────────────────────── */}
      {(showWeight || showDimensions || showFilter) && (
        <>
          <div style={{ height: 1, background: "#e4e4e7" }} />
          <div style={{ padding: `28px ${POSTER_PX}px` }}>
            <PosterSection title={labels.sectionSizeWeight}>
              {/* Weight + mini bar */}
              {showWeight && (
                <div style={gridStyle(n)}>
                  {lenses.map((lens, i) => {
                    const display = weightDisplay(lens.weightG, "g");
                    if (!display) return <div key={i} />;
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <span className={cn("font-semibold tabular-nums text-zinc-900 leading-tight", statSize)}>
                          {display}
                        </span>
                        <div style={{ width: "80%", maxWidth: 80 }}>
                          <PosterWeightBar
                            weightG={lens.weightG}
                            maxWeightG={maxWeightG}
                            lensIndex={i}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: 9,
                            color: "#a1a1aa",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                          }}
                        >
                          {labels.weightLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
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
        <div style={{ padding: `28px ${POSTER_PX}px` }}>
          <PosterSection title={labels.sectionFeatures}>
            <div style={gridStyle(n)}>
              {lenses.map((lens, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <PosterFeatureItem present={lens.wr} label={labels.featureWR} />
                  <PosterFeatureItem
                    present={lens.ois}
                    label={labels.featureOIS}
                    sub={oisSub(lens)}
                  />
                  <PosterFeatureItem present={lens.af} label={labels.featureAF} />
                  <PosterFeatureItem present={lens.apertureRing} label={labels.featureApertureRing} />
                  {showInternalFocusing && (
                    <PosterFeatureItem
                      present={lens.internalFocusing}
                      label={labels.featureInternalFocusing}
                    />
                  )}
                </div>
              ))}
            </div>
          </PosterSection>
        </div>
      </>

      {/* ── Details Section (conditional) ────────────────────── */}
      {showDetailsSection && (
        <>
          <div style={{ height: 1, background: "#e4e4e7" }} />
          <div style={{ padding: `28px ${POSTER_PX}px` }}>
            <PosterSection title={labels.sectionDetails}>
              {showFocusMotorRow && (
                <div style={gridStyle(n)}>
                  {focusMotorValues.map((val, i) => (
                    <PosterStatBlock
                      key={i}
                      value={val}
                      label={labels.focusMotorLabel}
                      valueClassName="text-sm font-medium"
                    />
                  ))}
                </div>
              )}
              {showLensConfigRow && (
                <div style={gridStyle(n)}>
                  {lensConfigValues.map((val, i) => (
                    <PosterStatBlock
                      key={i}
                      value={val}
                      label={labels.lensConfigLabel}
                      valueClassName="text-sm font-medium"
                    />
                  ))}
                </div>
              )}
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

      {/* ── Footer ────────────────────────────────────────────── */}
      <div style={{ height: 1, background: "#e4e4e7" }} />
      <div
        style={{
          padding: `16px ${POSTER_PX}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#18181b" }}>
            {labels.appName}
          </span>
          <span style={{ fontSize: 11, color: "#a1a1aa" }}>{labels.siteUrl}</span>
        </div>

        {/* QR placeholder */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 6,
            border: "1.5px solid #e4e4e7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 8, color: "#d4d4d8", letterSpacing: 1 }}>QR</span>
        </div>
      </div>
    </div>
  );
}
