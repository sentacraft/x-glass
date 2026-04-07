import type { Lens } from "./types";
import { focalRangeDisplay, apertureDisplay, optionalNumber } from "./lens.format";

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

// ── Palette ────────────────────────────────────────────────────────
const C = {
  bg:      "#ffffff",
  z900:    "#18181b",
  z500:    "#71717a",
  z400:    "#a1a1aa",
  z300:    "#d4d4d8",
  z200:    "#e4e4e7",
  z100:    "#f4f4f5",
} as const;

// ── Layout ─────────────────────────────────────────────────────────
const W   = 750;  // logical width
const PX  = 40;   // horizontal padding
const SCALE = 2;  // retina export

// Section heights (logical px)
const HEADER_H  = 140; // 40 top + 10 label + 14 gap + 20 title + 8 gap + 20 models + 28 bottom
const IMG_GAP   = 10;  // gap between image area and brand label
const BRAND_H   = 13;  // 10px brand + 3px gap
const MODEL_H   = 12;  // model name font-size
const IMG_PAD   = 28;  // images section top/bottom padding
const ROW_H     = 39;  // 13 top + 13 content + 13 bottom per table row
const ROW_COUNT = 6;
const TABLE_H   = ROW_H * ROW_COUNT;
const FOOTER_H  = 84;  // 20 top + 44 content + 20 bottom
const SEP       = 1;   // separator line

// ── Helpers ────────────────────────────────────────────────────────
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function truncate(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let s = text;
  while (s.length > 0 && ctx.measureText(s + "…").width > maxWidth) {
    s = s.slice(0, -1);
  }
  return s + "…";
}

function hLine(ctx: CanvasRenderingContext2D, y: number) {
  ctx.fillStyle = C.z200;
  ctx.fillRect(0, y, W, 1);
}

// ── Main export ────────────────────────────────────────────────────
export async function drawSharePoster(
  lenses: Lens[],
  labels: ShareImageLabels
): Promise<string> {
  const n = lenses.length;
  const imgH = n <= 2 ? 160 : 120;
  const imagesH = IMG_PAD + imgH + IMG_GAP + BRAND_H + MODEL_H + IMG_PAD;
  const totalH = HEADER_H + SEP + imagesH + SEP + TABLE_H + SEP + FOOTER_H;

  // Load fonts and images in parallel
  const [, loadedImages] = await Promise.all([
    document.fonts.ready,
    Promise.all(lenses.map((l) => loadImage(l.imageUrl))),
  ]);

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width  = W * SCALE;
  canvas.height = totalH * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = "alphabetic";

  // Background
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, totalH);

  const FONT = `-apple-system, BlinkMacSystemFont, "Helvetica Neue", "Segoe UI", sans-serif`;

  let y = 0;

  // ── Header ────────────────────────────────────────────────────
  y += 40;

  // App name label (10px, uppercase, zinc-400)
  ctx.font = `600 10px ${FONT}`;
  ctx.fillStyle = C.z400;
  ctx.textAlign = "left";
  ctx.fillText(labels.appName.toUpperCase(), PX, y + 8);
  y += 10 + 14;

  // Title (20px, semibold, zinc-900)
  ctx.font = `600 20px ${FONT}`;
  ctx.fillStyle = C.z900;
  ctx.fillText(labels.comparison, PX, y + 16);
  y += 20 + 8;

  // Model names (12px, zinc-500)
  ctx.font = `400 12px ${FONT}`;
  ctx.fillStyle = C.z500;
  const modelList = lenses.map((l) => l.model).join("  ·  ");
  ctx.fillText(truncate(ctx, modelList, W - PX * 2), PX, y + 10);
  y += 20 + 28; // models line + bottom padding

  hLine(ctx, y);
  y += SEP;

  // ── Images ────────────────────────────────────────────────────
  y += IMG_PAD;

  // Column layout: n columns, 16px gaps between them
  const colW = (W - PX * 2 - (n - 1) * 16) / n;

  // Draw each lens image
  lenses.forEach((lens, i) => {
    const colX = PX + i * (colW + 16);
    const img  = loadedImages[i];

    if (img && img.naturalWidth > 0) {
      // object-contain within colW × imgH
      const scale = Math.min(colW / img.naturalWidth, imgH / img.naturalHeight);
      const dw = img.naturalWidth  * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, colX + (colW - dw) / 2, y + (imgH - dh) / 2, dw, dh);
    } else {
      // Placeholder rectangle
      ctx.fillStyle = C.z100;
      ctx.beginPath();
      ctx.roundRect(colX, y, colW, imgH, 8);
      ctx.fill();
    }
  });

  y += imgH + IMG_GAP;

  // Brand labels (10px, uppercase, zinc-400)
  ctx.font = `600 10px ${FONT}`;
  ctx.fillStyle = C.z400;
  ctx.textAlign = "center";
  lenses.forEach((lens, i) => {
    const cx = PX + i * (colW + 16) + colW / 2;
    ctx.fillText(truncate(ctx, lens.brand.toUpperCase(), colW), cx, y + 8);
  });
  y += 10 + 3;

  // Model names under images (11-12px, semibold, zinc-900)
  const mSize = n >= 4 ? 11 : 12;
  ctx.font = `600 ${mSize}px ${FONT}`;
  ctx.fillStyle = C.z900;
  ctx.textAlign = "center";
  lenses.forEach((lens, i) => {
    const cx = PX + i * (colW + 16) + colW / 2;
    ctx.fillText(truncate(ctx, lens.model, colW - 4), cx, y + Math.round(mSize * 0.8));
  });

  ctx.textAlign = "left";
  y += MODEL_H + IMG_PAD;

  hLine(ctx, y);
  y += SEP;

  // ── Params table ──────────────────────────────────────────────
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
      values: lenses.map((l) => optionalNumber(l.minFocusDistanceCm, " cm") ?? labels.na),
    },
  ];

  const LABEL_W = 130;
  const valW   = (W - PX * 2 - LABEL_W) / n;

  rows.forEach((row, ri) => {
    const rowTop = y + ri * ROW_H;
    const baseY  = rowTop + ROW_H / 2 + 4; // visual vertical center

    // Row label
    ctx.font = `400 12px ${FONT}`;
    ctx.fillStyle = C.z500;
    ctx.textAlign = "left";
    ctx.fillText(row.label, PX, baseY);

    // Values
    ctx.font = `500 13px ${FONT}`;
    ctx.fillStyle = C.z900;
    ctx.textAlign = "center";
    row.values.forEach((val, ci) => {
      const cx = PX + LABEL_W + ci * valW + valW / 2;
      ctx.fillText(val, cx, baseY);
    });

    // Inter-row separator (not after last)
    if (ri < rows.length - 1) {
      ctx.fillStyle = C.z100;
      ctx.fillRect(PX, rowTop + ROW_H, W - PX * 2, 1);
    }
  });

  ctx.textAlign = "left";
  y += TABLE_H;

  hLine(ctx, y);
  y += SEP;

  // ── Footer ────────────────────────────────────────────────────
  y += 20;

  // App name
  ctx.font = `600 13px ${FONT}`;
  ctx.fillStyle = C.z900;
  ctx.fillText(labels.appName, PX, y + 10);

  // Site URL
  ctx.font = `400 11px ${FONT}`;
  ctx.fillStyle = C.z400;
  ctx.fillText(labels.siteUrl, PX, y + 10 + 4 + 11);

  // QR placeholder box (44×44)
  const QR = 44;
  const qrX = W - PX - QR;
  const qrY = y + (QR - QR) / 2; // center in footer content area

  ctx.strokeStyle = C.z200;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.roundRect(qrX, qrY, QR, QR, 6);
  ctx.stroke();

  ctx.font = `400 8px ${FONT}`;
  ctx.fillStyle   = C.z300;
  ctx.textAlign   = "center";
  ctx.fillText("QR", qrX + QR / 2, qrY + QR / 2 + 3);
  ctx.textAlign = "left";

  return canvas.toDataURL("image/png");
}
