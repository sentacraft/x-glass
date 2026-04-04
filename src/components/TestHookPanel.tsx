"use client";

import { useContext } from "react";
import { Button } from "@/components/ui/button";
import { TestHookContext } from "@/context/TestHookProvider";
import { TESTHOOK_OPTION_DEFINITIONS } from "@/lib/testhook";

export default function TestHookPanel() {
  const context = useContext(TestHookContext);

  if (!context || !context.state.testHook) {
    return null;
  }

  const { state, setOption, setTestHook, reset } = context;

  return (
    <aside className="fixed bottom-4 right-4 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-zinc-200/80 bg-white/95 p-4 shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Test hooks
          </p>
          <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            Toggle option variants to compare visual directions.
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setTestHook(false)}>
          Hide
        </Button>
      </div>

      <div className="mt-4 space-y-4">
        {TESTHOOK_OPTION_DEFINITIONS.map((option) => (
          <label key={option.key} className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
              {option.label}
            </span>
            <select
              value={state.options[option.key] ?? option.defaultValue ?? ""}
              onChange={(event) => setOption(option.key, event.target.value)}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
            >
              {option.values.map((value) => (
                <option key={value.id} value={value.id}>
                  {value.label}
                </option>
              ))}
            </select>
            <span className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              {option.description}
            </span>
          </label>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <Button size="sm" variant="outline" onClick={reset}>
          Reset
        </Button>
      </div>
    </aside>
  );
}
