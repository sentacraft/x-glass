"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export default function Nav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black sticky top-0 z-30">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-bold text-zinc-900 dark:text-zinc-50 text-base tracking-tight"
        >
          X Glass
        </Link>
        <div className="flex items-center gap-6">
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
        </div>
      </nav>
    </header>
  );
}
