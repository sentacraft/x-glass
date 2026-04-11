"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Popover } from "@base-ui/react/popover";
import { Drawer } from "@base-ui/react/drawer";
import { Tabs } from "@base-ui/react/tabs";
import { useTranslations } from "next-intl";
import { Share2, Copy, Check, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lens } from "@/lib/types";
import { drawSharePoster } from "@/lib/share-image";

interface ShareButtonProps {
  lenses: Lens[];
}

export function ShareButton({ lenses }: ShareButtonProps) {
  const t = useTranslations("Share");
  const tImage = useTranslations("ShareImage");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [canShareFile, setCanShareFile] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  // Poster state
  const [posterDataUrl, setPosterDataUrl] = useState<string | null>(null);
  const [posterGenerating, setPosterGenerating] = useState(false);
  const slugRef = useRef("");

  useEffect(() => {
    setMounted(true);
    setShareUrl(window.location.href);
    setCanNativeShare("share" in navigator);

    const mq = window.matchMedia("(min-width: 640px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Keep shareUrl in sync with URL changes (e.g. column reorder updates the URL)
  useEffect(() => {
    if (!open) return;
    setShareUrl(window.location.href);
  }, [open]);

  // Generate poster in the background as soon as the panel opens
  useEffect(() => {
    if (!open) return;
    setPosterDataUrl(null);
    setCanShareFile(false);
    setPosterGenerating(true);

    slugRef.current = lenses
      .map((l) => l.model.replace(/\s+/g, "-").toLowerCase())
      .join("_vs_")
      .slice(0, 60);

    const labels = {
      appName: "X Glass",
      comparison: tImage("comparison"),
      focalLength: tImage("focalLength"),
      maxAperture: tImage("maxAperture"),
      weight: tImage("weight"),
      ois: tImage("ois"),
      wr: tImage("wr"),
      minFocusDist: tImage("minFocusDist"),
      na: tImage("na"),
      siteUrl: "x-glass.app",
    };

    drawSharePoster(lenses, labels)
      .then((url) => {
        setPosterDataUrl(url);
        // Probe file-share capability with a real File object
        if ("canShare" in navigator) {
          fetch(url)
            .then((r) => r.blob())
            .then((blob) => {
              const testFile = new File([blob], "test.png", { type: "image/png" });
              setCanShareFile(
                (navigator as Navigator & { canShare: (data: object) => boolean }).canShare(
                  { files: [testFile] }
                )
              );
            })
            .catch(() => {});
        }
      })
      .catch(console.error)
      .finally(() => setPosterGenerating(false));
    // tImage is a stable translation function — intentionally omitted from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lenses]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable
    }
  }, []);

  const handleNativeShare = useCallback(async () => {
    try {
      await navigator.share({
        title: lenses.map((l) => l.model).join(" vs "),
        url: window.location.href,
      });
    } catch {
      // user cancelled or not supported
    }
  }, [lenses]);

  const handleDownload = useCallback(() => {
    if (!posterDataUrl) return;
    const link = document.createElement("a");
    link.download = `x-glass_${slugRef.current}.png`;
    link.href = posterDataUrl;
    link.click();
  }, [posterDataUrl]);

  const handleShareImage = useCallback(async () => {
    if (!posterDataUrl) return;
    try {
      const blob = await (await fetch(posterDataUrl)).blob();
      const file = new File([blob], `x-glass_${slugRef.current}.png`, {
        type: "image/png",
      });
      await navigator.share({
        files: [file],
        title: lenses.map((l) => l.model).join(" vs "),
      });
    } catch {
      // user cancelled or not supported
    }
  }, [posterDataUrl, lenses]);

  const truncatedUrl =
    shareUrl.length > 56 ? shareUrl.slice(0, 56) + "…" : shareUrl;

  // Compact lens caption: "XF10-18mm F4 · XF10mm F2"
  const lensCaption = lenses.map((l) => l.model).join(" · ");

  const triggerLabel = (
    <>
      <Share2 className="size-4" />
      {t("button")}
    </>
  );

  // Shared tab pill styles
  const tabClass =
    "flex-1 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 data-selected:bg-white data-selected:text-zinc-900 data-selected:shadow-xs dark:text-zinc-400 dark:hover:text-zinc-50 dark:data-selected:bg-zinc-700 dark:data-selected:text-zinc-50 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 cursor-pointer";

  const panelContent = (
    <div className="flex flex-col gap-4 p-4">
      {/* Header: title + compact lens caption */}
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h2>
        <p className="truncate text-xs text-zinc-400 dark:text-zinc-500">
          {lensCaption}
        </p>
      </div>

      {/* Tabs */}
      <Tabs.Root defaultValue="link" className="flex flex-col gap-4">
        <Tabs.List className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
          <Tabs.Tab value="link" className={tabClass}>
            {t("tabLink")}
          </Tabs.Tab>
          <Tabs.Tab value="image" className={tabClass}>
            {t("tabImage")}
          </Tabs.Tab>
        </Tabs.List>

        {/* Link tab */}
        <Tabs.Panel value="link" className="flex flex-col gap-3">
          {/* URL box */}
          <div className="select-all break-all rounded-md bg-zinc-100 px-3 py-2.5 font-mono text-xs leading-relaxed text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {truncatedUrl}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                copied
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-zinc-900 text-zinc-50 hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              )}
            >
              {copied ? (
                <>
                  <Check className="size-4" />
                  {t("copied")}
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  {t("copyLink")}
                </>
              )}
            </button>

            {canNativeShare && (
              <button
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Share2 className="size-4" />
              </button>
            )}
          </div>
        </Tabs.Panel>

        {/* Image tab */}
        <Tabs.Panel value="image" className="flex flex-col gap-3">
          {/* Poster preview: fixed max-height with gradient fade */}
          <div className="relative max-h-52 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-950">
            {posterGenerating ? (
              <div className="flex items-center justify-center gap-2 py-10 text-zinc-400">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-xs">{t("posterGenerating")}</span>
              </div>
            ) : posterDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={posterDataUrl}
                alt={tImage("previewAlt")}
                className="w-full"
              />
            ) : null}
            {/* Bottom gradient fade — only over the actual image */}
            {posterDataUrl && !posterGenerating && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-100 to-transparent dark:from-zinc-950" />
            )}
          </div>

          {/* Actions: Download (primary) + Share (icon-only, conditional) */}
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={!posterDataUrl}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Download className="size-4" />
              {t("posterDownload")}
            </button>
            {canShareFile && (
              <button
                onClick={handleShareImage}
                disabled={!posterDataUrl}
                title={t("posterShare")}
                className="flex items-center justify-center rounded-lg border border-zinc-200 px-3 py-2.5 text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Share2 className="size-4" />
              </button>
            )}
          </div>
        </Tabs.Panel>
      </Tabs.Root>
    </div>
  );

  // Before mount: static placeholder to avoid layout shift
  const shareControl = !mounted ? (
    <button
      disabled
      className="flex cursor-default items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400"
      aria-hidden
    >
      <Share2 className="size-4" />
      {t("button")}
    </button>
  ) : isDesktop ? (
    <Popover.Root open={open} onOpenChange={(nextOpen) => setOpen(nextOpen)}>
      <Popover.Trigger className="flex cursor-pointer items-center gap-1.5 rounded-md text-sm text-zinc-500 outline-none transition-colors hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:hover:text-zinc-50">
        {triggerLabel}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={8}>
          <Popover.Popup className="w-96 max-h-[calc(100svh-80px)] overflow-y-auto origin-(--transform-origin) rounded-xl bg-white shadow-lg ring-1 ring-zinc-200 duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 dark:bg-zinc-900 dark:ring-zinc-800">
            {panelContent}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  ) : (
    // Mobile: bottom sheet via Drawer
    <Drawer.Root
      open={open}
      onOpenChange={(nextOpen) => setOpen(nextOpen)}
      swipeDirection="down"
    >
      <Drawer.Trigger className="flex cursor-pointer items-center gap-1.5 rounded-md text-sm text-zinc-500 outline-none transition-colors hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:hover:text-zinc-50">
        {triggerLabel}
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 bg-black/40 duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <Drawer.Popup className="fixed inset-x-0 bottom-0 max-h-[85svh] overflow-y-auto rounded-t-2xl bg-white pb-8 ring-1 ring-zinc-200 duration-200 data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom dark:bg-zinc-900 dark:ring-zinc-800">
          {/* Drag handle */}
          <div className="sticky top-0 flex justify-center bg-white pb-1 pt-3 dark:bg-zinc-900">
            <div className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          </div>
          {panelContent}
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );

  return shareControl;
}
