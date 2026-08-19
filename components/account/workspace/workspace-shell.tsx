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
import { WorkspaceActivity } from "./workspace-activity";
import { WorkspaceBiblioteca } from "./workspace-biblioteca";
import { WorkspaceDecisions } from "./workspace-decisions";
import { parseWorkspaceView, type WorkspaceView } from "./workspace-model";
import { WorkspaceRiprendi } from "./workspace-riprendi";
import { WorkspaceSignal } from "./workspace-signal";
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
  const view = resolveViewFromSearch(searchParams, initialView);
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
      {showStateBanner ? <AccountStateBanner cell={stateCell} /> : null}
      <AccountRecoverySection account={account} suppressAuthMessage={showStateBanner} />
      <div className="tv-space-main">
        {view === "riprendi" ? <WorkspaceRiprendi state={state} /> : null}
        {view === "biblioteca" ? <WorkspaceBiblioteca state={state} /> : null}
        {view === "stack" ? <WorkspaceStacks state={state} /> : null}
        {view === "decisioni" ? <WorkspaceDecisions state={state} /> : null}
        {view === "segnale" ? <WorkspaceSignal /> : null}
        {view === "recenti" ? <WorkspaceActivity state={state} /> : null}
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
