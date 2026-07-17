"use client";

import { Shield, User, Zap } from "lucide-react";

import {
  getAccountStateLabel,
  getContinuityStatusLabel,
  type AccountPanelAccountSlice,
} from "./account-panel-model";

/* ═══════════════════════════════════════════════════════════════
   AccountStatusSection (B27) — pannello "Stato attuale".
   Modalità sessione e stato di continuità della selezione.
   ═══════════════════════════════════════════════════════════════ */

export function AccountStatusSection({
  account,
}: {
  account: AccountPanelAccountSlice;
}) {
  return (
    <div className="account-section-panel p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Zap size={16} className="text-[var(--accent-purple)]" />
        <p className="account-label">Stato attuale</p>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="account-stat-card p-5">
          <div className="flex items-center gap-2">
            <User size={16} className="text-[var(--accent-purple)]" />
            <p className="account-label">Modalità</p>
          </div>
          <p className="account-stat-value mt-3">{getAccountStateLabel(account)}</p>
        </div>
        <div className="account-stat-card p-5">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[var(--accent-purple)]" />
            <p className="account-label">Continuità</p>
          </div>
          <p className="account-stat-value mt-3">{getContinuityStatusLabel(account)}</p>
        </div>
      </div>
    </div>
  );
}
