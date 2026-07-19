"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useAccount } from "./account-provider";
import { BrandLogo } from "@/components/layout/brand-logo";
import { useKeyboardAwareScroll } from "@/lib/hooks/use-keyboard-aware-scroll";
import { Mail, User, ArrowRight, RotateCcw, Shield, Sparkles } from "lucide-react";

type AuthTab = "login" | "register" | "admin";

export function AuthPage() {
  const account = useAccount();
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [agreed, setAgreed] = useState(false);

  /* B39/MOB-703: scroll-to-input con tastiera aperta (iOS non ridimensiona
     il layout viewport); il container e' la card che racchiude i campi. */
  const keyboardScrollRef = useKeyboardAwareScroll<HTMLDivElement>();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    const metadata =
      activeTab === "register" && (firstName || lastName)
        ? { first_name: firstName.trim(), last_name: lastName.trim() }
        : undefined;

    await account.sendMagicLink(normalizedEmail, metadata);
  };

  const tabs: { key: AuthTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { key: "login", label: "Accedi", icon: Mail },
    { key: "register", label: "Registrati", icon: User },
    { key: "admin", label: "Admin", icon: Shield },
  ];

  return (
    <div className="v-auth-page tv-kbd-page">
      {/* Ambient background */}
      <div className="v-auth-page-bg" aria-hidden="true" />
      <div className="v-auth-page-orb" aria-hidden="true" />

      <div className="v-auth-container">
        <motion.div
          ref={keyboardScrollRef}
          className="v-auth-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="v-auth-header">
            <div className="v-auth-brand">
              <BrandLogo size={44} priority />
            </div>
            <h1 className="v-auth-title">TooolVibes</h1>
            <p className="v-auth-subtitle">
              {activeTab === "admin"
                ? "Accesso riservato agli amministratori"
                : "Accedi al tuo spazio di selezione tool"}
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
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {activeTab === "admin" ? (
              <motion.div
                key="admin"
                className="v-auth-admin"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="v-auth-admin-icon">
                  <Shield size={28} />
                </div>
                <p className="v-auth-admin-title">Accesso amministratore</p>
                <p className="v-auth-admin-desc">
                  Portale dedicato per la gestione dei contenuti, degli strumenti e delle raccolte.
                </p>
                <Link
                  href="/admin/login"
                  className="v-auth-btn-primary v-auth-btn-admin"
                >
                  <Shield size={16} />
                  Accedi come amministratore
                  <ArrowRight size={14} />
                </Link>
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                className="v-auth-form-wrapper"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
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
                      />
                    </div>
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
                        Accetto di ricevere la mail di conferma e i termini del servizio.
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
                    ) : activeTab === "login" ? (
                      <>
                        <Mail size={16} />
                        Accedi con email
                      </>
                    ) : (
                      <>
                        <User size={16} />
                        Registrati
                      </>
                    )}
                  </button>
                </form>

                {/* Info */}
                <p className="v-auth-info">
                  {activeTab === "login"
                    ? "Inserisci la tua email. Ti invieremo un link sicuro per accedere."
                    : "Inserisci i tuoi dati. Ti invieremo una mail di conferma per attivare l'account."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

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
          {account.authMessage && (
            <motion.div
              className={`v-auth-message ${account.authMessage.includes("non disponibile") || account.authMessage.includes("errore") || account.authMessage.includes("pausa") ? "v-auth-message--error" : "v-auth-message--success"}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {account.authMessage}
            </motion.div>
          )}

          {/* Footer */}
          <div className="v-auth-footer">
            <p>
              {activeTab === "login"
                ? "Non hai un account? "
                : "Hai già un account? "}
              <button
                type="button"
                className="v-auth-link"
                onClick={() => setActiveTab(activeTab === "login" ? "register" : "login")}
              >
                {activeTab === "login" ? "Registrati" : "Accedi"}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
