import { useTranslations } from "next-intl";

export default function Tagline() {
  const t = useTranslations("Footer");
  const taglines = [t("tagline1"), t("tagline2"), t("tagline3"), t("tagline4")];
  const tagline = taglines[Math.floor(Math.random() * taglines.length)];

  return (
    <span
      suppressHydrationWarning
      className="text-[11px] text-zinc-400 dark:text-zinc-600 tracking-wide select-none"
    >
      {tagline}
    </span>
  );
}
