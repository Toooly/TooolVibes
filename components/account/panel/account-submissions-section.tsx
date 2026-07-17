"use client";

import { ExternalLink, Send } from "lucide-react";

import type {
  AccountPanelStatus,
  AccountSubmissionsPayload,
} from "./account-panel-model";

/* ═══════════════════════════════════════════════════════════════
   AccountSubmissionsSection (B27) — pannello "Submission inviate".
   Stati guest / loading / lista / vuoto invariati; i dati arrivano
   da useAccountSubmissions (fetch con bearer token nel hook).
   ═══════════════════════════════════════════════════════════════ */

export function AccountSubmissionsSection({
  status,
  submissions,
  isLoading,
  totalSubmissions,
}: {
  status: AccountPanelStatus;
  submissions: AccountSubmissionsPayload | null;
  isLoading: boolean;
  totalSubmissions: number;
}) {
  return (
    <div className="account-section-panel p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Send size={16} className="text-[var(--accent-purple)]" />
        <p className="account-label">Submission inviate</p>
      </div>
      <h2 className="account-title mt-3 text-[1.3rem] sm:text-[1.5rem]">
        Le richieste non spariscono dopo l&apos;invio.
      </h2>
      <p className="account-subtitle mt-3">
        Quando sei loggato, recuperiamo suggerimenti tool e candidature affiliate collegate alla tua email.
      </p>

      <div className="mt-5 grid gap-3">
        {status !== "authenticated" ? (
          <div className="account-selection-card p-4">
            <p className="text-sm leading-6" style={{ color: "var(--muted)" }}>
              Accedi per vedere lo stato delle submission associate alla tua email.
            </p>
          </div>
        ) : isLoading ? (
          <div className="account-selection-card p-4">
            <p className="text-sm leading-6" style={{ color: "var(--muted)" }}>
              Caricamento submission...
            </p>
          </div>
        ) : totalSubmissions > 0 ? (
          <>
            {submissions?.toolRequests.slice(0, 3).map((request) => (
              <div key={request.id} className="account-selection-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--account-ink)]">{request.tool_name}</p>
                    <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                      {request.submitter_type === "founder" ? "Proposta founder" : "Suggerimento tool"}
                    </p>
                  </div>
                  <span className="account-status-badge">{request.status}</span>
                </div>
              </div>
            ))}
            {submissions?.affiliateRequests.slice(0, 2).map((request) => (
              <div key={request.id} className="account-selection-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--account-ink)]">
                      {request.brand_name ?? "Richiesta affiliato"}
                    </p>
                    <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                      Programma affiliati
                    </p>
                  </div>
                  <span className="account-status-badge">{request.status}</span>
                </div>
                {request.referral_url ? (
                  <a
                    href={request.referral_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="account-link mt-3 text-sm"
                  >
                    Apri referral
                    <ExternalLink size={14} />
                  </a>
                ) : null}
              </div>
            ))}
          </>
        ) : (
          <div className="account-selection-card p-4">
            <p className="text-sm leading-6" style={{ color: "var(--muted)" }}>
              Nessuna submission collegata. Quando suggerisci un tool o invii una candidatura, la ritrovi qui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
