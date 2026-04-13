import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import Nav from "@/components/Nav";
import ConsoleEgg from "@/components/ConsoleEgg";
import TestHookPanel from "@/components/TestHookPanel";
import { CompareProvider } from "@/context/CompareProvider";
import { ScrollContainer } from "@/context/ScrollContainerContext";
import { TestHookProvider } from "@/context/TestHookProvider";
import { TESTHOOK_ALLOWED } from "@/lib/testhook";
import "../globals.css";

export const viewport: Viewport = {
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "X-Glass | Fujifilm X Mount Lens Comparison Tool",
    template: "%s | X-Glass",
  },
  description:
    "Not a recommendation engine — a structured lens comparison tool for Fujifilm X users. All brands. One dataset.",
  openGraph: {
    siteName: "X-Glass",
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
          <ConsoleEgg />
          <Nav />
          <ScrollContainer>
            {TESTHOOK_ALLOWED ? (
              <TestHookProvider>
                {children}
                <TestHookPanel />
              </TestHookProvider>
            ) : (
              children
            )}
          </ScrollContainer>
        </CompareProvider>
      </NextIntlClientProvider>
    </div>
  );
}
