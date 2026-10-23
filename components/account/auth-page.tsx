"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { useLocale } from "@/components/i18n/locale-provider";
import { useState, type FormEvent } from "react";
import { isAuthFailureMessage } from "@/lib/auth/auth-messages";
import { useAccount } from "./account-provider";
import { OAuthButtons } from "./oauth-buttons";
import { BrandLogo } from "@/components/layout/brand-logo";
import { InstrumentOrbit } from "@/components/ui/instrument-orbit";
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
      setEmailError("Inserisci l'email del tuo spazio.");
      return;
    }
    if (!normalizedEmail.includes("@") || !normalizedEmail.includes(".")) {
      setEmailError("Questa email non sembra valida.");
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
          <InstrumentOrbit className="v-auth-context__orbit" />
          <p className="v-auth-context__eyebrow"><LocalizedText>{"Il tuo spazio"}</LocalizedText></p>
          <p id="account-context-title" className="v-auth-context__title"><LocalizedText>{"Tutto ciò che decidi resta qui. "}</LocalizedText></p>
          <p><LocalizedText>{"Salvati, confronti, stack e note in un solo posto — anche quando cambi dispositivo. "}</LocalizedText></p>
          {savedCount > 0 || compareCount > 0 ? (
            <p className="v-auth-context__live"><LocalizedText>{"Hai già "}</LocalizedText>{savedCount}<LocalizedText>{" tool salvati e "}</LocalizedText>{compareCount}<LocalizedText>{" nel confronto. Entrando li porti nel tuo spazio. "}</LocalizedText></p>
          ) : (
            <ul>
              <li><LocalizedText>{"Salva i candidati che stai valutando."}</LocalizedText></li>
              <li><LocalizedText>{"Confronta, poi registra perché hai scelto."}</LocalizedText></li>
              <li><LocalizedText>{"Ritrova stack e decisioni quando torni."}</LocalizedText></li>
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
                ? "Crea il tuo spazio"
                : "Entra in TooolVibes"}</LocalizedText>
            </h1>
            <p className="v-auth-subtitle">
              <LocalizedText>{activeTab === "register"
                ? "Due minuti. Poi salvati, confronti e motivazioni restano con te."
                : "Il tuo spazio per salvare, confrontare e ricordare le tue decisioni."}</LocalizedText>
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
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Inserisci la tua email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                      className="v-auth-input tv-kbd-input"
                      aria-invalid={Boolean(emailError)}
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
                    <p className="v-auth-message v-auth-message--error" role="alert"><LocalizedText>{emailError}</LocalizedText></p>
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
                      <User size={16} /><LocalizedText>{"Crea lo spazio "}</LocalizedText></>
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
                  ? "Ti invieremo un link sicuro per accedere."
                  : "Ti arriva una mail di conferma. I salvati di questo browser restano con te."}</LocalizedText>
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
                ? "Hai già uno spazio? "
                : "Non hai ancora uno spazio? "}</LocalizedText>
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
