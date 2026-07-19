"use client";

import { useAccount } from "@/components/account/account-provider";
import { AccountVibesBackground } from "@/components/account/account-vibes-background";

import { AccountAccessSection } from "./panel/account-access-section";
import { AccountGamificationSection } from "./panel/account-gamification-section";
import { AccountHero } from "./panel/account-hero";
import { AccountJourneyPanel } from "./panel/account-journey-panel";
import { AccountPreferencesSection } from "./panel/account-preferences-section";
import { AccountPremiumSection } from "./panel/account-premium-section";
import { AccountRecoverySection } from "./panel/account-recovery-section";
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

  return (
    <>
      <AccountVibesBackground />
      <div className="tone-account relative z-10 space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        {/* Hero */}
        <AccountHero account={account} workspace={workspace} />

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

        {/* Editorial grid */}
        <div className="editorial-grid gap-y-5">
          {/* Left column */}
          <section className="col-span-12 space-y-5 lg:col-span-7">
            <AccountGamificationSection
              vibeRushBest={vibeRushBest}
              submissionsLoading={submissions.isLoading}
              totalSubmissions={submissions.totalSubmissions}
            />
            <AccountStatusSection account={account} />
            <AccountPremiumSection status={account.status} savedCount={workspace.saved} />
            <AccountAccessSection account={account} form={signupForm} />
            <AccountRecoverySection
              account={account}
              suppressAuthMessage={suppressAuthMessage}
            />
          </section>

          {/* Right column */}
          <aside className="col-span-12 space-y-5 lg:col-span-5">
            <AccountSelectionSection
              workspace={workspace}
              savedToolCards={savedToolCards}
              recommendedTools={recommendedTools}
            />
            <AccountSubmissionsSection
              status={account.status}
              submissions={submissions.submissions}
              isLoading={submissions.isLoading}
              totalSubmissions={submissions.totalSubmissions}
              error={submissions.error}
              onRetry={submissions.reload}
            />
            <AccountPreferencesSection status={account.status} savedCount={workspace.saved} />
            <AccountJourneyPanel />
          </aside>
        </div>
      </div>
    </>
  );
}
