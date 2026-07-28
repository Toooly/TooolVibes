"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Send,
  Briefcase,
  User,
} from "lucide-react";

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
import { SubmissionProtectionFields } from "@/components/security/submission-protection-fields";
import { cn } from "@/lib/utils";
import { playTooolvibesSound } from "@/lib/config/sound";

type FormState = ToolRequestInput;
type FormErrors = Partial<Record<keyof FormState, string>>;

const initialForm: FormState = {
  submitterType: "community",
  toolName: "",
  toolUrl: "",
  category: "ai-app-builder",
  level: "beginner",
  email: "",
  message: "",
  useCase: "",
  referralUrl: "",
  mediaUrl: "",
  personalNotes: "",
  founderName: "",
  companyRole: "",
  launchStage: "",
  budgetRange: "",
  requestedServices: [],
};

const serviceOptions = [
  { value: "listing", label: "Listing tool" },
  { value: "editorial-review", label: "Review editoriale" },
  { value: "dedicated-guide", label: "Guida dedicata" },
  { value: "interview", label: "Intervista" },
  { value: "linkedin-content", label: "Contenuto LinkedIn" },
  { value: "product-hunt", label: "Supporto Product Hunt" },
  { value: "betalist", label: "Supporto BetaList" },
  { value: "launch-support", label: "Supporto lancio" },
  { value: "sponsorship", label: "Sponsorship" },
  { value: "growth-package", label: "Pacchetto growth" },
];

const launchStageOptions = [
  { value: "", label: "Seleziona fase" },
  { value: "idea", label: "Idea / prototipo" },
  { value: "private-beta", label: "Beta privata" },
  { value: "public-beta", label: "Beta pubblica" },
  { value: "launched", label: "Gia' lanciato" },
  { value: "scaling", label: "In crescita" },
];

const budgetOptions = [
  { value: "", label: "Budget indicativo" },
  { value: "not-sure", label: "Da capire insieme" },
  { value: "under-500", label: "Sotto 500 euro" },
  { value: "500-1500", label: "500-1.500 euro" },
  { value: "1500-5000", label: "1.500-5.000 euro" },
  { value: "5000-plus", label: "Oltre 5.000 euro" },
];

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

  if (form.referralUrl && !isValidUrl(form.referralUrl.trim())) {
    errors.referralUrl = "Inserisci un referral valido con https:// oppure lascia vuoto.";
  }

  if (form.mediaUrl && !isValidUrl(form.mediaUrl.trim())) {
    errors.mediaUrl = "Inserisci un link media valido con https:// oppure lascia vuoto.";
  }

  if (form.submitterType === "founder") {
    if (!form.email?.trim()) {
      errors.email = "Per il flusso founder serve un'email di contatto.";
    }

    if (!form.founderName?.trim()) {
      errors.founderName = "Inserisci il tuo nome o quello del founder.";
    }

    if (!form.companyRole?.trim()) {
      errors.companyRole = "Inserisci ruolo, team o azienda.";
    }

    if ((form.requestedServices ?? []).length === 0) {
      errors.requestedServices = "Scegli almeno un obiettivo business.";
    }
  }

  return errors;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p
      id={id}
      className="mt-1.5 animate-in fade-in slide-in-from-top-1 text-sm font-semibold text-red-600"
    >
      {message}
    </p>
  );
}

const fieldClass =
  "w-full rounded-lg border border-[var(--tv-border-interactive)] bg-[var(--tv-surface-base)] px-3.5 py-2.5 text-[0.92rem] text-[var(--tv-ink-primary)] placeholder:text-[var(--tv-ink-muted-aa)] transition-colors focus-visible:border-[var(--tv-accent-brand-aa)] focus-visible:outline-none disabled:opacity-50 sm:px-4 sm:py-3 sm:text-[0.98rem]";

const labelClass =
  "text-xs font-semibold uppercase tracking-[0.12em] text-[var(--tv-ink-secondary)]";

export function RequestToolForm({ className }: { className?: string }) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastRequest, setLastRequest] = useState<StoredToolRequest | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const isFounderFlow = form.submitterType === "founder";

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

  function setFlow(submitterType: FormState["submitterType"]) {
    setForm((current) => ({ ...current, submitterType }));
    setErrors({});
  }

  function toggleService(value: string) {
    setForm((current) => {
      const currentServices = current.requestedServices ?? [];
      const requestedServices = currentServices.includes(value)
        ? currentServices.filter((item) => item !== value)
        : [...currentServices, value];

      return { ...current, requestedServices };
    });
    setErrors((current) => ({ ...current, requestedServices: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const submissionData = new FormData(formElement);

    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      playTooolvibesSound("warning");
      return;
    }

    setIsSubmitting(true);

    try {
      const savedRequest = await saveToolRequest(
        {
          submitterType: form.submitterType,
          toolName: form.toolName.trim(),
          toolUrl: form.toolUrl.trim(),
          category: form.category,
          level: form.level,
          email: form.email?.trim() || undefined,
          message: form.message?.trim() || undefined,
          useCase: form.useCase?.trim() || undefined,
          referralUrl: form.referralUrl?.trim() || undefined,
          mediaUrl: form.mediaUrl?.trim() || undefined,
          personalNotes: form.personalNotes?.trim() || undefined,
          founderName: form.founderName?.trim() || undefined,
          companyRole: form.companyRole?.trim() || undefined,
          launchStage: form.launchStage || undefined,
          budgetRange: form.budgetRange || undefined,
          requestedServices: form.requestedServices ?? [],
        },
        {
          companyWebsite: String(submissionData.get("companyWebsite") ?? ""),
          captchaToken: String(submissionData.get("captchaToken") ?? ""),
        },
      );

      setLastRequest(savedRequest);
      setForm(initialForm);
      setToastVisible(true);
      playTooolvibesSound("success");
      window.setTimeout(() => setToastVisible(false), 3600);
    } catch {
      setErrors({
        message: "Non sono riuscito a salvare la richiesta. Riprova tra poco.",
      });
    } finally {
      setIsSubmitting(false);
      formElement.reset();
    }
  }

  return (
    <div className={cn("relative", className)}>
      {toastVisible ? (
        <div
          role="status"
          className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-4 right-4 z-[70] rounded-xl border border-emerald-200/60 bg-white px-5 py-4 text-sm text-[var(--tv-ink-primary)] shadow-lg sm:bottom-5 sm:left-auto sm:max-w-[22rem]"
        >
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" aria-hidden="true" />
            <div>
              <p className="font-semibold">Richiesta ricevuta.</p>
              <p className="mt-1 leading-6 text-[var(--tv-ink-secondary)]">
                {lastRequest?.toolName} entra nel flusso{" "}
                {lastRequest?.submitterType === "founder" ? "founder" : "community"} TooolVibes.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-[var(--tv-border-subtle)] bg-[var(--tv-surface-raised)] p-4 sm:p-6">
        <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
          <SubmissionProtectionFields action="tool_request" />

          {/* Flow selector — simple radio group */}
          <fieldset className="mb-5">
            <legend className={labelClass}>Tipo di segnalazione</legend>
            <div
              className="mt-2 flex gap-1 rounded-lg border border-[var(--tv-border-interactive)] bg-[var(--tv-surface-base)] p-1"
              role="radiogroup"
              aria-label="Tipo di segnalazione"
            >
              {[
                { value: "community" as const, icon: User, label: "Consiglio un tool" },
                { value: "founder" as const, icon: Briefcase, label: "Sono il founder" },
              ].map((item) => {
                const Icon = item.icon;
                const active = form.submitterType === item.value;

                return (
                  <label
                    key={item.value}
                    className={cn(
                      "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-[var(--tv-surface-raised)] text-[var(--tv-ink-primary)] shadow-sm"
                        : "text-[var(--tv-ink-secondary)] hover:text-[var(--tv-ink-primary)]",
                    )}
                  >
                    <input
                      type="radio"
                      name="submitterType"
                      value={item.value}
                      checked={active}
                      onChange={() => setFlow(item.value)}
                      className="sr-only"
                    />
                    <Icon size={14} aria-hidden="true" />
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--tv-ink-secondary)]">
              {isFounderFlow
                ? "Proposta business per listing, contenuti, lancio e sponsorship."
                : "Segnala un tool che usi e che merita spazio nel catalogo."}
            </p>
          </fieldset>

          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Nome tool</span>
              <input
                value={form.toolName}
                onChange={(event) => updateForm("toolName", event.target.value)}
                className={cn(fieldClass, "mt-1.5")}
                placeholder="Es. Blink, Make, Flowise..."
                aria-invalid={Boolean(errors.toolName)}
                aria-describedby={errors.toolName ? "tool-name-error" : undefined}
              />
              <FieldError id="tool-name-error" message={errors.toolName} />
            </label>

            <label className="block">
              <span className={labelClass}>URL tool</span>
              <input
                value={form.toolUrl}
                onChange={(event) => updateForm("toolUrl", event.target.value)}
                inputMode="url"
                className={cn(fieldClass, "mt-1.5")}
                placeholder="https://..."
                aria-invalid={Boolean(errors.toolUrl)}
                aria-describedby={errors.toolUrl ? "tool-url-error" : undefined}
              />
              <FieldError id="tool-url-error" message={errors.toolUrl} />
            </label>

            <label className="block">
              <span className={labelClass}>Categoria</span>
              <select
                value={form.category}
                onChange={(event) => updateForm("category", event.target.value)}
                className={cn(fieldClass, "mt-1.5")}
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
              <span className={labelClass}>Livello suggerito</span>
              <select
                value={form.level}
                onChange={(event) =>
                  updateForm("level", event.target.value as DirectoryToolLevel)
                }
                className={cn(fieldClass, "mt-1.5")}
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
              <span className={labelClass}>
                {isFounderFlow ? "Email di contatto" : "Email opzionale"}
              </span>
              <input
                value={form.email ?? ""}
                onChange={(event) => updateForm("email", event.target.value)}
                inputMode="email"
                className={cn(fieldClass, "mt-1.5")}
                placeholder={
                  isFounderFlow
                    ? "Per ricontattarti sulla proposta"
                    : "Per aggiornarti sulla valutazione, se vuoi"
                }
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "tool-email-error" : undefined}
              />
              <FieldError id="tool-email-error" message={errors.email} />
            </label>

            <label className="block md:col-span-2">
              <span className={labelClass}>
                {isFounderFlow ? "Pitch rapido" : "Perche' lo consigli"}
              </span>
              <textarea
                value={form.message ?? ""}
                onChange={(event) => updateForm("message", event.target.value)}
                rows={4}
                className={cn(fieldClass, "mt-1.5 min-h-[7rem] resize-none leading-6 sm:min-h-[9rem] sm:leading-7")}
                placeholder={
                  isFounderFlow
                    ? "Cosa fa il tool, per chi e' costruito e perche' dovrebbe stare su TooolVibes."
                    : "Racconta cosa ci fai, perche' ti ha convinto e quando lo useresti."
                }
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "tool-message-error" : undefined}
              />
              <FieldError id="tool-message-error" message={errors.message} />
            </label>

            {isFounderFlow ? (
              <>
                <label className="block">
                  <span className={labelClass}>Nome founder</span>
                  <input
                    value={form.founderName ?? ""}
                    onChange={(event) => updateForm("founderName", event.target.value)}
                    className={cn(fieldClass, "mt-1.5")}
                    placeholder="Nome e cognome"
                    aria-invalid={Boolean(errors.founderName)}
                    aria-describedby={errors.founderName ? "tool-founder-error" : undefined}
                  />
                  <FieldError id="tool-founder-error" message={errors.founderName} />
                </label>

                <label className="block">
                  <span className={labelClass}>Ruolo / azienda</span>
                  <input
                    value={form.companyRole ?? ""}
                    onChange={(event) => updateForm("companyRole", event.target.value)}
                    className={cn(fieldClass, "mt-1.5")}
                    placeholder="Founder, CEO, growth, team..."
                    aria-invalid={Boolean(errors.companyRole)}
                    aria-describedby={errors.companyRole ? "tool-role-error" : undefined}
                  />
                  <FieldError id="tool-role-error" message={errors.companyRole} />
                </label>

                <label className="block">
                  <span className={labelClass}>Fase del tool</span>
                  <select
                    value={form.launchStage ?? ""}
                    onChange={(event) => updateForm("launchStage", event.target.value)}
                    className={cn(fieldClass, "mt-1.5")}
                  >
                    {launchStageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className={labelClass}>Budget</span>
                  <select
                    value={form.budgetRange ?? ""}
                    onChange={(event) => updateForm("budgetRange", event.target.value)}
                    className={cn(fieldClass, "mt-1.5")}
                  >
                    {budgetOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="md:col-span-2">
                  <span className={labelClass}>Cosa ti interessa</span>
                  <div
                    className="mt-1.5 grid gap-2 sm:grid-cols-2"
                    role="group"
                    aria-label="Servizi richiesti"
                  >
                    {serviceOptions.map((service) => {
                      const checked = (form.requestedServices ?? []).includes(service.value);

                      return (
                        <label
                          key={service.value}
                          className={cn(
                            "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                            checked
                              ? "border-[var(--tv-accent-brand-aa)] bg-[var(--tv-accent-primary)]/10 text-[var(--tv-ink-primary)]"
                              : "border-[var(--tv-border-interactive)] bg-[var(--tv-surface-base)] text-[var(--tv-ink-secondary)] hover:border-[var(--tv-accent-brand-aa)]/50",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleService(service.value)}
                            className="size-4 accent-[var(--tv-accent-primary)]"
                          />
                          {service.label}
                        </label>
                      );
                    })}
                  </div>
                  <FieldError id="tool-services-error" message={errors.requestedServices} />
                </div>
              </>
            ) : (
              <>
                <label className="block md:col-span-2">
                  <span className={labelClass}>Use case</span>
                  <input
                    value={form.useCase ?? ""}
                    onChange={(event) => updateForm("useCase", event.target.value)}
                    className={cn(fieldClass, "mt-1.5")}
                    placeholder="Es. creare landing, automatizzare lead, montare video..."
                  />
                </label>

                <label className="block">
                  <span className={labelClass}>Referral personale</span>
                  <input
                    value={form.referralUrl ?? ""}
                    onChange={(event) => updateForm("referralUrl", event.target.value)}
                    inputMode="url"
                    className={cn(fieldClass, "mt-1.5")}
                    placeholder="https://... se ce l'hai"
                    aria-invalid={Boolean(errors.referralUrl)}
                    aria-describedby={errors.referralUrl ? "tool-referral-error" : undefined}
                  />
                  <FieldError id="tool-referral-error" message={errors.referralUrl} />
                </label>

                <label className="block">
                  <span className={labelClass}>Screenshot / video</span>
                  <input
                    value={form.mediaUrl ?? ""}
                    onChange={(event) => updateForm("mediaUrl", event.target.value)}
                    inputMode="url"
                    className={cn(fieldClass, "mt-1.5")}
                    placeholder="Link a video, screenshot o demo"
                    aria-invalid={Boolean(errors.mediaUrl)}
                    aria-describedby={errors.mediaUrl ? "tool-media-error" : undefined}
                  />
                  <FieldError id="tool-media-error" message={errors.mediaUrl} />
                </label>

                <label className="block md:col-span-2">
                  <span className={labelClass}>Note personali</span>
                  <textarea
                    value={form.personalNotes ?? ""}
                    onChange={(event) => updateForm("personalNotes", event.target.value)}
                    rows={3}
                    className={cn(fieldClass, "mt-1.5 min-h-[6rem] resize-none leading-6")}
                    placeholder="Dettagli extra, limiti, alternative provate o cosa dovremmo guardare."
                  />
                </label>
              </>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-[var(--tv-border-subtle)] pt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <p className="max-w-[42rem] text-sm leading-6 text-[var(--tv-ink-secondary)]">
              Valutiamo ogni proposta per qualit&agrave;, utilit&agrave; reale e coerenza con il catalogo
              {isFounderFlow ? ", poi decidiamo se aprire un percorso commerciale." : "."}
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--tv-accent-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--tv-ink-on-brand)] transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[13rem]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Invio in corso
                </>
              ) : (
                <>
                  <Send className="size-4" aria-hidden="true" />
                  {isFounderFlow ? "Invia proposta founder" : "Suggerisci un tool"}
                </>
              )}
            </button>
          </div>

          {errors.message ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {errors.message}
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}
