"use client";

import Link from "next/link";
import { ArrowRight, Clock, GitCompare, Mail, Save } from "lucide-react";

import { useDiscoveryPersistence } from "@/components/discovery/canonical-discovery-persistence-provider";

import {
  getHeroBadgeLabel,
  getPersistenceLabel,
  type AccountPanelAccountSlice,
  type WorkspaceSnapshot,
} from "./account-panel-model";

/* ═══════════════════════════════════════════════════════════════
   AccountHero (B27) — hero del pannello account.
   Badge di stato, CTA guest/auth e riga persistenza/conteggi.
   Markup e classi invariati rispetto al monolite.
   ═══════════════════════════════════════════════════════════════ */

export function AccountHero({
  account,
  workspace,
}: {
  account: AccountPanelAccountSlice;
  workspace: WorkspaceSnapshot;
}) {
  const persistence = useDiscoveryPersistence();
  const persistenceLabel = getPersistenceLabel(persistence);

  return (
    <div className="account-hero p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="account-status-badge">Account</span>
        <span className="account-status-badge">{getHeroBadgeLabel(account)}</span>
      </div>
      <h1 className="account-title mt-5 max-w-[22ch]">
        Il tuo spazio personale TooolVibes
      </h1>
      <p className="account-subtitle mt-4 max-w-[44rem]">
        Qui capisci se la selezione resta solo in questo browser o segue il tuo account e da dove conviene ripartire.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {account.status === "authenticated" ? (
          <>
            <Link
              href={workspace.compare > 1 ? "/compare" : "/shortlist"}
              className="account-btn-primary"
            >
              <ArrowRight size={16} />
              {workspace.compare > 1 ? "Continua il confronto" : "Apri i salvati"}
            </Link>
            <Link href="/collections" className="account-link">
              Apri le raccolte
              <ArrowRight size={14} />
            </Link>
          </>
        ) : (
          <>
            <Link href="#account-upgrade" className="account-btn-primary">
              <Mail size={16} />
              Continua con email
            </Link>
            <Link href="/collections" className="account-link">
              Vedi le Raccolte
              <ArrowRight size={14} />
            </Link>
          </>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
        <span className="inline-flex items-center gap-1.5">
          <Clock size={14} />
          {persistenceLabel}
        </span>
        <span style={{ color: "var(--line-strong)" }}>·</span>
        <span className="inline-flex items-center gap-1.5">
          <Save size={14} />
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
