import type { ReactNode } from "react";
import { rowClass, rowLabelClass } from "./styles";

interface FilterRowProps {
  label: string;
  children: ReactNode;
  trailing?: ReactNode;
}

export default function FilterRow({ label, children, trailing }: FilterRowProps) {
  return (
    <div className={rowClass}>
      {trailing ? (
        <div className="flex items-center justify-between sm:contents">
          <span className={rowLabelClass}>{label}</span>
          {trailing}
        </div>
      ) : (
        <span className={rowLabelClass}>{label}</span>
      )}
      {children}
    </div>
  );
}
