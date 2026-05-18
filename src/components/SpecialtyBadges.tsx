import { useTranslations } from "next-intl";
import type { OpticalTrait } from "@/lib/types";

interface SpecialtyBadgesProps {
  isCine: boolean;
  opticalTraits: OpticalTrait[];
}

const cinePillCls =
  "inline-flex items-center rounded-md bg-zinc-900 px-2 py-0.5 text-[11px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900";

const traitPillCls =
  "inline-flex items-center rounded-md border border-zinc-300 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:border-zinc-600 dark:text-zinc-300";

/**
 * Renders specialty pills as a Fragment with no wrapper element — the caller
 * is responsible for placing them inside a flex container. This lets the
 * lens card put them on the same row as the feature badges (so cards with
 * and without specialty share the same vertical rhythm), while the detail
 * and compare pages can wrap them in a dedicated row.
 */
export default function SpecialtyBadges({
  isCine,
  opticalTraits,
}: SpecialtyBadgesProps) {
  const t = useTranslations("SpecialtyBadge");

  return (
    <>
      {isCine ? <span className={cinePillCls}>{t("cine")}</span> : null}
      {opticalTraits.map((trait) => (
        <span key={trait} className={traitPillCls}>
          {t(trait)}
        </span>
      ))}
    </>
  );
}
