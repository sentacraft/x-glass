import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";
import { routing } from "@/i18n/routing";
import xLensesData from "@/data/lenses.json";
import gfxLensesData from "@/data/lenses-g.json";
import { lensListPath, comparePath, lensDetailPath } from "@/lib/routes";

const LOCALES = routing.locales;

function url(path: string): string {
  return `${SITE.url}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "/lenses",
    lensListPath("x"),
    comparePath("x"),
    lensListPath("gfx"),
    comparePath("gfx"),
    "/about",
    "/get",
  ];

  const staticEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) => [
    {
      url: url(`/${locale}`),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    ...staticPaths.map((path) => ({
      url: url(`/${locale}${path}`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ]);

  const xLensEntries: MetadataRoute.Sitemap = (xLensesData as { id: string }[]).flatMap(
    (lens) =>
      LOCALES.map((locale) => ({
        url: url(`/${locale}${lensDetailPath("x", lens.id)}`),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }))
  );

  const gfxLensEntries: MetadataRoute.Sitemap = (gfxLensesData as { id: string }[]).flatMap(
    (lens) =>
      LOCALES.map((locale) => ({
        url: url(`/${locale}${lensDetailPath("gfx", lens.id)}`),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }))
  );

  return [...staticEntries, ...xLensEntries, ...gfxLensEntries];
}
