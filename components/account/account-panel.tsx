"use client";

import { useAccount } from "@/components/account/account-provider";
import { WorkspaceShell } from "@/components/account/workspace/workspace-shell";

import { AccountAccessSection } from "./panel/account-access-section";
import { AccountHero } from "./panel/account-hero";
import { AccountJourneyPanel } from "./panel/account-journey-panel";
import { AccountPreferencesSection } from "./panel/account-preferences-section";
import { AccountPremiumSection } from "./panel/account-premium-section";
import { AccountRecoverySection } from "./panel/account-recovery-section";
import { AccountSelectionSection } from "./panel/account-selection-section";
import { AccountStateBanner } from "./panel/account-state-banner";
import { AccountStatusSection } from "./panel/account-status-section";
import { AccountSubmissionsSection } from "./panel/account-submissions-section";
import { AccountWorkspaceBoard } from "./panel/account-workspace-board";
import { DecisionMemorySection } from "./panel/decision-memory-section";
import { isAccountStateMatrixEnabled } from "./panel/account-state-flags";
import {
  resolveAccountStateCell,
  shouldRenderAccountStateBanner,
} from "./panel/account-state-matrix";
import { useAccountOnlineStatus } from "./panel/use-account-online-status";
import { useAccountSignupForm } from "./panel/use-account-signup-form";
import { useAccountSubmissions } from "./panel/use-account-submissions";
import { useAccountVibeContext } from "./panel/use-account-vibe-context";
import { useAccountWorkspaceSummary } from "./panel/use-account-workspace-summary";

export function AccountPanel() {
  const account = useAccount();

  if (account.status === "authenticated") {
    return <WorkspaceShell />;
  }

  return <GuestAccountPanel />;
}

function GuestAccountPanel() {
  const account = useAccount();
  const { vibeContext } = useAccountVibeContext();
  const signupForm = useAccountSignupForm({
    sendMagicLink: account.sendMagicLink,
    vibeContext,
  });
  const submissions = useAccountSubmissions({
    status: account.status,
    accessToken: account.session?.access_token,
  });
  const { workspace, savedToolCards, recommendedTools } = useAccountWorkspaceSummary();
  const isOnline = useAccountOnlineStatus();
  const stateCell = isAccountStateMatrixEnabled()
    ? resolveAccountStateCell({
        status: account.status,
        authEnabled: account.authEnabled,
        isOnline,
        isAttaching: account.isAttaching,
        workspaceAttachPending: account.workspaceAttachPending,
        pendingLinkEmail: signupForm.pendingLink?.email ?? null,
        authMessage: account.authMessage,
      })
    : null;
  const showStateBanner = stateCell !== null && shouldRenderAccountStateBanner(stateCell);
  const suppressAuthMessage =
    showStateBanner &&
    (stateCell.kind === "attach-retry" || stateCell.kind === "attach-success");

  return (
    <div
      id="member-access"
      className="tone-account relative z-10 space-y-5 scroll-mt-24 px-4 py-6 sm:px-6 sm:py-8"
    >
      <AccountHero account={account} workspace={workspace} />
      <AccountWorkspaceBoard
        workspace={workspace}
        decisionCount={workspace.notes}
      />
      {showStateBanner ? (
        <AccountStateBanner
          cell={stateCell}
          onAction={(actionId) => {
            if (actionId === "resend-link") {
              void signupForm.resendPendingLink();
            }
          }}
        />
      ) : null}
      <div className="account-workspace space-y-4">
        <DecisionMemorySection />
        <AccountSelectionSection
          workspace={workspace}
          savedToolCards={savedToolCards}
          recommendedTools={recommendedTools}
        />
        <AccountJourneyPanel />
        <AccountSubmissionsSection
          status={account.status}
          submissions={submissions.submissions}
          isLoading={submissions.isLoading}
          totalSubmissions={submissions.totalSubmissions}
          error={submissions.error}
          onRetry={submissions.reload}
        />
        <AccountStatusSection account={account} />
        <AccountPremiumSection status={account.status} savedCount={workspace.saved} />
        <AccountPreferencesSection status={account.status} savedCount={workspace.saved} />
        <AccountAccessSection account={account} form={signupForm} />
        <AccountRecoverySection
          account={account}
          suppressAuthMessage={suppressAuthMessage}
        />
        <p>
          <a className="account-link" href="/account/settings">Impostazioni</a>
        </p>
      </div>
    </div>
  );
}
