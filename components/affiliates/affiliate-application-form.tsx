"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";

import { PremiumBadge, PremiumButton, PremiumPanel } from "@/components/ui/premium";
import { SubmissionProtectionFields } from "@/components/security/submission-protection-fields";
import { cn } from "@/lib/utils";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  brandName: string;
  websiteUrl: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  xProfile: string;
  linkedin: string;
  youtube: string;
  audience: string;
  channels: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormState | "form", string>>;

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  brandName: "",
  websiteUrl: "",
  instagram: "",
  facebook: "",
  tiktok: "",
  xProfile: "",
  linkedin: "",
  youtube: "",
  audience: "",
  channels: "",
  message: "",
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidUrl(value: string) {
  if (!value.trim()) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Social fields are optional and accept either a free-form handle
 * (e.g. @profilo) or an https URL. Empty values are valid; bare
 * handles are valid; only fully-formed URLs are checked against
 * the http(s) protocol. Keeps the form tolerant so candidates can
 * submit even with just a username.
 */
function isValidSocialValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;

  // Bare handle or free-form text — never reject.
  if (!/^https?:\/\//i.test(trimmed)) return true;

  return isValidUrl(trimmed);
}

const SOCIAL_FIELD_KEYS = [
  "instagram",
  "facebook",
  "tiktok",
  "xProfile",
  "linkedin",
  "youtube",
] as const;

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!isValidEmail(form.email.trim())) {
    errors.email = "Inserisci un'email valida per poterti ricontattare.";
  }
  if (!isValidUrl(form.websiteUrl.trim())) {
    errors.websiteUrl = "Inserisci un URL valido con https:// oppure lascia vuoto.";
  }
  if (form.message.trim().length < 12) {
    errors.message = "Scrivi almeno 12 caratteri sul perché vuoi diventare affiliato.";
  }

  for (const key of SOCIAL_FIELD_KEYS) {
    if (!isValidSocialValue(form[key])) {
      errors[key] = "Inserisci un link che inizia con https:// oppure lascia vuoto.";
    }
  }

  return errors;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-2 text-sm font-semibold text-red-100">
      <LocalizedText>{message}</LocalizedText>
    </p>
  );
}

export function AffiliateApplicationForm({ className }: { className?: string }) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
    setIsSubmitted(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const submissionData = new FormData(formElement);

    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setIsSubmitted(false);

    try {
      const response = await fetch("/api/affiliate-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          companyWebsite: String(submissionData.get("companyWebsite") ?? ""),
          captchaToken: String(submissionData.get("captchaToken") ?? ""),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        nextAllowedAt?: string;
      };

      if (!response.ok) {
        const cooldownMessage = payload.nextAllowedAt
          ? `Potrai inviare una nuova richiesta dal ${new Date(payload.nextAllowedAt).toLocaleDateString("it-IT")}.`
          : undefined;
        setErrors({
          form:
            cooldownMessage ??
            payload.message ??
            "Non sono riuscito a inviare la richiesta. Riprova tra poco.",
        });
        return;
      }

      setForm(initialForm);
      setIsSubmitted(true);
    } catch {
      setErrors({ form: "Non sono riuscito a inviare la richiesta. Riprova tra poco." });
    } finally {
      setIsSubmitting(false);
      formElement.reset();
    }
  }

  const inputClass =
    "premium-input min-h-11 border-[var(--tv-border-interactive)] bg-[var(--tv-surface-elevated)] px-3.5 py-2.5 text-[0.92rem] text-[var(--tv-ink-primary)] placeholder:text-[var(--tv-ink-muted-aa)] sm:min-h-12 sm:px-4 sm:py-3 sm:text-[0.98rem]";
  const labelClass =
    "text-xs font-semibold uppercase tracking-[0.14em] text-[var(--tv-ink-secondary)]";

  return (
    <PremiumPanel tone="dark" className={cn("p-4 text-white before:!hidden after:!hidden sm:p-6", className)}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <PremiumBadge tone="accent" className="after:!hidden"><LocalizedText>{"Candidatura affiliato"}</LocalizedText></PremiumBadge>
          <h2 id="affiliate-application-title" className="mt-3 text-[1.45rem] leading-tight sm:text-[1.85rem]"><LocalizedText>{"Raccontaci chi sei e dove porteresti TooolVibes. "}</LocalizedText></h2>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        aria-labelledby="affiliate-application-title"
        noValidate
      >
        <SubmissionProtectionFields action="affiliate_request" />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className={labelClass}><LocalizedText>{"Nome"}</LocalizedText></span>
            <LocalizedAttributes><input
              value={form.firstName}
              onChange={(event) => updateField("firstName", event.target.value)}
              className={cn(inputClass, "mt-2")}
              placeholder="Il tuo nome"
              disabled={isSubmitting}
              autoComplete="given-name"
            /></LocalizedAttributes>
            <FieldError id="affiliate-first-name-error" message={errors.firstName} />
          </label>

          <label className="block">
            <span className={labelClass}><LocalizedText>{"Brand o progetto"}</LocalizedText></span>
            <LocalizedAttributes><input
              value={form.brandName}
              onChange={(event) => updateField("brandName", event.target.value)}
              className={cn(inputClass, "mt-2")}
              placeholder="Creator, newsletter, community..."
              disabled={isSubmitting}
              autoComplete="organization"
            /></LocalizedAttributes>
          </label>

          <label className="block md:col-span-2">
            <span className={labelClass}><LocalizedText>{"Email per ricontattarti"}</LocalizedText></span>
            <LocalizedAttributes><input
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              type="email"
              inputMode="email"
              autoComplete="email"
              className={cn(inputClass, "mt-2")}
              placeholder="nome@esempio.it"
              disabled={isSubmitting}
              required
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "affiliate-email-error" : undefined}
            /></LocalizedAttributes>
            <FieldError id="affiliate-email-error" message={errors.email} />
          </label>

          <label className="block md:col-span-2">
            <span className={labelClass}><LocalizedText>{"Sito principale"}</LocalizedText></span>
            <LocalizedAttributes><input
              value={form.websiteUrl}
              onChange={(event) => updateField("websiteUrl", event.target.value)}
              type="url"
              inputMode="url"
              autoComplete="url"
              className={cn(inputClass, "mt-2")}
              placeholder="https://..."
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.websiteUrl)}
              aria-describedby={errors.websiteUrl ? "affiliate-website-error" : undefined}
            /></LocalizedAttributes>
            <FieldError id="affiliate-website-error" message={errors.websiteUrl} />
          </label>

          <label className="block md:col-span-2">
            <span className={labelClass}><LocalizedText>{"Audience o caso d'uso (poche righe)"}</LocalizedText></span>
            <textarea
              value={form.audience}
              onChange={(event) => updateField("audience", event.target.value)}
              rows={3}
              className={cn(inputClass, "mt-2 min-h-[6.5rem] resize-none")}
              placeholder="Chi ti segue e perché potrebbe essere interessato ai tool di TooolVibes?"
              disabled={isSubmitting}
            />
          </label>

          <label className="block md:col-span-2">
            <span className={labelClass}><LocalizedText>{"Messaggio obbligatorio"}</LocalizedText></span>
            <textarea
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
              rows={4}
              className={cn(inputClass, "mt-2 min-h-[8rem] resize-none")}
              placeholder="Raccontaci perché vorresti diventare affiliato e come presenteresti TooolVibes alla tua audience."
              disabled={isSubmitting}
              required
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? "affiliate-message-error" : undefined}
            />
            <FieldError id="affiliate-message-error" message={errors.message} />
          </label>
        </div>

        <details className="affiliate-progressive-disclosure rounded-[22px] border border-[var(--tv-border-subtle)] bg-[var(--tv-surface-raised)]">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-[var(--tv-ink-primary)] sm:px-5 sm:py-4">
            <span className="flex items-center justify-between gap-3">
              <span><LocalizedText>{"Aggiungi canali di promozione e profili social"}</LocalizedText></span>
              <span className="text-xs font-normal uppercase tracking-[0.14em] text-[var(--tv-ink-muted-aa)]" aria-hidden="true"><LocalizedText>{"Apri "}</LocalizedText></span>
            </span>
          </summary>
          <div className="space-y-4 px-4 pb-4 sm:px-5 sm:pb-5">
            <label className="block">
              <span className={labelClass}><LocalizedText>{"Cognome"}</LocalizedText></span>
              <LocalizedAttributes><input
                value={form.lastName}
                onChange={(event) => updateField("lastName", event.target.value)}
                className={cn(inputClass, "mt-2")}
                placeholder="Opzionale"
                disabled={isSubmitting}
                autoComplete="family-name"
              /></LocalizedAttributes>
              <FieldError id="affiliate-last-name-error" message={errors.lastName} />
            </label>

            <label className="block">
              <span className={labelClass}><LocalizedText>{"Canali di promozione"}</LocalizedText></span>
              <LocalizedAttributes><input
                value={form.channels}
                onChange={(event) => updateField("channels", event.target.value)}
                className={cn(inputClass, "mt-2")}
                placeholder="Newsletter, YouTube, LinkedIn, community, sito..."
                disabled={isSubmitting}
              /></LocalizedAttributes>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["instagram", "Instagram", "@profilo o URL"],
                ["facebook", "Facebook", "Pagina, gruppo o profilo"],
                ["tiktok", "TikTok", "@profilo o URL"],
                ["xProfile", "X / Twitter", "@profilo o URL"],
                ["linkedin", "LinkedIn", "Profilo o pagina"],
                ["youtube", "YouTube", "Canale o URL"],
              ].map(([key, label, placeholder]) => {
                const fieldKey = key as keyof FormState;
                const errorKey = `affiliate-${fieldKey}-error`;
                const errorMessage = errors[fieldKey];
                return (
                  <label key={key} className="block">
                    <span className={labelClass}><LocalizedText>{label}</LocalizedText></span>
                    <LocalizedAttributes><input
                      value={form[fieldKey]}
                      onChange={(event) => updateField(fieldKey, event.target.value)}
                      className={cn(inputClass, "mt-2")}
                      placeholder={placeholder}
                      disabled={isSubmitting}
                      aria-invalid={Boolean(errorMessage)}
                      aria-describedby={errorMessage ? errorKey : undefined}
                    /></LocalizedAttributes>
                    <FieldError id={errorKey} message={errorMessage} />
                  </label>
                );
              })}
            </div>
          </div>
        </details>

        {errors.form ? (
          <div
            role="alert"
            className="rounded-[20px] border border-red-500 bg-[var(--tv-surface-elevated)] px-4 py-3 text-sm font-semibold text-red-200"
          >
            <LocalizedText>{errors.form}</LocalizedText>
          </div>
        ) : null}

        {isSubmitted ? (
          <div
            role="status"
            aria-live="polite"
            className="flex gap-3 rounded-[20px] border border-emerald-500 bg-[var(--tv-surface-elevated)] px-4 py-3 text-sm text-emerald-200"
          >
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <p><LocalizedText>{"Richiesta ricevuta. La troviamo nel backoffice e ti ricontattiamo sui recapiti indicati."}</LocalizedText></p>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-[var(--tv-border-subtle)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.9375rem] leading-6 text-[var(--tv-ink-secondary)]"><LocalizedText>{"Nome, brand, email e sito bastano per candidarti. Aggiungi canali e profili social solo se li vuoi condividere. "}</LocalizedText></p>
          <PremiumButton type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" /><LocalizedText>{"Invio in corso "}</LocalizedText></>
            ) : (
              <>
                <Send className="size-4" aria-hidden="true" /><LocalizedText>{"Invia candidatura "}</LocalizedText></>
            )}
          </PremiumButton>
        </div>
      </form>
    </PremiumPanel>
  );
}
