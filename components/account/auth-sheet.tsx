"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";

import { useAccount } from "@/components/account/account-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { trackAuthGateFromIntent } from "@/lib/analytics/auth-gate-events";
import { writePendingAuthIntent } from "@/lib/auth/pending-auth-intent";

import "./auth-sheet.css";

const DESKTOP_QUERY = "(min-width: 1024px)";

export type AuthSheetDraft = {
  toolSlug: string;
  desiredStackName?: string;
  targetStackId?: string;
  targetStackName?: string;
  returnTo: string;
  origin: string;
};

type AuthSheetPhase = "email" | "submitting" | "sent" | "error";

function useDesktopAuthSheet() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const media = window.matchMedia(DESKTOP_QUERY);
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return isDesktop;
}

function AuthSheetForm({
  draft,
  phase,
  email,
  error,
  emailId,
  errorId,
  statusId,
  title,
  description,
  onEmailChange,
  onSubmit,
  onDismiss,
}: {
  draft: AuthSheetDraft;
  phase: AuthSheetPhase;
  email: string;
  error: string | null;
  emailId: string;
  errorId: string;
  statusId: string;
  title: ReactNode;
  description: ReactNode;
  onEmailChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDismiss: () => void;
}) {
  const emailRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const submitting = phase === "submitting";
  const sent = phase === "sent";

  return (
    <div className="tv-auth-sheet">
      <p className="tv-auth-sheet__eyebrow">Spazio di lavoro</p>
      {title}
      {description}
      {sent ? (
        <p className="tv-auth-sheet__status" id={statusId} role="status">
          Controlla la tua email. Apri il link per continuare con {draft.toolSlug}.
        </p>
      ) : (
        <form className="tv-auth-sheet__form" onSubmit={onSubmit} noValidate>
          <label className="tv-auth-sheet__label" htmlFor={emailId}>
            Email
            <input
              ref={emailRef}
              id={emailId}
              className="tv-auth-sheet__input"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              disabled={submitting}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              onChange={(event) => onEmailChange(event.target.value)}
            />
          </label>
          {error ? (
            <p className="tv-auth-sheet__error" id={errorId} role="alert">
              {error}
            </p>
          ) : null}
          <div className="tv-auth-sheet__actions">
            <button
              type="submit"
              className="tv-auth-sheet__cta"
              disabled={submitting}
            >
              {submitting ? "Invio in corso…" : "Continua con il tuo account"}
            </button>
            <button
              type="button"
              className="tv-auth-sheet__dismiss"
              onClick={onDismiss}
            >
              Non ora
            </button>
          </div>
        </form>
      )}
      {sent ? (
        <button
          type="button"
          className="tv-auth-sheet__dismiss"
          onClick={onDismiss}
        >
          Chiudi
        </button>
      ) : null}
      <p className="tv-auth-sheet__footnote">
        Ti inviamo un link. Nessuna password.
      </p>
    </div>
  );
}

export function AuthSheet({
  open,
  draft,
  onOpenChange,
}: {
  open: boolean;
  draft: AuthSheetDraft | null;
  onOpenChange: (open: boolean) => void;
}) {
  const account = useAccount();
  const isDesktop = useDesktopAuthSheet();
  useReducedMotion();
  const emailId = useId();
  const errorId = useId();
  const statusId = useId();
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<AuthSheetPhase>("email");
  const [error, setError] = useState<string | null>(null);
  const viewedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      viewedRef.current = false;
      setPhase("email");
      setError(null);
      setEmail("");
      return;
    }
    if (!draft || viewedRef.current) return;
    viewedRef.current = true;
    trackAuthGateFromIntent({
      name: "auth_gate_view",
      capability: "stack.create",
      origin: draft.origin,
      returnTo: draft.returnTo,
    });
  }, [open, draft]);

  const dismiss = () => {
    if (!open) return;
    if (draft && phase !== "sent") {
      trackAuthGateFromIntent({
        name: "auth_gate_dismiss",
        capability: "stack.create",
        origin: draft.origin,
        returnTo: draft.returnTo,
      });
    }
    onOpenChange(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft) return;
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@") || !normalized.includes(".")) {
      setError("Inserisci l'email del tuo spazio.");
      setPhase("error");
      return;
    }
    if (!account.authEnabled) {
      setError("Accesso email non disponibile al momento.");
      setPhase("error");
      return;
    }
    const written = writePendingAuthIntent({
      toolSlug: draft.toolSlug,
      desiredStackName: draft.desiredStackName,
      targetStackId: draft.targetStackId,
      targetStackName: draft.targetStackName,
      returnTo: draft.returnTo,
      origin: draft.origin,
    });
    if (written.status !== "ready") {
      setError("Non siamo riusciti a conservare questa azione. Riprova.");
      setPhase("error");
      return;
    }
    trackAuthGateFromIntent({
      name: "auth_gate_continue",
      capability: "stack.create",
      origin: draft.origin,
      returnTo: draft.returnTo,
    });
    setPhase("submitting");
    setError(null);
    const result = await account.sendMagicLink(normalized);
    if (!result.ok) {
      setError(result.message || "Invio non riuscito. Riprova.");
      setPhase("error");
      return;
    }
    setPhase("sent");
  };

  if (!draft) return null;

  const formProps = {
    draft,
    phase,
    email,
    error,
    emailId,
    errorId,
    statusId,
    onEmailChange: setEmail,
    onSubmit: handleSubmit,
    onDismiss: dismiss,
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : dismiss())}>
        <DialogContent
          showCloseButton={false}
          className="tv-auth-sheet__surface !bg-[var(--tv-auth-sheet-veil)] border-0 p-0 shadow-none ring-0 sm:max-w-none"
          data-placement="desktop"
        >
          <AuthSheetForm
            {...formProps}
            title={
              <DialogTitle className="tv-auth-sheet__title">
                Crea il tuo spazio di lavoro
              </DialogTitle>
            }
            description={
              <DialogDescription className="tv-auth-sheet__body">
                Gli Stack restano sincronizzati con il tuo account e raccolgono i
                tool che usi insieme.
              </DialogDescription>
            }
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? onOpenChange(true) : dismiss())}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="tv-auth-sheet__surface !bg-[var(--tv-auth-sheet-veil)] border-0 p-0 shadow-none"
        data-placement="mobile"
      >
        <AuthSheetForm
          {...formProps}
          title={
            <SheetTitle className="tv-auth-sheet__title">
              Crea il tuo spazio di lavoro
            </SheetTitle>
          }
          description={
            <SheetDescription className="tv-auth-sheet__body">
              Gli Stack restano sincronizzati con il tuo account e raccolgono i
              tool che usi insieme.
            </SheetDescription>
          }
        />
      </SheetContent>
    </Sheet>
  );
}
