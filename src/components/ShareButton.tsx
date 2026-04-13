"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useGesture } from "@use-gesture/react";
import { Popover } from "@base-ui/react/popover";
import { Drawer } from "@base-ui/react/drawer";
import { Tabs } from "@base-ui/react/tabs";
import { useTranslations } from "next-intl";
import { Share2, Copy, Check, Download, Loader2, Expand, SlidersHorizontal, Maximize2, Minimize2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Z } from "@/config/ui";
import { cn } from "@/lib/utils";
import type { Lens } from "@/lib/types";
import { rasterizePoster } from "@/lib/share-image";
import { SharePoster, type PosterLabels } from "@/components/poster/SharePoster";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

// Scale the 750px poster down to fit the panel content area
const POSTER_W = 750;
const PREVIEW_SCALE = 352 / POSTER_W; // ≈ 0.469
const PREVIEW_SCALED_W = POSTER_W * PREVIEW_SCALE; // 352px — visual width after scale
const PREVIEW_H = 310; // visible preview height in pixels

interface ShareButtonProps {
  lenses: Lens[];
  variant?: "default" | "fab";
}

export function ShareButton({ lenses, variant = "default" }: ShareButtonProps) {
  const t = useTranslations("Share");
  const tImage = useTranslations("ShareImage");
  const tBrand = useTranslations("Brands");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [canShareFile, setCanShareFile] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  // Poster rasterization state (only needed for download / system share)
  const [posterGenerating, setPosterGenerating] = useState(false);

  // Ref to the rendered <SharePoster /> root node
  const posterRef = useRef<HTMLDivElement>(null);

  // Customization
  const [customTitle, setCustomTitle] = useState("");
  const [customSlogan, setCustomSlogan] = useState("");
  const [customOpen, setCustomOpen] = useState(false);

  // Full-size poster viewer
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [posterViewMode, setPosterViewMode] = useState<"fit" | "actual">("fit");
  const [viewerScale, setViewerScale] = useState(1);
  const [viewerOffset, setViewerOffset] = useState({ x: 0, y: 0 });
  const [stageRect, setStageRect] = useState({ width: 0, height: 0 });
  const [posterRect, setPosterRect] = useState({ width: POSTER_W, height: 0 });
  const viewerStageRef = useRef<HTMLDivElement | null>(null);
  const viewerPosterRef = useRef<HTMLDivElement | null>(null);

  // Filename slug
  const slugRef = useRef("");

  useEffect(() => {
    setMounted(true);
    setShareUrl(window.location.href);
    setCanNativeShare("share" in navigator);

    // Check PNG file sharing support with a dummy file
    if ("canShare" in navigator) {
      const testFile = new File(["x"], "test.png", { type: "image/png" });
      setCanShareFile(
        (navigator as Navigator & { canShare: (d: object) => boolean }).canShare({
          files: [testFile],
        })
      );
    }

    const mq = window.matchMedia("(min-width: 640px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Keep shareUrl in sync when panel opens
  useEffect(() => {
    if (!open) {
      return;
    }
    setShareUrl(window.location.href);
    slugRef.current = lenses
      .map((l) => l.model.replace(/\s+/g, "-").toLowerCase())
      .join("_vs_")
      .slice(0, 60);
  }, [open, lenses]);

  // Build poster labels from i18n
  const posterLabels: PosterLabels = {
    appName: "X Glass",
    siteUrl: "x-glass.app",
    cta: tImage("cta"),
    comparison: tImage("comparison"),
    sectionFocalCoverage: tImage("sectionFocalCoverage"),
    sectionFocus: tImage("sectionFocus"),
    sectionSizeWeight: tImage("sectionSizeWeight"),
    sectionFeatures: tImage("sectionFeatures"),
    sectionDetails: tImage("sectionDetails"),
    minFocusLabel: tImage("minFocusLabel"),
    maxMagLabel: tImage("maxMagLabel"),
    weightLabel: tImage("weightLabel"),
    dimensionsLabel: tImage("dimensionsLabel"),
    filterLabel: tImage("filterLabel"),
    focusMotorLabel: tImage("focusMotorLabel"),
    lensConfigLabel: tImage("lensConfigLabel"),
    featureWR: tImage("featureWR"),
    featureOIS: tImage("featureOIS"),
    featureAF: tImage("featureAF"),
    featureApertureRing: tImage("featureApertureRing"),
    featureInternalFocusing: tImage("featureInternalFocusing"),
    motorLinear: tImage("motorLinear"),
    motorStepping: tImage("motorStepping"),
    motorOther: tImage("motorOther"),
    wide: tImage("wide"),
    tele: tImage("tele"),
    tagCine: tImage("tagCine"),
    tagAnamorphic: tImage("tagAnamorphic"),
    tagTilt: tImage("tagTilt"),
    tagShift: tImage("tagShift"),
    tagMacro: tImage("tagMacro"),
    tagUltraMacro: tImage("tagUltraMacro"),
    tagFisheye: tImage("tagFisheye"),
    tagProbe: tImage("tagProbe"),
    na: tImage("na"),
  };

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

  const handleDownload = useCallback(async () => {
    if (!posterRef.current) {
      return;
    }
    setPosterGenerating(true);
    try {
      const url = await rasterizePoster(posterRef.current);
      const link = document.createElement("a");
      link.download = `x-glass_${slugRef.current}.png`;
      link.href = url;
      link.click();
    } catch (e) {
      console.error(e);
    } finally {
      setPosterGenerating(false);
    }
  }, []);

  const handleShareImage = useCallback(async () => {
    if (!posterRef.current) {
      return;
    }
    setPosterGenerating(true);
    let url: string | undefined;
    try {
      url = await rasterizePoster(posterRef.current);
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], `x-glass_${slugRef.current}.png`, {
        type: "image/png",
      });
      await navigator.share({
        files: [file],
        title: lenses.map((l) => l.model).join(" vs "),
      });
    } catch (err) {
      // User cancelled — no fallback needed
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      // Share API unsupported or failed — fall back to download
      if (url) {
        const link = document.createElement("a");
        link.download = `x-glass_${slugRef.current}.png`;
        link.href = url;
        link.click();
      }
    } finally {
      setPosterGenerating(false);
    }
  }, [lenses]);

  const truncatedUrl =
    shareUrl.length > 56 ? shareUrl.slice(0, 56) + "…" : shareUrl;

  const lensCaption = lenses.map((l) => `${tBrand(l.brand)} · ${l.model}`).join(" / ");

  const triggerLabel = (
    <>
      <Share2 className="size-5" />
      <span className="hidden sm:inline">{t("button")}</span>
    </>
  );

  const tabClass =
    "flex-1 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 data-[active]:bg-white data-[active]:text-zinc-900 data-[active]:shadow-xs dark:text-zinc-400 dark:hover:text-zinc-50 dark:data-[active]:bg-zinc-700 dark:data-[active]:text-zinc-50 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 cursor-pointer";

  const inputClass =
    "w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:text-zinc-50 dark:placeholder:text-zinc-600";

  const posterCustom = {
    title: customTitle.trim() || undefined,
    slogan: customSlogan.trim() || undefined,
  };

  const openPosterViewer = useCallback(() => {
    setPosterViewMode("fit");
    setLightboxOpen(true);
  }, []);

  const fitScale =
    stageRect.width > 0 && stageRect.height > 0 && posterRect.height > 0
      ? Math.min(stageRect.width / posterRect.width, stageRect.height / posterRect.height, 1)
      : 1;

  const clampOffset = useCallback(
    (nextScale: number, nextOffset: { x: number; y: number }) => {
      if (!stageRect.width || !stageRect.height || !posterRect.width || !posterRect.height) {
        return nextOffset;
      }

      const scaledWidth = posterRect.width * nextScale;
      const scaledHeight = posterRect.height * nextScale;
      const maxX = Math.max(0, (scaledWidth - stageRect.width) / 2);
      const maxY = Math.max(0, (scaledHeight - stageRect.height) / 2);

      return {
        x: Math.min(maxX, Math.max(-maxX, nextOffset.x)),
        y: Math.min(maxY, Math.max(-maxY, nextOffset.y)),
      };
    },
    [posterRect.height, posterRect.width, stageRect.height, stageRect.width]
  );

  useEffect(() => {
    if (!lightboxOpen) {
      return;
    }

    const stageEl = viewerStageRef.current;
    const posterEl = viewerPosterRef.current;
    if (!stageEl || !posterEl) {
      return;
    }

    const updateRects = () => {
      setStageRect({
        width: stageEl.clientWidth,
        height: stageEl.clientHeight,
      });
      setPosterRect({
        width: posterEl.scrollWidth || POSTER_W,
        height: posterEl.scrollHeight,
      });
    };

    updateRects();
    const observer = new ResizeObserver(updateRects);
    observer.observe(stageEl);
    observer.observe(posterEl);
    return () => observer.disconnect();
  }, [lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen) {
      setViewerOffset({ x: 0, y: 0 });
      setViewerScale(1);
      return;
    }

    if (posterViewMode === "fit") {
      setViewerScale(fitScale);
      setViewerOffset({ x: 0, y: 0 });
      return;
    }

    if (posterViewMode === "actual") {
      setViewerScale(1);
      setViewerOffset(clampOffset(1, { x: 0, y: 0 }));
    }
  }, [clampOffset, fitScale, lightboxOpen, posterViewMode]);

  const viewerScaleRef = useRef(viewerScale);
  const viewerOffsetRef = useRef(viewerOffset);
  const pinchStartScaleRef = useRef(1);
  const pinchStartOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    viewerScaleRef.current = viewerScale;
  }, [viewerScale]);

  useEffect(() => {
    viewerOffsetRef.current = viewerOffset;
  }, [viewerOffset]);

  const updateViewerTransform = useCallback(
    (nextScale: number, nextOffset: { x: number; y: number }) => {
      const boundedOffset = clampOffset(nextScale, nextOffset);
      setViewerScale(nextScale);
      setViewerOffset(boundedOffset);
    },
    [clampOffset]
  );

  const viewerGestureBind = useGesture(
    {
      onDrag: ({ offset: [x, y] }) => {
        if (!lightboxOpen || viewerScaleRef.current <= fitScale + 0.001) {
          return;
        }
        updateViewerTransform(viewerScaleRef.current, { x, y });
      },
      onPinch: ({ first, offset: [distance], memo }) => {
        if (!lightboxOpen) {
          return memo;
        }

        if (first) {
          pinchStartScaleRef.current = viewerScaleRef.current;
          pinchStartOffsetRef.current = viewerOffsetRef.current;
          return distance;
        }

        const startDistance = memo ?? distance;
        const scaleRatio = startDistance === 0 ? 1 : distance / startDistance;
        const nextScale = Math.min(3, Math.max(fitScale, pinchStartScaleRef.current * scaleRatio));
        updateViewerTransform(nextScale, pinchStartOffsetRef.current);
        return startDistance;
      },
      onWheel: ({ event, delta: [, dy] }) => {
        if (!lightboxOpen || !isDesktop) {
          return;
        }
        event.preventDefault();
        const nextScale = Math.min(3, Math.max(fitScale, viewerScaleRef.current - dy * 0.0015));
        updateViewerTransform(nextScale, viewerOffsetRef.current);
      },
    },
    {
      drag: {
        from: () => [viewerOffsetRef.current.x, viewerOffsetRef.current.y],
        pointer: { touch: true },
        filterTaps: true,
      },
      pinch: {
        scaleBounds: () => ({ min: fitScale, max: 3 }),
      },
      wheel: {
        eventOptions: { passive: false },
      },
    }
  );

  const panelContent = (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h2>
        <p className="text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
          {lensCaption}
        </p>
      </div>

      {/* Tabs */}
      <Tabs.Root defaultValue="image" className="flex flex-col gap-4">
        <Tabs.List className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
          <Tabs.Tab value="image" className={tabClass}>
            {t("tabImage")}
          </Tabs.Tab>
          <Tabs.Tab value="link" className={tabClass}>
            {t("tabLink")}
          </Tabs.Tab>
        </Tabs.List>

        {/* ── Link tab ─────────────────────────────────────────── */}
        <Tabs.Panel value="link" className="flex flex-col gap-3">
          <div className="select-all break-all rounded-md bg-zinc-100 px-3 py-2.5 font-mono text-xs leading-relaxed text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {truncatedUrl}
          </div>
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
                title={t("nativeShare")}
                className="flex items-center justify-center rounded-lg border border-zinc-200 px-3 py-2.5 text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Share2 className="size-4" />
              </button>
            )}
          </div>
        </Tabs.Panel>

        {/* ── Image tab ────────────────────────────────────────── */}
        <Tabs.Panel value="image" className="flex flex-col gap-3">
          {/* Poster preview: full-bleed, breaks out of p-4 padding */}
          <div
            className="group relative -mx-4 cursor-zoom-in overflow-hidden"
            style={{ height: PREVIEW_H }}
            onClick={openPosterViewer}
          >
            {/* Scale wrapper: absolute so it doesn't affect flow height */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: `calc(50% - ${PREVIEW_SCALED_W / 2}px)`,
                width: POSTER_W,
                transform: `scale(${PREVIEW_SCALE})`,
                transformOrigin: "top left",
                pointerEvents: "none",
              }}
              aria-hidden="true"
            >
              <SharePoster
                ref={posterRef}
                lenses={lenses}
                labels={posterLabels}
                custom={posterCustom}
                shareUrl={shareUrl}
              />
            </div>

            {/* Gradient fade at bottom */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent dark:from-zinc-900" />

            {/* Expand hint on hover */}
            <div className="absolute right-2 top-2 rounded-md bg-black/30 p-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Expand className="size-3.5 text-white" />
            </div>
          </div>

          {/* Full-size poster viewer — mobile keeps a preview step, desktop enters immersive directly */}
          <Dialog
            open={lightboxOpen}
            onOpenChange={(open) => {
              setLightboxOpen(open);
              if (!open) {
                setPosterViewMode("fit");
              }
            }}
          >
            {/* Dialog fills the full viewport; all visual styling lives inside */}
            <DialogContent
              noDefaultPositioning
              className="fixed inset-0 flex items-center justify-center border-0 bg-transparent p-0 shadow-none duration-100"
              backdropStyle={{ zIndex: Z.dialogBackdrop }}
              style={{ zIndex: Z.dialog }}
              backdropClassName="bg-zinc-950/82 transition-[background-color] duration-150"
              showCloseButton={false}
            >
              {/* ── State-driven content ── */}
              <AnimatePresence mode="sync" initial={false}>
                {!isDesktop ? (
                  /* Mobile: keep a fixed lightbox shell and switch poster zoom modes inside it. */
                  <motion.div
                    key="mobile-lightbox"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.12, ease: "easeOut" }}
                    className="relative h-[min(calc(100svh-6rem),46rem)] w-[calc(100vw-2rem)] max-w-[750px] overflow-hidden rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.22),0_0_0_1px_rgba(0,0,0,0.06)]"
                  >
                    <div
                      ref={viewerStageRef}
                      className="relative h-full w-full overflow-hidden touch-none"
                      style={{ touchAction: "none" }}
                      {...viewerGestureBind()}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          ref={viewerPosterRef}
                          style={{
                            width: POSTER_W,
                            transform: `translate3d(${viewerOffset.x}px, ${viewerOffset.y}px, 0) scale(${viewerScale})`,
                            transformOrigin: "center center",
                            willChange: "transform",
                            cursor: viewerScale > fitScale + 0.001 ? "grab" : "default",
                          }}
                          className="shrink-0 select-none"
                        >
                          <SharePoster lenses={lenses} labels={posterLabels} custom={posterCustom} shareUrl={shareUrl} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* Desktop: keep the full-screen poster scene. */
                  <motion.div
                    key="desktop-viewer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-zinc-950/96 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    <div
                      ref={viewerStageRef}
                      className="flex min-h-full w-full items-center justify-center overflow-hidden px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-[calc(env(safe-area-inset-top,0px)+4rem)] touch-none"
                      style={{ touchAction: "none" }}
                      {...viewerGestureBind()}
                    >
                      <div
                        ref={viewerPosterRef}
                        style={{
                          width: POSTER_W,
                          transform: `translate3d(${viewerOffset.x}px, ${viewerOffset.y}px, 0) scale(${viewerScale})`,
                          transformOrigin: "center center",
                          willChange: "transform",
                          cursor:
                            viewerScale > fitScale + 0.001
                              ? "grab"
                              : "default",
                        }}
                        className="shrink-0 select-none"
                      >
                        <SharePoster lenses={lenses} labels={posterLabels} custom={posterCustom} shareUrl={shareUrl} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Persistent controls — float above both states ── */}
              <div
                className="pointer-events-none absolute inset-0 z-50"
                style={{ zIndex: Z.dialogControls }}
              >
                {/* Close */}
                <button
                  onClick={() => setLightboxOpen(false)}
                  className={cn(
                    "pointer-events-auto absolute top-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm transition-colors",
                    isDesktop
                      ? "bg-white/15 text-white hover:bg-white/25"
                      : "bg-black/40 text-white hover:bg-black/60"
                  )}
                  aria-label={t("close")}
                >
                  <X className="size-4" />
                </button>

                {/* Viewer mode toggle — desktop always shows it, mobile uses it to enter or refine immersive view. */}
                {lightboxOpen && (
                  <button
                    onClick={() => {
                      setPosterViewMode((mode) => (mode === "fit" ? "actual" : "fit"));
                    }}
                    className={cn(
                      "pointer-events-auto absolute bottom-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm transition-colors",
                      isDesktop
                        ? "bg-white/15 text-white hover:bg-white/25"
                        : "bg-black/40 text-white hover:bg-black/60"
                    )}
                    aria-label={
                      posterViewMode === "fit"
                          ? t("posterActualSize")
                          : t("posterFitScreen")
                    }
                    title={
                      posterViewMode === "fit"
                          ? t("posterActualSize")
                          : t("posterFitScreen")
                    }
                  >
                    {posterViewMode === "actual" ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                  </button>
                )}

                {/* Download — appears only in immersive mode */}
                <AnimatePresence>
                  {lightboxOpen && (
                    <motion.button
                      key="dl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      onClick={handleDownload}
                      disabled={posterGenerating}
                      className="pointer-events-auto absolute top-4 left-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm transition-colors disabled:opacity-50"
                      aria-label={t("posterDownload")}
                    >
                      {posterGenerating ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </DialogContent>
          </Dialog>

          {/* Action row — Customize Popover on the left, share actions on the right */}
          <div className="flex gap-2">
              {/* Customize — Popover anchored to this trigger button */}
              <Popover.Root open={customOpen} onOpenChange={setCustomOpen}>
                <Popover.Trigger
                  title={t("customize")}
                  className={cn(
                    "flex items-center justify-center rounded-lg border px-3 py-2.5 outline-none transition-colors",
                    customOpen
                      ? "border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                      : "border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  )}
                >
                  <SlidersHorizontal className="size-4" />
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Positioner side="top" align="start" sideOffset={8}>
                    <Popover.Popup className="w-72 origin-(--transform-origin) rounded-xl border border-zinc-200 bg-white p-3 shadow-lg duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 dark:border-zinc-700 dark:bg-zinc-900">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-zinc-400 dark:text-zinc-500">
                            {t("customizeTitle")}
                          </label>
                          <input
                            type="text"
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            placeholder={tImage("comparison")}
                            className={inputClass}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-zinc-400 dark:text-zinc-500">
                            {t("customizeSlogan")}
                          </label>
                          <input
                            type="text"
                            value={customSlogan}
                            onChange={(e) => setCustomSlogan(e.target.value)}
                            placeholder={t("customizeSloganPlaceholder")}
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              </Popover.Root>

              {/* Share + Download */}
              {canShareFile ? (
                <>
                  <button
                    onClick={handleShareImage}
                    disabled={posterGenerating}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {posterGenerating ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
                    {t("posterShare")}
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={posterGenerating}
                    title={t("posterDownload")}
                    className="flex items-center justify-center rounded-lg border border-zinc-200 px-3 py-2.5 text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <Download className="size-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleDownload}
                  disabled={posterGenerating}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {posterGenerating ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                  {t("posterDownload")}
                </button>
              )}
          </div>
        </Tabs.Panel>
      </Tabs.Root>
    </div>
  );

  const isFab = variant === "fab";

  const defaultTriggerClass =
    "flex cursor-pointer items-center gap-1.5 rounded-md p-1 text-sm text-zinc-500 outline-none transition-colors hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:hover:text-zinc-50";

  const fabTriggerClass =
    "flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg outline-none transition-colors hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-400 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200";

  const triggerContent = isFab ? (
    <Share2 className="size-5" />
  ) : (
    triggerLabel
  );

  // Before mount: static placeholder to avoid layout shift
  const shareControl = !mounted ? (
    <button
      disabled
      aria-hidden
      className={isFab ? fabTriggerClass + " cursor-default opacity-0" : "flex cursor-default items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400"}
    >
      {isFab ? <Share2 className="size-5" /> : <><Share2 className="size-4" />{t("button")}</>}
    </button>
  ) : isDesktop ? (
    <Popover.Root open={open} onOpenChange={(nextOpen) => setOpen(nextOpen)}>
      <Popover.Trigger className={isFab ? fabTriggerClass : defaultTriggerClass}>
        {triggerContent}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side={isFab ? "top" : "bottom"} align="end" sideOffset={8}>
          <Popover.Popup className="w-96 max-h-[calc(100svh-80px)] overflow-y-auto origin-(--transform-origin) rounded-xl bg-white shadow-lg ring-1 ring-zinc-200 duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 dark:bg-zinc-900 dark:ring-zinc-800">
            {panelContent}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  ) : (
    <Drawer.Root
      open={open}
      onOpenChange={(nextOpen) => setOpen(nextOpen)}
      swipeDirection="down"
    >
      <Drawer.Trigger className={isFab ? fabTriggerClass : defaultTriggerClass}>
        {triggerContent}
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop
          className="fixed inset-0 z-50 bg-black/40 duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
          style={{ zIndex: Z.drawerBackdrop }}
        />
        <Drawer.Popup
          className="fixed inset-x-0 bottom-0 z-50 max-h-[85svh] flex flex-col rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom,0px)] ring-1 ring-zinc-200 duration-200 data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom dark:bg-zinc-900 dark:ring-zinc-800"
          style={{ zIndex: Z.drawer }}
        >
          {/* Handle sits outside the scroll container so swipe-down reaches the drawer */}
          <div className="flex shrink-0 touch-none justify-center pb-1 pt-3">
            <div className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          </div>
          <div className="overflow-y-auto pb-8">
            {panelContent}
          </div>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );

  return shareControl;
}
