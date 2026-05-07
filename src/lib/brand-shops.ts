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
 * Search query: just `lens.model` (no brand prefix). Each search_url already
 * targets the brand's official store, so the brand name in the query is
 * redundant — and dropping it sidesteps the Tmall/Taobao GBK-vs-UTF-8
 * decoding ambiguity that surfaced in early testing (Tmall defaulted to
 * GBK and rendered the URL-encoded UTF-8 brand bytes as garbage Chinese).
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

function buildUrl(template: string, model: string): string {
  return template.replace(/\{q\}/g, encodeURIComponent(model));
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
    url: buildUrl(entry.search_url, lens.model),
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
