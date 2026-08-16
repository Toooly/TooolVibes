"use client";

import Link from "next/link";

import { useAccount } from "@/components/account/account-provider";

import { AccountGamificationSection } from "./panel/account-gamification-section";
import { AccountSignalProgressSection } from "./panel/account-signal-progress-section";
import { AccountAccessSection } from "./panel/account-access-section";
import { AccountHero } from "./panel/account-hero";
import { AccountRecoverySection } from "./panel/account-recovery-section";
import { AccountJourneyPanel } from "./panel/account-journey-panel";
import { AccountPreferencesSection } from "./panel/account-preferences-section";
import { AccountPremiumSection } from "./panel/account-premium-section";
import { DecisionMemorySection } from "./panel/decision-memory-section";
import { AccountWorkspaceBoard } from "./panel/account-workspace-board";
import { AccountSavedRail } from "./panel/account-saved-rail";
import { AccountSelectionSection } from "./panel/account-selection-section";
import { AccountStateBanner } from "./panel/account-state-banner";
import { isAccountStateMatrixEnabled } from "./panel/account-state-flags";
import {
  resolveAccountStateCell,
  shouldRenderAccountStateBanner,
} from "./panel/account-state-matrix";
import { AccountStatusSection } from "./panel/account-status-section";
import { AccountSubmissionsSection } from "./panel/account-submissions-section";
import { useAccountOnlineStatus } from "./panel/use-account-online-status";
import { useAccountSignupForm } from "./panel/use-account-signup-form";
import { useAccountSubmissions } from "./panel/use-account-submissions";
import { useAccountVibeContext } from "./panel/use-account-vibe-context";
import { useAccountWorkspaceSummary } from "./panel/use-account-workspace-summary";

/* ═══════════════════════════════════════════════════════════════
   AccountPanel — facade compositivo (B27).
   Stato sessione invariato in account-provider (B18/B19); qui
   vivono solo wiring e layout: contesto Vibe Rush, form signup,
   submission e riepilogo workspace sono hook isolati sotto
   components/account/panel, ogni sezione ha contract proprio.
   La route continua a montare questo export: comportamento,
   markup, classi e copy invariati rispetto al monolite.
   B59: banner additivo della state matrix (STATE-1002) sotto
   l'hero — offline, auth non disponibile, link pending ed esiti
   attach con success/retry distinti. Kill switch env
   NEXT_PUBLIC_TOOOLVIBES_ACCOUNT_STATE_MATRIX=0.
   ═══════════════════════════════════════════════════════════════ */

export function AccountPanel() {
  const account = useAccount();
  const { vibeContext, vibeRushBest } = useAccountVibeContext();
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
  if (account.status === "authenticated") {
    return (
      <div
        id="member-access"
        className="tone-account relative z-10 space-y-4 scroll-mt-24 px-4 py-6 sm:px-6 sm:py-8"
      >
        <AccountHero account={account} workspace={workspace} />
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
        <AccountRecoverySection
          account={account}
          suppressAuthMessage={suppressAuthMessage}
        />
        <AccountWorkspaceBoard workspace={workspace} decisionCount={workspace.notes} />
        <DecisionMemorySection />
        <AccountSavedRail tools={savedToolCards} />
        <p className="account-workspace-foot">
          <Link className="account-link" href="/account/settings">Impostazioni</Link>
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        id="member-access"
        className="tone-account relative z-10 space-y-5 scroll-mt-24 px-4 py-6 sm:px-6 sm:py-8"
      >
        <AccountHero account={account} workspace={workspace} />
        <AccountWorkspaceBoard
          workspace={workspace}
          decisionCount={workspace.notes}
        />

        {/* State matrix (B59): offline / unavailable / link pending / attach */}
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

        {/* My TooolVibes — decisions first, bureaucracy later */}
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
          <AccountGamificationSection
            vibeRushBest={vibeRushBest}
            submissionsLoading={submissions.isLoading}
            totalSubmissions={submissions.totalSubmissions}
          />
          <AccountSignalProgressSection />
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
    </>
  );
}
