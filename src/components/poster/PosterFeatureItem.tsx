import { cn } from "@/lib/utils";

interface PosterFeatureItemProps {
  present: boolean | "partial" | null | undefined;
  label: string;
  /** Optional sub-label appended when present, e.g. "5-stop" for OIS. */
  sub?: string;
}

export function PosterFeatureItem({ present, label, sub }: PosterFeatureItemProps) {
  const isPresent = present === true || present === "partial";
  const isPartial = present === "partial";

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "w-3 shrink-0 text-center text-sm font-semibold tabular-nums leading-none",
          isPresent ? "text-zinc-900" : "text-zinc-300"
        )}
      >
        {isPresent ? (isPartial ? "~" : "✓") : "—"}
      </span>
      <span className={cn("text-xs leading-tight", isPresent ? "text-zinc-700" : "text-zinc-400")}>
        {label}
        {sub && isPresent && (
          <span className="text-zinc-400"> · {sub}</span>
        )}
      </span>
    </div>
  );
}
