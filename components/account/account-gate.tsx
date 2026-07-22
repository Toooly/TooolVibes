"use client";

import { useAccount } from "./account-provider";
import { AuthPage } from "./auth-page";
import { AccountPanel } from "./account-panel";

export function AccountGate() {
  const account = useAccount();

  if (account.status === "loading") {
    return (
      <div id="member-access" className="v-auth-page scroll-mt-24">
        <div className="v-auth-page-bg" aria-hidden="true" />
        <div className="v-auth-container">
          <div className="v-auth-card v-auth-loading account-loading-state" role="status" aria-busy="true">
            <div className="v-auth-loading-spinner" aria-hidden="true" />
            <p className="account-loading-state__eyebrow">Workspace personale</p>
            <h1>Stiamo preparando il tuo spazio.</h1>
            <p className="v-auth-loading-text">
              Sincronizziamo preferenze, tool salvati e decisioni recenti.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (account.status === "authenticated") {
    return <AccountPanel />;
  }

  return <AuthPage />;
}
