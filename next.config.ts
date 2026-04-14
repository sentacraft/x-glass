import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import withPWAInit from '@ducanh2912/next-pwa';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const withPWA = withPWAInit({
  dest: "public",
  // Disable in development — no service worker noise during local dev.
  disable: process.env.NODE_ENV === "development",
  // Offline fallback page served when a navigation request fails.
  fallbacks: {
    document: "/offline",
  },
});

const nextConfig: NextConfig = {};

export default withPWA(withNextIntl(nextConfig));
