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
 * Templates take a `model` string (the lens model field) and return the URL
 * to navigate to. They prepend a brand keyword so the search results surface
 * the official store first, even on JD where no `exbrand` filter is applied.
 *
 * Returning `undefined` for a market means "no brand-official channel
 * available in that market" — the corresponding button is not rendered.
 */

import type { Lens } from "@/lib/types";

interface BrandShop {
  /** Display brand keyword used inside the search query in the CN market. */
  cnKeyword: string;
  /** Display brand keyword used inside the search query for the global market. */
  globalKeyword: string;
  /** Build the global market shop URL. Return undefined if the brand has no global official channel. */
  buildGlobalUrl?: (query: string) => string;
}

const JD_SEARCH = (query: string) =>
  `https://search.jd.com/Search?keyword=${encodeURIComponent(query)}&enc=utf-8`;

const SHOPIFY_SEARCH = (origin: string) => (query: string) =>
  `${origin}/search?q=${encodeURIComponent(query)}`;

const BRAND_SHOPS: Record<string, BrandShop> = {
  fujifilm: {
    cnKeyword: "富士",
    globalKeyword: "Fujifilm",
    // Magento-based storefront.
    buildGlobalUrl: (q) =>
      `https://shopusa.fujifilm-x.com/catalogsearch/result/?q=${encodeURIComponent(q)}`,
  },
  sigma: {
    cnKeyword: "适马",
    globalKeyword: "Sigma",
    buildGlobalUrl: (q) =>
      `https://www.sigmaphoto.com/catalogsearch/result/?q=${encodeURIComponent(q)}`,
  },
  tamron: {
    cnKeyword: "腾龙",
    globalKeyword: "Tamron",
    // Tamron Americas does not sell direct; search returns the brand's own
    // product/article hits, which is still preferable to any 3rd-party retailer.
    buildGlobalUrl: (q) =>
      `https://www.tamron-americas.com/?s=${encodeURIComponent(q)}`,
  },
  viltrox: {
    cnKeyword: "唯卓仕",
    globalKeyword: "Viltrox",
    buildGlobalUrl: SHOPIFY_SEARCH("https://viltrox.com"),
  },
  ttartisan: {
    cnKeyword: "铭匠光学",
    globalKeyword: "TTArtisan",
    buildGlobalUrl: SHOPIFY_SEARCH("https://ttartisan.store"),
  },
  "7artisans": {
    cnKeyword: "七工匠",
    globalKeyword: "7Artisans",
    buildGlobalUrl: SHOPIFY_SEARCH("https://7artisans.store"),
  },
  brightinstar: {
    cnKeyword: "星曜光学",
    globalKeyword: "Brightin Star",
    buildGlobalUrl: SHOPIFY_SEARCH("https://brightinstar.com"),
  },
  sgimage: {
    cnKeyword: "深光影像",
    globalKeyword: "SG Image",
    // No working brand-official storefront found at sgimage.com (parked).
    // Skip the global button rather than fall back to a third-party retailer.
  },
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
  const links: ShopLink[] = [
    {
      market: "cn",
      url: JD_SEARCH(`${brand.cnKeyword} ${lens.model}`),
    },
  ];
  if (brand.buildGlobalUrl) {
    links.push({
      market: "global",
      url: brand.buildGlobalUrl(`${brand.globalKeyword} ${lens.model}`),
    });
  }
  return links;
}
