"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LensSearchDialog from "@/components/LensSearchDialog";
import Iris from "@/components/Iris";
import { IRIS_NAV } from "@/config/iris-config";
import { useCompare } from "@/context/CompareProvider";
import { useScrollContainer } from "@/context/ScrollContainerContext";
import { cn } from "@/lib/utils";

export default function Nav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const { compareIds } = useCompare();
  const scrollContainer = useScrollContainer();
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  // Hide on scroll-down, reveal on scroll-up (mobile only — sm: always visible via CSS).
  useEffect(() => {
    const el = scrollContainer;
    if (!el) return;
    const onScroll = () => {
      const y = el.scrollTop;
      if (y > lastScrollY.current && y > 56) {
        setHidden(true);
      } else if (y < lastScrollY.current) {
        setHidden(false);
      }
      lastScrollY.current = y;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollContainer]);

  // Always reveal when navigating to a new page.
  useEffect(() => {
    setHidden(false);
    lastScrollY.current = 0;
  }, [pathname]);

  const compareHref =
    compareIds.length > 0
      ? `/lenses/compare?ids=${compareIds.join(",")}`
      : "/lenses/compare";

  return (
    <header
      className={cn(
        "shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black z-30",
        "transition-[margin-top] duration-300 ease-in-out",
        hidden && "-mt-14 sm:mt-0"
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center font-bold text-zinc-900 dark:text-zinc-50 text-lg tracking-tight"
        >
          <Iris config={IRIS_NAV} uid="nav" />
          X-Glass
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/lenses"
            className={`text-sm transition-colors ${
              pathname === "/lenses" ||
              (pathname.startsWith("/lenses/") && !pathname.startsWith("/lenses/compare"))
                ? "text-zinc-900 dark:text-zinc-50 font-medium"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
            }`}
          >
            {t("lenses")}
          </Link>
          <Link
            href={compareHref}
            className={`text-sm transition-colors ${
              pathname.startsWith("/lenses/compare")
                ? "text-zinc-900 dark:text-zinc-50 font-medium"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
            }`}
          >
            {t("compare")}
          </Link>
          <Link
            href="/about"
            className={`text-sm transition-colors ${
              pathname === "/about"
                ? "text-zinc-900 dark:text-zinc-50 font-medium"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
            }`}
          >
            {t("about")}
          </Link>
        </div>
      </nav>
    </header>
  );
}
