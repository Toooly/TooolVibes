"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { useEffect, useState } from "react";

import { useAccount } from "@/components/account/account-provider";
import { AccountWorkspaceFrame } from "@/components/account/workspace/account-workspace-frame";
import { AccountIdentitiesSection } from "@/components/account/account-identities-section";
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
import { normalizeUserProfile } from "@/lib/auth/profile-normalization";

export function AccountSettingsPage() {
  const account = useAccount();
  const submissions = useAccountSubmissions({
    status: account.status,
    accessToken: account.session?.access_token,
  });

  if (account.status === "loading") {
    return <p className="px-4 py-8"><LocalizedText>{"Apertura impostazioni…"}</LocalizedText></p>;
  }
  if (account.status !== "authenticated") {
    return <AuthPage />;
  }

  const email = account.user?.email ?? null;
  const profile = normalizeUserProfile(account.user);
  const showRecovery =
    account.hasQuarantinedWorkspace || Boolean(account.authMessage);

  return (
    <AccountWorkspaceFrame surface="settings">
      <div className="tv-settings">
        <header className="tv-id">
          <span className="tv-app__initials" aria-hidden="true">
            <LocalizedText>{profile.displayName?.slice(0, 2).toUpperCase() ?? (email?.slice(0, 2).toUpperCase() ?? "TV")}</LocalizedText>
          </span>
          <div className="tv-id__copy">
            <p className="tv-id__name"><LocalizedText>{profile.displayName ?? email?.split("@")[0] ?? "account"}</LocalizedText></p>
            {email ? <p className="tv-id__meta"><LocalizedText>{email}</LocalizedText></p> : null}
            <h1 className="sr-only"><LocalizedText>{"Impostazioni"}</LocalizedText></h1>
          </div>
        </header>

        <section className="tv-settings-section" aria-labelledby="settings-profile">
          <h2 id="settings-profile" className="tv-settings-heading"><LocalizedText>{"Profilo "}</LocalizedText></h2>
          <p className="tv-settings-lead"><LocalizedText>{"Chi sei in questo workspace, e su cosa stai lavorando."}</LocalizedText></p>
          <PersonalizationSettings />
        </section>

        <section className="tv-settings-section" aria-labelledby="settings-signal">
          <h2 id="settings-signal" className="tv-settings-heading"><LocalizedText>{"Segnale "}</LocalizedText></h2>
          <p className="tv-settings-lead"><LocalizedText>{"Volume, animazioni e celebrazioni. Lo spazio resta utile anche in silenzio."}</LocalizedText></p>
          <SignalSettings />
        </section>

        {showRecovery ? (
          <section className="tv-settings-section" aria-labelledby="settings-recovery">
            <h2 id="settings-recovery" className="tv-settings-heading"><LocalizedText>{"Recovery "}</LocalizedText></h2>
            <AccountRecoverySection account={account} />
          </section>
        ) : (
          <AccountRecoverySection account={account} />
        )}

        <section className="tv-settings-section" aria-labelledby="settings-workspace">
          <h2 id="settings-workspace" className="tv-settings-heading"><LocalizedText>{"Workspace "}</LocalizedText></h2>
          <p className="tv-settings-lead"><LocalizedText>{"Esporta o svuota salvati, stack e decisioni di questo spazio."}</LocalizedText></p>
          <WorkspaceSettings />
        </section>

        <section className="tv-settings-section" aria-labelledby="settings-privacy">
          <h2 id="settings-privacy" className="tv-settings-heading"><LocalizedText>{"Privacy e dati "}</LocalizedText></h2>
          <p className="tv-settings-copy"><LocalizedText>{"I dati del toolbox restano nel workspace personale. Puoi esportarli dalla sezione Workspace. "}</LocalizedText></p>
          <p className="tv-settings-copy"><LocalizedText>{"Eliminazione account: non disponibile in questo ciclo. "}</LocalizedText></p>
        </section>

        <section className="tv-settings-section" aria-labelledby="settings-contrib">
          <h2 id="settings-contrib" className="tv-settings-heading"><LocalizedText>{"Contributi "}</LocalizedText></h2>
          <p className="tv-settings-lead"><LocalizedText>{"Tool e segnalazioni che hai inviato."}</LocalizedText></p>
          <AccountSubmissionsSection
            status={account.status}
            submissions={submissions.submissions}
            isLoading={submissions.isLoading}
            totalSubmissions={submissions.totalSubmissions}
            error={submissions.error}
            onRetry={submissions.reload}
          />
        </section>

        <AccountIdentitiesSection />

        <section className="tv-settings-section" aria-labelledby="settings-account">
          <h2 id="settings-account" className="tv-settings-heading"><LocalizedText>{"Account "}</LocalizedText></h2>
          <p className="tv-settings-lead"><LocalizedText>{"Sessione e uscita."}</LocalizedText></p>
          <LocalizedAttributes><button
            type="button"
            className="account-btn-secondary"
            onClick={() => void account.signOut()}
            aria-label="Esci dall'account"
          ><LocalizedText>{"Esci dall'account "}</LocalizedText></button></LocalizedAttributes>
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
      <p className="tv-settings-copy"><LocalizedText>{"Si può cambiare quando cambia il lavoro. Non è un onboarding da chiudere. "}</LocalizedText></p>
      <fieldset className="tv-choice">
        <legend><LocalizedText>{"Focus"}</LocalizedText></legend>
        {SIGNAL_FOCUS_AREAS.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={focusArea === item}
            onClick={() => setFocusArea(item)}
          >
            <LocalizedText>{FOCUS_AREA_LABELS[item]}</LocalizedText>
          </button>
        ))}
      </fieldset>
      <fieldset className="tv-choice">
        <legend><LocalizedText>{"Obiettivo"}</LocalizedText></legend>
        {SIGNAL_PRIMARY_GOALS.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={primaryGoal === item}
            onClick={() => setPrimaryGoal(item)}
          >
            <LocalizedText>{PRIMARY_GOAL_LABELS[item]}</LocalizedText>
          </button>
        ))}
      </fieldset>
      <button type="submit" className="account-btn-primary"><LocalizedText>{"Aggiorna contesto "}</LocalizedText></button>
      {status ? <p role="status"><LocalizedText>{status}</LocalizedText></p> : null}
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
      <p className="tv-settings-copy"><LocalizedText>{"Lo spazio resta utile anche a volume zero. Nessuna penalità per le pause. "}</LocalizedText></p>
      <label className="tv-switch">
        <input
          type="checkbox"
          checked={prefs.quietMode}
          onChange={() => toggle("quietMode")}
        /><LocalizedText>{"Modalità silenziosa "}</LocalizedText></label>
      <label className="tv-switch">
        <input
          type="checkbox"
          checked={prefs.reduceRewardAnimations}
          onChange={() => toggle("reduceRewardAnimations")}
        /><LocalizedText>{"Riduci animazioni "}</LocalizedText></label>
      <label className="tv-switch">
        <input
          type="checkbox"
          checked={prefs.suppressMajorCelebrations}
          onChange={() => toggle("suppressMajorCelebrations")}
        /><LocalizedText>{"Niente celebrazioni "}</LocalizedText></label>
      {status ? <p role="status"><LocalizedText>{status}</LocalizedText></p> : null}
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
      <p className="tv-settings-copy"><LocalizedText>{"Esporta o svuota salvati, stack e decisioni di questo workspace. Il catalogo e il ledger del segnale restano intatti. "}</LocalizedText></p>
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
      ><LocalizedText>{"Esporta i tuoi dati "}</LocalizedText></button>
      {exportStatus ? <p role="status"><LocalizedText>{exportStatus}</LocalizedText></p> : null}

      <div className="tv-danger">
      <label className="tv-space-search">
        <span><LocalizedText>{"Scrivi RESET per confermare"}</LocalizedText></span>
        <input
          value={resetConfirm}
          onChange={(event) => setResetConfirm(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          aria-describedby="settings-reset-help"
        />
      </label>
      <p id="settings-reset-help" className="tv-settings-copy"><LocalizedText>{"Svuota salvati, stack e decisioni su questo workspace. Non tocca il catalogo né il ledger del segnale. "}</LocalizedText></p>
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
      ><LocalizedText>{"Svuota lo spazio "}</LocalizedText></button>
      {resetStatus ? <p role="status"><LocalizedText>{resetStatus}</LocalizedText></p> : null}
      </div>
    </div>
  );
}
