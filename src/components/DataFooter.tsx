"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { meta } from "@/lib/lens";

export default function DataInfo() {
  const t = useTranslations("Footer");
  const locale = useLocale();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 mt-3">
      {t("dataInfo", {
        version: meta.version,
        lensCount: meta.lensCount,
        date: formatDate(meta.lastUpdated),
      })}
    </p>
  );
}
