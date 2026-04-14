"use client";

import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  fallbackHref: string;
  label: string;
  className?: string;
}

/**
 * Navigates to `fallbackHref`. The destination is determined by the caller —
 * use URL `?from=` params to pass context-aware targets.
 */
export default function BackButton({ fallbackHref, label, className }: BackButtonProps) {
  const router = useRouter();

  return (
    <button type="button" onClick={() => router.push(fallbackHref)} className={cn(className)}>
      {label}
    </button>
  );
}
