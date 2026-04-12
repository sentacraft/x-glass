"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import LensSearchDialog from "@/components/LensSearchDialog";
import { MAX_COMPARE } from "@/lib/lens";
import type { Lens } from "@/lib/types";

interface Props {
  lenses: Lens[];
}

export default function CompareAddLensButton({ lenses }: Props) {
  const t = useTranslations("Compare");
  const router = useRouter();

  const canAddMore = lenses.length < MAX_COMPARE;
  const currentIds = lenses.map((l) => l.id);

  const handleSelectLens = useCallback(
    (lens: Lens) => {
      if (currentIds.includes(lens.id) || currentIds.length >= MAX_COMPARE) return;
      const nextIds = [...currentIds, lens.id];
      router.replace(`/lenses/compare?ids=${nextIds.join(",")}`);
    },
    [currentIds, router]
  );

  const getResultState = useCallback(
    (candidate: Lens) => ({
      actionLabel: currentIds.includes(candidate.id)
        ? t("alreadyAdded")
        : currentIds.length >= MAX_COMPARE
          ? t("compareFull")
          : t("addToCompareAction"),
      disabled:
        currentIds.includes(candidate.id) ||
        currentIds.length >= MAX_COMPARE,
    }),
    [currentIds, t]
  );

  if (!canAddMore) return null;

  return (
    <LensSearchDialog
      onSelectLens={handleSelectLens}
      getResultState={getResultState}
      triggerVariant="button"
      triggerLabel={t("addLens")}
      triggerClassName="h-9 whitespace-nowrap rounded-full border border-zinc-300 bg-white px-3.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
    />
  );
}
