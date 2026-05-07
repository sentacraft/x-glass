/**
 * Brand-official shop search URL templates.
 *
 * X-Glass does not store or display prices. Instead, each lens detail page
 * exposes one or two buttons that hand users off to the brand's own official
 * channel where they can see the current price themselves. We deliberately
 * link to brand-controlled endpoints (brand shop search, or JD official
 * flagship store search via brand-name-qualified query) rather than
 * third-party retailers (B&H / Amazon / Adorama / Taobao), to avoid implicit
 * endorsement of any commercial partner.
 *
 * Each template takes the prebuilt query string ("<brand> <model>") and
 * returns the destination URL. The brand portion of the query is sourced from
 * the i18n message catalogs — no separate keyword registry is maintained.
 *
 * `buildGlobalUrl` absent ⇒ no working brand-official global channel ⇒ the
 * corresponding button is not rendered (currently only `sgimage`).
 */

import type { Lens } from "@/lib/types";
import enMessages from "@/messages/en.json";
import zhMessages from "@/messages/zh.json";

const EN_BRAND_NAMES = enMessages.Brands as Record<string, string>;
const ZH_BRAND_NAMES = zhMessages.Brands as Record<string, string>;

interface BrandShop {
  buildGlobalUrl?: (query: string) => string;
}

const JD_SEARCH = (query: string) =>
  `https://search.jd.com/Search?keyword=${encodeURIComponent(query)}&enc=utf-8`;

const SHOPIFY_SEARCH = (origin: string) => (query: string) =>
  `${origin}/search?q=${encodeURIComponent(query)}`;

const BRAND_SHOPS: Record<string, BrandShop> = {
  // Magento-based storefront.
  fujifilm: {
    buildGlobalUrl: (q) =>
      `https://shopusa.fujifilm-x.com/catalogsearch/result/?q=${encodeURIComponent(q)}`,
  },
  sigma: {
    buildGlobalUrl: (q) =>
      `https://www.sigmaphoto.com/catalogsearch/result/?q=${encodeURIComponent(q)}`,
  },
  // Tamron Americas does not sell direct; search returns the brand's own
  // product/article hits, which is still preferable to any 3rd-party retailer.
  tamron: {
    buildGlobalUrl: (q) =>
      `https://www.tamron-americas.com/?s=${encodeURIComponent(q)}`,
  },
  viltrox: { buildGlobalUrl: SHOPIFY_SEARCH("https://viltrox.com") },
  ttartisan: { buildGlobalUrl: SHOPIFY_SEARCH("https://ttartisan.store") },
  "7artisans": { buildGlobalUrl: SHOPIFY_SEARCH("https://7artisans.store") },
  brightinstar: { buildGlobalUrl: SHOPIFY_SEARCH("https://brightinstar.com") },
  // sgimage.com is a parked domain — no global button.
  sgimage: {},
};

export interface ShopLink {
  market: "cn" | "global";
  url: string;
}

export function getShopLinks(lens: Lens): ShopLink[] {
  const brand = BRAND_SHOPS[lens.brand];
  if (!brand) {
    return [];
  }
  const links: ShopLink[] = [];

  const cnBrand = ZH_BRAND_NAMES[lens.brand];
  if (cnBrand) {
    links.push({
      market: "cn",
      url: JD_SEARCH(`${cnBrand} ${lens.model}`),
    });
  }

  const globalBrand = EN_BRAND_NAMES[lens.brand];
  if (brand.buildGlobalUrl && globalBrand) {
    links.push({
      market: "global",
      url: brand.buildGlobalUrl(`${globalBrand} ${lens.model}`),
    });
  }

  return links;
}
