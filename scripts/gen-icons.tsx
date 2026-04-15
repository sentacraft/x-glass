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
  standard: 0.175,
  maskable: 0.225,
} as const;

function paddedViewBox(padding: number): string {
  const padR = clipR / (1 - padding * 2);
  return `viewBox="${-padR} ${-padR} ${padR * 2} ${padR * 2}"`;
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
  // Used for platforms that render transparent icons on an undesirable fill
  // (e.g. Chrome on iOS "Add to Home Screen" shortcut uses a gray background).
  if (background) {
    result = result.replace(
      /(<svg[^>]*>)/,
      `$1<rect width="100%" height="100%" fill="${background}"/>`
    );
  }
  return result;
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
  background?: string;
}> = [
  // Next.js file-convention icons (browser tab + Apple touch)
  { path: `${appDir}/icon.png`,        size: 32,  padding: PADDING.standard },
  { path: `${appDir}/apple-icon.png`,  size: 180, padding: PADDING.standard },
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
];

for (const { path, size, padding, background } of outputs) {
  writeFileSync(path, svgToPng(irisToSvg(size, padding, background), size));
  const label = path.replace(resolve(".") + "/", "");
  console.log(`✓ ${label} (${size}×${size})`);
}

console.log("\nDone.");
