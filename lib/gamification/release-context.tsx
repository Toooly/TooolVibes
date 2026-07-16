"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import {
  GAMIFICATION_SURFACE_KEYS,
  type GamificationMode,
  type GamificationSurfaceKey,
} from "@/lib/config/release-features";

export type GamificationClientModes = Readonly<
  Record<GamificationSurfaceKey, GamificationMode>
>;

export const OFF_GAMIFICATION_CLIENT_MODES: GamificationClientModes =
  Object.freeze({
    missions: "OFF",
    hiddenSignal: "OFF",
    arena: "OFF",
    prediction: "OFF",
    leaderboard: "OFF",
    vibeRush: "OFF",
  });

const GamificationReleaseContext = createContext<GamificationClientModes>(
  OFF_GAMIFICATION_CLIENT_MODES,
);

export function GamificationReleaseProvider({
  children,
  modes,
}: {
  children: ReactNode;
  modes: GamificationClientModes;
}) {
  return (
    <GamificationReleaseContext.Provider value={modes}>
      {children}
    </GamificationReleaseContext.Provider>
  );
}

export function useGamificationSurface(
  surfaceKey: GamificationSurfaceKey,
) {
  const modes = useContext(GamificationReleaseContext);
  const mode = modes[surfaceKey] ?? "OFF";

  return useMemo(
    () => ({
      mode,
      surfaceEnabled: mode !== "OFF",
      persistentRewardsEnabled: mode === "REWARDED",
    }),
    [mode],
  );
}

export function useGamificationReleaseSummary() {
  const modes = useContext(GamificationReleaseContext);

  return useMemo(() => {
    const resolvedModes = Object.values(modes);
    const firstRewardedSurface =
      GAMIFICATION_SURFACE_KEYS.find(
        (surfaceKey) => modes[surfaceKey] === "REWARDED",
      ) ?? null;

    return {
      hasEnabledSurface: resolvedModes.some((mode) => mode !== "OFF"),
      hasRewardedSurface: resolvedModes.some(
        (mode) => mode === "REWARDED",
      ),
      firstRewardedSurface,
    };
  }, [modes]);
}
