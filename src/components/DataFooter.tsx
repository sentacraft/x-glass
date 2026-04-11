"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { meta, brandCount } from "@/lib/lens";

export default function DataInfo() {
  const t = useTranslations("Footer");
  const h = useTranslations("Home");
  const locale = useLocale();
  const [showVersion, setShowVersion] = useState(false);
  const [tagline, setTagline] = useState<string | null>(null);

  useEffect(() => {
    // Pick a tagline randomly on mount to avoid SSR hydration mismatch
    setTagline(Math.random() < 0.5 ? t("tagline1") : t("tagline2"));
  }, [t]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(locale, {
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const versionLabel = `${meta.version} Build ${meta.buildNumber}`;
  const dateLabel = showVersion
    ? versionLabel
    : formatDate(meta.lastUpdated);

  return (
    <div className="flex flex-col items-center gap-1 mt-3">
      <p className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
        {h("dataSnapshot")}
      </p>
      <p
        className="text-center text-xs text-zinc-400 dark:text-zinc-500 cursor-pointer hover:text-zinc-300 dark:hover:text-zinc-400 transition-colors"
        onClick={() => setShowVersion((v) => !v)}
      >
        {h("dataSnapshotMeta", {
          count: meta.lensCount,
          brands: brandCount,
          date: dateLabel,
        })}
      </p>
      {tagline && (
        <p className="text-xs text-zinc-300 dark:text-zinc-600 italic mt-1">
          {tagline}
        </p>
      )}
    </div>
  );
}
