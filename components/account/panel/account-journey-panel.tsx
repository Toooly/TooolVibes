"use client";

import { Shield } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   AccountJourneyPanel (B27) — "Percorso di continuità" (dark).
   Contenuto statico: tre step sessione → mail → collegamento.
   ═══════════════════════════════════════════════════════════════ */

export function AccountJourneyPanel() {
  return (
    <div className="account-journey-panel p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Shield size={16} className="text-[var(--account-violet)]" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--account-muted)]">
          Percorso di continuità
        </p>
      </div>
      <div className="mt-5 grid gap-3">
        <div className="account-journey-step px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--account-muted)]">
            1. Sessione locale
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--account-ink)]">
            Continui a esplorare e salvare tool senza attrito iniziale.
          </p>
        </div>
        <div className="account-journey-step px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--account-muted)]">
            2. Mail di conferma
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--account-ink)]">
            Colleghi l&apos;email con un passaggio minimo, senza schermate pesanti.
          </p>
        </div>
        <div className="account-journey-step px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--account-muted)]">
            3. Collegamento sicuro
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--account-ink)]">
            Salvati, confronto, note e priorità vengono agganciati all&apos;account
            senza perdere il contesto costruito in questo browser.
          </p>
        </div>
      </div>
    </div>
  );
}
