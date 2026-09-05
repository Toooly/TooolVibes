"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { AccountRecoverySection } from "@/components/account/panel/account-recovery-section";
import { AccountStateBanner } from "@/components/account/panel/account-state-banner";
import { isAccountStateMatrixEnabled } from "@/components/account/panel/account-state-flags";
import {
  resolveAccountStateCell,
  shouldRenderAccountStateBanner,
} from "@/components/account/panel/account-state-matrix";
import { useAccountOnlineStatus } from "@/components/account/panel/use-account-online-status";
import { useAccount } from "@/components/account/account-provider";

import { AccountWorkspaceFrame } from "./account-workspace-frame";
import { useCanonicalWorkspace } from "./use-canonical-workspace";
import { WorkspaceBiblioteca } from "./workspace-biblioteca";
import { parseWorkspaceView, type WorkspaceView } from "./workspace-model";
import { WorkspaceRiprendi } from "./workspace-riprendi";
import { WorkspaceDecisioni } from "./workspace-decisioni";
import { WorkspaceStacks } from "./workspace-stacks";

function resolveViewFromSearch(
  searchParams: { get(name: string): string | null } | null,
  initialView?: WorkspaceView,
): WorkspaceView {
  const raw = searchParams?.get("view") ?? null;
  if (raw === null || raw === "") {
    return initialView ?? "riprendi";
  }
  return parseWorkspaceView(raw);
}

function WorkspaceShellView({
  initialView,
}: {
  initialView?: WorkspaceView;
}) {
  const account = useAccount();
  const state = useCanonicalWorkspace();
  const searchParams = useSearchParams();
  const requestedView = resolveViewFromSearch(searchParams, initialView);
  const view =
    requestedView === "recenti" || requestedView === "segnale"
      ? "riprendi"
      : requestedView;
  const focusSlug = searchParams?.get("focus") ?? null;
  const stackId = searchParams?.get("stack") ?? null;
  const isOnline = useAccountOnlineStatus();
  const stateCell = isAccountStateMatrixEnabled()
    ? resolveAccountStateCell({
        status: account.status,
        authEnabled: account.authEnabled,
        isOnline,
        isAttaching: account.isAttaching,
        workspaceAttachPending: account.workspaceAttachPending,
        pendingLinkEmail: null,
        authMessage: account.authMessage,
      })
    : null;
  const showStateBanner = stateCell !== null && shouldRenderAccountStateBanner(stateCell);

  return (
    <AccountWorkspaceFrame surface="workspace" view={view}>
      {showStateBanner ? (
        <div className="tv-workspace-sync">
          <AccountStateBanner cell={stateCell} />
        </div>
      ) : null}
      <AccountRecoverySection account={account} suppressAuthMessage={showStateBanner} />
      <div className="tv-space-main">
        {view === "riprendi" ? (
          <WorkspaceRiprendi
            state={state}
            focusSlug={focusSlug}
            autoOpenDecide={false}
          />
        ) : null}
        {view === "salvati" ? (
          <WorkspaceBiblioteca state={state} focusSlug={focusSlug} />
        ) : null}
        {view === "stack" ? <WorkspaceStacks state={state} stackId={stackId} /> : null}
        {view === "decisioni" ? <WorkspaceDecisioni state={state} focusSlug={focusSlug} /> : null}
      </div>
    </AccountWorkspaceFrame>
  );
}

export function WorkspaceShell({
  initialView,
}: {
  initialView?: WorkspaceView;
} = {}) {
  return (
    <Suspense
      fallback={
        <AccountWorkspaceFrame surface="workspace" view={initialView ?? "riprendi"}>
          <p>Apertura spazio…</p>
        </AccountWorkspaceFrame>
      }
    >
      <WorkspaceShellView initialView={initialView} />
    </Suspense>
  );
}
