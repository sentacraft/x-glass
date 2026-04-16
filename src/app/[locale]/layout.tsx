import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import Nav from "@/components/Nav";
import ConsoleEgg from "@/components/ConsoleEgg";
import TestHookPanel from "@/components/TestHookPanel";
import { CompareProvider } from "@/context/CompareProvider";
import { ScrollContainerProvider } from "@/context/ScrollContainerContext";
import { TestHookProvider } from "@/context/TestHookProvider";
import { TESTHOOK_ALLOWED } from "@/lib/testhook";
import { SITE } from "@/config/site";
import { SPLASH_DEVICES, splashUrl, splashMedia } from "@/config/splash";
import "../globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: SITE.themeColor.light },
    { media: "(prefers-color-scheme: dark)",  color: SITE.themeColor.dark  },
  ],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: {
      default: t("seoTitle"),
      template: "%s | X-Glass",
    },
    description: t("seoDescription"),
    // Explicit icon declarations — setting `icons` in metadata disables Next.js
    // file-convention auto-discovery, so both `icon` and `apple` must be listed.
    // Safari requires an explicit favicon.ico link tag; it won't auto-discover it.
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
        { url: "/icon.png", sizes: "32x32", type: "image/png" },
      ],
    },
    appleWebApp: {
      capable: true,
      title: SITE.shortName,
      statusBarStyle: "black-translucent",
      // One PNG per device × color-scheme so iOS shows a branded launch image
      // instead of a white flash during the WebKit startup gap.
      startupImage: SPLASH_DEVICES.flatMap((device) =>
        (["light", "dark"] as const).map((scheme) => ({
          url:   splashUrl(device.label, scheme),
          media: splashMedia(device, scheme),
        }))
      ),
    },
    openGraph: {
      siteName: SITE.name,
      type: "website",
      description: t("seoDescription"),
      images: [{ url: "/opengraph-image.png", width: 1200, height: 630 }],
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <div lang={locale}>
      <NextIntlClientProvider messages={messages}>
        <CompareProvider>
          <ScrollContainerProvider>
            <ConsoleEgg />
            <Nav />
            {/* Offset fixed nav; respect home indicator in PWA mode.
                No background here — body stone-100 shows through the bottom
                padding zone, so safe-area always matches the page canvas color
                regardless of whether the page content is short or non-scrolling. */}
            <div className="pt-[var(--nav-height)] pb-[env(safe-area-inset-bottom,0px)]">
              {TESTHOOK_ALLOWED ? (
                <TestHookProvider>
                  {children}
                  <TestHookPanel />
                </TestHookProvider>
              ) : (
                children
              )}
            </div>
          </ScrollContainerProvider>
        </CompareProvider>
      </NextIntlClientProvider>
    </div>
  );
}
