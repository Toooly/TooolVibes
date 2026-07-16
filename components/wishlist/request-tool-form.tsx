"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  HeartHandshake,
  Loader2,
  Rocket,
  Send,
  Sparkles,
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
import { PremiumBadge, PremiumButton, PremiumPanel } from "@/components/ui/premium";
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

  const fieldClass =
    "premium-input min-h-11 px-3.5 py-2.5 text-[0.92rem] placeholder:text-[var(--muted)] sm:min-h-12 sm:px-4 sm:py-3 sm:text-[0.98rem]";
  const labelClass =
    "text-xs font-semibold uppercase tracking-[0.12em] text-white/62 sm:text-sm sm:tracking-[0.14em]";
  const flowSteps = isFounderFlow
    ? ["Contatto founder", "Fase e obiettivo", "Pacchetto utile", "Prossimo passo"]
    : ["Nome tool", "Link ufficiale", "Categoria", "Perche' e' utile"];

  return (
    <div className={cn("relative", className)}>
      {toastVisible ? (
        <div
          role="status"
          className="motion-toast fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-4 right-4 z-[70] rounded-[24px] border border-emerald-200/40 bg-[linear-gradient(135deg,#fffdf8,#f4fff8)] px-5 py-4 text-sm text-[var(--foreground)] shadow-[0_24px_70px_rgba(47,33,126,0.16)] sm:bottom-5 sm:left-auto sm:max-w-[22rem]"
        >
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-200" aria-hidden="true" />
            <div>
              <p className="font-semibold">Richiesta ricevuta.</p>
              <p className="mt-1 leading-6 text-[var(--muted-strong)]">
                {lastRequest?.toolName} entra nel flusso{" "}
                {lastRequest?.submitterType === "founder" ? "founder" : "community"} TooolVibes.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <PremiumPanel tone={isFounderFlow ? "warm" : "blue"} className="motion-form-panel request-tool-form p-4 sm:p-6">
        <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
          <SubmissionProtectionFields action="tool_request" />
          <div className="grid gap-4 sm:gap-6">
            <aside className="rounded-[22px] border border-white/10 bg-[rgba(37,37,43,0.9)] p-4 text-white sm:rounded-[26px] sm:p-5">
              <PremiumBadge tone={isFounderFlow ? "warning" : "accent"}>
                {isFounderFlow ? "Founder flow" : "Community flow"}
              </PremiumBadge>
              <h2 className="text-display-card mt-3 text-[1.35rem] leading-tight text-white sm:mt-4 sm:text-[2.2rem]">
                {isFounderFlow ? "Proponi il tuo tool a TooolVibes." : "Consiglia un tool che usi davvero."}
              </h2>
              <p className="mt-2 text-[0.84rem] leading-6 text-white/68 sm:mt-3 sm:text-sm sm:leading-7">
                {isFounderFlow
                  ? "Se sei founder, qui puoi aprire una conversazione commerciale su listing, contenuti, lancio e sponsorship."
                  : "Se lo usi e ti ha convinto, lascia il contesto giusto: caso d'uso, link e motivo per cui merita spazio."}
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  {
                    value: "community" as const,
                    icon: HeartHandshake,
                    title: "Lo uso, ve lo consiglio",
                    copy: "Segnale leggero da utente o appassionato.",
                  },
                  {
                    value: "founder" as const,
                    icon: Building2,
                    title: "Sono il founder",
                    copy: "Proposta business e crescita.",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = form.submitterType === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setFlow(item.value)}
                      className={cn(
                        "rounded-[20px] border p-3 text-left transition duration-200 active:scale-[0.99]",
                        active
                          ? "border-violet-300/36 bg-[rgba(106,60,255,0.24)] shadow-[0_12px_28px_rgba(67,48,199,0.18)]"
                          : "border-white/10 bg-[rgba(26,26,30,0.72)] hover:bg-[rgba(37,37,43,0.92)]",
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Icon size={16} aria-hidden="true" />
                        {item.title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-white/64">
                        {item.copy}
                      </span>
                    </button>
                  );
                })}
              </div>

              <details className="micro-details mt-3 rounded-[18px] border border-white/10 bg-[rgba(26,26,30,0.72)] px-3 py-2.5 text-white sm:hidden">
                <summary>{isFounderFlow ? "Opzioni business" : "Segnali richiesti"}</summary>
                <div className="mt-3 grid gap-2">
                  {flowSteps.map((item, index) => (
                    <div key={item} className="flex items-center gap-2 rounded-[14px] bg-white/7 p-2.5">
                      <span className="grid size-7 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white">
                        {index + 1}
                      </span>
                      <span className="text-xs font-semibold text-white/66">{item}</span>
                    </div>
                  ))}
                </div>
              </details>

              <div className="mt-5 hidden gap-3 sm:grid">
                {flowSteps.map((item, index) => (
                  <div key={item} className="motion-form-step flex items-center gap-3 rounded-[18px] border border-white/10 bg-[rgba(26,26,30,0.72)] p-3">
                    <span className="grid size-8 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-white/66">{item}</span>
                  </div>
                ))}
              </div>
            </aside>

            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
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
                <span className={labelClass}>{isFounderFlow ? "Email di contatto" : "Email opzionale"}</span>
                <input
                  value={form.email}
                  onChange={(event) => updateForm("email", event.target.value)}
                  inputMode="email"
                  className={cn(fieldClass, "mt-2")}
                  placeholder={isFounderFlow ? "Per ricontattarti sulla proposta" : "Per aggiornarti sulla valutazione, se vuoi"}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "tool-email-error" : undefined}
                />
                <FieldError id="tool-email-error" message={errors.email} />
              </label>

              <label className="motion-field block md:col-span-2">
                <span className={labelClass}>{isFounderFlow ? "Pitch rapido" : "Perche' lo consigli"}</span>
                <textarea
                  value={form.message}
                  onChange={(event) => updateForm("message", event.target.value)}
                  rows={4}
                  className={cn(fieldClass, "mt-2 min-h-[7rem] resize-none leading-6 sm:min-h-[9rem] sm:leading-7")}
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
                  <label className="motion-field block">
                    <span className={labelClass}>Nome founder</span>
                    <input
                      value={form.founderName}
                      onChange={(event) => updateForm("founderName", event.target.value)}
                      className={cn(fieldClass, "mt-2")}
                      placeholder="Nome e cognome"
                      aria-invalid={Boolean(errors.founderName)}
                    />
                    <FieldError id="tool-founder-error" message={errors.founderName} />
                  </label>

                  <label className="motion-field block">
                    <span className={labelClass}>Ruolo / azienda</span>
                    <input
                      value={form.companyRole}
                      onChange={(event) => updateForm("companyRole", event.target.value)}
                      className={cn(fieldClass, "mt-2")}
                      placeholder="Founder, CEO, growth, team..."
                      aria-invalid={Boolean(errors.companyRole)}
                    />
                    <FieldError id="tool-role-error" message={errors.companyRole} />
                  </label>

                  <label className="motion-field block">
                    <span className={labelClass}>Fase del tool</span>
                    <select
                      value={form.launchStage}
                      onChange={(event) => updateForm("launchStage", event.target.value)}
                      className={cn(fieldClass, "mt-2 font-semibold")}
                    >
                      {launchStageOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="motion-field block">
                    <span className={labelClass}>Budget</span>
                    <select
                      value={form.budgetRange}
                      onChange={(event) => updateForm("budgetRange", event.target.value)}
                      className={cn(fieldClass, "mt-2 font-semibold")}
                    >
                      {budgetOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="motion-field md:col-span-2">
                    <span className={labelClass}>Cosa ti interessa</span>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {serviceOptions.map((service) => {
                        const checked = (form.requestedServices ?? []).includes(service.value);

                        return (
                          <label
                            key={service.value}
                            className={cn(
                              "flex min-h-11 items-center gap-2 rounded-[18px] border px-3 py-2.5 text-sm font-semibold transition",
                              checked
                                ? "border-violet-300/36 bg-[rgba(106,60,255,0.24)] text-white"
                                : "border-white/10 bg-[rgba(26,26,30,0.72)] text-white/66",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleService(service.value)}
                              className="size-4 accent-[var(--accent-strong)]"
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
                  <label className="motion-field block md:col-span-2">
                    <span className={labelClass}>Use case</span>
                    <input
                      value={form.useCase}
                      onChange={(event) => updateForm("useCase", event.target.value)}
                      className={cn(fieldClass, "mt-2")}
                      placeholder="Es. creare landing, automatizzare lead, montare video..."
                    />
                  </label>

                  <label className="motion-field block">
                    <span className={labelClass}>Referral personale</span>
                    <input
                      value={form.referralUrl}
                      onChange={(event) => updateForm("referralUrl", event.target.value)}
                      inputMode="url"
                      className={cn(fieldClass, "mt-2")}
                      placeholder="https://... se ce l'hai"
                      aria-invalid={Boolean(errors.referralUrl)}
                    />
                    <FieldError id="tool-referral-error" message={errors.referralUrl} />
                  </label>

                  <label className="motion-field block">
                    <span className={labelClass}>Screenshot / video</span>
                    <input
                      value={form.mediaUrl}
                      onChange={(event) => updateForm("mediaUrl", event.target.value)}
                      inputMode="url"
                      className={cn(fieldClass, "mt-2")}
                      placeholder="Link a video, screenshot o demo"
                      aria-invalid={Boolean(errors.mediaUrl)}
                    />
                    <FieldError id="tool-media-error" message={errors.mediaUrl} />
                  </label>

                  <label className="motion-field block md:col-span-2">
                    <span className={labelClass}>Note personali</span>
                    <textarea
                      value={form.personalNotes}
                      onChange={(event) => updateForm("personalNotes", event.target.value)}
                      rows={3}
                      className={cn(fieldClass, "mt-2 min-h-[6rem] resize-none leading-6")}
                      placeholder="Dettagli extra, limiti, alternative provate o cosa dovremmo guardare."
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pt-5">
            <p className="max-w-[42rem] text-[0.82rem] leading-6 text-white/66 sm:text-sm">
              Valutiamo ogni proposta per qualit&agrave;, utilit&agrave; reale e coerenza con il catalogo
              {isFounderFlow ? ", poi decidiamo se aprire un percorso commerciale." : "."}
            </p>
            <PremiumButton
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="w-full sm:min-w-[13rem] sm:w-auto"
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
            </PremiumButton>
          </div>

          {errors.message ? (
            <div className="mt-4 rounded-[20px] border border-red-200/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">
              {errors.message}
            </div>
          ) : null}

          <div className="mt-3 flex items-center gap-2 rounded-[18px] border border-white/10 bg-[rgba(26,26,30,0.72)] px-3 py-2.5 text-xs leading-5 text-white/66 sm:mt-5 sm:rounded-[20px] sm:px-4 sm:py-3 sm:text-sm">
            {isFounderFlow ? (
              <>
                <Rocket className="size-4 text-violet-100" aria-hidden="true" />
                Le proposte founder possono diventare listing, contenuti, lancio o sponsorship.
              </>
            ) : (
              <>
                <BadgeCheck className="size-4 text-violet-100" aria-hidden="true" />
                Le segnalazioni migliori diventano schede curate, non semplici link in elenco.
              </>
            )}
          </div>

          <div className="sr-only" aria-live="polite">
            <Sparkles aria-hidden="true" />
          </div>
        </form>
      </PremiumPanel>
    </div>
  );
}
