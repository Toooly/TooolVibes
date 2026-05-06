"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Send, Sparkles } from "lucide-react";

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
import { PremiumBadge, PremiumButton, PremiumPanel } from "@/components/ui/premium";
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

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="mt-2 animate-in fade-in slide-in-from-top-1 text-sm font-semibold text-red-700">
      {message}
    </p>
  );
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const savedRequest = await saveToolRequest({
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
  }

  const fieldClass =
    "premium-input min-h-12 px-4 py-3 text-[0.98rem] placeholder:text-[var(--muted)]";
  const labelClass =
    "text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-white/68";

  return (
    <div className={cn("relative", className)}>
      {toastVisible ? (
        <div
          role="status"
          className="motion-toast fixed bottom-[5.75rem] left-4 right-4 z-50 rounded-[24px] border border-emerald-200/40 bg-white/92 px-5 py-4 text-sm text-[var(--foreground)] shadow-[0_24px_70px_rgba(47,33,126,0.16)] backdrop-blur-xl sm:bottom-5 sm:left-auto sm:max-w-[22rem]"
        >
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-200" aria-hidden="true" />
            <div>
              <p className="font-semibold">Richiesta ricevuta.</p>
              <p className="mt-1 leading-6 text-[var(--muted-strong)]">
                {lastRequest?.toolName} entra nella wishlist TooolVibes.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <PremiumPanel tone="blue" className="motion-form-panel p-5 sm:p-6">
        <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.74fr)_minmax(0,1.26fr)] lg:items-start">
            <aside className="rounded-[26px] border border-white/12 bg-white/9 p-5">
              <PremiumBadge tone="accent">Invio guidato</PremiumBadge>
              <h2 className="text-display-card mt-4 text-[1.75rem] leading-tight text-white sm:text-[2.2rem]">
                Bastano quattro segnali buoni.
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/66">
                Nome, link ufficiale, categoria e motivo d&apos;uso ci aiutano a capire se
                il tool merita di entrare nella selezione.
              </p>

              <div className="mt-5 grid gap-3">
                {["Nome tool", "Link ufficiale", "Categoria", "Perché è utile"].map(
                  (item, index) => (
                    <div key={item} className="motion-form-step flex items-center gap-3 rounded-[18px] border border-white/10 bg-white/6 p-3">
                      <span className="grid size-8 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white">
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold text-white/76">{item}</span>
                    </div>
                  ),
                )}
              </div>
            </aside>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="motion-field block">
                <span className={labelClass}>Nome tool</span>
                <input
                  value={form.toolName}
                  onChange={(event) => updateForm("toolName", event.target.value)}
                  className={cn(fieldClass, "mt-2")}
                  placeholder="Es. Blink, Make, Flowise..."
                  aria-invalid={Boolean(errors.toolName)}
                  aria-describedby={errors.toolName ? "tool-name-error" : undefined}
                />
                <FieldError id="tool-name-error" message={errors.toolName} />
              </label>

              <label className="motion-field block">
                <span className={labelClass}>URL tool</span>
                <input
                  value={form.toolUrl}
                  onChange={(event) => updateForm("toolUrl", event.target.value)}
                  inputMode="url"
                  className={cn(fieldClass, "mt-2")}
                  placeholder="https://..."
                  aria-invalid={Boolean(errors.toolUrl)}
                  aria-describedby={errors.toolUrl ? "tool-url-error" : undefined}
                />
                <FieldError id="tool-url-error" message={errors.toolUrl} />
              </label>

              <label className="motion-field block">
                <span className={labelClass}>Categoria</span>
                <select
                  value={form.category}
                  onChange={(event) => updateForm("category", event.target.value)}
                  className={cn(fieldClass, "mt-2 font-semibold")}
                  aria-invalid={Boolean(errors.category)}
                >
                  {categoryOptions.map((category) => (
                    <option key={category.key} value={category.key}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="motion-field block">
                <span className={labelClass}>Livello suggerito</span>
                <select
                  value={form.level}
                  onChange={(event) =>
                    updateForm("level", event.target.value as DirectoryToolLevel)
                  }
                  className={cn(fieldClass, "mt-2 font-semibold")}
                  aria-invalid={Boolean(errors.level)}
                >
                  {levelOptions.map((level) => (
                    <option key={level.key} value={level.key}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="motion-field block md:col-span-2">
                <span className={labelClass}>Email opzionale</span>
                <input
                  value={form.email}
                  onChange={(event) => updateForm("email", event.target.value)}
                  inputMode="email"
                  className={cn(fieldClass, "mt-2")}
                  placeholder="Per aggiornarti sulla valutazione, se vuoi"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "tool-email-error" : undefined}
                />
                <FieldError id="tool-email-error" message={errors.email} />
              </label>

              <label className="motion-field block md:col-span-2">
                <span className={labelClass}>Perché merita attenzione</span>
                <textarea
                  value={form.message}
                  onChange={(event) => updateForm("message", event.target.value)}
                  rows={5}
                  className={cn(fieldClass, "mt-2 min-h-[9rem] resize-none leading-7")}
                  placeholder="Racconta il caso d'uso, chi lo userebbe e cosa lo rende diverso."
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? "tool-message-error" : undefined}
                />
                <FieldError id="tool-message-error" message={errors.message} />
              </label>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-[42rem] text-sm leading-6 text-white/62">
              Valutiamo ogni proposta per qualità, utilità reale e coerenza con la
              directory.
            </p>
            <PremiumButton
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="min-w-[13rem]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Invio in corso
                </>
              ) : (
                <>
                  <Send className="size-4" aria-hidden="true" />
                  Suggerisci un tool
                </>
              )}
            </PremiumButton>
          </div>

          {errors.message ? (
            <div className="mt-4 rounded-[20px] border border-red-200/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">
              {errors.message}
            </div>
          ) : null}

          <div className="mt-5 flex items-center gap-2 rounded-[20px] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/58">
            <Sparkles className="size-4 text-violet-100" aria-hidden="true" />
            Le proposte migliori diventano schede curate, non link buttati in lista.
          </div>
        </form>
      </PremiumPanel>
    </div>
  );
}
