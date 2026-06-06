"use client";

import { useEffect } from "react";
import type { DependencyList } from "react";

/**
 * Mirrors client state onto the address bar via history.replaceState — the
 * shared discipline for write-only URL projection:
 *   - reads the LIVE URL, so the locale prefix and any foreign params (utm, …)
 *     survive
 *   - lets the caller mutate ONLY the keys it owns
 *   - no-ops when nothing changed, so an already-correct URL never triggers a
 *     redundant history write or subscriber re-render
 *
 * `mutate` receives the live URL and must touch only its own params; everything
 * else is left intact. Pass the state it reads as `deps`.
 */
export function useUrlStateSync(mutate: (url: URL) => void, deps: DependencyList) {
  useEffect(() => {
    const url = new URL(window.location.href);
    mutate(url);
    if (url.href === window.location.href) {
      return;
    }
    window.history.replaceState(null, "", url);
    // mutate is intentionally excluded; deps is the caller-declared trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
