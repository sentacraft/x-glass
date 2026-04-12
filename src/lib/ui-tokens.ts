/**
 * Design token class strings for interactive UI states.
 * Single source of truth — prevents design language drift across components.
 *
 * Design language:
 *   Primary action  → black (zinc-900 light / zinc-100 dark)
 *   Secondary action → ghost / outline, no fill
 *   Selected state  → zinc-900 border + ring (light) / zinc-100 (dark)
 */

/** Primary action button (compare, add-to-compare, hero CTA). */
export const ACTION_PRIMARY_CLS =
  "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors";

/** Selected card border + ring (e.g. lens card added to compare). */
export const CARD_SELECTED_BORDER_CLS =
  "border-zinc-900 ring-1 ring-zinc-900 shadow-lg shadow-zinc-900/10 dark:border-zinc-100 dark:ring-zinc-100 dark:shadow-zinc-100/10";

/** Active/hovered item in a list or search result (e.g. LensSearchDialog). */
export const LIST_ITEM_ACTIVE_CLS =
  "border-zinc-200 bg-zinc-50/80 dark:border-zinc-700 dark:bg-zinc-800/50";

/** Small indicator dot signalling an active hidden filter. */
export const ACTIVE_DOT_CLS = "bg-zinc-900 dark:bg-zinc-100";
