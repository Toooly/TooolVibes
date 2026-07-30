"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";

import type { AccountPanelStatus } from "./account-panel-model";
import {
  DEFAULT_REWARD_PREFERENCES,
  mergeRewardPreferences,
  readRewardPreferences,
  type RewardPreferences,
} from "@/lib/rewards/preferences";
import { useSignalProgressUiEnabled } from "@/lib/signal-progression/release-context";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

export function AccountPreferencesSection({
  status,
  savedCount,
}: {
  status: AccountPanelStatus;
  savedCount: number;
}) {
  const signalUi = useSignalProgressUiEnabled();
  const [prefs, setPrefs] = useState<RewardPreferences>({
    ...DEFAULT_REWARD_PREFERENCES,
  });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setPrefs(readRewardPreferences());
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !signalUi) return;
    let cancelled = false;
    void (async () => {
      try {
        const token = (
          await getBrowserSupabaseClient().auth.getSession()
        ).data.session?.access_token;
        if (!token || cancelled) return;
        const response = await fetch("/api/signal-progression/preferences", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "same-origin",
        });
        if (!response.ok || cancelled) return;
        const payload = (await response.json()) as {
          preferences?: {
            reduceRewardAnimations: boolean;
            muteRewardSounds: boolean;
            quietMode: boolean;
            suppressAutomaticAchievements: boolean;
          } | null;
        };
        if (!payload.preferences) return;
        const merged = mergeRewardPreferences(payload.preferences);
        if (!cancelled) setPrefs(merged);
      } catch {
        // local only
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, signalUi]);

  async function toggle(key: keyof Omit<RewardPreferences, "version">) {
    const next = mergeRewardPreferences({ [key]: !prefs[key] }, prefs);
    setPrefs(next);
    if (status !== "authenticated" || !signalUi) return;
    setSyncing(true);
    try {
      const token = (
        await getBrowserSupabaseClient().auth.getSession()
      ).data.session?.access_token;
      if (token) {
        await fetch("/api/signal-progression/preferences", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({
            reduceRewardAnimations: next.reduceRewardAnimations,
            muteRewardSounds: next.muteRewardSounds,
            quietMode: next.quietMode,
            suppressAutomaticAchievements: next.suppressAutomaticAchievements,
          }),
        });
      }
    } catch {
      // keep local
    }
    setSyncing(false);
  }

  return (
    <div className="account-section-panel p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Settings size={16} className="text-[var(--accent-purple)]" />
        <p className="account-label">Preferenze</p>
      </div>
      <h2 className="account-title mt-3 text-[1.3rem] sm:text-[1.5rem]">
        Il prossimo passo e&apos; personalizzare il ritorno.
      </h2>
      <div className="mt-5 grid gap-3">
        {[
          ["Interessi", savedCount > 0 ? `${savedCount} segnali dai tool salvati` : "Da costruire"],
          ["Notifiche", status === "authenticated" ? "Email collegata" : "Richiede login"],
          ["Shop", "Acquisti digitali in roadmap"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 rounded-[18px] border px-4 py-3"
            style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.66)" }}
          >
            <span className="text-sm font-semibold text-[var(--account-ink)]">{label}</span>
            <span
              className="text-right text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ color: "var(--muted)" }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {signalUi ? (
        <div className="mt-5 grid gap-2">
          <p className="account-label">Ricomense e motion</p>
          {(
            [
              ["reduceRewardAnimations", "Riduci animazioni ricompensa"],
              ["muteRewardSounds", "Silenzia suoni ricompensa"],
              ["suppressAutomaticAchievements", "Sopprimi achievement automatici"],
              ["quietMode", "Modalità quiet"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => void toggle(key)}
              className="flex items-center justify-between gap-3 rounded-[18px] border px-4 py-3 text-left"
              style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.66)" }}
              aria-pressed={prefs[key]}
              aria-label={`${label}, attualmente ${prefs[key] ? "On" : "Off"}`}
            >
              <span className="text-sm font-semibold text-[var(--account-ink)]">{label}</span>
              <span
                className="text-xs font-semibold uppercase tracking-[0.12em]"
                style={{ color: "var(--muted)" }}
              >
                {prefs[key] ? "On" : "Off"}
              </span>
            </button>
          ))}
          {syncing ? (
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Sincronizzazione preferenze...
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
