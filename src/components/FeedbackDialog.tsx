"use client";

import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type FeedbackType = "data_issue" | "missing_lens" | "general";

export interface FeedbackContext {
  lensId?: string;
  lensModel?: string;
  searchQuery?: string;
}

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: FeedbackType;
  context?: FeedbackContext;
}

type Status = "idle" | "submitting" | "success" | "error";

export default function FeedbackDialog({
  open,
  onOpenChange,
  type,
  context,
}: FeedbackDialogProps) {
  const t = useTranslations("Feedback");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const textareaId = useId();

  useEffect(() => {
    if (!open) {
      setDescription("");
      setStatus("idle");
      setErrorMessage(null);
    }
  }, [open]);

  const titleKey =
    type === "data_issue"
      ? "titleDataIssue"
      : type === "missing_lens"
        ? "titleMissingLens"
        : "titleGeneral";
  const descriptionKey =
    type === "data_issue"
      ? "descriptionDataIssue"
      : type === "missing_lens"
        ? "descriptionMissingLens"
        : "descriptionGeneral";

  const contextLine =
    type === "data_issue" && context?.lensModel
      ? t("contextLens", { model: context.lensModel })
      : type === "missing_lens" && context?.searchQuery
        ? t("contextQuery", { query: context.searchQuery })
        : null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (description.trim().length === 0 || status === "submitting") {
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          description: description.trim(),
          context: context ?? {},
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? "request_failed");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "unknown");
    }
  }

  const canSubmit = description.trim().length > 0 && status !== "submitting";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t(titleKey)}</DialogTitle>
          <DialogDescription>{t(descriptionKey)}</DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="px-5 py-6 text-sm text-zinc-700 dark:text-zinc-300">
            {t("success")}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-5 pb-2">
            {contextLine && (
              <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400">
                {contextLine}
              </div>
            )}
            <label
              htmlFor={textareaId}
              className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
            >
              {t("descriptionLabel")}
            </label>
            <textarea
              id={textareaId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              rows={5}
              maxLength={2000}
              required
              className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
            />
            {status === "error" && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {t("error")}
                {errorMessage ? ` (${errorMessage})` : ""}
              </p>
            )}
          </form>
        )}

        <DialogFooter>
          {status === "success" ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("close")}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {status === "submitting" ? t("submitting") : t("submit")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
