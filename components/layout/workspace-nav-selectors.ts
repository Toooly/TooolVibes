"use client";

import { useMemo } from "react";

import { useAccount } from "@/components/account/account-provider";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import { headerChromeRelease } from "./header-chrome-release";

/**
 * BATCH 30 — Selector canonici account/workspace per il chrome di navigazione
 * (IA-502 "Header account-aware").
 *
 * Header v2 e bottom nav non leggono più lo stato sessione o i conteggi con
 * adapter locali: derivano tutto da qui, così copy e counts guest/auth sono
 * identici su ogni route (lo stato account vive in AccountProvider B18/B19 e
 * i conteggi nello store workspace canonico, aggiornato anche cross-tab dal
 * persistence provider via DISCOVERY_SYNC_EVENT).
 *
 * Reversibilità (pattern B04/B29): con la flag
 * `TOOOLVIBES_HEADER_ACCOUNT_AWARE_ENABLED=0` il selector restituisce il
 * modello legacy pre-B30 (CTA statica "Accedi / Registrati", badge compare
 * senza badge salvati). Le variabili env non pubbliche non sono inline nel
 * bundle client: la hatch opera lato server/build e nei test, come per le
 * flag di navigazione B29.
 */

export type HeaderAccountStatus =
  | "loading"
  | "guest"
  | "authenticated"
  | "unavailable";

export type HeaderAccountCtaState =
  | "legacy"
  | "loading"
  | "guest"
  | "syncing"
  | "authenticated"
  | "unavailable";

export type HeaderAccountCtaModel = Readonly<{
  /** Stato account risolto, esposto come data-account-state per i test. */
  state: HeaderAccountCtaState;
  /** false quando l'accesso non è disponibile: niente copy promozionale falso. */
  visible: boolean;
  href: string;
  label: string;
  /** true durante loading/sync: la CTA resta unica ma segnala lavoro in corso. */
  ariaBusy: boolean;
}>;

/** Adapter legacy pre-B30: CTA statica, sempre visibile, copy invariato. */
const LEGACY_ACCOUNT_CTA: HeaderAccountCtaModel = Object.freeze({
  state: "legacy",
  visible: true,
  href: "/account#account-upgrade",
  label: "Accedi",
  ariaBusy: false,
});

export function isHeaderAccountAwareEnabled(): boolean {
  return headerChromeRelease.headerAccountAware;
}

/**
 * Risolve l'unica CTA account del chrome. Invarianti IA-502:
 * - una sola azione account per surface (questa);
 * - lo stato loading NON mostra copy guest (niente lampeggio "Accedi");
 * - con accesso non disponibile la CTA sparisce invece di promettere un
 *   flusso che non può partire.
 */
export function resolveHeaderAccountCta(
  input: Readonly<{
    authEnabled: boolean;
    status: HeaderAccountStatus;
    /** attach/sync workspace in corso (isAttaching || workspaceAttachPending). */
    syncInProgress: boolean;
  }>,
  options: Readonly<{ accountAware?: boolean }> = {},
): HeaderAccountCtaModel {
  if (options.accountAware === false) {
    return LEGACY_ACCOUNT_CTA;
  }

  if (!input.authEnabled || input.status === "unavailable") {
    return Object.freeze({
      state: "unavailable",
      visible: false,
      href: "/account",
      label: "",
      ariaBusy: false,
    });
  }

  if (input.status === "loading") {
    return Object.freeze({
      state: "loading",
      visible: true,
      href: "/account",
      label: "Account",
      ariaBusy: true,
    });
  }

  if (input.status === "guest") {
    return Object.freeze({
      state: "guest",
      visible: true,
      href: "/account#account-upgrade",
      label: "Accedi",
      ariaBusy: false,
    });
  }

  return Object.freeze({
    state: input.syncInProgress ? "syncing" : "authenticated",
    visible: true,
    href: "/account",
    label: "Il tuo spazio",
    ariaBusy: input.syncInProgress,
  });
}

/** CTA account canonica per header v2 (desktop e menu mobile). */
export function useHeaderAccountCta(): HeaderAccountCtaModel {
  const { authEnabled, status, isAttaching, workspaceAttachPending } =
    useAccount();
  const accountAware = isHeaderAccountAwareEnabled();

  return useMemo(
    () =>
      resolveHeaderAccountCta(
        {
          authEnabled,
          status,
          syncInProgress: isAttaching || workspaceAttachPending,
        },
        { accountAware },
      ),
    [accountAware, authEnabled, isAttaching, status, workspaceAttachPending],
  );
}

export type WorkspaceNavCounts = Readonly<{
  saved: number;
  compare: number;
}>;

/**
 * Conteggi workspace per la bottom nav. Selector primitivi sullo store
 * canonico (nessun oggetto nuovo per snapshot): saved = shortlist, compare =
 * confronto. Identici su ogni route e aggiornati cross-tab perché lo store è
 * l'unica sorgente.
 */
export function useWorkspaceNavCounts(): WorkspaceNavCounts {
  const saved = useToolWorkspaceStore((state) => state.savedSlugs.length);
  const compare = useToolWorkspaceStore((state) => state.compareSlugs.length);
  return { saved, compare };
}
