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
import { IRIS_NAV } from "../src/config/iris-config.ts";

function irisToSvg(size: number): string {
  const svg = renderToStaticMarkup(
    createElement(Iris, { config: IRIS_NAV, uid: "gen", size })
  );
  // resvg-js requires the xmlns attribute to parse SVG correctly.
  return svg.replace("<svg ", `<svg xmlns="http://www.w3.org/2000/svg" `);
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
