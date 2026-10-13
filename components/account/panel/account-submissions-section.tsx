"use client";

import { LocalizedText } from "@/components/i18n/localized-text";
import { ExternalLink, RotateCcw, Send } from "lucide-react";

import type {
  AccountPanelStatus,
  AccountSubmissionsPayload,
} from "./account-panel-model";
import { isAccountStateMatrixEnabled } from "./account-state-flags";
import {
  resolveSubmissionsErrorCell,
  type AccountSubmissionsErrorKind,
} from "./account-state-matrix";

/* ═══════════════════════════════════════════════════════════════
   AccountSubmissionsSection (B27) — pannello "Submission inviate".
   Stati guest / loading / lista / vuoto invariati; i dati arrivano
   da useAccountSubmissions (fetch con bearer token nel hook).
   B59 (additivo, flag accountStateMatrix): l'esito fallito della
   fetch (401/429/5xx/offline) ha una cella esplicita con retry,
   al posto dello stato vuoto che simulava "nessuna submission".
   ═══════════════════════════════════════════════════════════════ */

export function AccountSubmissionsSection({
  status,
  submissions,
  isLoading,
  totalSubmissions,
  error = null,
  onRetry,
}: {
  status: AccountPanelStatus;
  submissions: AccountSubmissionsPayload | null;
  isLoading: boolean;
  totalSubmissions: number;
  error?: AccountSubmissionsErrorKind | null;
  onRetry?: () => void;
}) {
  const errorCell =
    isAccountStateMatrixEnabled() && error
      ? resolveSubmissionsErrorCell(error)
      : null;

  return (
    <div className="account-section-panel p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Send size={16} className="text-[var(--accent-purple)]" />
        <p className="account-label"><LocalizedText>{"Submission inviate"}</LocalizedText></p>
      </div>
      <h2 className="account-title mt-3 text-[1.3rem] sm:text-[1.5rem]"><LocalizedText>{"Le richieste non spariscono dopo l'invio. "}</LocalizedText></h2>
      <p className="account-subtitle mt-3"><LocalizedText>{"Quando sei loggato, recuperiamo suggerimenti tool e candidature affiliate collegate alla tua email. "}</LocalizedText></p>

      <div className="mt-5 grid gap-3">
        {status !== "authenticated" ? (
          <div className="account-selection-card p-4">
            <p className="text-sm leading-6" style={{ color: "var(--muted)" }}><LocalizedText>{"Accedi per vedere lo stato delle submission associate alla tua email. "}</LocalizedText></p>
          </div>
        ) : isLoading ? (
          <div className="account-selection-card p-4">
            <p className="text-sm leading-6" style={{ color: "var(--muted)" }}><LocalizedText>{"Caricamento submission... "}</LocalizedText></p>
          </div>
        ) : errorCell ? (
          <div
            className="account-selection-card p-4"
            role="status"
            data-submissions-error={errorCell.kind}
          >
            <p className="font-semibold text-sm text-[var(--account-ink)]">
              <LocalizedText>{errorCell.title}</LocalizedText>
            </p>
            <p className="mt-1 text-sm leading-6" style={{ color: "var(--muted)" }}>
              <LocalizedText>{errorCell.body}</LocalizedText>
            </p>
            {onRetry ? (
              <button
                type="button"
                className="account-btn-secondary mt-3"
                onClick={onRetry}
              >
                <RotateCcw size={14} aria-hidden="true" />
                <LocalizedText>{errorCell.retryLabel}</LocalizedText>
              </button>
            ) : null}
          </div>
        ) : totalSubmissions > 0 ? (
          <>
            {submissions?.toolRequests.slice(0, 3).map((request) => (
              <div key={request.id} className="account-selection-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--account-ink)]"><LocalizedText>{request.tool_name}</LocalizedText></p>
                    <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                      <LocalizedText>{request.submitter_type === "founder" ? "Proposta founder" : "Suggerimento tool"}</LocalizedText>
                    </p>
                  </div>
                  <span className="account-status-badge"><LocalizedText>{request.status}</LocalizedText></span>
                </div>
              </div>
            ))}
            {submissions?.affiliateRequests.slice(0, 2).map((request) => (
              <div key={request.id} className="account-selection-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--account-ink)]">
                      <LocalizedText>{request.brand_name ?? "Richiesta affiliato"}</LocalizedText>
                    </p>
                    <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}><LocalizedText>{"Programma affiliati "}</LocalizedText></p>
                  </div>
                  <span className="account-status-badge"><LocalizedText>{request.status}</LocalizedText></span>
                </div>
                {request.referral_url ? (
                  <a
                    href={request.referral_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="account-link mt-3 text-sm"
                  ><LocalizedText>{"Apri referral "}</LocalizedText><ExternalLink size={14} />
                  </a>
                ) : null}
              </div>
            ))}
          </>
        ) : (
          <div className="account-selection-card p-4">
            <p className="text-sm leading-6" style={{ color: "var(--muted)" }}><LocalizedText>{"Nessuna submission collegata. Quando suggerisci un tool o invii una candidatura, la ritrovi qui. "}</LocalizedText></p>
          </div>
        )}
      </div>
    </div>
  );
}
