"use client";

import { createContext, useContext, useState } from "react";

// Siblings that need to share the scroll container (e.g. Nav and ScrollContainer)
// can't pass state directly to each other. The standard fix is to lift the state
// into their nearest common ancestor via context. This provider holds the scroll
// element and exposes both the value (for listeners like Nav) and the setter (for
// the scroll div to register itself).
//
// navLocked: when true, Nav stays hidden regardless of scroll direction.
// Used by pages that have their own sticky header (e.g. CompareTable phantom header)
// so that only one top-chrome element is visible at a time.
interface ScrollContainerContextValue {
  el: HTMLDivElement | null;
  setEl: (el: HTMLDivElement | null) => void;
  navLocked: boolean;
  lockNav: (locked: boolean) => void;
}

const ScrollContainerContext = createContext<ScrollContainerContextValue>({
  el: null,
  setEl: () => {},
  navLocked: false,
  lockNav: () => {},
});

// Wrap Nav + ScrollContainer with this so both can access the shared state.
export function ScrollContainerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const [navLocked, setNavLocked] = useState(false);

  return (
    <ScrollContainerContext.Provider value={{ el, setEl, navLocked, lockNav: setNavLocked }}>
      {children}
    </ScrollContainerContext.Provider>
  );
}

export function ScrollContainer({ children }: { children: React.ReactNode }) {
  const { setEl } = useContext(ScrollContainerContext);

  return (
    <div ref={setEl} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      {children}
    </div>
  );
}

export function useScrollContainer() {
  return useContext(ScrollContainerContext).el;
}

export function useNavLock() {
  const { navLocked, lockNav } = useContext(ScrollContainerContext);
  return { navLocked, lockNav };
}
