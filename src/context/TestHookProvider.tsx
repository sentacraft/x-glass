"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  TESTHOOK_QUERY_KEYS,
  buildTestHookSearchParams,
  getDefaultTestHookState,
  parseTestHookState,
  resolveTestHookCss,
  type TestHookState,
} from "@/lib/testhook";

interface TestHookContextValue {
  state: TestHookState;
  setTestHook: (enabled: boolean) => void;
  setOption: (key: string, value: string) => void;
  reset: () => void;
}

export const TestHookContext = createContext<TestHookContextValue | null>(null);

function getInitialState(): TestHookState {
  if (typeof window === "undefined") return getDefaultTestHookState();
  return parseTestHookState(new URLSearchParams(window.location.search));
}

export function TestHookProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<TestHookState>(getInitialState);

  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  // Sync state → CSS injection
  useEffect(() => {
    let styleElement = document.getElementById("testhook-css") as HTMLStyleElement | null;
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = "testhook-css";
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = resolveTestHookCss(state);
  }, [state]);

  // Re-inject testhook params after page navigation
  useEffect(() => {
    if (!state.testHook) return;
    const current = new URLSearchParams(searchParams.toString());
    if (!current.has(TESTHOOK_QUERY_KEYS.testHook)) {
      const next = buildTestHookSearchParams(current, state);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    }
  }, [pathname]);

  const update = useCallback((nextState: TestHookState) => {
    setState(nextState);
    const next = buildTestHookSearchParams(
      new URLSearchParams(searchParamsRef.current.toString()),
      nextState
    );
    const query = next.toString();
    const p = pathnameRef.current;
    router.replace(`${p}${query ? `?${query}` : ""}`, { scroll: false });
  }, [router]);

  const value: TestHookContextValue = useMemo(
    () => ({
      state,
      setTestHook: (enabled) => update({ ...state, testHook: enabled }),
      setOption: (key, value) =>
        update({
          ...state,
          options: { ...state.options, [key]: value },
        }),
      reset: () => update({ ...getDefaultTestHookState(), testHook: state.testHook }),
    }),
    [state, update]
  );

  return <TestHookContext value={value}>{children}</TestHookContext>;
}

export function useUiHookAttr(): (value: string) => Record<string, string> {
  const context = useContext(TestHookContext);
  const enabled = context?.state.testHook ?? false;
  return enabled ? (value) => ({ "data-ui-hook": value }) : () => ({});
}
