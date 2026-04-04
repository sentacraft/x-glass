"use client";

import { createContext, useContext, useState, useMemo } from "react";

const MAX_COMPARE = 4;

interface CompareContextValue {
  compareIds: string[];
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  canToggle: (id: string) => boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareIds, setCompareIds] = useState<string[]>([]);

  function toggleCompare(id: string) {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function clearCompare() {
    setCompareIds([]);
  }

  const value = useMemo(
    () => ({
      compareIds,
      toggleCompare,
      clearCompare,
      canToggle: (id: string) =>
        compareIds.includes(id) || compareIds.length < MAX_COMPARE,
    }),
    [compareIds]
  );

  return <CompareContext value={value}>{children}</CompareContext>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) {
    throw new Error("useCompare must be used within CompareProvider");
  }
  return ctx;
}
