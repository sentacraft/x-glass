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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FeedbackType = "data_issue" | "missing_lens" | "general";

export interface FeedbackField {
  /** The label exactly as shown on the page, used both as display text and issue payload. */
  label: string;
  /** Current display value for this field on this lens, shown read-only after selection. */
  currentValue?: string;
}

export interface FeedbackContext {
  lensId?: string;
  lensModel?: string;
  searchQuery?: string;
  field?: string;
}

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: FeedbackType;
  context?: FeedbackContext;
  /** Pre-built list of reportable fields for this lens. Only shown for data_issue type. */
  fields?: FeedbackField[];
}

type Status = "idle" | "submitting" | "success" | "error";

export default function FeedbackDialog({
  open,
  onOpenChange,
  type,
  context,
  fields,
}: FeedbackDialogProps) {
  const t = useTranslations("Feedback");
  const [description, setDescription] = useState("");
  const [selectedFieldLabel, setSelectedFieldLabel] = useState("");
  const [suggestedCorrection, setSuggestedCorrection] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const textareaId = useId();
  const correctionId = useId();

  const showFieldPicker = type === "data_issue" && fields && fields.length > 0;

  const selectedField = fields?.find((f) => f.label === selectedFieldLabel);

  useEffect(() => {
    if (!open) {
      setDescription("");
      setSelectedFieldLabel("");
      setSuggestedCorrection("");
      setStatus("idle");
      setErrorMessage(null);
      setSubmitAttempted(false);
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
    if (status === "submitting") return;
    if (!hasContent) {
      setSubmitAttempted(true);
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
          context: {
            ...(context ?? {}),
            ...(selectedFieldLabel ? { field: selectedFieldLabel } : {}),
            ...(selectedField?.currentValue ? { currentValue: selectedField.currentValue } : {}),
            ...(suggestedCorrection.trim() ? { suggestedCorrection: suggestedCorrection.trim() } : {}),
          },
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

  const hasContent =
    description.trim().length > 0 || suggestedCorrection.trim().length > 0;
  const canSubmit = status !== "submitting";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t(titleKey)}</DialogTitle>
          {status !== "success" && <DialogDescription>{t(descriptionKey)}</DialogDescription>}
        </DialogHeader>

        {status === "success" ? (
          <div className="flex items-center px-5 py-10 text-sm text-zinc-700 dark:text-zinc-300">
            {t("success")}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-5 pb-2">
            {contextLine && (
              <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400">
                {contextLine}
              </div>
            )}

            {showFieldPicker && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {t("fieldPickerLabel")}
                </span>
                <Select
                  value={selectedFieldLabel}
                  onValueChange={(v) => {
                    setSelectedFieldLabel(v ?? "");
                    setSuggestedCorrection("");
                  }}
                  items={fields.map((f) => ({ value: f.label, label: f.label }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("fieldPickerPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent
                    positionerClassName="z-[70]"
                    className="z-[70]"
                  >
                    {fields.map((f) => (
                      <SelectItem key={f.label} value={f.label}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedField && (
                  <div className="flex flex-col gap-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 px-3 py-2.5">
                    {selectedField.currentValue && (
                      <div className="flex items-baseline gap-2">
                        <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                          {t("currentValueLabel")}
                        </span>
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          {selectedField.currentValue}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor={correctionId}
                        className="text-xs text-zinc-400 dark:text-zinc-500"
                      >
                        {t("suggestedCorrectionLabel")}
                      </label>
                      <input
                        id={correctionId}
                        type="text"
                        value={suggestedCorrection}
                        onChange={(e) => setSuggestedCorrection(e.target.value)}
                        placeholder={t("suggestedCorrectionPlaceholder")}
                        maxLength={200}
                        className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <label
              htmlFor={textareaId}
              className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
            >
              {t("descriptionLabel")}
              {showFieldPicker && (
                <span className="ml-1 font-normal text-zinc-400 dark:text-zinc-500">
                  ({t("descriptionOptional")})
                </span>
              )}
            </label>
            <textarea
              id={textareaId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              rows={4}
              maxLength={2000}
              className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
            />
            {showFieldPicker && submitAttempted && !hasContent && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {t("contentRequired")}
              </p>
            )}
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
