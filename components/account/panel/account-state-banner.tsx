"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CloudOff,
  Info,
  Mail,
  RotateCcw,
} from "lucide-react";

import type { AccountStateCell } from "./account-state-matrix";

/* ═══════════════════════════════════════════════════════════════
   AccountStateBanner (B59) — cella visibile della state matrix.
   Presentazionale: riusa le classi messaggio esistenti
   (account-message / v-auth-message) senza nuovo CSS. Espone
   data-account-state e data-sync-claim per contract test: il
   claim "synced" è possibile solo sull'esito attach riuscito.
   ═══════════════════════════════════════════════════════════════ */

function iconFor(cell: AccountStateCell) {
  switch (cell.kind) {
    case "offline":
      return CloudOff;
    case "link-pending":
      return Mail;
    case "attach-success":
      return CheckCircle2;
    case "unavailable":
    case "attach-local-pending":
    case "attach-retry":
      return AlertTriangle;
    default:
      return Info;
  }
}

export function AccountStateBanner({
  cell,
  variant = "panel",
  onAction,
}: {
  cell: AccountStateCell;
  variant?: "panel" | "auth";
  onAction?: (actionId: string) => void;
}) {
  const Icon = iconFor(cell);
  const className =
    variant === "auth"
      ? `v-auth-message ${
          cell.tone === "warning" ? "v-auth-message--error" : "v-auth-message--success"
        }`
      : `account-message ${
          cell.tone === "warning" ? "account-message--warning" : "account-message--success"
        }`;

  return (
    <div
      className={className}
      role="status"
      data-account-state={cell.kind}
      data-sync-claim={cell.syncClaim}
    >
      <div className="flex items-start gap-2.5 text-left">
        <Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-semibold">{cell.title}</p>
          <p className="mt-1 text-sm leading-6">{cell.body}</p>
          {cell.action && onAction ? (
            <button
              type="button"
              className={
                variant === "auth"
                  ? "v-auth-btn-primary mt-3"
                  : "account-btn-secondary mt-3"
              }
              onClick={() => onAction(cell.action?.id ?? "")}
            >
              <RotateCcw size={14} aria-hidden="true" />
              {cell.action.label}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
