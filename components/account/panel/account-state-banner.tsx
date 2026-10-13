"use client";

import { LocalizedText } from "@/components/i18n/localized-text";
import {
  AlertTriangle,
  CheckCircle2,
  CloudOff,
  Info,
  Mail,
  RotateCcw,
} from "lucide-react";

import type {
  AccountStateCell,
  AccountStateCellTone,
} from "./account-state-matrix";

/* ═══════════════════════════════════════════════════════════════
   AccountStateBanner (B59) — cella visibile della state matrix.
   Presentazionale: riusa le classi messaggio esistenti
   (account-message / v-auth-message), incluso --info per attach-retry. Espone
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
      return AlertTriangle;
    default:
      return Info;
  }
}

function bannerClassName(
  variant: "panel" | "auth",
  tone: AccountStateCellTone,
) {
  if (variant === "auth") {
    if (tone === "warning") return "v-auth-message v-auth-message--error";
    if (tone === "success") return "v-auth-message v-auth-message--success";
    return "v-auth-message v-auth-message--info";
  }
  if (tone === "warning") return "account-message account-message--warning";
  if (tone === "success") return "account-message account-message--success";
  return "account-message account-message--info";
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
  const className = bannerClassName(variant, cell.tone);

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
          <p className="text-sm font-semibold"><LocalizedText>{cell.title}</LocalizedText></p>
          <p className="mt-1 text-sm leading-6"><LocalizedText>{cell.body}</LocalizedText></p>
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
              <LocalizedText>{cell.action.label}</LocalizedText>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
