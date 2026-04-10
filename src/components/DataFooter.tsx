"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { meta } from "@/lib/lens";

export default function DataInfo() {
  const t = useTranslations("Footer");
  const locale = useLocale();
  const [showVersion, setShowVersion] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(locale, {
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const versionLabel = `${meta.version} Build ${meta.buildNumber}`;

  return (
    <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 mt-3">
      {t("dataInfo", { lensCount: meta.lensCount })}{" "}
      <span
        onClick={() => setShowVersion((v) => !v)}
        className="cursor-pointer hover:text-zinc-300 dark:hover:text-zinc-400 transition-colors"
      >
        {showVersion
          ? versionLabel
          : `${t("updatedPrefix")} ${formatDate(meta.lastUpdated)}`}
      </span>
    </p>
  );
}
