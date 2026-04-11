import { cn } from "@/lib/utils";

interface PosterSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function PosterSection({ title, children, className }: PosterSectionProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
        {title}
      </div>
      {children}
    </div>
  );
}
