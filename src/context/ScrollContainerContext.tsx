"use client";

import { createContext, useContext, useState } from "react";

// Provides the layout's main scroll container element to deeply nested
// components that need it as an IntersectionObserver root.
const ScrollContainerContext = createContext<HTMLDivElement | null>(null);

export function ScrollContainer({ children }: { children: React.ReactNode }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);

  return (
    <ScrollContainerContext.Provider value={el}>
      <div ref={setEl} className="flex-1 min-h-0 overflow-y-auto">
        {children}
      </div>
    </ScrollContainerContext.Provider>
  );
}

export function useScrollContainer() {
  return useContext(ScrollContainerContext);
}
