"use client";

import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  fallbackHref: string;
  label: string;
  className?: string;
}

/**
 * Navigates back in browser history when the previous page was within the same
 * origin. Falls back to `fallbackHref` when opened from an external link or
 * directly (no same-origin referrer).
 */
export default function BackButton({ fallbackHref, label, className }: BackButtonProps) {
  const router = useRouter();

  function handleBack() {
    const sameOrigin =
      document.referrer !== "" &&
      new URL(document.referrer).origin === window.location.origin;
    if (sameOrigin) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button type="button" onClick={handleBack} className={cn(className)}>
      {label}
    </button>
  );
}
