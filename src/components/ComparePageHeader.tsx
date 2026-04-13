"use client";

import { useEffect, useRef, useState } from "react";
import { useScrollContainer } from "@/context/ScrollContainerContext";
import { Z } from "@/config/ui";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ShareButton } from "@/components/ShareButton";
import CompareAddLensButton from "@/components/CompareAddLensButton";
import type { Lens } from "@/lib/types";

interface Props {
  lenses: Lens[];
}

export default function ComparePageHeader({ lenses }: Props) {
  const t = useTranslations("Compare");
  const headerRef = useRef<HTMLDivElement>(null);
  const [showFab, setShowFab] = useState(false);
  const scrollContainer = useScrollContainer();

  // Show the FAB when the header row scrolls behind the nav bar
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowFab(!entry.isIntersecting),
      { root: scrollContainer, rootMargin: "0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [scrollContainer]);

  return (
    <>
      <div ref={headerRef} className="flex items-center gap-3">
        <Link
          href="/lenses"
          className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
        >
          ←
        </Link>
        <h1 className="hidden sm:block text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h1>
        <CompareAddLensButton lenses={lenses} />
        <div className="ml-auto">
          <ShareButton lenses={lenses} />
        </div>
      </div>

      {/* Floating share FAB — slides up when the header share button is out of view */}
      <div
        className={`fixed bottom-6 right-4 ${Z.fixed} transition-all duration-200 sm:right-6 ${
          showFab
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-3 pointer-events-none"
        }`}
        aria-hidden={!showFab}
      >
        <ShareButton lenses={lenses} variant="fab" />
      </div>
    </>
  );
}
