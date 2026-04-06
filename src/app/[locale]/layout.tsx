import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import Nav from "@/components/Nav";
import TestHookPanel from "@/components/TestHookPanel";
import { CompareProvider } from "@/context/CompareProvider";
import { TestHookProvider } from "@/context/TestHookProvider";
import { TESTHOOK_ALLOWED } from "@/lib/testhook";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "X Glass",
    template: "%s | X Glass",
  },
  description:
    "Fujifilm X-Mount lens comparison tool — filter, compare specs, and convert focal lengths. 富士 X 卡口镜头对比工具。",
  openGraph: {
    siteName: "X Glass",
    type: "website",
  },
  twitter: {
    card: "summary",
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
      className={`${GeistSans.variable} ${GeistMono.variable} min-h-full font-sans antialiased`}
    >
      <NextIntlClientProvider messages={messages}>
        <CompareProvider>
          <Nav />
          {TESTHOOK_ALLOWED ? (
            <TestHookProvider>
              {children}
              <TestHookPanel />
            </TestHookProvider>
          ) : (
            children
          )}
        </CompareProvider>
      </NextIntlClientProvider>
    </div>
  );
}
