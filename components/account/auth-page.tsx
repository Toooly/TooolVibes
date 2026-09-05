"use client";

import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { layoutMarkerTransition } from "@/lib/motion/transitions";
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

type AuthTab = "login" | "register" | "recover";

/* B59: ultimo magic link inviato con successo (cella link-pending). */
type PendingMagicLink = {
  email: string;
  metadata?: { first_name: string; last_name: string };
};

export function AuthPage() {
  const account = useAccount();
  const preferReducedMotion = useReducedMotion();
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

  const tabs: { key: AuthTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { key: "login", label: "Accedi", icon: Mail },
    { key: "register", label: "Crea spazio", icon: User },
    { key: "recover", label: "Recupera", icon: RotateCcw },
  ];

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
          <p className="v-auth-context__eyebrow">Il tuo spazio</p>
          <p id="account-context-title" className="v-auth-context__title">
            Tutto ciò che decidi resta qui.
          </p>
          <p>
            Salvati, confronti, stack e note in un solo posto — anche quando
            cambi dispositivo.
          </p>
          {savedCount > 0 || compareCount > 0 ? (
            <p className="v-auth-context__live">
              Hai già {savedCount} tool salvati e {compareCount} nel confronto.
              Entrando li porti nel tuo spazio.
            </p>
          ) : (
            <ul>
              <li>Salva i candidati che stai valutando.</li>
              <li>Confronta, poi registra perché hai scelto.</li>
              <li>Ritrova stack e decisioni quando torni.</li>
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
              {activeTab === "register"
                ? "Crea il tuo spazio"
                : activeTab === "recover"
                  ? "Rientra nel tuo spazio"
                  : "Entra nel tuo spazio"}
            </h1>
            <p className="v-auth-subtitle">
              {activeTab === "register"
                ? "Due minuti. Poi salvati, confronti e motivazioni restano con te."
                : activeTab === "recover"
                  ? "Stesso accesso sicuro, sullo stesso spazio."
                  : "Google, Apple, GitHub — oppure un link alla tua email. Niente password."}
            </p>
          </div>

          {/* Tabs */}
          <div className="v-auth-tabs" role="tablist">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.key)}
                  className={`v-auth-tab ${isActive ? "is-active" : ""}`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.span
                      className="v-auth-tab-indicator"
                      layoutId="auth-tab-indicator"
                      transition={layoutMarkerTransition({ preferReducedMotion })}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="v-auth-form-wrapper">
              {account.signInWithOAuth && activeTab !== "recover" ? (
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
                      <label htmlFor="auth-firstName">Nome</label>
                      <div className="v-auth-input-wrap">
                        <User size={16} className="v-auth-input-icon" />
                        <input
                          id="auth-firstName"
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Mario"
                          autoComplete="given-name"
                          className="v-auth-input tv-kbd-input"
                        />
                      </div>
                    </div>
                    <div className="v-auth-field v-auth-field--half">
                      <label htmlFor="auth-lastName">Cognome</label>
                      <div className="v-auth-input-wrap">
                        <User size={16} className="v-auth-input-icon" />
                        <input
                          id="auth-lastName"
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Rossi"
                          autoComplete="family-name"
                          className="v-auth-input tv-kbd-input"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="v-auth-field">
                  <label htmlFor="auth-email">Email</label>
                  <div className="v-auth-input-wrap">
                    <Mail size={16} className="v-auth-input-icon" />
                    <input
                      id="auth-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nome@email.com"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                      className="v-auth-input tv-kbd-input"
                      aria-invalid={Boolean(emailError)}
                    />
                  </div>
                  {emailError ? (
                    <p className="v-auth-message v-auth-message--error" role="alert">{emailError}</p>
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
                    <span>
                      Accetto di ricevere la mail di conferma e i <a href="/termini" className="underline hover:text-white">termini del servizio</a>.
                    </span>
                  </label>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={account.isSendingLink || (activeTab === "register" && !agreed)}
                  className="v-auth-btn-primary tv-kbd-sheet__footer"
                >
                  {account.isSendingLink ? (
                    <>
                      <Sparkles size={16} className="v-auth-spin" />
                      Invio in corso...
                    </>
                  ) : activeTab === "register" ? (
                    <>
                      <User size={16} />
                      Crea lo spazio
                    </>
                  ) : activeTab === "recover" ? (
                    <>
                      <RotateCcw size={16} />
                      Invia link di recupero
                    </>
                  ) : (
                    <>
                      <Mail size={16} />
                      Inviami il link
                    </>
                  )}
                </button>
              </form>

              {/* Info */}
              <p className="v-auth-info">
                {activeTab === "login"
                  ? "Apri la mail, clicca il link, sei dentro. Niente password da ricordare."
                  : activeTab === "recover"
                    ? "Se questa email ha già uno spazio, ricevi un nuovo link di accesso."
                    : "Ti arriva una mail di conferma. I salvati di questo browser restano con te."}
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
              <p className="font-semibold">Backup locale isolato</p>
              <p className="mt-1">
                Abbiamo separato una selezione creata prima che questo browser
                potesse stabilirne il proprietario. Ripristinala solo se riconosci
                questo dispositivo e vuoi aggiungerla allo spazio corrente.
              </p>
              <button
                type="button"
                className="v-auth-btn-primary mt-3"
                disabled={account.isRestoringQuarantinedWorkspace || account.isAttaching}
                onClick={() => void account.restoreQuarantinedWorkspace()}
              >
                <RotateCcw size={16} aria-hidden="true" />
                {account.isRestoringQuarantinedWorkspace
                  ? "Ripristino in corso..."
                  : "Ripristina selezione locale"}
              </button>
            </div>
          ) : null}

          {/* Auth message */}
          {account.authMessage && stateCell?.kind !== "link-pending" && (
            <div
              className={`v-auth-message ${account.authMessage.includes("non disponibile") || account.authMessage.includes("errore") || account.authMessage.includes("pausa") ? "v-auth-message--error" : "v-auth-message--success"}`}
            >
              {account.authMessage}
            </div>
          )}

          {/* Footer */}
          <div className="v-auth-footer">
            <p>
              {activeTab === "register"
                ? "Hai già uno spazio? "
                : "Non hai ancora uno spazio? "}
              <button
                type="button"
                className="v-auth-link"
                onClick={() => setActiveTab(activeTab === "register" ? "login" : "register")}
              >
                {activeTab === "register" ? "Accedi" : "Crea spazio"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
