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

export interface FeedbackContext {
  lensId?: string;
  lensModel?: string;
  searchQuery?: string;
  field?: string; // resolved label of the affected spec field, e.g. "Max Aperture"
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
  const td = useTranslations("LensDetail");
  const [description, setDescription] = useState("");
  const [selectedField, setSelectedField] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const textareaId = useId();

  // All spec field labels the user can pick from, in group order.
  // Uses LensDetail translations so labels match what's shown on the page.
  const fieldOptions = [
    { value: td("focalLength"),       label: td("focalLength") },
    { value: td("focalLengthEquiv"),  label: td("focalLengthEquiv") },
    { value: td("maxAperture"),       label: td("maxAperture") },
    { value: td("minAperture"),       label: td("minAperture") },
    { value: td("maxTStop"),          label: td("maxTStop") },
    { value: td("minTStop"),          label: td("minTStop") },
    { value: td("angleOfView"),       label: td("angleOfView") },
    { value: td("apertureBladeCount"),label: td("apertureBladeCount") },
    { value: td("lensConfiguration"), label: td("lensConfiguration") },
    { value: td("af"),                label: td("af") },
    { value: td("focusMotor"),        label: td("focusMotor") },
    { value: td("internalFocusing"),  label: td("internalFocusing") },
    { value: td("minFocusDist"),      label: td("minFocusDist") },
    { value: td("maxMagnification"),  label: td("maxMagnification") },
    { value: td("ois"),               label: td("ois") },
    { value: td("weight"),            label: td("weight") },
    { value: td("dimensions"),        label: td("dimensions") },
    { value: td("filterSize"),        label: td("filterSize") },
    { value: td("lensMaterial"),      label: td("lensMaterial") },
    { value: td("wr"),                label: td("wr") },
    { value: td("apertureRing"),      label: td("apertureRing") },
    { value: td("powerZoom"),         label: td("powerZoom") },
    { value: td("specialtyTags"),     label: td("specialtyTags") },
    { value: td("releaseYear"),       label: td("releaseYear") },
    { value: td("accessories"),       label: td("accessories") },
    { value: t("fieldImage"),         label: t("fieldImage") },
    { value: t("fieldOther"),         label: t("fieldOther") },
  ];

  useEffect(() => {
    if (!open) {
      setDescription("");
      setSelectedField("");
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
          context: {
            ...(context ?? {}),
            ...(selectedField ? { field: selectedField } : {}),
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
            {type === "data_issue" && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {t("fieldPickerLabel")}
                </span>
                <Select
                  value={selectedField}
                  onValueChange={(v) => setSelectedField(v ?? "")}
                  items={fieldOptions}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("fieldPickerPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
