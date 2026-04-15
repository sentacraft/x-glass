#!/usr/bin/env tsx
// Generates static icon PNGs from the live <Iris> component.
// Uses react-dom/server to render the SVG, then resvg-js to convert to PNG.
// Run automatically before every build via the "build" npm script,
// or manually: npm run gen:icons

import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { Resvg } from "@resvg/resvg-js";

import Iris from "../src/components/Iris.tsx";
import { IRIS_NAV, R_HOUSING } from "../src/config/iris-config.ts";
import { buildDerivedConfig } from "../src/lib/iris-kinematics.ts";

// ── ViewBox computation ───────────────────────────────────────────────────────
//
// The Iris component has a hardcoded viewBox larger than R_HOUSING*2 so the
// blades have room to breathe. We read the actual viewBox from a test render
// instead of computing it from R_HOUSING, then replace it with a padded one
// that gives the desired logo fill ratio on the final canvas.
//
// padding: fraction of the canvas width added as breathing room on each side
// relative to clipR, the visible iris radius.
//   fill_ratio = clipR / padR = 1 - 2 * padding
//
// Industry references:
//   standard  0.175 → 65 % fill — prominent on transparent bg, matches major
//                      app icons (Chrome, WhatsApp, etc.)
//   maskable  0.225 → 55 % fill — comfortably inside Android's safe zone
//                      (inner 80 % circle = 40 % radius from centre)

const dc = buildDerivedConfig(IRIS_NAV, R_HOUSING);
const clipR = R_HOUSING - dc.bladeWidth; // visible iris radius in SVG units

// Read the real viewBox from a sample render so this stays correct even if
// the Iris component's internal viewBox ever changes.
const _sampleSvg = renderToStaticMarkup(createElement(Iris, { config: IRIS_NAV, uid: "sample", size: 64 }));
const _vbMatch = _sampleSvg.match(/viewBox="([^"]+)"/);
if (!_vbMatch) throw new Error("Could not find viewBox in Iris SVG output");
const originalViewBox = `viewBox="${_vbMatch[1]}"`;

const PADDING = {
  // favicon: maximise fill for small sizes (32px tab icon) where breathing
  // room is imperceptible and the icon must compete with other tab favicons.
  favicon:  0.05,   // → ~90% fill
  // standard: comfortable breathing room for large transparent-bg PWA icons.
  standard: 0.175,  // → ~65% fill
  // maskable: keeps the mark inside Android's safe zone (inner 80% circle).
  maskable: 0.225,  // → ~55% fill
} as const;

function padR(padding: number): number {
  return clipR / (1 - padding * 2);
}

function paddedViewBox(padding: number): string {
  const r = padR(padding);
  return `viewBox="${-r} ${-r} ${r * 2} ${r * 2}"`;
}

// ── Rendering helpers ─────────────────────────────────────────────────────────

function irisToSvg(size: number, padding: number, background?: string): string {
  const svg = renderToStaticMarkup(
    createElement(Iris, { config: IRIS_NAV, uid: "gen", size })
  );
  let result = svg
    .replace("<svg ", `<svg xmlns="http://www.w3.org/2000/svg" `)
    .replace(originalViewBox, paddedViewBox(padding));
  // Inject a background rect as the first child of <svg> when needed.
  // Uses absolute viewBox coordinates instead of percentages because resvg
  // does not resolve "100%" correctly when the viewBox has negative origins.
  if (background) {
    const r = padR(padding);
    result = result.replace(
      /(<svg[^>]*>)/,
      `$1<rect x="${-r}" y="${-r}" width="${r * 2}" height="${r * 2}" fill="${background}"/>`
    );
  }
  return result;
}

function svgToPng(svg: string, size: number): Buffer {
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: size } });
  return Buffer.from(resvg.render().asPng());
}

// Build a multi-size ICO file from individual PNG buffers.
// ICO format: 6-byte header + 16-byte directory entry per image + concatenated PNG data.
function buildIco(pngs: Buffer[]): Buffer {
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * pngs.length;
  let dataOffset = headerSize + dirSize;

  // Header: reserved(2) + type=1(2) + count(2)
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);           // reserved
  header.writeUInt16LE(1, 2);           // type: 1 = ICO
  header.writeUInt16LE(pngs.length, 4); // image count

  const dirEntries: Buffer[] = [];
  for (const png of pngs) {
    // Read dimensions from the PNG IHDR chunk (bytes 16–23).
    const w = png.readUInt32BE(16);
    const h = png.readUInt32BE(18);
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(w >= 256 ? 0 : w, 0);  // width  (0 = 256)
    entry.writeUInt8(h >= 256 ? 0 : h, 1);  // height (0 = 256)
    entry.writeUInt8(0, 2);                  // colour palette
    entry.writeUInt8(0, 3);                  // reserved
    entry.writeUInt16LE(1, 4);               // colour planes
    entry.writeUInt16LE(32, 6);              // bits per pixel
    entry.writeUInt32LE(png.length, 8);      // data size
    entry.writeUInt32LE(dataOffset, 12);     // data offset
    dirEntries.push(entry);
    dataOffset += png.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngs]);
}

// ── Output definitions ────────────────────────────────────────────────────────

const appDir  = resolve("src/app");
const iconsDir = resolve("public/icons");
mkdirSync(iconsDir, { recursive: true });

const outputs: Array<{
  path: string;
  size: number;
  padding: number;
  background?: string;
}> = [
  // Next.js file-convention icons (browser tab + Apple touch)
  { path: `${appDir}/icon.png`,        size: 32,  padding: PADDING.favicon   },
  { path: `${appDir}/apple-icon.png`,  size: 180, padding: PADDING.standard  },
  // PWA manifest icons — transparent background (purpose: any / maskable)
  { path: `${iconsDir}/icon-192.png`,           size: 192,  padding: PADDING.standard },
  { path: `${iconsDir}/icon-512.png`,           size: 512,  padding: PADDING.standard },
  { path: `${iconsDir}/icon-1024.png`,          size: 1024, padding: PADDING.standard },
  { path: `${iconsDir}/icon-maskable-192.png`,  size: 192,  padding: PADDING.maskable },
  { path: `${iconsDir}/icon-maskable-512.png`,  size: 512,  padding: PADDING.maskable },
  // White-background variants — for platforms that render transparent icons
  // on an undesirable fill (iOS Chrome shortcuts, macOS Dock fallback, etc.)
  { path: resolve("public/apple-touch-icon.png"),   size: 180, padding: PADDING.standard, background: "white" },
  { path: `${iconsDir}/icon-192-white.png`,         size: 192, padding: PADDING.standard, background: "white" },
  { path: `${iconsDir}/icon-512-white.png`,         size: 512, padding: PADDING.standard, background: "white" },
  { path: `${iconsDir}/icon-1024-white.png`,        size: 1024, padding: PADDING.standard, background: "white" },
];

for (const { path, size, padding, background } of outputs) {
  writeFileSync(path, svgToPng(irisToSvg(size, padding, background), size));
  const label = path.replace(resolve(".") + "/", "");
  console.log(`✓ ${label} (${size}×${size})`);
}

// ── Favicon ICO ──────────────────────────────────────────────────────────────
// Generated directly from SVG at each target size (16/32/48) with tight
// padding, so every pixel is rendered at native resolution — no downscaling.

const faviconSizes = [16, 32, 48];
const faviconPngs = faviconSizes.map((s) =>
  svgToPng(irisToSvg(s, PADDING.favicon), s)
);
writeFileSync(resolve("public/favicon.ico"), buildIco(faviconPngs));
console.log(`✓ public/favicon.ico (${faviconSizes.join("+")}px)`);

console.log("\nDone.");
