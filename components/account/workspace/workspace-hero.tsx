"use client";

import { Clock, LogOut } from "lucide-react";

import { useDiscoveryPersistence } from "@/components/discovery/canonical-discovery-persistence-provider";
import {
  getHeroBadgeLabel,
  getPersistenceLabel,
  type AccountPanelAccountSlice,
} from "@/components/account/panel/account-panel-model";

export function WorkspaceHero({
  account,
}: {
  account: AccountPanelAccountSlice;
}) {
  const persistence = useDiscoveryPersistence();
  const persistenceLabel = getPersistenceLabel(persistence);
  const badge =
    account.isAttaching || account.workspaceAttachPending
      ? getHeroBadgeLabel(account)
      : "Spazio connesso";

  return (
    <header className="account-hero account-hero--session p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="account-status-badge">{badge}</span>
        <button
          type="button"
          onClick={() => void account.signOut()}
          className="account-btn-secondary"
        >
          <LogOut size={16} />
          Esci dall&apos;account
        </button>
      </div>
      <h1 className="account-title mt-4">Il tuo spazio</h1>
      <p className="account-subtitle mt-2">
        Scopri, salva, confronta, decidi. Qui resta il filo.
      </p>
      <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
        <span className="inline-flex items-center gap-1.5">
          <Clock size={14} />
          {persistenceLabel}
        </span>
        {account.workspaceAttachPending ? (
          <>
            <span style={{ color: "var(--line-strong)" }}> · </span>
            <span>Su questo dispositivo</span>
          </>
        ) : null}
      </p>
    </header>
  );
}
