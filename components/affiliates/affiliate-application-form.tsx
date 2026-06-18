"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";

import { PremiumBadge, PremiumButton, PremiumPanel } from "@/components/ui/premium";
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

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (form.email.trim() && !isValidEmail(form.email.trim())) {
    errors.email = "Inserisci una email valida oppure lascia vuoto.";
  }
  if (!isValidUrl(form.websiteUrl.trim())) {
    errors.websiteUrl = "Inserisci un URL valido con https:// oppure lascia vuoto.";
  }
  if (form.message.trim().length < 12) {
    errors.message = "Scrivi almeno due righe sul perché vuoi diventare affiliato.";
  }

  return errors;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-2 text-sm font-semibold text-red-100">{message}</p>;
}

export function AffiliateApplicationForm({ className }: { className?: string }) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
        body: JSON.stringify(form),
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
    }
  }

  const inputClass =
    "premium-input min-h-11 px-3.5 py-2.5 text-[0.92rem] placeholder:text-white/38 sm:min-h-12 sm:px-4 sm:py-3 sm:text-[0.98rem]";
  const labelClass = "text-xs font-semibold uppercase tracking-[0.14em] text-white/68";

  return (
    <PremiumPanel tone="dark" className={cn("p-4 text-white sm:p-6", className)}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <PremiumBadge tone="accent">Candidatura affiliato</PremiumBadge>
          <h2 className="mt-3 text-[1.45rem] leading-tight sm:text-[1.85rem]">
            Raccontaci chi sei e dove porteresti TooolVibes.
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Nome</span>
            <input
              value={form.firstName}
              onChange={(event) => updateField("firstName", event.target.value)}
              className={cn(inputClass, "mt-2 border-white/14 bg-white/8 text-white")}
              placeholder="Opzionale"
              disabled={isSubmitting}
            />
            <FieldError message={errors.firstName} />
          </label>

          <label className="block">
            <span className={labelClass}>Cognome</span>
            <input
              value={form.lastName}
              onChange={(event) => updateField("lastName", event.target.value)}
              className={cn(inputClass, "mt-2 border-white/14 bg-white/8 text-white")}
              placeholder="Opzionale"
              disabled={isSubmitting}
            />
            <FieldError message={errors.lastName} />
          </label>

          <label className="block">
            <span className={labelClass}>Email</span>
            <input
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              type="email"
              inputMode="email"
              className={cn(inputClass, "mt-2 border-white/14 bg-white/8 text-white")}
              placeholder="Opzionale, se vuoi essere ricontattato via email"
              disabled={isSubmitting}
            />
            <FieldError message={errors.email} />
          </label>

          <label className="block">
            <span className={labelClass}>Brand o progetto</span>
            <input
              value={form.brandName}
              onChange={(event) => updateField("brandName", event.target.value)}
              className={cn(inputClass, "mt-2 border-white/14 bg-white/8 text-white")}
              placeholder="Creator, newsletter, community..."
              disabled={isSubmitting}
            />
          </label>

          <label className="block md:col-span-2">
            <span className={labelClass}>Sito</span>
            <input
              value={form.websiteUrl}
              onChange={(event) => updateField("websiteUrl", event.target.value)}
              type="url"
              inputMode="url"
              className={cn(inputClass, "mt-2 border-white/14 bg-white/8 text-white")}
              placeholder="https://..."
              disabled={isSubmitting}
            />
            <FieldError message={errors.websiteUrl} />
          </label>

          <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
            {[
              ["instagram", "Instagram", "@profilo o URL"],
              ["facebook", "Facebook", "Pagina, gruppo o profilo"],
              ["tiktok", "TikTok", "@profilo o URL"],
              ["xProfile", "X / Twitter", "@profilo o URL"],
              ["linkedin", "LinkedIn", "Profilo o pagina"],
              ["youtube", "YouTube", "Canale o URL"],
            ].map(([key, label, placeholder]) => (
              <label key={key} className="block">
                <span className={labelClass}>{label}</span>
                <input
                  value={form[key as keyof FormState]}
                  onChange={(event) => updateField(key as keyof FormState, event.target.value)}
                  className={cn(inputClass, "mt-2 border-white/14 bg-white/8 text-white")}
                  placeholder={placeholder}
                  disabled={isSubmitting}
                />
              </label>
            ))}
          </div>

          <label className="block md:col-span-2">
            <span className={labelClass}>Audience</span>
            <textarea
              value={form.audience}
              onChange={(event) => updateField("audience", event.target.value)}
              rows={3}
              className={cn(inputClass, "mt-2 min-h-[7rem] resize-none border-white/14 bg-white/8 text-white")}
              placeholder="Chi ti segue e perché potrebbe essere interessato ai tool AI?"
              disabled={isSubmitting}
            />
          </label>

          <label className="block md:col-span-2">
            <span className={labelClass}>Canali di promozione</span>
            <input
              value={form.channels}
              onChange={(event) => updateField("channels", event.target.value)}
              className={cn(inputClass, "mt-2 border-white/14 bg-white/8 text-white")}
              placeholder="Newsletter, YouTube, LinkedIn, community, sito..."
              disabled={isSubmitting}
            />
          </label>

          <label className="block md:col-span-2">
            <span className={labelClass}>Messaggio obbligatorio</span>
            <textarea
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
              rows={4}
              className={cn(inputClass, "mt-2 min-h-[8rem] resize-none border-white/14 bg-white/8 text-white")}
              placeholder="Raccontaci perché vorresti diventare affiliato e come presenteresti TooolVibes alla tua audience."
              disabled={isSubmitting}
              required
            />
            <FieldError message={errors.message} />
          </label>
        </div>

        {errors.form ? (
          <div className="rounded-[20px] border border-red-200/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">
            {errors.form}
          </div>
        ) : null}

        {isSubmitted ? (
          <div className="flex gap-3 rounded-[20px] border border-emerald-200/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <p>Richiesta ricevuta. La troviamo nel backoffice e ti rispondiamo via email.</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-white/62">
            Nome, email e profili social sono opzionali. Il messaggio e il solo campo richiesto.
          </p>
          <PremiumButton type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Invio in corso
              </>
            ) : (
              <>
                <Send className="size-4" aria-hidden="true" />
                Invia candidatura
              </>
            )}
          </PremiumButton>
        </div>
      </form>
    </PremiumPanel>
  );
}
