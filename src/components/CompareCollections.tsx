"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCompare } from "@/context/CompareProvider";
import { useEffectiveMount } from "@/hooks/useMountParam";
import { getLensesByMount } from "@/lib/lens";
import { getSharedCollections } from "@/lib/collections";
import { mountToUrlSegment } from "@/lib/mount";
import type { Lens } from "@/lib/types";

export default function CompareCollections() {
  const t = useTranslations("Compare");
  const locale = useLocale();
  const { compareIds } = useCompare();
  const mount = useEffectiveMount();
  const seg = mountToUrlSegment(mount);

  const activeLenses = useMemo(
    () =>
      compareIds
        .map((id) => getLensesByMount(mount, locale).find((l) => l.id === id))
        .filter((l): l is Lens => l !== undefined),
    [compareIds, mount, locale],
  );

  const sharedCollections = useMemo(
    () => getSharedCollections(activeLenses, mount, locale),
    [activeLenses, mount, locale],
  );

  if (sharedCollections.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {t("collectionsTitle")}
        </h2>
        <Link
          href={`/lenses/${seg}/collections`}
          className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          {t("viewAllCollections")} →
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {sharedCollections.map((c) => (
          <Link
            key={c.slug}
            href={`/lenses/${seg}/collections/${c.slug}`}
            className="group inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-sm transition-colors hover:border-zinc-900 hover:bg-zinc-900 hover:text-white dark:border-zinc-700 dark:hover:border-zinc-100 dark:hover:bg-zinc-100 dark:hover:text-zinc-900"
          >
            <span className="font-normal text-zinc-900 group-hover:text-white dark:text-zinc-100 dark:group-hover:text-zinc-900">
              {locale === "zh" ? c.title.zh : c.title.en}
            </span>
            <span className="text-xs text-zinc-400 group-hover:text-zinc-400 dark:text-zinc-500 dark:group-hover:text-zinc-500">
              {c.lensCount}
            </span>
            <span className="text-zinc-300 group-hover:text-zinc-500 dark:text-zinc-600 dark:group-hover:text-zinc-400" aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
