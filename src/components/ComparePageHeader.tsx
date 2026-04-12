"use client";

import { useEffect, useRef, useState } from "react";
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

  // Show the FAB when the header row scrolls behind the nav bar
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowFab(!entry.isIntersecting),
      // Shrink the root rect by the nav height (56px) so the FAB appears
      // as soon as the header disappears behind the nav, not the viewport top
      { rootMargin: "-56px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={headerRef} className="flex items-center gap-3">
        <Link
          href="/lenses"
          className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
        >
          ←
        </Link>
        <h1 className="hidden sm:block text-2xl font-bold text-zinc-900 dark:text-zinc-50 shrink-0">
          {t("title")}
        </h1>
        <div className="flex flex-1 px-2">
          <CompareAddLensButton
            lenses={lenses}
            triggerClassName="flex w-full items-center justify-start gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-300 hover:bg-white hover:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-400 transition-colors"
          />
        </div>
        <div className="shrink-0">
          <ShareButton lenses={lenses} />
        </div>
      </div>

      {/* Floating share FAB — slides up when the header share button is out of view */}
      <div
        className={`fixed bottom-6 right-4 z-40 transition-all duration-200 sm:right-6 ${
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
