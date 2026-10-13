"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { KeyRound } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

type LoginErrorCode = "credentials" | "missing-fields" | "rate-limited" | "config";

type LoginFormProps = {
  errorCode: LoginErrorCode | null;
};

const loginErrorMessages: Record<LoginErrorCode, string> = {
  credentials: "Credenziali non valide.",
  "missing-fields": "Inserisci email e password per accedere.",
  "rate-limited": "Troppi tentativi. Attendi qualche minuto e riprova.",
  config: "Accesso non disponibile in questo momento. Riprova più tardi.",
};

function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  const { pending } = useFormStatus();
  const isBusy = pending || isSubmitting;

  return (
    <button
      type="submit"
      disabled={isBusy}
      data-sound-control="true"
      className="premium-button premium-button-primary min-h-12 w-full rounded-full px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
    >
      <LocalizedText>{isBusy ? "Accesso in corso..." : "Accedi"}</LocalizedText>
    </button>
  );
}

export function LoginForm({ errorCode }: LoginFormProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [hasEditedAfterError, setHasEditedAfterError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const showError = Boolean(errorCode) && !hasEditedAfterError;

  useEffect(() => {
    setHasEditedAfterError(false);
    setIsSubmitting(false);
  }, [errorCode]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (isSubmitting) {
      event.preventDefault();
      return;
    }

    setIsSubmitting(true);
  }

  return (
    <form
      action="/api/admin/login"
      method="post"
      className="tv-admin-login-form mt-7 space-y-4"
      onChange={() => {
        setHasEditedAfterError(true);
      }}
      onSubmit={handleSubmit}
    >
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-white/86"><LocalizedText>{"Email"}</LocalizedText></span>
        <input
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          className="premium-input w-full border-white/14 bg-white/8 text-white placeholder:text-white/40 focus:border-white/34"
          style={{ color: "white" }}
          required
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-white/86"><LocalizedText>{"Password"}</LocalizedText></span>
        <div className="relative">
          <input
            type={isPasswordVisible ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            autoCapitalize="none"
            spellCheck={false}
            className="premium-input w-full border-white/14 bg-white/8 pr-[7.25rem] text-white placeholder:text-white/40 focus:border-white/34"
            style={{ color: "white" }}
            required
          />
          <LocalizedAttributes><button
            type="button"
            onClick={() => setIsPasswordVisible((current) => !current)}
            className="absolute bottom-1.5 right-1.5 top-1.5 inline-flex items-center justify-center gap-1.5 rounded-full border border-white/12 bg-white/10 px-3 text-xs font-semibold text-white/76 transition hover:bg-white/16 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/28"
            aria-pressed={isPasswordVisible}
            aria-label={isPasswordVisible ? "Nascondi password" : "Mostra password"}
          >
            <KeyRound className="size-3.5" aria-hidden="true" />
            <LocalizedText>{isPasswordVisible ? "Proteggi" : "Mostra"}</LocalizedText>
          </button></LocalizedAttributes>
        </div>
      </label>

      {showError && errorCode ? (
        <p className="text-sm font-medium text-[#ffd1ca]" aria-live="polite">
          <LocalizedText>{loginErrorMessages[errorCode]}</LocalizedText>
        </p>
      ) : null}

      <SubmitButton isSubmitting={isSubmitting} />
    </form>
  );
}
