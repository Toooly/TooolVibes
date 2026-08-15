"use client";

import { useEffect } from "react";
import { useAccount } from "./account-provider";
import { AuthPage } from "./auth-page";
import { AccountPanel } from "./account-panel";

export function AccountGate() {
  const account = useAccount();
  useEffect(() => {
    document.body.dataset.accountSurface = account.status === "authenticated" ? "workspace" : "auth";
    return () => {
      delete document.body.dataset.accountSurface;
    };
  }, [account.status]);

  if (account.status === "loading") {
    return (
      <div id="member-access" className="v-auth-page v-auth-page--loading scroll-mt-24" data-state="loading">
        <div className="v-auth-container v-auth-container--split">
          <aside className="v-auth-context" aria-labelledby="account-context-title">
            <p className="v-auth-context__eyebrow">Account</p>
            <p id="account-context-title" className="v-auth-context__title">Il tuo TooolVibes</p>
            <p className="account-loading-state__hint">
              Controlliamo se hai già una sessione attiva. In pochi istanti
              entri nel workspace oppure nel modulo di accesso.
            </p>
          </aside>
          <section
            className="v-auth-card v-auth-loading account-loading-state"
            role="status"
            aria-live="polite"
            aria-busy="true"
            aria-labelledby="account-loading-title"
          >
            <p className="account-loading-state__eyebrow">My TooolVibes</p>
            <h1 id="account-loading-title">Stiamo aprendo il tuo TooolVibes.</h1>
            <p className="v-auth-loading-text">
              Recupero sessione e workspace locale. Appena pronti, vedi i tuoi
              salvati oppure il modulo per entrare con email.
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
