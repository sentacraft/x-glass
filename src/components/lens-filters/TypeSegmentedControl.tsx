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
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex rounded-lg bg-zinc-100 p-1"
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.label}
            type="button"
            role="radio"
            aria-checked={selected}
            className={cn(
              "h-7 rounded-md px-4 text-[12px] font-medium transition-colors",
              selected
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900",
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
