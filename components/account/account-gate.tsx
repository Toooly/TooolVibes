"use client";

import { useAccount } from "./account-provider";
import { AuthPage } from "./auth-page";
import { AccountPanel } from "./account-panel";

export function AccountGate() {
  const account = useAccount();

  if (account.status === "loading") {
    return (
      <div id="member-access" className="v-auth-page v-auth-page--loading scroll-mt-24" data-state="loading">
        <div className="v-auth-container v-auth-container--split">
          <aside className="v-auth-context" aria-labelledby="account-context-title">
            <p className="v-auth-context__eyebrow">Account</p>
            <p id="account-context-title" className="v-auth-context__title">Spazio personale</p>
            <p className="account-loading-state__hint">
              Stiamo verificando lo stato di accesso. Se hai già una sessione
              attiva, ti porteremo dentro la tua area; altrimenti qui trovi
              subito il modulo per ricevere un magic link.
            </p>
          </aside>
          <section
            className="v-auth-card v-auth-loading account-loading-state"
            role="status"
            aria-live="polite"
            aria-busy="true"
            aria-labelledby="account-loading-title"
          >
            <p className="account-loading-state__eyebrow">Workspace personale</p>
            <h1 id="account-loading-title">Verifica accesso in corso.</h1>
            <p className="v-auth-loading-text">
              Recuperiamo configurazione Supabase, sessione e stato del workspace
              locale. Niente dati fittizi: appena pronti vedrai il modulo di accesso.
            </p>
            <div className="account-loading-state__skeleton" aria-hidden="true">
              <span className="account-loading-state__row" />
              <span className="account-loading-state__row account-loading-state__row--short" />
              <span className="account-loading-state__row" />
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (account.status === "authenticated") {
    return <AccountPanel />;
  }

  return <AuthPage />;
}
