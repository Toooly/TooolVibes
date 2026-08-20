"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "@/components/account/account-provider";
import { AccountBadgeCabinetSection } from "@/components/account/panel/account-badge-cabinet-section";
import { SignalMark } from "@/components/signal/marks/signal-mark";
import {
  fetchSignalHub,
  saveSignalProfileContext,
} from "@/lib/signal-progression/client";
import { useSignalProgressUiEnabled } from "@/lib/signal-progression/release-context";
import {
  FOCUS_AREA_LABELS,
  PRIMARY_GOAL_LABELS,
  SIGNAL_FOCUS_AREAS,
  SIGNAL_PRIMARY_GOALS,
  type SignalFocusArea,
  type SignalPrimaryGoal,
} from "@/lib/signal-progression/profile-context";
import type { SignalProgressHub } from "@/lib/signal-progression/hub-contracts";

export function AccountSignalProgressSection() {
  const enabled = useSignalProgressUiEnabled();
  const { status } = useAccount();
  const [hub, setHub] = useState<SignalProgressHub | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusArea, setFocusArea] = useState<SignalFocusArea>("product");
  const [primaryGoal, setPrimaryGoal] = useState<SignalPrimaryGoal>("discover");
  const [savingContext, setSavingContext] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled || status !== "authenticated") {
      setHub(null);
      return;
    }
    setLoading(true);
    const next = await fetchSignalHub();
    setHub(next);
    if (next?.profileContext) {
      setFocusArea(next.profileContext.focusArea);
      setPrimaryGoal(next.profileContext.primaryGoal);
    }
    setLoading(false);
  }, [enabled, status]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function saveContext() {
    setSavingContext(true);
    await saveSignalProfileContext({ focusArea, primaryGoal });
    await reload();
    setSavingContext(false);
  }

  if (!enabled) return null;

  if (status !== "authenticated") {
    return (
      <div className="tv-signal-hero">
        <p className="account-label">Segnale</p>
        <h2 className="tv-signal-view__title">Accedi per tracciare progressi reali.</h2>
        <p className="tv-signal-view__copy">
          Nessun progresso finto da ospite: SP, livelli e missioni arrivano solo da azioni verificate sul server.
        </p>
      </div>
    );
  }

  const missions = hub?.missions ?? [];
  const progressPct = Math.round((hub?.progressInLevel ?? 0) * 100);
  const activeMissions = missions.filter((mission) => mission.status !== "upcoming");
  const shownMissions = activeMissions.length > 0 ? activeMissions : missions;

  return (
    <div className="tv-signal-progress">
      <div className="tv-signal-hero">
        <div className="tv-signal-hero__top">
          <SignalMark code="first_signal" state="earned" title={hub?.levelTitle ?? "Segnale"} />
          <div>
            <p className="account-label">Segnale</p>
            <h2 className="tv-signal-view__title">
              {hub?.levelTitle ?? "La tua progressione"}
            </h2>
            <p className="tv-signal-view__copy">
              {hub?.explanation ??
                "Punti e missioni derivano da azioni utili verificate — non da click cosmetici."}
            </p>
          </div>
        </div>

        <div className="tv-signal-stats">
          <div className="tv-signal-stat">
            <span>Livello</span>
            <strong>{loading || !hub ? "—" : hub.level}</strong>
          </div>
          <div className="tv-signal-stat">
            <span>Signal Points</span>
            <strong>
              {loading || !hub ? "—" : hub.balance}
            </strong>
          </div>
          <div className="tv-signal-stat">
            <span>Missioni</span>
            <strong>
              {loading
                ? "—"
                : `${missions.filter((m) => m.status === "completed").length}/${missions.length || 0}`}
            </strong>
          </div>
        </div>

        <div
          className="tv-signal-meter"
          aria-label={`${progressPct}% verso il prossimo livello Signal`}
        >
          <span style={{ width: `${progressPct}%` }} />
        </div>
        <p className="tv-signal-view__copy">
          {hub?.nextThreshold != null
            ? `Mancano ${Math.max(0, hub.nextThreshold - hub.balance)} SP al livello ${hub.nextLevel}.`
            : hub
              ? "Hai raggiunto il livello massimo del modello V1."
              : loading
                ? "Caricamento progressione..."
                : "Nessun dato di progressione ancora."}
        </p>
      </div>

      {shownMissions.length > 0 ? (
        <div className="tv-signal-missions">
          <p className="account-label">Missioni Signal</p>
          {shownMissions.map((mission) => (
            <article
              key={mission.id}
              className="tv-mission"
              data-status={mission.status}
              aria-label={`${mission.title} — ${mission.status === "completed" ? "Fatto" : mission.status === "current" ? "Attiva" : "Prossima"}`}
            >
              <div className="tv-mission__head">
                <h3 className="tv-mission__title">{mission.title}</h3>
                <span className="tv-chip" data-tone={mission.status === "completed" ? "using" : mission.status === "current" ? "selected" : "saved"}>
                  {mission.status === "completed"
                    ? "Fatto"
                    : mission.status === "current"
                      ? "Attiva"
                      : "Prossima"}
                </span>
              </div>
              <p className="tv-mission__copy">{mission.description}</p>
              <p className="tv-mission__copy">+{mission.rewardSp} SP</p>
            </article>
          ))}
        </div>
      ) : null}

      <div className="tv-settings-form">
        <p className="account-label">Contesto profilo</p>
        <fieldset className="tv-choice">
          <legend>Focus</legend>
          {SIGNAL_FOCUS_AREAS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={focusArea === value}
              onClick={() => setFocusArea(value)}
            >
              {FOCUS_AREA_LABELS[value]}
            </button>
          ))}
        </fieldset>
        <fieldset className="tv-choice">
          <legend>Obiettivo</legend>
          {SIGNAL_PRIMARY_GOALS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={primaryGoal === value}
              onClick={() => setPrimaryGoal(value)}
            >
              {PRIMARY_GOAL_LABELS[value]}
            </button>
          ))}
        </fieldset>
        <button
          type="button"
          className="account-btn-secondary"
          disabled={savingContext || Boolean(hub?.profileContextComplete)}
          onClick={() => void saveContext()}
        >
          {hub?.profileContextComplete
            ? "Contesto già completo"
            : savingContext
              ? "Salvataggio..."
              : "Salva contesto"}
        </button>
      </div>

      <AccountBadgeCabinetSection hub={hub} loading={loading} />
    </div>
  );
}
