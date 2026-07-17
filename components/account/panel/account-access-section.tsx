"use client";

import { CheckCircle2, LogOut, Mail, Sparkles } from "lucide-react";

import {
  getContinuityCopy,
  type AccountPanelAccountSlice,
} from "./account-panel-model";
import type { AccountSignupForm } from "./use-account-signup-form";

/* ═══════════════════════════════════════════════════════════════
   AccountAccessSection (B27) — accesso all'area riservata.
   Autenticato: riepilogo account connesso + sign out.
   Guest: form magic link (anche variante Vibe Rush). Markup,
   classi, id e copy invariati rispetto al monolite.
   ═══════════════════════════════════════════════════════════════ */

export function AccountAccessSection({
  account,
  form,
}: {
  account: AccountPanelAccountSlice;
  form: AccountSignupForm;
}) {
  const continuityCopy = getContinuityCopy(account);
  const {
    email,
    setEmail,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    phone,
    setPhone,
    isVibeRushSignup,
    vibeScore,
    vibeXp,
    handleSubmit,
  } = form;

  if (account.status === "authenticated") {
    return (
      <div className="account-section-panel p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-[var(--success)]" />
          <p className="account-label">Account connesso</p>
        </div>
        <p className="account-subtitle mt-3">
          {account.user?.email ?? "Account attivo"} è collegato alla selezione corrente. I
          tool salvati, il confronto e le note sono rimasti al loro posto.
        </p>
        <p className="mt-3 text-[0.9rem] leading-7" style={{ color: "var(--muted)" }}>
          {continuityCopy}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void account.signOut()}
            className="account-btn-secondary"
          >
            <LogOut size={16} />
            Esci dall&apos;account
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      id="account-upgrade"
      onSubmit={handleSubmit}
      className="account-section-panel p-5 sm:p-6"
    >
      <div className="flex items-center gap-2">
        <Mail size={16} className="text-[var(--accent-purple)]" />
        <p className="account-label">
          {isVibeRushSignup ? "Salva Vibe Rush" : "Continua con email"}
        </p>
      </div>
      <p className="account-subtitle mt-3">
        {isVibeRushSignup
          ? `Completa il profilo e ti mandiamo la mail di conferma con il riepilogo: ${vibeScore || 0} vibe raccolti, ${vibeXp || 0} XP.`
          : "Ti mandiamo una mail di conferma. Quando entri, la selezione viene collegata senza perdere ciò che hai già salvato."}
      </p>
      <p className="mt-3 text-[0.88rem] leading-7" style={{ color: "var(--muted)" }}>
        {continuityCopy}
      </p>
      {isVibeRushSignup ? (
        <>
          <p className="mt-3 text-[0.88rem] leading-7 font-semibold" style={{ color: "var(--accent-strong)" }}>
            Riepilogo partita: {vibeScore ?? 0} vibe raccolti, {vibeXp ?? 0} XP.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Nome"
              className="account-input"
              required
            />
            <input
              type="text"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Cognome"
              className="account-input"
              required
            />
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Telefono (opzionale)"
              className="account-input sm:col-span-2"
            />
          </div>
        </>
      ) : null}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nome@email.com"
          className="account-input"
        />
        <button
          type="submit"
          disabled={account.isSendingLink || !account.authEnabled}
          className="account-btn-primary disabled:cursor-default disabled:opacity-60 shrink-0"
        >
          {account.isSendingLink
            ? (
              <>
                <Sparkles size={16} className="animate-spin" />
                Invio...
              </>
            )
            : isVibeRushSignup
              ? "Registrati"
              : "Invia link"}
        </button>
      </div>
      <p className="mt-3 text-xs uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
        {account.authEnabled
          ? isVibeRushSignup
            ? "Conferma la mail per salvare la partita e ritrovare il tuo progresso."
            : "Conferma la mail per entrare e ritrovare la tua selezione."
          : account.status === "loading"
            ? "Prepariamo l'accesso sicuro..."
            : "Accesso email non disponibile in questo momento."}
      </p>
    </form>
  );
}
