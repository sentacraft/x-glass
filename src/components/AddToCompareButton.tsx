"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useCompare } from "@/context/CompareContext";

interface Props {
  lensId: string;
}

export default function AddToCompareButton({ lensId }: Props) {
  const t = useTranslations("LensDetail");
  const router = useRouter();
  const { compareIds, toggleCompare, canToggle } = useCompare();

  function handleClick() {
    const alreadyIn = compareIds.includes(lensId);
    if (!alreadyIn && canToggle(lensId)) {
      toggleCompare(lensId);
    }
    const ids = alreadyIn
      ? compareIds
      : [...compareIds, lensId];
    router.push(`/lenses/compare?ids=${ids.join(",")}`);
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
    >
      {t("addToCompare")}
    </button>
  );
}
