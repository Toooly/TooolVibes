"use client";

import { RotateCcw, Shield } from "lucide-react";

import {
  getAuthMessageClassName,
  getAuthMessageTone,
  type AccountPanelAccountSlice,
} from "./account-panel-model";

/* ═══════════════════════════════════════════════════════════════
   AccountRecoverySection (B27) — stati di recovery e feedback.
   Backup locale in quarantena (ripristino esplicito) e messaggio
   auth con tono warning/success. Condizioni e copy invariati.
   ═══════════════════════════════════════════════════════════════ */

export function AccountRecoverySection({
  account,
}: {
  account: AccountPanelAccountSlice;
}) {
  return (
    <>
      {account.hasQuarantinedWorkspace ? (
        <div className="account-section-panel p-5 sm:p-6" role="status">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[var(--accent-purple)]" aria-hidden="true" />
            <p className="account-label">Backup locale isolato</p>
          </div>
          <p className="account-subtitle mt-3">
            Questa selezione è precedente al sistema di proprietà del browser.
            Non è stata assegnata automaticamente al tuo account. Ripristinala
            solo se riconosci questo dispositivo e il suo contenuto.
          </p>
          <button
            type="button"
            className="account-btn-secondary mt-4 disabled:cursor-default disabled:opacity-60"
            disabled={account.isRestoringQuarantinedWorkspace || account.isAttaching}
            onClick={() => void account.restoreQuarantinedWorkspace()}
          >
            <RotateCcw size={16} aria-hidden="true" />
            {account.isRestoringQuarantinedWorkspace
              ? "Ripristino in corso..."
              : "Ripristina nello spazio corrente"}
          </button>
        </div>
      ) : null}

      {account.authMessage ? (
        <div
          className={getAuthMessageClassName(account.authMessage)}
          style={getAuthMessageTone(account.authMessage)}
        >
          <p className="text-sm leading-6">{account.authMessage}</p>
        </div>
      ) : null}
    </>
  );
}
