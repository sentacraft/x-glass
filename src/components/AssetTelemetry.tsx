"use client";

import { useEffect } from "react";
import { onLCP, onINP, onCLS, onFCP, onTTFB, type Metric } from "web-vitals";

// Client-side telemetry: reports asset load failures and Web Vitals to
// /api/telemetry. The Worker logs each event with CF-IPCountry and CF-Ray
// (which embeds the serving PoP), giving us geo-attributed visibility into
// problems that bypass the Worker — most notably static assets served via
// the ASSETS binding, which produce no Worker logs of their own.
//
// Dedupe and sample to keep log volume sane; we expect O(10) events per
// session at most. Worker observability is enabled in wrangler.toml.

const ENDPOINT = "/api/telemetry";
const DEDUPE_WINDOW_MS = 30_000;
const ASSET_TAGS = new Set(["IMG", "SCRIPT", "LINK"]);
const SLOW_ASSET_THRESHOLD_MS = 3000;
const SLOW_ASSET_KINDS = new Set(["img", "script", "link", "css"]);

const recentlySent = new Map<string, number>();

function send(payload: Record<string, unknown>): void {
  const key = JSON.stringify(payload);
  const now = Date.now();
  const last = recentlySent.get(key);
  if (last !== undefined && now - last < DEDUPE_WINDOW_MS) {
    return;
  }
  recentlySent.set(key, now);
  try {
    const body = JSON.stringify({ ...payload, ts: now, page: location.pathname });
    if (typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(ENDPOINT, body);
    } else {
      fetch(ENDPOINT, { method: "POST", body, keepalive: true }).catch(() => {});
    }
  } catch {
    // Telemetry must never throw into the host page.
  }
}

export default function AssetTelemetry() {
  useEffect(() => {
    function onAssetError(e: Event) {
      const target = e.target as (HTMLElement & { src?: string; href?: string }) | null;
      if (!target || !ASSET_TAGS.has(target.tagName)) {
        return;
      }
      const url = target.src || target.href;
      if (!url) {
        return;
      }
      send({
        evt: "asset-error",
        tag: target.tagName,
        url,
        conn: (navigator as Navigator & { connection?: { effectiveType?: string } })
          .connection?.effectiveType,
      });
    }
    // Capture phase = true: <img>/<script>/<link> error events don't bubble.
    window.addEventListener("error", onAssetError, true);

    const report = (m: Metric) => {
      // Skip "good" measurements to keep volume down; only report degraded
      // experience. Tune later if we want full RUM histograms.
      if (m.rating === "good") {
        return;
      }
      send({ evt: "vitals", name: m.name, value: Math.round(m.value), rating: m.rating });
    };
    onLCP(report);
    onINP(report);
    onCLS(report);
    onFCP(report);
    onTTFB(report);

    // Slow-but-successful resources are invisible to the 'error' listener and
    // to Web Vitals (which only reflect a few page-level metrics). Resource
    // Timing surfaces per-resource durations, so we can flag stragglers that
    // load but take painfully long — the dominant failure mode for users on
    // congested trans-Pacific links.
    let resourceObs: PerformanceObserver | null = null;
    if (typeof PerformanceObserver === "function") {
      try {
        resourceObs = new PerformanceObserver((list) => {
          for (const e of list.getEntries() as PerformanceResourceTiming[]) {
            if (!SLOW_ASSET_KINDS.has(e.initiatorType)) {
              continue;
            }
            if (e.duration < SLOW_ASSET_THRESHOLD_MS) {
              continue;
            }
            send({
              evt: "slow-asset",
              kind: e.initiatorType,
              url: e.name,
              duration: Math.round(e.duration),
              ttfb: Math.round(e.responseStart - e.requestStart),
              transfer: e.transferSize,
              encoded: e.encodedBodySize,
            });
          }
        });
        // buffered: also receive entries that completed before observe() ran,
        // which catches the initial-page-load burst.
        resourceObs.observe({ type: "resource", buffered: true });
      } catch {
        resourceObs = null;
      }
    }

    return () => {
      window.removeEventListener("error", onAssetError, true);
      resourceObs?.disconnect();
    };
  }, []);

  return null;
}
