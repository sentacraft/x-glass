"use client";

import { useEffect } from "react";
import { useCompare } from "@/context/CompareProvider";

/**
 * Projects the current compare state onto the address bar for the compare
 * page surface — and only the compare page.
 *
 * `CompareContext` is the single client-side source of truth for the lens
 * selection. The compare page's URL (`?ids=A,B,C`) is a write-only derived
 * view so the comparison can be linked, refreshed, or shared. Other surfaces
 * (lens list, lens detail) carry compare state via context only; their URLs
 * have nothing to sync, so this hook is never mounted there.
 *
 * Why `window.history.replaceState` instead of `router.replace`: the latter
 * forces an RSC round-trip even though the new ids are already authoritative
 * on the client. `history.replaceState` (monkey-patched by Next.js) updates
 * the address bar without contacting the server while still notifying
 * `usePathname` / `useSearchParams` subscribers.
 *
 * Why this hook does NOT read `useSearchParams`: the URL only carries `ids`.
 * Anything else previously squatting on the query string (`preset`, `from`,
 * `lensId`) has been removed — `preset` is reverse-derived from `ids` where
 * needed, `from` / `lensId` were dead code. With nothing else to preserve,
 * the projection becomes a pure function of compare state — the effect
 * depends only on `compareIds`.
 */
export function useCompareUrlSync() {
  const { compareIds } = useCompare();

  useEffect(() => {
    const url = new URL(window.location.href);
    // Assign the query as a string (not url.searchParams.set) so the comma
    // separators in `ids` stay raw (`A,B`) instead of percent-encoded (`A%2CB`).
    url.search = compareIds.length > 0 ? `ids=${compareIds.join(",")}` : "";

    // No-op when the URL already matches — avoids re-emitting a router event
    // (and the associated subscriber re-renders) for an already-correct URL.
    if (url.href === window.location.href) {
      return;
    }

    window.history.replaceState(null, "", url);
  }, [compareIds]);
}
