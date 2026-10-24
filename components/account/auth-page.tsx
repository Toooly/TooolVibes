"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { useLocale } from "@/components/i18n/locale-provider";
import { useId, useState, type FormEvent } from "react";
import { isAuthFailureMessage } from "@/lib/auth/auth-messages";
import { useAccount } from "./account-provider";
import { OAuthButtons } from "./oauth-buttons";
import { BrandLogo } from "@/components/layout/brand-logo";
import { useKeyboardAwareScroll } from "@/lib/hooks/use-keyboard-aware-scroll";
import { Mail, User, RotateCcw, Sparkles } from "lucide-react";
import { AccountStateBanner } from "./panel/account-state-banner";
import { isAccountStateMatrixEnabled } from "./panel/account-state-flags";
import {
  resolveAccountStateCell,
  shouldRenderAccountStateBanner,
} from "./panel/account-state-matrix";
import { useAccountOnlineStatus } from "./panel/use-account-online-status";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

type AuthTab = "login" | "register";

/* B59: ultimo magic link inviato con successo (cella link-pending). */
type PendingMagicLink = {
  email: string;
  metadata?: { first_name: string; last_name: string };
};

export function AuthPage() {
  const account = useAccount();
  const { locale } = useLocale();
  const memoryMaterial = useId();
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [pendingLink, setPendingLink] = useState<PendingMagicLink | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const isOnline = useAccountOnlineStatus();
  const savedCount = useToolWorkspaceStore((s) => s.savedSlugs.length);
  const compareCount = useToolWorkspaceStore((s) => s.compareSlugs.length);

  /* B39/MOB-703: scroll-to-input con tastiera aperta (iOS non ridimensiona
     il layout viewport); il container e' la card che racchiude i campi. */
  const keyboardScrollRef = useKeyboardAwareScroll<HTMLDivElement>();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setEmailError("Inserisci la tua email.");
      return;
    }
    if (!normalizedEmail.includes("@") || !normalizedEmail.includes(".")) {
      setEmailError("Controlla l'indirizzo email.");
      return;
    }
    setEmailError(null);

    const metadata =
      activeTab === "register" && (firstName || lastName)
        ? { first_name: firstName.trim(), last_name: lastName.trim() }
        : undefined;

    const result = await account.sendMagicLink(normalizedEmail, metadata);
    setPendingLink(result.ok ? { email: normalizedEmail, metadata } : null);
  };

  /* B59: cella state matrix per la superficie auth (offline, auth non
     disponibile, link pending). Con flag OFF tutto resta come prima. */
  const stateCell = isAccountStateMatrixEnabled()
    ? resolveAccountStateCell({
        status: account.status ?? "guest",
        authEnabled: account.authEnabled !== false,
        isOnline,
        isAttaching: account.isAttaching === true,
        workspaceAttachPending: account.workspaceAttachPending === true,
        pendingLinkEmail: pendingLink?.email ?? null,
        authMessage: account.authMessage,
      })
    : null;
  const showStateBanner = stateCell !== null && shouldRenderAccountStateBanner(stateCell);

  return (
    <div id="member-access" className="v-auth-page tv-kbd-page scroll-mt-24">
      <div className="v-auth-container v-auth-container--split">
        <aside className="v-auth-context" aria-labelledby="account-context-title">
          <div className="v-auth-memory" aria-hidden="true">
            <svg viewBox="0 0 360 170" focusable="false">
              <defs>
                <linearGradient id={memoryMaterial} x2="1" y2="1">
                  <stop stopColor="var(--tv-color-violet-300)" stopOpacity="0.2" />
                  <stop offset="1" stopColor="var(--tv-surface-raised)" />
                </linearGradient>
              </defs>
              <path className="v-auth-memory__connection" d="M91 105h46q18 0 18-18V67q0-18 18-18h69" />
              <g className="v-auth-memory__record" fill={`url(#${memoryMaterial})`} stroke="var(--tv-material-edge)">
                <rect x="37" y="41" width="83" height="100" rx="17" />
                <path className="v-auth-memory__bookmark" d="M67 42v39l12-8 12 8V42" />
                <path className="v-auth-memory__trace" d="M55 107h47m-47 12h29" />
              </g>
              <g className="v-auth-memory__record v-auth-memory__record--choice" fill={`url(#${memoryMaterial})`} stroke="var(--tv-material-edge)">
                <rect x="191" y="27" width="125" height="98" rx="17" />
                <path className="v-auth-memory__trace" d="M210 54h52m-52 12h84m-84 37h67" />
                <path className="v-auth-memory__check" d="m211 84 7 7 15-16" />
              </g>
            </svg>
          </div>
          <p className="v-auth-context__eyebrow"><LocalizedText>{"Il tuo spazio"}</LocalizedText></p>
          <p id="account-context-title" className="v-auth-context__title"><LocalizedText>{"Le tue scelte, con il loro perché."}</LocalizedText></p>
          <p><LocalizedText>{"Salva i tool, confronta le alternative e ritrova il motivo di ogni scelta."}</LocalizedText></p>
          {savedCount > 0 || compareCount > 0 ? (
            <p className="v-auth-context__live">{locale === "en"
              ? `You have ${savedCount} saved ${savedCount === 1 ? "tool" : "tools"} and ${compareCount} in comparison. Sign in to bring them into your space.`
              : `Hai già ${savedCount} ${savedCount === 1 ? "tool salvato" : "tool salvati"} e ${compareCount} nel confronto. Entrando li porti nel tuo spazio.`}</p>
          ) : (
            <ul>
              <li><LocalizedText>{"Raccogli i tool da provare."}</LocalizedText></li>
              <li><LocalizedText>{"Confronta le alternative."}</LocalizedText></li>
              <li><LocalizedText>{"Ritrova note, stack e decisioni."}</LocalizedText></li>
            </ul>
          )}
        </aside>
        <div
          ref={keyboardScrollRef}
          className="v-auth-card"
        >
          {/* Header */}
          <div className="v-auth-header">
            <div className="v-auth-brand">
              <BrandLogo size={44} priority fallback="png" />
            </div>
            <h1 className="v-auth-title">
              <LocalizedText>{activeTab === "register"
                ? "Crea il tuo account"
                : "Entra in TooolVibes"}</LocalizedText>
            </h1>
            <p className="v-auth-subtitle">
              <LocalizedText>{activeTab === "register"
                ? "Uno spazio per i tuoi tool, le note e le decisioni."
                : "Riprendi i tool e le scelte che stai valutando."}</LocalizedText>
            </p>
          </div>

          {/* Content */}
          <div className="v-auth-form-wrapper">
              {account.signInWithOAuth ? (
                <OAuthButtons
                  disabled={account.isSendingLink}
                  onSelect={(provider) => {
                    void account.signInWithOAuth?.(provider);
                  }}
                />
              ) : null}
              <form onSubmit={handleSubmit} className="v-auth-form" noValidate>
                {/* Register fields */}
                {activeTab === "register" && (
                  <div className="v-auth-field-group">
                    <div className="v-auth-field v-auth-field--half">
                      <label htmlFor="auth-firstName"><LocalizedText>{"Nome"}</LocalizedText></label>
                      <div className="v-auth-input-wrap">
                        <User size={16} className="v-auth-input-icon" />
                        <LocalizedAttributes><input
                          id="auth-firstName"
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Mario"
                          autoComplete="given-name"
                          className="v-auth-input tv-kbd-input"
                        /></LocalizedAttributes>
                      </div>
                    </div>
                    <div className="v-auth-field v-auth-field--half">
                      <label htmlFor="auth-lastName"><LocalizedText>{"Cognome"}</LocalizedText></label>
                      <div className="v-auth-input-wrap">
                        <User size={16} className="v-auth-input-icon" />
                        <LocalizedAttributes><input
                          id="auth-lastName"
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Rossi"
                          autoComplete="family-name"
                          className="v-auth-input tv-kbd-input"
                        /></LocalizedAttributes>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="v-auth-field">
                  <label htmlFor="auth-email"><LocalizedText>{"Email"}</LocalizedText></label>
                  <div className="v-auth-input-wrap v-auth-input-wrap--inline">
                    <Mail size={16} className="v-auth-input-icon" />
                    <LocalizedAttributes><input
                      id="auth-email"
                      type="email"
                      inputMode="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
                      placeholder="Inserisci la tua email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                      className="v-auth-input tv-kbd-input"
                      aria-invalid={Boolean(emailError)}
                      aria-describedby={emailError ? "auth-email-error" : undefined}
                    /></LocalizedAttributes>
                    {activeTab === "login" ? (
                      <button
                        type="submit"
                        disabled={account.isSendingLink}
                        className="v-auth-btn-primary v-auth-btn-primary--inline tv-kbd-sheet__footer"
                      >
                        {account.isSendingLink ? (
                          <>
                            <Sparkles size={16} className="v-auth-spin" /><LocalizedText>{"Invio in corso... "}</LocalizedText></>
                        ) : (
                          <>
                            <Mail size={16} /><LocalizedText>{"Invia link "}</LocalizedText></>
                        )}
                      </button>
                    ) : null}
                  </div>
                  {emailError ? (
                    <p id="auth-email-error" className="v-auth-message v-auth-message--error" role="alert"><LocalizedText>{emailError}</LocalizedText></p>
                  ) : null}
                </div>

                {/* Consent register */}
                {activeTab === "register" && (
                  <label className="v-auth-consent">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      required
                      className="v-auth-checkbox"
                    />
                    <span><LocalizedText>{"Accetto di ricevere la mail di conferma e i "}</LocalizedText><a href="/termini" className="underline hover:text-white"><LocalizedText>{"termini del servizio"}</LocalizedText></a>.
                    </span>
                  </label>
                )}

                {/* Submit (register only — login submits inline in the email row) */}
                {activeTab === "register" ? (
                <button
                  type="submit"
                  disabled={account.isSendingLink || !agreed}
                  className="v-auth-btn-primary tv-kbd-sheet__footer"
                >
                  {account.isSendingLink ? (
                    <>
                      <Sparkles size={16} className="v-auth-spin" /><LocalizedText>{"Invio in corso... "}</LocalizedText></>
                  ) : activeTab === "register" ? (
                    <>
                      <User size={16} /><LocalizedText>{"Crea account"}</LocalizedText></>
                  ) : (
                    <>
                      <Mail size={16} /><LocalizedText>{"Invia link "}</LocalizedText></>
                  )}
                </button>
                ) : null}
              </form>

              {/* Info */}
              <p className="v-auth-info">
                <LocalizedText>{activeTab === "login"
                  ? "Apri il link nell'email per accedere, senza password."
                  : "Conferma l'email per portare i salvati di questo browser nel tuo account."}</LocalizedText>
              </p>
            </div>

          {/* State matrix (B59): offline / unavailable / link pending */}
          {showStateBanner ? (
            <AccountStateBanner
              variant="auth"
              cell={stateCell}
              onAction={(actionId) => {
                if (actionId === "resend-link" && pendingLink) {
                  void account
                    .sendMagicLink(pendingLink.email, pendingLink.metadata)
                    .then((result) => {
                      if (!result.ok) setPendingLink(null);
                    });
                }
              }}
            />
          ) : null}

          {account.hasQuarantinedWorkspace ? (
            <div className="v-auth-message v-auth-message--success" role="status">
              <p className="font-semibold"><LocalizedText>{"Backup locale isolato"}</LocalizedText></p>
              <p className="mt-1"><LocalizedText>{"Abbiamo separato una selezione creata prima che questo browser potesse stabilirne il proprietario. Ripristinala solo se riconosci questo dispositivo e vuoi aggiungerla allo spazio corrente. "}</LocalizedText></p>
              <button
                type="button"
                className="v-auth-btn-primary mt-3"
                disabled={account.isRestoringQuarantinedWorkspace || account.isAttaching}
                onClick={() => void account.restoreQuarantinedWorkspace()}
              >
                <RotateCcw size={16} aria-hidden="true" />
                <LocalizedText>{account.isRestoringQuarantinedWorkspace
                  ? "Ripristino in corso..."
                  : "Ripristina selezione locale"}</LocalizedText>
              </button>
            </div>
          ) : null}

          {/* Auth message */}
          {account.authMessage && stateCell?.kind !== "link-pending" && (
            <div
              className={`v-auth-message ${isAuthFailureMessage(account.authMessage) ? "v-auth-message--error" : "v-auth-message--success"}`}
              role={isAuthFailureMessage(account.authMessage) ? "alert" : "status"}
            >
              <LocalizedText>{account.authMessage}</LocalizedText>
            </div>
          )}

          {/* Footer */}
          <div className="v-auth-footer">
            <p>
              <LocalizedText>{activeTab === "register"
                ? "Hai già un account? "
                : "Non hai un account? "}</LocalizedText>
              <button
                type="button"
                className="v-auth-link"
                onClick={() => setActiveTab(activeTab === "register" ? "login" : "register")}
              >
                <LocalizedText>{locale === "en"
                  ? activeTab === "register" ? "Sign in" : "Create an account"
                  : activeTab === "register" ? "Accedi" : "Crea un account"}</LocalizedText>
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
