"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getPremiumEntitlementMeta } from "@/lib/premium/access";

import type { AccountPanelStatus } from "./account-panel-model";

/* ═══════════════════════════════════════════════════════════════
   AccountPremiumSection (B27) — blocco "Accesso riservato".
   Meta premium derivati dallo stato auth; CTA verso upgrade o
   anchor del form magic link. Copy e markup invariati.
   ═══════════════════════════════════════════════════════════════ */

export function AccountPremiumSection({
  status,
  savedCount,
}: {
  status: AccountPanelStatus;
  savedCount: number;
}) {
  const premiumStatus = status === "authenticated" ? "account" : "guest";
  const premiumMeta = getPremiumEntitlementMeta(premiumStatus);
  const premiumActionHref =
    status === "authenticated" ? premiumMeta.cta_href : "#account-upgrade";
  const premiumActionLabel =
    status === "authenticated" ? premiumMeta.cta_label : "Continua con email";

  return (
    <div className="account-meta-block p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="account-status-badge">Accesso riservato</span>
        <span className="account-status-badge">{premiumMeta.short_label}</span>
      </div>
      <p className="account-title mt-4 max-w-[20ch] text-[1.5rem] sm:text-[1.7rem]">
        {premiumMeta.label}
      </p>
      <p className="account-subtitle mt-3">
        {premiumMeta.description}
      </p>
      <p className="mt-3 text-[0.9rem] leading-7" style={{ color: "var(--muted)" }}>
        {savedCount > 0
          ? `Hai già ${savedCount} tool salvati: account e premium servono a dare continuità e accesso, non a rimettere in discussione la selezione.`
          : "Qui si chiarisce il rapporto tra accesso, anteprime e raccolte riservate senza aggiungere frizione inutile."}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link href={premiumActionHref} className="account-btn-secondary">
          {premiumActionLabel}
        </Link>
        <Link href="/collections" className="account-link">
          Vedi raccolte e anteprime
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
