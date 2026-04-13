// UI constants — animation timings, z-index layers, and layout breakpoints.
// Centralises magic numbers that are currently scattered across components.

// ── Animation ─────────────────────────────────────────────────────────────────

export const ANIMATION = {
  // LogoMark: ease-out return duration after mouse leaves (ms)
  logoEaseOutMs: 700,
  // LogoMark: entry catch-up duration to eliminate jump on mouse enter (ms)
  logoCatchupMs: 180,
} as const;

// ── Z-index layers ────────────────────────────────────────────────────────────
//
// Stacking order (low → high):
//   local    z-10   Inline stacking within a card or table (close buttons, sticky data cells)
//   table    z-20   Table-level chrome (phantom sticky header bar)
//   chrome   z-30   App shell chrome (nav bar, table frozen corner)
//   fixed    z-40   Fixed UI chrome that floats above content (compare bar, FABs)
//   overlay  z-50   Overlay primitives: drawers, dropdown selects
//   dialog   z-[60] Modal dialogs — must sit above drawers (z-50)
//
// Note: table-level z-indexes (local, table, chrome) live in a CSS stacking
// context isolated from the rest of the page; their values only need to be
// consistent relative to each other, not to fixed/overlay/dialog layers.

export const Z = {
  local:   "z-10",
  table:   "z-20",
  chrome:  "z-30",
  fixed:   "z-40",
  overlay: "z-50",
  dialog:  "z-[60]",
} as const;

// ── Layout ────────────────────────────────────────────────────────────────────
//
// The layout's scroll container (ScrollContainerContext) owns the vertical
// scroll; the nav bar sits above it in a flex column. Individual pages should
// use h-full / flex-1 rather than calc(100dvh - navHeight).

// ── Lens list / compare ───────────────────────────────────────────────────────

// TODO: max number of lenses that can be compared simultaneously
// TODO: default sort field and direction
