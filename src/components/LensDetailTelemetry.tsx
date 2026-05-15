"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

interface Props {
  lensSlug: string;
}

const SCROLL_MILESTONES = [50, 90] as const;

export default function LensDetailTelemetry({ lensSlug }: Props) {
  const firedViewRef = useRef(false);
  const firedScrollRef = useRef<Set<number>>(new Set());
  const enteredAtRef = useRef<number>(0);
  const firedDwellRef = useRef(false);

  // lens_view: on mount, once per slug.
  useEffect(() => {
    if (firedViewRef.current) {
      return;
    }
    firedViewRef.current = true;
    enteredAtRef.current = Date.now();
    track("lens_view", {
      lens_slug: lensSlug,
      referrer: typeof document !== "undefined" ? document.referrer.slice(0, 256) : undefined,
    });
  }, [lensSlug]);

  // lens_scroll: 50% and 90% milestones.
  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) {
        return;
      }
      const pct = Math.floor((window.scrollY / scrollable) * 100);
      for (const milestone of SCROLL_MILESTONES) {
        if (pct >= milestone && !firedScrollRef.current.has(milestone)) {
          firedScrollRef.current.add(milestone);
          track("lens_scroll", { lens_slug: lensSlug, depth_pct: milestone });
        }
      }
      if (firedScrollRef.current.size === SCROLL_MILESTONES.length) {
        window.removeEventListener("scroll", onScroll);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lensSlug]);

  // lens_dwell: fire on visibilitychange→hidden or pagehide, once per mount.
  // sendBeacon survives both navigation and tab close.
  useEffect(() => {
    function fireDwell() {
      if (firedDwellRef.current) {
        return;
      }
      firedDwellRef.current = true;
      const seconds = Math.round((Date.now() - enteredAtRef.current) / 1000);
      track("lens_dwell", { lens_slug: lensSlug, seconds });
    }
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        fireDwell();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", fireDwell);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", fireDwell);
    };
  }, [lensSlug]);

  return null;
}
