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
        const Icon = option.selected ? Check : option.icon;
        return (
          <Button
            key={option.key}
            size="sm"
            variant={option.selected ? "default" : "outline"}
            className={cn(
              option.selected ? filterPillActiveClass : featurePillClass,
              "whitespace-nowrap",
            )}
            onClick={option.onClick}
            aria-pressed={option.selected}
          >
            <span className="inline-flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              {option.label}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
