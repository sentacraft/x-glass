// UI constants — animation timings, z-index layers, and layout breakpoints.
// Centralises magic numbers that are currently scattered across components.

// ── Animation ─────────────────────────────────────────────────────────────────

export const ANIMATION = {
  // LogoMark: ease-out return duration after mouse leaves (ms)
  logoEaseOutMs: 700,
  // LogoMark: entry catch-up duration to eliminate jump on mouse enter (ms)
  logoCatchupMs: 180,
  // TODO: page transition duration
  // TODO: toast / notification fade duration
} as const;

// ── Z-index layers ────────────────────────────────────────────────────────────

// TODO: Enumerate all z-index values currently hardcoded in components.
// Example shape (fill in as you audit):
// export const Z = {
//   base: 0,
//   stickyHeader: 10,
//   compareBar: 20,
//   drawer: 30,
//   modal: 40,
//   toast: 50,
// } as const;

// ── Layout ────────────────────────────────────────────────────────────────────

// TODO: navbar height, sidebar width, compare-bar height — values currently
// hardcoded as Tailwind arbitrary values (e.g. min-h-[calc(100svh-3.5rem)]).
// Keeping them here lets you change one number and have calc() expressions
// automatically stay in sync.

// ── Lens list / compare ───────────────────────────────────────────────────────

// TODO: max number of lenses that can be compared simultaneously
// TODO: default sort field and direction
