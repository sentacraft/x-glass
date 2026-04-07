"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { X, Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { ShareImageCard, type ShareImageLabels } from "./ShareImageCard";
import type { Lens } from "@/lib/types";

interface ShareImageDialogProps {
  lenses: Lens[];
  open: boolean;
  onClose: () => void;
}

export function ShareImageDialog({
  lenses,
  open,
  onClose,
}: ShareImageDialogProps) {
  const t = useTranslations("ShareImage");
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const labels: ShareImageLabels = {
    appName: "X Glass",
    comparison: t("comparison"),
    focalLength: t("focalLength"),
    maxAperture: t("maxAperture"),
    weight: t("weight"),
    ois: t("ois"),
    wr: t("wr"),
    minFocusDist: t("minFocusDist"),
    na: t("na"),
    siteUrl: "x-glass.app",
  };

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current || exporting) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        // Tailwind v4 uses oklch/lab color functions which html2canvas
        // can't parse. Strip all stylesheets from the clone so only
        // inline styles (which ShareImageCard uses exclusively) remain.
        onclone: (clonedDoc) => {
          clonedDoc
            .querySelectorAll('style, link[rel="stylesheet"]')
            .forEach((el) => el.remove());
        },
      });
      const link = document.createElement("a");
      const slug = lenses
        .map((l) => l.model.replace(/\s+/g, "-").toLowerCase())
        .join("_vs_")
        .slice(0, 60);
      link.download = `x-glass_${slug}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setExporting(false);
    }
  }, [lenses, exporting]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className="flex flex-col w-full max-w-3xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl shadow-zinc-950/20 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dialog header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h2>
          <button
            onClick={onClose}
            aria-label={t("close")}
            className="flex items-center justify-center w-8 h-8 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-950 p-6">
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">
            {t("previewNote")}
          </p>
          {/* The card is fixed at 750px — scales naturally on wide screens,
              scrolls horizontally on narrow ones */}
          {/* No Tailwind classes here — html2canvas can't parse oklch/lab
              color functions that Tailwind v4 injects into computed styles. */}
          <div
            ref={cardRef}
            style={{
              display: "inline-block",
              boxShadow:
                "0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.08)",
              borderRadius: 2,
            }}
          >
            <ShareImageCard lenses={lenses} labels={labels} />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleDownload}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-zinc-900 text-zinc-50 hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors disabled:opacity-60 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            {exporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {exporting ? t("exporting") : t("download")}
          </button>
        </div>
      </div>
    </div>
  );
}
