"use client";

import { FormEvent, useMemo, useState } from "react";

import {
  directoryFilterGroups,
  directoryLevelFilters,
  type DirectoryToolLevel,
} from "@/lib/data/tooolvibes-directory";
import {
  saveToolRequest,
  type StoredToolRequest,
  type ToolRequestInput,
} from "@/lib/wishlist/request-tool-store";
import { cn } from "@/lib/utils";

type FormState = ToolRequestInput;

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialForm: FormState = {
  toolName: "",
  toolUrl: "",
  category: "ai-app-builder",
  level: "beginner",
  email: "",
  message: "",
};

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidEmail(value: string) {
  if (!value.trim()) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (form.toolName.trim().length < 2) {
    errors.toolName = "Inserisci il nome del tool.";
  }

  if (!isValidUrl(form.toolUrl.trim())) {
    errors.toolUrl = "Inserisci un URL valido con https://.";
  }

  if (!form.category) {
    errors.category = "Scegli una categoria.";
  }

  if (!form.level) {
    errors.level = "Scegli un livello.";
  }

  if (!isValidEmail(form.email ?? "")) {
    errors.email = "Inserisci una email valida oppure lascia il campo vuoto.";
  }

  return errors;
}

export function RequestToolForm({ className }: { className?: string }) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastRequest, setLastRequest] = useState<StoredToolRequest | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const categoryOptions = useMemo(
    () => directoryFilterGroups.filter((group) => group.key !== "all"),
    [],
  );
  const levelOptions = useMemo(
    () => directoryLevelFilters.filter((level) => level.key !== "all"),
    [],
  );

  function updateForm<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    window.setTimeout(() => {
      try {
        const savedRequest = saveToolRequest({
          toolName: form.toolName.trim(),
          toolUrl: form.toolUrl.trim(),
          category: form.category,
          level: form.level,
          email: form.email?.trim() || undefined,
          message: form.message?.trim() || undefined,
        });

        setLastRequest(savedRequest);
        setForm(initialForm);
        setToastVisible(true);
        window.setTimeout(() => setToastVisible(false), 3600);
      } catch {
        setErrors({
          message: "Non sono riuscito a salvare la richiesta. Riprova tra poco.",
        });
      } finally {
        setIsSubmitting(false);
      }
    }, 420);
  }

  return (
    <div className={cn("relative", className)}>
      {toastVisible ? (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 max-w-[22rem] rounded-[24px] border border-[rgba(83,63,170,0.12)] bg-white px-5 py-4 text-sm text-[var(--foreground)] shadow-[0_24px_70px_rgba(30,18,83,0.18)]"
        >
          <p className="font-semibold">Richiesta ricevuta.</p>
          <p className="mt-1 leading-6 text-[var(--muted-strong)]">
            {lastRequest?.toolName} entra nella wishlist TooolVibes.
          </p>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="rounded-[34px] border border-[rgba(83,63,170,0.12)] bg-white/88 p-5 shadow-[0_22px_70px_rgba(35,18,95,0.08)] sm:p-6"
        noValidate
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
              Nome tool
            </span>
            <input
              value={form.toolName}
              onChange={(event) => updateForm("toolName", event.target.value)}
              className="mt-2 w-full rounded-[20px] border border-[rgba(83,63,170,0.12)] bg-[rgba(246,244,255,0.78)] px-4 py-3 text-[0.98rem] text-[var(--foreground)] outline-none transition-colors duration-200 focus:border-[rgba(108,76,255,0.34)]"
              aria-invalid={Boolean(errors.toolName)}
              aria-describedby={errors.toolName ? "tool-name-error" : undefined}
            />
            {errors.toolName ? (
              <p id="tool-name-error" className="mt-2 text-sm font-medium text-[#b42318]">
                {errors.toolName}
              </p>
            ) : null}
          </label>

          <label className="block">
            <span className="text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
              URL tool
            </span>
            <input
              value={form.toolUrl}
              onChange={(event) => updateForm("toolUrl", event.target.value)}
              inputMode="url"
              className="mt-2 w-full rounded-[20px] border border-[rgba(83,63,170,0.12)] bg-[rgba(246,244,255,0.78)] px-4 py-3 text-[0.98rem] text-[var(--foreground)] outline-none transition-colors duration-200 focus:border-[rgba(108,76,255,0.34)]"
              aria-invalid={Boolean(errors.toolUrl)}
              aria-describedby={errors.toolUrl ? "tool-url-error" : undefined}
            />
            {errors.toolUrl ? (
              <p id="tool-url-error" className="mt-2 text-sm font-medium text-[#b42318]">
                {errors.toolUrl}
              </p>
            ) : null}
          </label>

          <label className="block">
            <span className="text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
              Categoria
            </span>
            <select
              value={form.category}
              onChange={(event) => updateForm("category", event.target.value)}
              className="mt-2 w-full rounded-[20px] border border-[rgba(83,63,170,0.12)] bg-[rgba(246,244,255,0.78)] px-4 py-3 text-[0.98rem] font-semibold text-[var(--foreground)] outline-none transition-colors duration-200 focus:border-[rgba(108,76,255,0.34)]"
              aria-invalid={Boolean(errors.category)}
            >
              {categoryOptions.map((category) => (
                <option key={category.key} value={category.key}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
              Livello suggerito
            </span>
            <select
              value={form.level}
              onChange={(event) =>
                updateForm("level", event.target.value as DirectoryToolLevel)
              }
              className="mt-2 w-full rounded-[20px] border border-[rgba(83,63,170,0.12)] bg-[rgba(246,244,255,0.78)] px-4 py-3 text-[0.98rem] font-semibold text-[var(--foreground)] outline-none transition-colors duration-200 focus:border-[rgba(108,76,255,0.34)]"
              aria-invalid={Boolean(errors.level)}
            >
              {levelOptions.map((level) => (
                <option key={level.key} value={level.key}>
                  {level.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
              Email opzionale
            </span>
            <input
              value={form.email}
              onChange={(event) => updateForm("email", event.target.value)}
              inputMode="email"
              className="mt-2 w-full rounded-[20px] border border-[rgba(83,63,170,0.12)] bg-[rgba(246,244,255,0.78)] px-4 py-3 text-[0.98rem] text-[var(--foreground)] outline-none transition-colors duration-200 focus:border-[rgba(108,76,255,0.34)]"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "tool-email-error" : undefined}
            />
            {errors.email ? (
              <p id="tool-email-error" className="mt-2 text-sm font-medium text-[#b42318]">
                {errors.email}
              </p>
            ) : null}
          </label>

          <label className="block md:col-span-2">
            <span className="text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
              Nota
            </span>
            <textarea
              value={form.message}
              onChange={(event) => updateForm("message", event.target.value)}
              rows={5}
              className="mt-2 w-full resize-none rounded-[20px] border border-[rgba(83,63,170,0.12)] bg-[rgba(246,244,255,0.78)] px-4 py-3 text-[0.98rem] leading-7 text-[var(--foreground)] outline-none transition-colors duration-200 focus:border-[rgba(108,76,255,0.34)]"
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? "tool-message-error" : undefined}
            />
            {errors.message ? (
              <p id="tool-message-error" className="mt-2 text-sm font-medium text-[#b42318]">
                {errors.message}
              </p>
            ) : null}
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-[rgba(83,63,170,0.08)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-[var(--muted-strong)]">
            Valutiamo ogni proposta per qualit&agrave;, utilit&agrave; reale e coerenza con
            la directory.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),#8a61ff)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(95,66,255,0.18)] transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Invio in corso..." : "Suggerisci un Toool"}
          </button>
        </div>
      </form>
    </div>
  );
}
