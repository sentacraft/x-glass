"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

interface Props {
  lensIds: string[];
}

export default function CompareTelemetry({ lensIds }: Props) {
  const firedViewRef = useRef(false);
  const firedScrollRef = useRef(false);

  useEffect(() => {
    if (firedViewRef.current || lensIds.length === 0) {
      return;
    }
    firedViewRef.current = true;
    track("compare_view", {
      lens_slugs: lensIds.join(","),
      lens_count: lensIds.length,
    });
  }, [lensIds]);

  useEffect(() => {
    if (lensIds.length === 0) {
      return;
    }
    function onScroll() {
      if (firedScrollRef.current) {
        return;
      }
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) {
        return;
      }
      const ratio = window.scrollY / scrollable;
      if (ratio >= 0.8) {
        firedScrollRef.current = true;
        track("compare_scroll", { lens_slugs: lensIds.join(",") });
        window.removeEventListener("scroll", onScroll);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lensIds]);

  return null;
}
