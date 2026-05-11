#!/usr/bin/env node
// CI gate: ensure routes that should be statically prerendered actually are.
//
// Motivation: in Next.js App Router, accessing request-time context
// (cookies(), headers(), getLocale()) anywhere up the layout tree silently
// forces every descendant route into dynamic rendering. The build doesn't
// fail — it just emits `ƒ Dynamic` instead of `○ Static` / `● SSG`. This
// regression is invisible until production CPU usage / TTFB suffers (or, on
// Cloudflare Workers, until the 10ms CPU limit causes 503s).
//
// This script reads .next/prerender-manifest.json after `next build` and
// asserts that the expected static surface is intact. Any expected static
// route that didn't get prerendered fails the build immediately.
//
// History: commit b20d263 ("fix(seo): move lang attr to <html> via
// getLocale() in root layout") unintentionally turned the entire [locale]
// tree dynamic and went unnoticed for weeks. This gate prevents that class
// of regression.

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import lensesData from "../src/data/lenses.json" with { type: "json" };
import gfxLensesData from "../src/data/lenses-g.json" with { type: "json" };

interface PrerenderManifest {
  routes: Record<string, unknown>;
  dynamicRoutes: Record<string, unknown>;
}

const LOCALES = ["en", "zh"] as const;

// Routes that must be present as concrete prerendered URLs in the manifest.
function expectedStaticRoutes(): string[] {
  const routes: string[] = [];

  // Top-level localized pages.
  for (const locale of LOCALES) {
    routes.push(`/${locale}`);
    routes.push(`/${locale}/about`);
    routes.push(`/${locale}/get`);
    routes.push(`/${locale}/lenses/x`);
    routes.push(`/${locale}/lenses/gfx`);
  }

  // Lens detail pages — one per (locale × mount × lens id).
  const xLensIds = (lensesData as Array<{ id: string }>).map((l) => l.id);
  const gLensIds = (gfxLensesData as Array<{ id: string }>).map((l) => l.id);
  for (const locale of LOCALES) {
    for (const id of xLensIds) {
      routes.push(`/${locale}/lenses/x/${id}`);
    }
    for (const id of gLensIds) {
      routes.push(`/${locale}/lenses/gfx/${id}`);
    }
  }

  // PWA offline fallback (outside the [locale] tree).
  routes.push("/offline");

  return routes;
}

// Routes that are intentionally dynamic — listed so reviewers see them as
// explicit exceptions rather than oversights. The presence of these in the
// dynamicRoutes manifest is informational, not asserted.
const INTENTIONALLY_DYNAMIC = [
  "/[locale]/lenses/[mount]/compare", // SSR + Cache-Control revalidate
];

async function main(): Promise<void> {
  const manifestPath = resolve(process.cwd(), ".next/prerender-manifest.json");
  let manifest: PrerenderManifest;
  try {
    const raw = await readFile(manifestPath, "utf8");
    manifest = JSON.parse(raw) as PrerenderManifest;
  } catch (err) {
    console.error(
      `\n✗ Could not read ${manifestPath}.\n` +
        `  Run \`next build\` first; this script is meant to run after the\n` +
        `  Next.js build step has completed.\n`
    );
    console.error(err);
    process.exit(1);
  }

  const prerendered = new Set(Object.keys(manifest.routes ?? {}));
  const expected = expectedStaticRoutes();
  const missing = expected.filter((r) => !prerendered.has(r));

  if (missing.length > 0) {
    console.error(
      `\n✗ Static route regression detected.\n\n` +
        `  ${missing.length} route(s) that should be prerendered at build time\n` +
        `  are missing from .next/prerender-manifest.json. This usually means\n` +
        `  something in a layout or page accessed request-time context (cookies,\n` +
        `  headers, getLocale, dynamic searchParams, etc.) and forced the route\n` +
        `  into dynamic rendering.\n\n` +
        `  First few missing routes:\n`
    );
    for (const route of missing.slice(0, 10)) {
      console.error(`    - ${route}`);
    }
    if (missing.length > 10) {
      console.error(`    ... and ${missing.length - 10} more`);
    }
    console.error(
      `\n  Check recent changes to:\n` +
        `    - src/app/layout.tsx              (must be pass-through)\n` +
        `    - src/app/[locale]/layout.tsx     (must call setRequestLocale)\n` +
        `    - the affected page files         (must call setRequestLocale)\n\n` +
        `  If a route was intentionally made dynamic, add it to the\n` +
        `  INTENTIONALLY_DYNAMIC list in scripts/check-static-routes.mts.\n`
    );
    process.exit(1);
  }

  console.log(
    `✓ Static route check passed (${expected.length} routes prerendered, ` +
      `${INTENTIONALLY_DYNAMIC.length} intentionally dynamic).`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
