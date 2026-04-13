"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";

import { Z } from "@/config/ui";
import { cn } from "@/lib/utils";
import { ICON_CLOSE_BTN_CLS } from "@/lib/ui-tokens";

function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </DialogPrimitive.Root>
  );
}

function DialogTrigger({
  className,
  ...props
}: DialogPrimitive.Trigger.Props) {
  return (
    <DialogPrimitive.Trigger
      data-slot="dialog-trigger"
      className={className}
      {...props}
    />
  );
}

function DialogPortal({
  children,
  ...props
}: DialogPrimitive.Portal.Props) {
  return (
    <DialogPrimitive.Portal {...props}>
      {children}
    </DialogPrimitive.Portal>
  );
}

function DialogBackdrop({
  className,
  style,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-backdrop"
      className={cn(
        "fixed inset-0 z-50 bg-zinc-950/55 backdrop-blur-sm",
        className
      )}
      style={{ zIndex: Z.dialogBackdrop, ...style }}
      {...props}
    />
  );
}

function DialogContent({
  className,
  backdropClassName,
  backdropStyle,
  style,
  children,
  showCloseButton = true,
  showOverlayCloseButton = false,
  noDefaultPositioning = false,
  ...props
}: DialogPrimitive.Popup.Props & {
  backdropClassName?: string;
  backdropStyle?: React.CSSProperties;
  showCloseButton?: boolean;
  /** Renders the close button outside the popup at the card's top-right corner (-right-4 -top-4).
   *  Requires the popup to NOT have overflow-hidden (move it to inner content instead). */
  showOverlayCloseButton?: boolean;
  /** Omits the default centered positioning (left-1/2 top-1/2 max-w-2xl -translate-*) so the
   *  caller can supply custom fixed inset classes without Tailwind class conflicts. */
  noDefaultPositioning?: boolean;
}) {
  return (
    <DialogPortal>
      <DialogBackdrop className={backdropClassName} style={backdropStyle} />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed z-50 rounded-2xl border border-zinc-200 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950",
          !noDefaultPositioning && "left-1/2 top-1/2 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2",
          "origin-[var(--transform-origin)] duration-200 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-90 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-90",
          className
        )}
        style={{ zIndex: Z.dialog, ...style }}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close className={cn(ICON_CLOSE_BTN_CLS, "absolute right-4 top-4 z-10 h-9 w-9 bg-white/90 shadow-sm backdrop-blur-sm dark:bg-zinc-800/90")}>
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        )}
        {showOverlayCloseButton && (
          <DialogPrimitive.Close className="absolute -right-4 -top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-black/70">
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5 px-5 py-4", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex items-center justify-end gap-3 px-5 py-4 border-t border-zinc-200 dark:border-zinc-800", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50", className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-zinc-500 dark:text-zinc-400", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
