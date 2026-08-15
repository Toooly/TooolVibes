"use client";

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
      <div
        id="member-access"
        className="tone-account relative z-10 space-y-5 scroll-mt-24 px-4 py-6 sm:px-6 sm:py-8"
      >
        {/* Hero */}
        <AccountHero account={account} workspace={workspace} />
        <section className="account-continue" aria-label="Continua la tua decisione">
          <p className="account-label">Continua la tua decisione</p>
          <p className="account-title mt-2">
            {workspace.saved > 0 || workspace.compare > 0
              ? `${workspace.saved} salvati · ${workspace.compare} in confronto`
              : "Nessuna selezione ancora. Parti dal catalogo."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a className="account-link" href={workspace.saved > 0 ? "/shortlist" : "/archivio"}>
              {workspace.saved > 0 ? "Apri la shortlist" : "Esplora il catalogo"}
            </a>
            <a className="account-link" href={workspace.compare > 0 ? "/compare" : "/archivio"}>
              {workspace.compare > 1 ? "Continua il confronto" : workspace.compare > 0 ? "Apri il confronto" : "Aggiungi candidati"}
            </a>
          </div>
        </section>

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
        <div className="editorial-grid gap-y-5 account-workspace">
          <section className="col-span-12 space-y-5 lg:col-span-7 lg:order-2">
            <div className="account-cluster account-cluster--solid">
              <div className="account-cluster__summary account-cluster__summary--static">
                <span>Le tue decisioni</span>
                <em>Note e shortlist nello stesso posto</em>
              </div>
              <div className="account-cluster__body space-y-5">
                <DecisionMemorySection />
                <AccountSelectionSection
                  workspace={workspace}
                  savedToolCards={savedToolCards}
                  recommendedTools={recommendedTools}
                />
                <AccountJourneyPanel />
              </div>
            </div>

            <details className="account-cluster">
              <summary className="account-cluster__summary">
                <span>Contributi e preferenze</span>
                <em>Suggerimenti e impostazioni</em>
              </summary>
              <div className="account-cluster__body space-y-5">
                <AccountSubmissionsSection
                  status={account.status}
                  submissions={submissions.submissions}
                  isLoading={submissions.isLoading}
                  totalSubmissions={submissions.totalSubmissions}
                  error={submissions.error}
                  onRetry={submissions.reload}
                />
                <AccountPreferencesSection status={account.status} savedCount={workspace.saved} />
              </div>
            </details>
          </section>

          <aside className="col-span-12 space-y-5 lg:col-span-5 lg:order-1">
            <details className="account-cluster">
              <summary className="account-cluster__summary">
                <span>Progresso e stato</span>
                <em>Segnale e account</em>
              </summary>
              <div className="account-cluster__body space-y-5">
                <AccountSignalProgressSection />
                <AccountGamificationSection
                  vibeRushBest={vibeRushBest}
                  submissionsLoading={submissions.isLoading}
                  totalSubmissions={submissions.totalSubmissions}
                />
                <AccountStatusSection account={account} />
                <AccountPremiumSection status={account.status} savedCount={workspace.saved} />
              </div>
            </details>

            <p>
              <a className="account-link" href="/account/settings">Impostazioni account</a>
            </p>
            <details className="account-cluster">
              <summary className="account-cluster__summary">
                <span>Accesso e sicurezza</span>
                <em>Credenziali e recupero</em>
              </summary>
              <div className="account-cluster__body space-y-5">
                <AccountAccessSection account={account} form={signupForm} />
                <AccountRecoverySection
                  account={account}
                  suppressAuthMessage={suppressAuthMessage}
                />
              </div>
            </details>
          </aside>
        </div>
      </div>
    </>
  );
}
