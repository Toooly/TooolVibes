"use client";

import Link from "next/link";
import { ArrowRight, Clock, GitCompare, LogOut, Mail, Save } from "lucide-react";

import { useDiscoveryPersistence } from "@/components/discovery/canonical-discovery-persistence-provider";

import {
  getHeroBadgeLabel,
  getPersistenceLabel,
  type AccountPanelAccountSlice,
  type WorkspaceSnapshot,
} from "./account-panel-model";

export function AccountHero({
  account,
  workspace,
}: {
  account: AccountPanelAccountSlice;
  workspace: WorkspaceSnapshot;
}) {
  const persistence = useDiscoveryPersistence();
  const persistenceLabel = getPersistenceLabel(persistence);

  if (account.status === "authenticated") {
    const badge =
      account.isAttaching || account.workspaceAttachPending
        ? getHeroBadgeLabel(account)
        : "Account connesso";

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
        <h1 className="account-title mt-4">Il tuo TooolVibes</h1>
        <p className="account-subtitle mt-2">{account.user?.email ?? "Account attivo"}</p>
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

  return (
    <div className="account-hero p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="account-status-badge">Account</span>
        <span className="account-status-badge">{getHeroBadgeLabel(account)}</span>
      </div>
      <h1 className="account-title mt-5 max-w-[22ch]">Il tuo spazio decisionale</h1>
      <p className="account-subtitle mt-3">Salva, confronta, decidi.</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link href="#account-upgrade" className="account-btn-primary">
          <Mail size={16} />
          Continua con email
        </Link>
        <Link href="/collections" className="account-link">
          Vedi le Raccolte
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
        <span className="inline-flex items-center gap-1.5">
          <Clock size={14} />
          {persistenceLabel}
        </span>
        <span style={{ color: "var(--line-strong)" }}>·</span>
        <span className="inline-flex items-center gap-1.5">
          <Save size={16} />
          {workspace.saved} tool salvati
        </span>
        <span style={{ color: "var(--line-strong)" }}>·</span>
        <span className="inline-flex items-center gap-1.5">
          <GitCompare size={14} />
          {workspace.compare} nel confronto
        </span>
      </div>
    </div>
  );
}
