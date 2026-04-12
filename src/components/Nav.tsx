"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LensSearchDialog from "@/components/LensSearchDialog";
import LogoMark from "@/components/LogoMark";

export default function Nav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black sticky top-0 z-30">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-50 text-lg tracking-tight"
        >
          <LogoMark size={26} uid="nav" />
          X-Glass
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/lenses"
            className={`text-sm transition-colors ${
              pathname === "/lenses" || pathname.startsWith("/lenses/")
                ? "text-zinc-900 dark:text-zinc-50 font-medium"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
            }`}
          >
            {t("lenses")}
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
          <LensSearchDialog />
        </div>
      </nav>
    </header>
  );
}
