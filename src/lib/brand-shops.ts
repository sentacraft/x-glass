/**
 * Brand-official shop search URLs for the lens detail page's
 * Where-to-buy entry.
 *
 * The data lives in src/data/brand-shops.json — currently hand-derived from
 * x-glass-pipeline/shop-links.yaml; once the pipeline publish step automates
 * emission of this file, brand-shops.json becomes pipeline-owned and this
 * module stays unchanged.
 *
 * Currently every channel entry is exposed as its own button (debug mode —
 * surfacing all sources for evaluation). Quality-based filtering / merging
 * happens later, before re-enabling auto-deploy.
 *
 * Search query strategy splits by brand origin:
 *
 *   - Chinese brands (7artisans / ttartisan / brightinstar / sgimage /
 *     viltrox) — query is constructed from structured fields:
 *       [AF if af] <focal> <aperture>
 *     e.g. "MF 4mm F2.8" → "4 2.8", "AF 25mm F1.8 LITE" → "AF 25 1.8".
 *     Their retail listings use loose, inconsistent naming (no MF tag,
 *     lowercase f, joined "AF25mmF1.8" tokens, generation suffixes that
 *     drop off as new SKUs replace old), so a structurally-derived query
 *     gets cleaner recall than any regex on lens.model. Variant suffixes
 *     like "LITE" / "PRO" are intentionally dropped — the user picks
 *     from results when both variants share focal/aperture/af.
 *
 *   - Japanese brands (fujifilm / sigma / tamron) — query is the lens.model
 *     verbatim. Their retail listings (mostly self-op flagship stores)
 *     keep faithful product names with full marketing strings ("XF 35mm
 *     F1.4 R", "18-50mm F2.8 DC DN", "11-20mm F/2.8 Di III-A RXD"), so
 *     letting the user search for the exact model name produces precise
 *     matches and preserves generation / lens-line distinctions.
 *
 * Brand name is NOT prepended to the query: each search_url already
 * targets a brand-official store. Including a CJK brand prefix would also
 * reignite Tmall's GBK/UTF-8 decoding ambiguity for non-ASCII queries.
 */

import type { Lens } from "@/lib/types";
import shopData from "@/data/brand-shops.json";

interface ChannelEntry {
  kind: string;
  search_url: string;
  region?: string;
}

interface BrandChannels {
  cn?: ChannelEntry[];
  global?: ChannelEntry[];
}

const SHOP_DATA = shopData as Record<string, BrandChannels | string>;

export interface ShopLink {
  market: "cn" | "global";
  kind: string;
  region?: string;
  url: string;
}

const CN_BRANDS = new Set([
  "7artisans",
  "ttartisan",
  "brightinstar",
  "sgimage",
  "viltrox",
]);

function buildSearchQuery(lens: Lens): string {
  if (!CN_BRANDS.has(lens.brand)) {
    return lens.model;
  }
  const focal =
    lens.focalLengthMin === lens.focalLengthMax
      ? String(lens.focalLengthMin)
      : `${lens.focalLengthMin}-${lens.focalLengthMax}`;
  const aperture = Array.isArray(lens.maxAperture)
    ? `${lens.maxAperture[0]}-${lens.maxAperture[1]}`
    : String(lens.maxAperture);
  return [lens.af ? "AF" : null, focal, aperture].filter(Boolean).join(" ");
}

function buildUrl(template: string, lens: Lens): string {
  return template.replace(/\{q\}/g, encodeURIComponent(buildSearchQuery(lens)));
}

function expandMarket(
  market: "cn" | "global",
  entries: ChannelEntry[] | undefined,
  lens: Lens,
): ShopLink[] {
  if (!entries) {
    return [];
  }
  return entries.map((entry) => ({
    market,
    kind: entry.kind,
    region: entry.region,
    url: buildUrl(entry.search_url, lens),
  }));
}

export function getShopLinks(lens: Lens): ShopLink[] {
  const channels = SHOP_DATA[lens.brand];
  if (!channels || typeof channels === "string") {
    return [];
  }
  return [
    ...expandMarket("cn", channels.cn, lens),
    ...expandMarket("global", channels.global, lens),
  ];
}
