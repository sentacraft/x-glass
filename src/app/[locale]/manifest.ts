import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";
import { getMessagesForLocale, resolveLocale } from "@/i18n/messages";

export default async function manifest({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<MetadataRoute.Manifest> {
  const { locale } = await params;
  const resolvedLocale = resolveLocale(locale);
  const messages = await getMessagesForLocale(resolvedLocale);

  return {
    name: SITE.name,
    short_name: SITE.shortName,
    description: messages.Metadata.pwaDescription,
    id: "/",
    start_url: `/${resolvedLocale}`,
    scope: `/${resolvedLocale}`,
    display: SITE.display,
    background_color: SITE.backgroundColor,
    theme_color: SITE.themeColor.dark,
    screenshots: [
      {
        src: "/screenshots/screenshot-mobile.png",
        sizes: "390x844",
        type: "image/png",
        label: messages.Metadata.manifestLabelHome,
      },
      {
        src: "/screenshots/screenshot-desktop.png",
        sizes: "1280x800",
        type: "image/png",
        form_factor: "wide",
        label: messages.Metadata.manifestLabelBrowser,
      },
    ],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
