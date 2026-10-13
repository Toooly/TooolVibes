"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";

import { useAccount } from "@/components/account/account-provider";
import { OAuthButtons } from "@/components/account/oauth-buttons";
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
import type { OAuthProviderId } from "@/lib/auth/oauth-providers";
import {
  writePendingAuthIntent,
  type PendingAuthCapability,
} from "@/lib/auth/pending-auth-intent";

import "./auth-sheet.css";

const DESKTOP_QUERY = "(min-width: 1024px)";

export type AuthSheetDraft = {
  capability?: PendingAuthCapability;
  toolSlug?: string;
  query?: string;
  desiredStackName?: string;
  targetStackId?: string;
  targetStackName?: string;
  returnTo: string;
  origin: string;
};

function authSheetCopy(capability: PendingAuthCapability) {
  if (capability === "note.private") {
    return {
      title: "Ricordalo nel tempo",
      body: "La nota resta sul tool e entra nella tua memoria. La rivedi quando serve.",
    };
  }
  if (capability === "search.personal") {
    return {
      title: "Cerca nel tuo spazio",
      body: "Salvati, stack, decisioni e note: una sola ricerca, la tua.",
    };
  }
  if (capability === "compare.deep") {
    return {
      title: "Confrontalo con ciò che già usi",
      body: "Note, stack, decisioni e utilizzo: il confronto legge il tuo spazio.",
    };
  }
  if (capability === "insight.personal") {
    return {
      title: "Vedi cosa significa per te",
      body: "Insight nati da ciò che hai salvato, confrontato e usato — non da un punteggio inventato.",
    };
  }
  if (capability === "radar.personal") {
    return {
      title: "Scopri cosa conta per te",
      body: "Il Radar resta pubblico. Il tuo filtro è ciò che hai già scelto, usato o scartato.",
    };
  }
  if (capability === "community.write") {
    return {
      title: "Condividi la tua esperienza",
      body: "Racconta come usi davvero questo tool e aiuta altri a valutarlo meglio.",
    };
  }
  return {
    title: "Tieni lo stack con te",
    body: "Gli stack restano nel tuo spazio, sincronizzati su ogni dispositivo.",
  };
}

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
  onOAuth,
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
  onOAuth?: (provider: OAuthProviderId) => void;
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
      <p className="tv-auth-sheet__eyebrow"><LocalizedText>{"Il tuo spazio"}</LocalizedText></p>
      <LocalizedText>{title}</LocalizedText>
      <LocalizedText>{description}</LocalizedText>
      {sent ? (
        <p className="tv-auth-sheet__status" id={statusId} role="status">
          <LocalizedText>{draft.capability === "search.personal"
            ? "Controlla la tua email. Apri il link per continuare la ricerca."
            : draft.capability === "compare.deep"
              ? "Controlla la tua email. Apri il link per continuare il confronto."
              : draft.capability === "insight.personal"
                ? "Controlla la tua email. Apri il link per continuare con gli insight."
                : draft.capability === "radar.personal"
                  ? "Controlla la tua email. Apri il link per continuare sul Radar."
                : draft.capability === "community.write"
                  ? "Controlla la tua email. Apri il link per continuare con la tua esperienza."
            : `Controlla la tua email. Apri il link per continuare con ${draft.toolSlug}.`}</LocalizedText>
        </p>
      ) : (
        <form className="tv-auth-sheet__form" onSubmit={onSubmit} noValidate>
          {onOAuth ? (
            <OAuthButtons disabled={submitting} onSelect={onOAuth} />
          ) : null}
          <label className="tv-auth-sheet__label" htmlFor={emailId}><LocalizedText>{"Email "}</LocalizedText><input
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
              <LocalizedText>{error}</LocalizedText>
            </p>
          ) : null}
          <div className="tv-auth-sheet__actions">
            <button
              type="submit"
              className="tv-auth-sheet__cta"
              disabled={submitting}
            >
              <LocalizedText>{submitting ? "Invio in corso…" : "Continua con il tuo account"}</LocalizedText>
            </button>
            <button
              type="button"
              className="tv-auth-sheet__dismiss"
              onClick={onDismiss}
            ><LocalizedText>{"Non ora "}</LocalizedText></button>
          </div>
        </form>
      )}
      {sent ? (
        <button
          type="button"
          className="tv-auth-sheet__dismiss"
          onClick={onDismiss}
        ><LocalizedText>{"Chiudi "}</LocalizedText></button>
      ) : null}
      <p className="tv-auth-sheet__footnote"><LocalizedText>{"Un link alla tua email, oppure un account se disponibile. Niente password. "}</LocalizedText></p>
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
      capability: draft.capability ?? "stack.create",
      origin: draft.origin,
      returnTo: draft.returnTo,
    });
  }, [open, draft]);

  const dismiss = () => {
    if (!open) return;
    if (draft && phase !== "sent") {
      trackAuthGateFromIntent({
        name: "auth_gate_dismiss",
        capability: draft.capability ?? "stack.create",
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
      capability: draft.capability ?? "stack.create",
      toolSlug: draft.toolSlug,
      query: draft.query,
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
      capability: draft.capability ?? "stack.create",
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

  const handleOAuth = (provider: OAuthProviderId) => {
    if (!draft || !account.signInWithOAuth) return;
    const written = writePendingAuthIntent({
      capability: draft.capability ?? "stack.create",
      toolSlug: draft.toolSlug,
      query: draft.query,
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
      capability: draft.capability ?? "stack.create",
      origin: draft.origin,
      returnTo: draft.returnTo,
    });
    setPhase("submitting");
    void account.signInWithOAuth(provider, { next: draft.returnTo }).then((result) => {
      if (!result.ok) {
        setError(result.message || "Accesso non riuscito. Riprova.");
        setPhase("error");
      }
    });
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
    onOAuth: account.signInWithOAuth ? handleOAuth : undefined,
    onDismiss: dismiss,
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : dismiss())}>
        <DialogContent
          showCloseButton={false}
          className="tv-auth-sheet__surface !bg-[var(--tv-activation-surface)] border-0 p-0 shadow-none ring-0 sm:max-w-none"
          data-placement="desktop"
        >
          <LocalizedAttributes><AuthSheetForm
            {...formProps}
            title={
              <DialogTitle className="tv-auth-sheet__title">
                <LocalizedText>{authSheetCopy(draft.capability ?? "stack.create").title}</LocalizedText>
              </DialogTitle>
            }
            description={
              <DialogDescription className="tv-auth-sheet__body">
                <LocalizedText>{authSheetCopy(draft.capability ?? "stack.create").body}</LocalizedText>
              </DialogDescription>
            }
          /></LocalizedAttributes>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? onOpenChange(true) : dismiss())}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="tv-auth-sheet__surface !bg-[var(--tv-activation-surface)] border-0 p-0 shadow-none"
        data-placement="mobile"
      >
        <LocalizedAttributes><AuthSheetForm
          {...formProps}
          title={
            <SheetTitle className="tv-auth-sheet__title">
              <LocalizedText>{authSheetCopy(draft.capability ?? "stack.create").title}</LocalizedText>
            </SheetTitle>
          }
          description={
            <SheetDescription className="tv-auth-sheet__body">
              <LocalizedText>{authSheetCopy(draft.capability ?? "stack.create").body}</LocalizedText>
            </SheetDescription>
          }
        /></LocalizedAttributes>
      </SheetContent>
    </Sheet>
  );
}
