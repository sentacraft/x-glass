import type { Lens } from "@/lib/types";
import {
  focalRangeDisplay,
  apertureDisplay,
  optionalNumber,
} from "@/lib/lens.format";

export interface ShareImageLabels {
  appName: string;
  comparison: string;
  focalLength: string;
  maxAperture: string;
  weight: string;
  ois: string;
  wr: string;
  minFocusDist: string;
  na: string;
  siteUrl: string;
}

interface ShareImageCardProps {
  lenses: Lens[];
  labels: ShareImageLabels;
}

const W = 750;
const PX = 40;

// All styles are inline so html2canvas captures them reliably.
export function ShareImageCard({ lenses, labels }: ShareImageCardProps) {
  const rows = [
    {
      label: labels.focalLength,
      values: lenses.map((l) => focalRangeDisplay(l.focalLengthMin, l.focalLengthMax)),
    },
    {
      label: labels.maxAperture,
      values: lenses.map((l) => apertureDisplay(l.maxAperture)),
    },
    {
      label: labels.weight,
      values: lenses.map((l) => optionalNumber(l.weightG, "g") ?? labels.na),
    },
    {
      label: labels.ois,
      values: lenses.map((l) => (l.ois ? "✓" : "—")),
    },
    {
      label: labels.wr,
      values: lenses.map((l) => (l.wr ? "✓" : "—")),
    },
    {
      label: labels.minFocusDist,
      values: lenses.map((l) =>
        optionalNumber(l.minFocusDistanceCm, " cm") ?? labels.na
      ),
    },
  ];

  const modelList = lenses.map((l) => l.model).join("  ·  ");

  return (
    <div
      style={{
        width: W,
        backgroundColor: "#ffffff",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'Segoe UI', system-ui, sans-serif",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div
        style={{
          padding: `${PX}px ${PX}px 28px`,
          borderBottom: "1px solid #e4e4e7",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: "#a1a1aa",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          {labels.appName}
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "#18181b",
            lineHeight: 1.35,
            marginBottom: 8,
          }}
        >
          {labels.comparison}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#71717a",
            lineHeight: 1.6,
            letterSpacing: "0.01em",
          }}
        >
          {modelList}
        </div>
      </div>

      {/* ── Lens images ────────────────────────────────────── */}
      <div
        style={{
          padding: `28px ${PX}px`,
          borderBottom: "1px solid #e4e4e7",
          display: "flex",
          gap: 16,
        }}
      >
        {lenses.map((lens) => (
          <div
            key={lens.id}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            {/* Image container */}
            <div
              style={{
                width: "100%",
                height: lenses.length <= 2 ? 160 : 120,
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
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
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

            {/* Brand + model */}
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 10,
                  color: "#a1a1aa",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 3,
                }}
              >
                {lens.brand}
              </div>
              <div
                style={{
                  fontSize: lenses.length >= 4 ? 11 : 12,
                  fontWeight: 600,
                  color: "#18181b",
                  lineHeight: 1.35,
                }}
              >
                {lens.model}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Params table ───────────────────────────────────── */}
      <div style={{ padding: `0 ${PX}px`, borderBottom: "1px solid #e4e4e7" }}>
        {rows.map((row, i) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "13px 0",
              borderBottom:
                i < rows.length - 1 ? "1px solid #f4f4f5" : "none",
            }}
          >
            {/* Row label */}
            <div
              style={{
                width: 130,
                flexShrink: 0,
                fontSize: 12,
                color: "#71717a",
              }}
            >
              {row.label}
            </div>

            {/* Lens values */}
            {row.values.map((val, j) => (
              <div
                key={j}
                style={{
                  flex: 1,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#18181b",
                  textAlign: "center",
                }}
              >
                {val}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div
        style={{
          padding: `20px ${PX}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#18181b" }}>
            {labels.appName}
          </div>
          <div style={{ fontSize: 11, color: "#a1a1aa", marginTop: 2 }}>
            {labels.siteUrl}
          </div>
        </div>

        {/* QR placeholder */}
        <div
          style={{
            width: 44,
            height: 44,
            border: "1.5px solid #e4e4e7",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 8,
              color: "#d4d4d8",
              textAlign: "center",
              lineHeight: 1.3,
              letterSpacing: "0.02em",
            }}
          >
            QR
          </div>
        </div>
      </div>
    </div>
  );
}
