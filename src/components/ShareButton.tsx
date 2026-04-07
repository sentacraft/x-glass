"use client";

import { useEffect, useState, useCallback } from "react";
import { Popover } from "@base-ui/react/popover";
import { Drawer } from "@base-ui/react/drawer";
import { useTranslations } from "next-intl";
import { Share2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lens } from "@/lib/types";

interface ShareButtonProps {
  lenses: Lens[];
}

export function ShareButton({ lenses }: ShareButtonProps) {
  const t = useTranslations("Share");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

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

  const truncatedUrl =
    shareUrl.length > 64 ? shareUrl.slice(0, 64) + "…" : shareUrl;

  const triggerLabel = (
    <>
      <Share2 className="size-4" />
      {t("button")}
    </>
  );

  const panelContent = (
    <div className="flex flex-col gap-4 p-4">
      {/* Title + description */}
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("description")}
        </p>
      </div>

      {/* Lens summary */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium tracking-wide text-zinc-400 dark:text-zinc-500 uppercase">
          {t("summary", { count: lenses.length })}
        </p>
        <p className="text-sm leading-snug text-zinc-700 dark:text-zinc-300">
          {lenses.map((l) => l.model).join(", ")}
        </p>
      </div>

      {/* URL preview */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium tracking-wide text-zinc-400 dark:text-zinc-500 uppercase">
          {t("linkLabel")}
        </p>
        <div className="select-all break-all rounded-md bg-zinc-100 px-3 py-2 font-mono text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          {truncatedUrl}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row">
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
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {t("nativeShare")}
          </button>
        )}
      </div>
    </div>
  );

  // Before mount: render a placeholder with the same dimensions to avoid layout shift.
  // After mount: render Popover (desktop) or Drawer (mobile).
  if (!mounted) {
    return (
      <button
        disabled
        className="flex cursor-default items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400"
        aria-hidden
      >
        <Share2 className="size-4" />
        {t("button")}
      </button>
    );
  }

  if (isDesktop) {
    return (
      <Popover.Root
        open={open}
        onOpenChange={(nextOpen) => setOpen(nextOpen)}
      >
        <Popover.Trigger className="flex cursor-pointer items-center gap-1.5 rounded-md text-sm text-zinc-500 outline-none transition-colors hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:hover:text-zinc-50">
          {triggerLabel}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side="bottom" align="end" sideOffset={8}>
            <Popover.Popup className="w-80 origin-(--transform-origin) rounded-xl bg-white shadow-lg ring-1 ring-zinc-200 duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 dark:bg-zinc-900 dark:ring-zinc-800">
              {panelContent}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    );
  }

  // Mobile: bottom sheet via Drawer
  return (
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
        <Drawer.Popup className="fixed inset-x-0 bottom-0 rounded-t-2xl bg-white pb-8 ring-1 ring-zinc-200 duration-200 data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom dark:bg-zinc-900 dark:ring-zinc-800">
          {/* Drag handle */}
          <div className="flex justify-center pb-1 pt-3">
            <div className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          </div>
          {panelContent}
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
