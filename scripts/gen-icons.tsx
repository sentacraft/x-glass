#!/usr/bin/env tsx
// Generates static icon PNGs from the live <Iris> component.
// Uses react-dom/server to render the SVG, then resvg-js to convert to PNG.
// Run after changing IRIS_NAV: npm run gen:icons

import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Resvg } from "@resvg/resvg-js";

import Iris from "../src/components/Iris.tsx";
import { IRIS_NAV, R_HOUSING } from "../src/config/iris-config.ts";
import { buildDerivedConfig } from "../src/lib/iris-kinematics.ts";

// Compute the clip radius so we can tighten the viewBox to fill the icon.
// The Iris component clips blades to (R_HOUSING - bladeWidth); anything outside
// that circle is transparent padding that makes the icon look undersized in browser tabs.
const dc = buildDerivedConfig(IRIS_NAV, R_HOUSING);
const clipR = R_HOUSING - dc.bladeWidth; // e.g. 100 - 45 = 55
const TIGHT_VIEWBOX = `${-clipR} ${-clipR} ${clipR * 2} ${clipR * 2}`;

function irisToSvg(size: number): string {
  const svg = renderToStaticMarkup(
    createElement(Iris, { config: IRIS_NAV, uid: "gen", size })
  );
  return svg
    .replace("<svg ", `<svg xmlns="http://www.w3.org/2000/svg" `)
    // Swap the default wide viewBox for a tight one that crops to the iris edge.
    .replace('viewBox="-112 -112 224 224"', `viewBox="${TIGHT_VIEWBOX}"`);
}

function svgToPng(svg: string, size: number): Buffer {
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: size } });
  return Buffer.from(resvg.render().asPng());
}

const out = resolve("src/app");

// icon.png — browser tab favicon
writeFileSync(`${out}/icon.png`, svgToPng(irisToSvg(32), 32));
console.log("✓ src/app/icon.png (32×32)");

// apple-icon.png — iOS home screen / Safari
writeFileSync(`${out}/apple-icon.png`, svgToPng(irisToSvg(180), 180));
console.log("✓ src/app/apple-icon.png (180×180)");

console.log("\nDone. Delete icon.tsx and apple-icon.tsx if they exist.");
