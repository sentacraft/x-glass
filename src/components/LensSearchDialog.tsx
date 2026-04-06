"use client";

import {
  type KeyboardEvent,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { allLenses } from "@/lib/lens";
import { searchLensesByModel } from "@/lib/lens-search";
import type { Lens } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LensSearchResultState {
  actionLabel?: string;
  disabled?: boolean;
}

interface LensSearchDialogProps {
  onSelectLens?: (lens: Lens) => void;
  getResultState?: (lens: Lens) => LensSearchResultState | undefined;
  triggerClassName?: string;
  triggerLabel?: string;
  triggerVariant?: "icon" | "button" | "card";
}

export default function LensSearchDialog({
  onSelectLens,
  getResultState,
  triggerClassName,
  triggerLabel,
  triggerVariant = "icon",
}: LensSearchDialogProps) {
  const t = useTranslations("Search");
  const tBrand = useTranslations("Brands");
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const resultsId = useId();
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(
    () => searchLensesByModel(allLenses, deferredQuery),
    [deferredQuery]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
    };
  }, [isOpen]);

  function openDialog() {
    setIsOpen(true);
    setActiveIndex(0);
  }

  function closeDialog() {
    setIsOpen(false);
    setQuery("");
    setActiveIndex(0);
  }

  function handleSelect(lens: Lens) {
    closeDialog();

    if (onSelectLens) {
      onSelectLens(lens);
      return;
    }

    router.push(`/lenses/${lens.id}`);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (results.length === 0) {
        return;
      }
      setActiveIndex((current) => (current + 1) % results.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (results.length === 0) {
        return;
      }
      setActiveIndex((current) => (current - 1 + results.length) % results.length);
      return;
    }

    if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      handleSelect(results[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        aria-label={triggerLabel ?? t("open")}
        className={cn(
          triggerVariant === "icon"
            ? "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-zinc-50"
            : triggerVariant === "button"
              ? "inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:text-zinc-50"
              : "flex min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-[28px] border border-dashed border-zinc-300 bg-zinc-50/60 px-6 py-8 text-center text-zinc-500 transition-colors hover:border-zinc-400 hover:bg-zinc-100/70 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
          triggerClassName
        )}
      >
        <Search className={triggerVariant === "card" ? "h-7 w-7" : "h-4 w-4"} />
        {triggerVariant === "button" ? (
          <span>{triggerLabel ?? t("add")}</span>
        ) : null}
        {triggerVariant === "card" ? (
          <>
            <span className="text-lg font-medium text-zinc-800 dark:text-zinc-100">
              {triggerLabel ?? t("addLens")}
            </span>
            <span className="max-w-[18rem] text-sm text-zinc-500 dark:text-zinc-400">
              {t("cardHint")}
            </span>
          </>
        ) : null}
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/55 px-4 pb-6 pt-[12vh] backdrop-blur-sm"
          onClick={closeDialog}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-2xl shadow-zinc-950/20 dark:border-zinc-800 dark:bg-zinc-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <button
                type="button"
                onClick={closeDialog}
                aria-label={t("close")}
                className="absolute right-5 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="space-y-1 pr-12">
                  <h2
                    id={titleId}
                    className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
                  >
                    {t("title")}
                  </h2>
                  <p
                    id={descriptionId}
                    className="text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    {t("description")}
                  </p>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 shadow-inner shadow-zinc-200/30 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/20">
                <label htmlFor={inputId} className="sr-only">
                  {t("placeholder")}
                </label>
                <Search className="h-4 w-4 shrink-0 text-zinc-400" />
                <input
                  id={inputId}
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={handleInputKeyDown}
                  placeholder={t("placeholder")}
                  aria-controls={resultsId}
                  aria-autocomplete="list"
                  className="w-full border-0 bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-zinc-50"
                />
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-3 py-3">
              {query.trim().length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 px-5 py-10 text-center dark:border-zinc-800">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {t("emptyTitle")}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {t("emptyDescription")}
                  </p>
                </div>
              ) : results.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 px-5 py-10 text-center dark:border-zinc-800">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {t("noResults")}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {t("noResultsHint")}
                  </p>
                </div>
              ) : (
                <div
                  id={resultsId}
                  role="listbox"
                  aria-label={t("results")}
                  className="space-y-2"
                >
                  {results.map((lens, index) => {
                    const isActive = index === activeIndex;
                    const resultState = getResultState?.(lens);
                    const actionLabel = resultState?.actionLabel ?? t("view");
                    const isDisabled = resultState?.disabled ?? false;

                    return (
                      <button
                        key={lens.id}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        disabled={isDisabled}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => handleSelect(lens)}
                        className={cn(
                          "flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition-colors",
                          isDisabled
                            ? "cursor-not-allowed border-transparent bg-zinc-50/80 opacity-60 dark:bg-zinc-900/60"
                            : isActive
                            ? "border-blue-200 bg-blue-50/80 dark:border-blue-900/70 dark:bg-blue-950/30"
                            : "border-transparent bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                        )}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                            {lens.model}
                          </p>
                          <p className="mt-1 truncate text-xs uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                            {tBrand(lens.brand)}
                            {lens.series ? ` · ${lens.series}` : ""}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                          {actionLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
