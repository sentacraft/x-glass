"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { Lens } from "@/lib/types";

interface Props {
  selectedLenses: Lens[];
  onRemove: (id: string) => void;
}

export default function CompareBar({ selectedLenses, onRemove }: Props) {
  const t = useTranslations("LensList");
  const router = useRouter();

  if (selectedLenses.length === 0) {
    return null;
  }

  function handleCompare() {
    const ids = selectedLenses.map((l) => l.id).join(",");
    router.push(`/lenses/compare?ids=${ids}`);
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-black/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
        <div className="flex gap-2 flex-1 min-w-0 overflow-x-auto">
          {selectedLenses.map((lens) => (
            <div
              key={lens.id}
              className="flex items-center gap-1.5 shrink-0 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-2.5 py-1"
            >
              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 max-w-[120px] truncate">
                {lens.model}
              </span>
              <button
                onClick={() => onRemove(lens.id)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-base leading-none"
                aria-label={`Remove ${lens.model}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={handleCompare}
          disabled={selectedLenses.length < 2}
          className="shrink-0 text-sm font-medium px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {t("goCompare", { count: selectedLenses.length })}
        </button>
      </div>
    </div>
  );
}
