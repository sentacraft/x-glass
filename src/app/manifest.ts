import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.shortName,
    description: SITE.description,
    // Explicit app ID — prevents DevTools warning about falling back to start_url.
    id: "/",
    start_url: "/",
    scope: "/",
    display: SITE.display,
    background_color: SITE.backgroundColor,
    theme_color: SITE.themeColor.dark,
    screenshots: [
      {
        src: "/screenshots/screenshot-mobile.png",
        sizes: "390x844",
        type: "image/png",
        // No form_factor → treated as mobile/narrow by Chrome.
        label: "X-Glass home screen",
      },
      {
        src: "/screenshots/screenshot-desktop.png",
        sizes: "1280x800",
        type: "image/png",
        form_factor: "wide",
        label: "X-Glass lens browser",
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
