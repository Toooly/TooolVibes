"use client";

import { useCallback, useEffect, useState } from "react";
import { Compass, Sparkles } from "lucide-react";
import NumberFlow from "@number-flow/react";

import { useAccount } from "@/components/account/account-provider";
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
      <div className="account-section-panel p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Compass size={16} className="text-[var(--accent-purple)]" />
          <p className="account-label">Signal Progress</p>
        </div>
        <h2 className="account-title mt-3 text-[1.3rem] sm:text-[1.5rem]">
          Accedi per tracciare progressi reali.
        </h2>
        <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted)" }}>
          Nessun progresso finto da ospite: SP, livelli e missioni arrivano solo da azioni verificate sul server.
        </p>
      </div>
    );
  }

  const missions = hub?.missions ?? [];
  const progressPct = Math.round((hub?.progressInLevel ?? 0) * 100);

  return (
    <div className="account-game-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="account-status-badge">Signal</span>
            <span className="account-status-badge">Server-verified</span>
          </div>
          <h2 className="account-title mt-4 text-[1.55rem] sm:text-[1.9rem]">
            {hub?.levelTitle ?? "La tua progressione"}
          </h2>
          <p className="account-subtitle mt-3 max-w-[42rem]">
            {hub?.explanation ??
              "Punti e missioni derivano da azioni utili verificate — non da click cosmetici."}
          </p>
        </div>
        <Sparkles size={22} className="text-[var(--accent-purple)]" aria-hidden />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="account-game-stat">
          <span>Livello</span>
          <strong>{loading || !hub ? "—" : <NumberFlow value={hub.level} />}</strong>
        </div>
        <div className="account-game-stat">
          <span>Signal Points</span>
          <strong>
            {loading || !hub ? "—" : <NumberFlow value={hub.balance} />}
          </strong>
        </div>
        <div className="account-game-stat">
          <span>Missioni</span>
          <strong>
            {loading
              ? "—"
              : `${missions.filter((m) => m.status === "completed").length}/${missions.length || 0}`}
          </strong>
        </div>
      </div>

      <div
        className="account-game-meter mt-4"
        aria-label={`${progressPct}% verso il prossimo livello Signal`}
      >
        <span style={{ width: `${progressPct}%` }} />
      </div>
      <p className="mt-3 text-[0.82rem] leading-6" style={{ color: "var(--account-muted)" }}>
        {hub?.nextThreshold != null
          ? `Mancano ${Math.max(0, hub.nextThreshold - hub.balance)} SP al livello ${hub.nextLevel}.`
          : hub
            ? "Hai raggiunto il livello massimo del modello V1."
            : loading
              ? "Caricamento progressione..."
              : "Nessun dato di progressione ancora."}
      </p>

      {missions.length > 0 ? (
        <div className="mt-5 grid gap-3">
          <p className="account-label">Missioni Signal</p>
          {missions.map((mission) => (
            <div
              key={mission.id}
              className="rounded-[18px] border px-4 py-3"
              style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.66)" }}
              data-status={mission.status}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--account-ink)]">
                    {mission.title}
                  </p>
                  <p className="mt-1 text-xs leading-5" style={{ color: "var(--muted)" }}>
                    {mission.description}
                  </p>
                </div>
                <span
                  className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em]"
                  style={{ color: "var(--muted-strong)" }}
                >
                  {mission.status === "completed"
                    ? "Fatto"
                    : mission.status === "current"
                      ? "Attiva"
                      : "Prossima"}
                </span>
              </div>
              <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
                +{mission.rewardSp} SP
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-6 grid gap-3">
        <p className="account-label">Contesto profilo</p>
        <label className="grid gap-1 text-sm">
          <span>Focus</span>
          <select
            value={focusArea}
            onChange={(e) => setFocusArea(e.target.value as SignalFocusArea)}
            className="rounded-[14px] border px-3 py-2"
            style={{ borderColor: "var(--line)", background: "#fff" }}
          >
            {SIGNAL_FOCUS_AREAS.map((value) => (
              <option key={value} value={value}>
                {FOCUS_AREA_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span>Obiettivo</span>
          <select
            value={primaryGoal}
            onChange={(e) => setPrimaryGoal(e.target.value as SignalPrimaryGoal)}
            className="rounded-[14px] border px-3 py-2"
            style={{ borderColor: "var(--line)", background: "#fff" }}
          >
            {SIGNAL_PRIMARY_GOALS.map((value) => (
              <option key={value} value={value}>
                {PRIMARY_GOAL_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
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
    </div>
  );
}
