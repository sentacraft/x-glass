import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getMessagesForLocale, resolveLocale } from "@/i18n/messages";
import Nav from "@/components/Nav";
import ConsoleEgg from "@/components/ConsoleEgg";
import TestHookPanel from "@/components/TestHookPanel";
import { CompareProvider } from "@/context/CompareProvider";
import { ScrollContainerProvider } from "@/context/ScrollContainerContext";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveLocale(locale);
  const messages = await getMessagesForLocale(resolvedLocale);

  return {
    title: {
      default: messages.Metadata.siteTitleDefault,
      template: `%s | ${SITE.name}`,
    },
    description: messages.Metadata.seoDescription,
    manifest: `/${resolvedLocale}/manifest.webmanifest`,
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
    },
    openGraph: {
      siteName: SITE.name,
      type: "website",
      description: messages.Metadata.seoDescription,
      images: [{ url: `/${resolvedLocale}/opengraph-image`, width: 1200, height: 630 }],
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
            {/* Offset fixed nav; respect home indicator in PWA mode. */}
            <div className="pt-[var(--nav-height)] pb-[env(safe-area-inset-bottom,0px)] bg-background">
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
