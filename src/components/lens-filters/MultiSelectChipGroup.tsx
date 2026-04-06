import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  filterAllPillClass,
  filterGroupClass,
  filterPillActiveClass,
  filterPillClass,
  filterPillDefaultActiveClass,
} from "./styles";

interface MultiSelectChipOption {
  key: string;
  label: string;
  hint?: string;
  selected: boolean;
  onClick: () => void;
}

interface MultiSelectChipGroupProps {
  allLabel: string;
  allSelected: boolean;
  onSelectAll: () => void;
  options: MultiSelectChipOption[];
  nowrap?: boolean;
  scrollable?: boolean;
}

export default function MultiSelectChipGroup({
  allLabel,
  allSelected,
  onSelectAll,
  options,
  nowrap = false,
  scrollable = false,
}: MultiSelectChipGroupProps) {
  const group = (
    <div className={cn(filterGroupClass, nowrap && "min-w-max flex-nowrap")}>
      <button
        type="button"
        className={cn(
          allSelected ? filterPillDefaultActiveClass : filterPillClass,
          filterAllPillClass,
        )}
        onClick={onSelectAll}
      >
        {allLabel}
      </button>
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          className={cn(
            option.selected ? filterPillActiveClass : filterPillClass,
            "inline-flex shrink-0 items-center gap-1.5",
          )}
          onClick={option.onClick}
        >
          {option.selected ? <Check className="h-3.5 w-3.5" /> : null}
          <span>{option.label}</span>
          {option.hint ? (
            <span className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400">
              {option.hint}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );

  if (scrollable) {
    return <div className="-mx-1 overflow-x-auto px-1 pb-0.5">{group}</div>;
  }

  return group;
}
