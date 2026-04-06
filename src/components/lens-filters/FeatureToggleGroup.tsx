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
              "gap-1.5",
            )}
            onClick={option.onClick}
          >
            {option.selected ? <Check className="h-3.5 w-3.5" /> : null}
            <Icon className="h-3.5 w-3.5" />
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
