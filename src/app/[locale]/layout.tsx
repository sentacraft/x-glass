import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import Nav from "@/components/Nav";
import ConsoleEgg from "@/components/ConsoleEgg";
import TestHookPanel from "@/components/TestHookPanel";
import { CompareProvider } from "@/context/CompareProvider";
import { ScrollContainer, ScrollContainerProvider } from "@/context/ScrollContainerContext";
import { TestHookProvider } from "@/context/TestHookProvider";
import { TESTHOOK_ALLOWED } from "@/lib/testhook";
import { SITE } from "@/config/site";
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

export const metadata: Metadata = {
  title: {
    default: "X-Glass | Fujifilm X Mount Lens Comparison Tool",
    template: "%s | X-Glass",
  },
  description: SITE.description,
  // Explicit icon declarations — setting `icons` in metadata disables Next.js
  // file-convention auto-discovery, so both `icon` and `apple` must be listed.
  icons: {
    icon: [
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: SITE.shortName,
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    siteName: SITE.name,
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
};

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
    <div
      lang={locale}
      className="flex h-svh flex-col overflow-hidden"
    >
      <NextIntlClientProvider messages={messages}>
        <CompareProvider>
          <ScrollContainerProvider>
            <ConsoleEgg />
            <Nav />
            <ScrollContainer>
              {/* Offset fixed nav at top; respect home indicator at bottom.
                  safe-area-inset-bottom prevents content from sitting in the
                  iOS gesture zone in standalone PWA mode (falls back to 0px). */}
              <div className="pt-[var(--nav-height)] pb-[env(safe-area-inset-bottom,0px)] h-full">
                {TESTHOOK_ALLOWED ? (
                  <TestHookProvider>
                    {children}
                    <TestHookPanel />
                  </TestHookProvider>
                ) : (
                  children
                )}
              </div>
            </ScrollContainer>
          </ScrollContainerProvider>
        </CompareProvider>
      </NextIntlClientProvider>
    </div>
  );
}
