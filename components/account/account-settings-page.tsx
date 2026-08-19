"use client";

import { useEffect, useState } from "react";

import { useAccount } from "@/components/account/account-provider";
import { AccountWorkspaceFrame } from "@/components/account/workspace/account-workspace-frame";
import { AccountRecoverySection } from "./panel/account-recovery-section";
import { AccountSubmissionsSection } from "./panel/account-submissions-section";
import { useAccountSubmissions } from "./panel/use-account-submissions";
import { AuthPage } from "./auth-page";
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
        <header className="tv-app__pagehead">
          <h1 className="tv-app__page-title">Impostazioni</h1>
          <p className="tv-app__page-copy">
            Preferenze e contesto del tuo spazio. Il volume del segnale si regola qui.
          </p>
        </header>

        <section className="tv-settings-section" aria-labelledby="settings-profile">
          <h2 id="settings-profile" className="tv-settings-heading">
            Profilo
          </h2>
          {email ? (
            <p className="tv-settings-email">
              <span className="tv-settings-kicker">Email</span>
              <span>{email}</span>
            </p>
          ) : null}
          <PersonalizationSettings />
        </section>

        <section className="tv-settings-section" aria-labelledby="settings-signal">
          <h2 id="settings-signal" className="tv-settings-heading">
            Segnale
          </h2>
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

        <section className="tv-settings-section" aria-labelledby="settings-contrib">
          <h2 id="settings-contrib" className="tv-settings-heading">
            Contributi
          </h2>
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
      <label className="tv-space-search">
        <span>Focus</span>
        <select
          value={focusArea}
          onChange={(event) => setFocusArea(event.target.value as SignalFocusArea)}
        >
          {SIGNAL_FOCUS_AREAS.map((item) => (
            <option key={item} value={item}>
              {FOCUS_AREA_LABELS[item]}
            </option>
          ))}
        </select>
      </label>
      <label className="tv-space-search">
        <span>Obiettivo</span>
        <select
          value={primaryGoal}
          onChange={(event) => setPrimaryGoal(event.target.value as SignalPrimaryGoal)}
        >
          {SIGNAL_PRIMARY_GOALS.map((item) => (
            <option key={item} value={item}>
              {PRIMARY_GOAL_LABELS[item]}
            </option>
          ))}
        </select>
      </label>
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
    setStatus("Preferenze locali aggiornate.");
    void saveSignalPreferences(next);
  };

  return (
    <div className="tv-settings-form">
      <p className="tv-settings-copy">
        Lo spazio resta utile anche a volume zero. Nessuna penalità per le pause.
      </p>
      <label className="tv-space-check">
        <input
          type="checkbox"
          checked={prefs.quietMode}
          onChange={() => toggle("quietMode")}
        />
        Modalità silenziosa
      </label>
      <label className="tv-space-check">
        <input
          type="checkbox"
          checked={prefs.reduceRewardAnimations}
          onChange={() => toggle("reduceRewardAnimations")}
        />
        Riduci animazioni
      </label>
      <label className="tv-space-check">
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
