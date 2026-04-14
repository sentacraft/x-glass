"use client";

import { createContext, useContext, useState } from "react";

// Provides the layout's main scroll container element to deeply nested
// components that need it as an IntersectionObserver root or scroll listener.
const ScrollContainerContext = createContext<HTMLDivElement | null>(null);

// Separate setter context so ScrollContainer can register itself without
// needing to own the provider (Nav is a sibling, not a child, of ScrollContainer).
const ScrollContainerSetterContext = createContext<
  ((el: HTMLDivElement | null) => void) | null
>(null);

// Wrap both Nav and ScrollContainer with this so all siblings share the same
// context value.
export function ScrollContainerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);

  return (
    <ScrollContainerSetterContext.Provider value={setEl}>
      <ScrollContainerContext.Provider value={el}>
        {children}
      </ScrollContainerContext.Provider>
    </ScrollContainerSetterContext.Provider>
  );
}

export function ScrollContainer({ children }: { children: React.ReactNode }) {
  const setEl = useContext(ScrollContainerSetterContext);

  return (
    <div ref={setEl ?? undefined} className="flex-1 min-h-0 overflow-y-auto">
      {children}
    </div>
  );
}

export function useScrollContainer() {
  return useContext(ScrollContainerContext);
}
