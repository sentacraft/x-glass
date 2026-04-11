"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

export default function Tagline() {
  const t = useTranslations("Footer");
  const [tagline, setTagline] = useState<string | null>(null);

  useEffect(() => {
    setTagline(Math.random() < 0.5 ? t("tagline1") : t("tagline2"));
  }, [t]);

  if (!tagline) return null;

  return (
    <span className="text-[11px] text-zinc-300 dark:text-zinc-700 tracking-wide select-none">
      {tagline}
    </span>
  );
}
