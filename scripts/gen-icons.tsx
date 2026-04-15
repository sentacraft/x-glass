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
// The Iris component renders with a default viewBox of
//   `-R_HOUSING -R_HOUSING R_HOUSING*2 R_HOUSING*2`
// but blades are clipped to a circle of radius (R_HOUSING - bladeWidth), so
// the visible iris mark is smaller than the full viewBox. We replace the
// viewBox to zoom in and add a controlled amount of padding around the mark.
//
// padding: fraction of the total canvas width reserved as breathing room on
// each side. E.g. 0.06 means the iris occupies 88% of the canvas width.

const dc = buildDerivedConfig(IRIS_NAV, R_HOUSING);
const clipR = R_HOUSING - dc.bladeWidth; // visible iris radius

// Derived from R_HOUSING so it stays correct if R_HOUSING ever changes.
const originalViewBox = `viewBox="${-R_HOUSING} ${-R_HOUSING} ${R_HOUSING * 2} ${R_HOUSING * 2}"`;

const PADDING = {
  // Standard icons: minimal breathing room, consistent with major brand favicons.
  standard: 0.06,
  // Maskable icons: larger safe zone so the mark stays within the Android
  // adaptive icon's inner circle (40% of canvas on each axis).
  maskable: 0.15,
} as const;

function paddedViewBox(padding: number): string {
  const padR = clipR / (1 - padding * 2);
  return `viewBox="${-padR} ${-padR} ${padR * 2} ${padR * 2}"`;
}

// ── Rendering helpers ─────────────────────────────────────────────────────────

function irisToSvg(size: number, padding: number): string {
  const svg = renderToStaticMarkup(
    createElement(Iris, { config: IRIS_NAV, uid: "gen", size })
  );
  return svg
    .replace("<svg ", `<svg xmlns="http://www.w3.org/2000/svg" `)
    .replace(originalViewBox, paddedViewBox(padding));
}

function svgToPng(svg: string, size: number): Buffer {
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: size } });
  return Buffer.from(resvg.render().asPng());
}

// ── Output definitions ────────────────────────────────────────────────────────

const appDir  = resolve("src/app");
const iconsDir = resolve("public/icons");
mkdirSync(iconsDir, { recursive: true });

const outputs: Array<{
  path: string;
  size: number;
  padding: number;
}> = [
  // Next.js file-convention icons (browser tab + Apple touch)
  { path: `${appDir}/icon.png`,        size: 32,  padding: PADDING.standard },
  { path: `${appDir}/apple-icon.png`,  size: 180, padding: PADDING.standard },
  // PWA manifest icons
  { path: `${iconsDir}/icon-192.png`,           size: 192, padding: PADDING.standard },
  { path: `${iconsDir}/icon-512.png`,           size: 512, padding: PADDING.standard },
  { path: `${iconsDir}/icon-maskable-192.png`,  size: 192, padding: PADDING.maskable },
  { path: `${iconsDir}/icon-maskable-512.png`,  size: 512, padding: PADDING.maskable },
];

for (const { path, size, padding } of outputs) {
  writeFileSync(path, svgToPng(irisToSvg(size, padding), size));
  const label = path.replace(resolve(".") + "/", "");
  console.log(`✓ ${label} (${size}×${size})`);
}

console.log("\nDone.");
