// Global site / brand configuration — single source of truth for metadata that
// appears across multiple contexts: PWA manifest, <head> meta tags, OG image.
//
// Keep this file framework-agnostic (no Next.js imports) so it can be consumed
// by scripts, the pipeline, and future packages in a monorepo.

export interface SiteConfig {
  /** Full display name shown in browser chrome and install prompts. */
  name: string;
  /** Short name for home screen icons (≤ 12 chars recommended). */
  shortName: string;
  /** One-line site description for <meta name="description"> and manifest. */
  description: string;
  /** Theme color for browser UI chrome, keyed by color scheme. */
  themeColor: { light: string; dark: string };
  /**
   * Background color shown on the PWA splash screen before the first paint.
   * Should match the app's primary background to avoid a flash.
   */
  backgroundColor: string;
  /** PWA display mode. "standalone" hides browser UI. */
  display: "standalone" | "minimal-ui" | "fullscreen" | "browser";
}

export const SITE: SiteConfig = {
  name: "X-Glass",
  shortName: "X-Glass",
  description:
    "An independent tool for browsing and comparing Fujifilm X-mount lenses across all brands.",
  themeColor: {
    light: "#ffffff",
    dark: "#0a0a0a",
  },
  // Matches dark-mode --background (oklch(0.145 0 0) ≈ #0a0a0a).
  // Using the dark shade so the splash screen matches the app on dark-mode devices.
  backgroundColor: "#0a0a0a",
  display: "standalone",
};
