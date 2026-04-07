"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { drawSharePoster, type ShareImageLabels } from "@/lib/share-image";
import type { Lens } from "@/lib/types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const slugRef = useRef("");

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

  // Generate the poster whenever the dialog opens
  useEffect(() => {
    if (!open) return;
    setDataUrl(null);
    setGenerating(true);

    slugRef.current = lenses
      .map((l) => l.model.replace(/\s+/g, "-").toLowerCase())
      .join("_vs_")
      .slice(0, 60);

    drawSharePoster(lenses, labels)
      .then((url) => setDataUrl(url))
      .catch(console.error)
      .finally(() => setGenerating(false));
    // labels are stable translations — intentionally not listed as deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lenses]);

  const handleDownload = useCallback(() => {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.download = `x-glass_${slugRef.current}.png`;
    link.href = dataUrl;
    link.click();
  }, [dataUrl]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="w-full max-w-3xl overflow-hidden rounded-2xl shadow-2xl shadow-zinc-950/20"
        showCloseButton
      >
        {/* Header */}
        <DialogHeader className="border-b border-zinc-200 dark:border-zinc-800">
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        {/* Preview area */}
        <div className="flex min-h-60 flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-950 p-6 items-center justify-center">
          {generating ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-zinc-400">
              <Loader2 className="size-6 animate-spin" />
              <span className="text-sm">{t("generating")}</span>
            </div>
          ) : dataUrl ? (
            <>
              <div className="flex flex-col items-center gap-4">
                <p className="self-start text-xs text-zinc-400 dark:text-zinc-500">
                  {t("previewNote")}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dataUrl}
                  alt={t("previewAlt")}
                  style={{ width: 750, height: "auto", display: "block" }}
                  className="rounded-sm shadow-md"
                />
              </div>
            </>
          ) : null}
        </div>

        {/* Footer actions */}
        <DialogFooter>
          <Button size="sm" variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button onClick={handleDownload} disabled={!dataUrl}>
            <Download className="size-4" />
            {t("download")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
