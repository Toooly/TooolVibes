"use client";

import { useEffect, useState } from "react";

import { useAccount } from "@/components/account/account-provider";
import { AccountWorkspaceFrame } from "@/components/account/workspace/account-workspace-frame";
import { AccountRecoverySection } from "./panel/account-recovery-section";
import { AccountSubmissionsSection } from "./panel/account-submissions-section";
import { useAccountSubmissions } from "./panel/use-account-submissions";
import { AuthPage } from "./auth-page";
import {
  buildWorkspaceExportPayload,
  downloadWorkspaceExportJson,
  isWorkspaceResetConfirmed,
  workspaceExportFilename,
} from "@/lib/account/workspace-export";
import {
  DEFAULT_REWARD_PREFERENCES,
  readRewardPreferences,
  writeRewardPreferences,
  type RewardPreferences,
} from "@/lib/rewards/preferences";
import {
  fetchSignalHub,
  saveSignalPreferences,
  saveSignalProfileContext,
} from "@/lib/signal-progression/client";
import {
  FOCUS_AREA_LABELS,
  PRIMARY_GOAL_LABELS,
  SIGNAL_FOCUS_AREAS,
  SIGNAL_PRIMARY_GOALS,
  type SignalFocusArea,
  type SignalPrimaryGoal,
} from "@/lib/signal-progression/profile-context";
import {
  getCanonicalToolWorkspaceState,
  useToolWorkspaceStore,
} from "@/lib/stores/tool-workspace-store";
import {
  emailLocalPart,
  initialsFromEmail,
} from "@/components/account/workspace/workspace-model";

export function AccountSettingsPage() {
  const account = useAccount();
  const submissions = useAccountSubmissions({
    status: account.status,
    accessToken: account.session?.access_token,
  });

  if (account.status === "loading") {
    return <p className="px-4 py-8">Apertura impostazioni…</p>;
  }
  if (account.status !== "authenticated") {
    return <AuthPage />;
  }

  const email = account.user?.email ?? null;
  const showRecovery =
    account.hasQuarantinedWorkspace || Boolean(account.authMessage);

  return (
    <AccountWorkspaceFrame surface="settings">
      <div className="tv-settings">
        <header className="tv-id">
          <span className="tv-app__initials" aria-hidden="true">
            {initialsFromEmail(email)}
          </span>
          <div className="tv-id__copy">
            <p className="tv-id__name">{emailLocalPart(email)}</p>
            {email ? <p className="tv-id__meta">{email}</p> : null}
            <h1 className="sr-only">Impostazioni</h1>
          </div>
        </header>

        <section className="tv-settings-section" aria-labelledby="settings-profile">
          <h2 id="settings-profile" className="tv-settings-heading">
            Profilo
          </h2>
          <p className="tv-settings-lead">Chi sei in questo workspace, e su cosa stai lavorando.</p>
          <PersonalizationSettings />
        </section>

        <section className="tv-settings-section" aria-labelledby="settings-signal">
          <h2 id="settings-signal" className="tv-settings-heading">
            Segnale
          </h2>
          <p className="tv-settings-lead">Volume, animazioni e celebrazioni. Lo spazio resta utile anche in silenzio.</p>
          <SignalSettings />
        </section>

        {showRecovery ? (
          <section className="tv-settings-section" aria-labelledby="settings-recovery">
            <h2 id="settings-recovery" className="tv-settings-heading">
              Recovery
            </h2>
            <AccountRecoverySection account={account} />
          </section>
        ) : (
          <AccountRecoverySection account={account} />
        )}

        <section className="tv-settings-section" aria-labelledby="settings-workspace">
          <h2 id="settings-workspace" className="tv-settings-heading">
            Workspace
          </h2>
          <p className="tv-settings-lead">Esporta o svuota salvati, stack e decisioni di questo spazio.</p>
          <WorkspaceSettings />
        </section>

        <section className="tv-settings-section" aria-labelledby="settings-privacy">
          <h2 id="settings-privacy" className="tv-settings-heading">
            Privacy e dati
          </h2>
          <p className="tv-settings-copy">
            I dati del toolbox restano nel workspace personale. Puoi esportarli dalla sezione Workspace.
          </p>
          <p className="tv-settings-copy">
            Eliminazione account: non disponibile in questo ciclo.
          </p>
        </section>

        <section className="tv-settings-section" aria-labelledby="settings-contrib">
          <h2 id="settings-contrib" className="tv-settings-heading">
            Contributi
          </h2>
          <p className="tv-settings-lead">Tool e segnalazioni che hai inviato.</p>
          <AccountSubmissionsSection
            status={account.status}
            submissions={submissions.submissions}
            isLoading={submissions.isLoading}
            totalSubmissions={submissions.totalSubmissions}
            error={submissions.error}
            onRetry={submissions.reload}
          />
        </section>

        <section className="tv-settings-section" aria-labelledby="settings-account">
          <h2 id="settings-account" className="tv-settings-heading">
            Account
          </h2>
          <p className="tv-settings-lead">Sessione e uscita. Nessun profilo sociale.</p>
          <button
            type="button"
            className="account-btn-secondary"
            onClick={() => void account.signOut()}
            aria-label="Esci dall'account"
          >
            Esci dall&apos;account
          </button>
        </section>
      </div>
    </AccountWorkspaceFrame>
  );
}

function PersonalizationSettings() {
  const [focusArea, setFocusArea] = useState<SignalFocusArea>("product");
  const [primaryGoal, setPrimaryGoal] = useState<SignalPrimaryGoal>("discover");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    void fetchSignalHub().then((hub) => {
      if (hub?.profileContext?.focusArea) {
        setFocusArea(hub.profileContext.focusArea);
      }
      if (hub?.profileContext?.primaryGoal) {
        setPrimaryGoal(hub.profileContext.primaryGoal);
      }
    });
  }, []);

  return (
    <form
      className="tv-settings-form"
      onSubmit={(event) => {
        event.preventDefault();
        setStatus("Salvataggio…");
        void saveSignalProfileContext({ focusArea, primaryGoal }).then((result) => {
          setStatus(result.ok ? "Contesto aggiornato." : "Non salvato. Riprova più tardi.");
        });
      }}
    >
      <p className="tv-settings-copy">
        Si può cambiare quando cambia il lavoro. Non è un onboarding da chiudere.
      </p>
      <fieldset className="tv-choice">
        <legend>Focus</legend>
        {SIGNAL_FOCUS_AREAS.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={focusArea === item}
            onClick={() => setFocusArea(item)}
          >
            {FOCUS_AREA_LABELS[item]}
          </button>
        ))}
      </fieldset>
      <fieldset className="tv-choice">
        <legend>Obiettivo</legend>
        {SIGNAL_PRIMARY_GOALS.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={primaryGoal === item}
            onClick={() => setPrimaryGoal(item)}
          >
            {PRIMARY_GOAL_LABELS[item]}
          </button>
        ))}
      </fieldset>
      <button type="submit" className="account-btn-primary">
        Aggiorna contesto
      </button>
      {status ? <p role="status">{status}</p> : null}
    </form>
  );
}

function SignalSettings() {
  const [prefs, setPrefs] = useState<RewardPreferences>(DEFAULT_REWARD_PREFERENCES);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setPrefs(readRewardPreferences());
  }, []);

  const toggle = (key: keyof RewardPreferences) => {
    if (key === "version") return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    writeRewardPreferences(next);
    if (key === "reduceRewardAnimations") {
      if (next.reduceRewardAnimations) {
        document.documentElement.dataset.tvReduceMotion = "true";
      } else {
        delete document.documentElement.dataset.tvReduceMotion;
      }
    }
    setStatus("Preferenze locali aggiornate.");
    void saveSignalPreferences(next);
  };

  return (
    <div className="tv-settings-form">
      <p className="tv-settings-copy">
        Lo spazio resta utile anche a volume zero. Nessuna penalità per le pause.
      </p>
      <label className="tv-switch">
        <input
          type="checkbox"
          checked={prefs.quietMode}
          onChange={() => toggle("quietMode")}
        />
        Modalità silenziosa
      </label>
      <label className="tv-switch">
        <input
          type="checkbox"
          checked={prefs.reduceRewardAnimations}
          onChange={() => toggle("reduceRewardAnimations")}
        />
        Riduci animazioni
      </label>
      <label className="tv-switch">
        <input
          type="checkbox"
          checked={prefs.suppressMajorCelebrations}
          onChange={() => toggle("suppressMajorCelebrations")}
        />
        Niente celebrazioni
      </label>
      {status ? <p role="status">{status}</p> : null}
    </div>
  );
}

function WorkspaceSettings() {
  const clearWorkspace = useToolWorkspaceStore((state) => state.clearWorkspace);
  const [resetConfirm, setResetConfirm] = useState("");
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [resetStatus, setResetStatus] = useState<string | null>(null);
  const canReset = isWorkspaceResetConfirmed(resetConfirm);

  return (
    <div className="tv-settings-form">
      <p className="tv-settings-copy">
        Esporta o svuota salvati, stack e decisioni di questo workspace. Il catalogo e il ledger del segnale restano intatti.
      </p>
      <button
        type="button"
        className="account-btn-secondary"
        onClick={() => {
          const now = new Date();
          downloadWorkspaceExportJson(
            buildWorkspaceExportPayload(getCanonicalToolWorkspaceState(), now),
            workspaceExportFilename(now),
          );
          setExportStatus("Esportazione avviata.");
        }}
      >
        Esporta i tuoi dati
      </button>
      {exportStatus ? <p role="status">{exportStatus}</p> : null}

      <div className="tv-danger">
      <label className="tv-space-search">
        <span>Scrivi RESET per confermare</span>
        <input
          value={resetConfirm}
          onChange={(event) => setResetConfirm(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          aria-describedby="settings-reset-help"
        />
      </label>
      <p id="settings-reset-help" className="tv-settings-copy">
        Svuota salvati, stack e decisioni su questo workspace. Non tocca il catalogo né il ledger del segnale.
      </p>
      <button
        type="button"
        className="account-btn-secondary"
        disabled={!canReset}
        onClick={() => {
          if (!isWorkspaceResetConfirmed(resetConfirm)) return;
          clearWorkspace();
          setResetConfirm("");
          setResetStatus("Spazio svuotato.");
        }}
      >
        Svuota lo spazio
      </button>
      {resetStatus ? <p role="status">{resetStatus}</p> : null}
      </div>
    </div>
  );
}
