import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { featurePillClass, filterPillActiveClass } from "./styles";

interface FeatureToggleOption {
  key: string;
  label: string;
  icon: LucideIcon;
  selected: boolean;
  onClick: () => void;
}

interface FeatureToggleGroupProps {
  options: FeatureToggleOption[];
}

export default function FeatureToggleGroup({
  options,
}: FeatureToggleGroupProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <Button
            key={option.key}
            size="sm"
            variant={option.selected ? "default" : "outline"}
            className={cn(
              option.selected ? filterPillActiveClass : featurePillClass,
              "relative whitespace-nowrap",
            )}
            onClick={option.onClick}
            aria-pressed={option.selected}
          >
            <Check
              className={cn(
                "pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transition-all duration-200",
                option.selected
                  ? "scale-100 opacity-100"
                  : "scale-75 opacity-0",
              )}
            />
            <span
              className={cn(
                "inline-flex items-center gap-1.5 transition-transform duration-200",
                option.selected && "translate-x-2",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {option.label}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
