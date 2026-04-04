import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import Nav from "@/components/Nav";
import TestHookPanel from "@/components/TestHookPanel";
import { CompareProvider } from "@/context/CompareProvider";
import { TestHookProvider } from "@/context/TestHookProvider";
import { TESTHOOK_ALLOWED } from "@/lib/testhook";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
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
      </body>
    </html>
  );
}
