"use client";

import { Settings } from "lucide-react";

import type { AccountPanelStatus } from "./account-panel-model";

/* ═══════════════════════════════════════════════════════════════
   AccountPreferencesSection (B27) — pannello "Preferenze".
   Righe riepilogo interessi/notifiche/shop; valori derivati da
   stato auth e conteggio salvati, invariati dal monolite.
   ═══════════════════════════════════════════════════════════════ */

export function AccountPreferencesSection({
  status,
  savedCount,
}: {
  status: AccountPanelStatus;
  savedCount: number;
}) {
  return (
    <div className="account-section-panel p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Settings size={16} className="text-[var(--accent-purple)]" />
        <p className="account-label">Preferenze</p>
      </div>
      <h2 className="account-title mt-3 text-[1.3rem] sm:text-[1.5rem]">
        Il prossimo passo e&apos; personalizzare il ritorno.
      </h2>
      <div className="mt-5 grid gap-3">
        {[
          ["Interessi", savedCount > 0 ? `${savedCount} segnali dai tool salvati` : "Da costruire"],
          ["Notifiche", status === "authenticated" ? "Email collegata" : "Richiede login"],
          ["Shop", "Acquisti digitali in roadmap"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 rounded-[18px] border px-4 py-3"
            style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.66)" }}
          >
            <span className="text-sm font-semibold text-[var(--account-ink)]">{label}</span>
            <span className="text-right text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
