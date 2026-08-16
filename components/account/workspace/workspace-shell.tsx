"use client";

import Link from "next/link";
import { useState } from "react";

import { AccountRecoverySection } from "@/components/account/panel/account-recovery-section";
import { AccountStateBanner } from "@/components/account/panel/account-state-banner";
import { isAccountStateMatrixEnabled } from "@/components/account/panel/account-state-flags";
import {
  resolveAccountStateCell,
  shouldRenderAccountStateBanner,
} from "@/components/account/panel/account-state-matrix";
import { useAccountOnlineStatus } from "@/components/account/panel/use-account-online-status";
import { useAccount } from "@/components/account/account-provider";
import type { AccountPanelAccountSlice } from "@/components/account/panel/account-panel-model";

import { useCanonicalWorkspace } from "./use-canonical-workspace";
import { WorkspaceActivity } from "./workspace-activity";
import { WorkspaceBiblioteca } from "./workspace-biblioteca";
import { WorkspaceDecisions } from "./workspace-decisions";
import {
  WORKSPACE_VIEW_LABELS,
  WORKSPACE_VIEWS,
  type WorkspaceView,
} from "./workspace-model";
import { WorkspaceRiprendi } from "./workspace-riprendi";
import { WorkspaceSignal } from "./workspace-signal";
import { WorkspaceStacks } from "./workspace-stacks";
import { WorkspaceHero } from "./workspace-hero";

export function WorkspaceShell({
  initialView = "riprendi",
}: {
  initialView?: WorkspaceView;
} = {}) {
  const account = useAccount();
  const state = useCanonicalWorkspace();
  const [view, setView] = useState<WorkspaceView>(initialView);
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
    <div
      id="member-access"
      className="tone-account account-workspace-shell tv-space relative z-10 scroll-mt-24 px-4 py-6 sm:px-6 sm:py-8"
    >
      <WorkspaceHero account={account as AccountPanelAccountSlice} />
      {showStateBanner ? <AccountStateBanner cell={stateCell} /> : null}
      <AccountRecoverySection account={account} suppressAuthMessage={showStateBanner} />
      <nav className="tv-space-nav" aria-label="Spazio personale">
        <label className="tv-space-nav__mobile">
          <span className="sr-only">Sezione</span>
          <select
            value={view}
            onChange={(event) => setView(event.target.value as WorkspaceView)}
          >
            {WORKSPACE_VIEWS.map((item) => (
              <option key={item} value={item}>
                {WORKSPACE_VIEW_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        <div className="tv-space-nav__tabs" role="tablist">
          {WORKSPACE_VIEWS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={view === item}
              className={view === item ? "is-active" : undefined}
              onClick={() => setView(item)}
            >
              {WORKSPACE_VIEW_LABELS[item]}
            </button>
          ))}
        </div>
      </nav>
      <div className="tv-space-main">
        {view === "riprendi" ? <WorkspaceRiprendi state={state} onOpen={setView} /> : null}
        {view === "biblioteca" ? <WorkspaceBiblioteca state={state} /> : null}
        {view === "stack" ? <WorkspaceStacks state={state} /> : null}
        {view === "decisioni" ? <WorkspaceDecisions state={state} /> : null}
        {view === "segnale" ? <WorkspaceSignal /> : null}
        {view === "attivita" ? <WorkspaceActivity state={state} /> : null}
      </div>
      <p className="account-workspace-foot">
        <Link className="account-link" href="/account/settings">
          Impostazioni
        </Link>
      </p>
    </div>
  );
}
