"use client";

import { useAccount } from "./account-provider";
import { AuthPage } from "./auth-page";
import { AccountPanel } from "./account-panel";

export function AccountGate() {
  const account = useAccount();

  if (account.status === "loading") {
    return (
      <div className="v-auth-page">
        <div className="v-auth-page-bg" aria-hidden="true" />
        <div className="v-auth-container">
          <div className="v-auth-card v-auth-loading">
            <div className="v-auth-loading-spinner" />
            <p className="v-auth-loading-text">Caricamento...</p>
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
