import { cn } from "@/lib/utils";

interface TypeSegmentedOption<T> {
  value: T;
  label: string;
}

interface TypeSegmentedControlProps<T> {
  ariaLabel: string;
  options: TypeSegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export default function TypeSegmentedControl<T>({
  ariaLabel,
  options,
  value,
  onChange,
}: TypeSegmentedControlProps<T>) {
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="relative grid h-9 w-full max-w-[18.75rem] grid-cols-3 rounded-full border border-zinc-200/80 bg-white/90 p-0.5 shadow-sm shadow-zinc-950/[0.03] dark:border-zinc-800 dark:bg-zinc-900/30"
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-0.5 bottom-0.5 left-0.5 rounded-full transition-transform duration-200 ease-out",
          value === options[0]?.value
            ? "border border-zinc-200/80 bg-zinc-100/80 shadow-none dark:border-zinc-700 dark:bg-zinc-800/80"
            : "bg-zinc-900 shadow-sm dark:bg-zinc-100",
        )}
        style={{
          width: `calc((100% - 4px) / ${options.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {options.map((option, index) => {
        const selected = value === option.value;
        return (
          <button
            key={option.label}
            type="button"
            role="radio"
            aria-checked={selected}
            className={cn(
              "relative z-10 h-full rounded-full px-3 text-[12px] font-medium transition-colors duration-200",
              index === 0 && "w-[5.75rem]",
              selected
                ? index === 0
                  ? "font-semibold text-zinc-900 dark:text-zinc-100"
                  : "text-white dark:text-zinc-950"
                : "text-zinc-800 hover:bg-zinc-50/80 hover:text-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100",
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
