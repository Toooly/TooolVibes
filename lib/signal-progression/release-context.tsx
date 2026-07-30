"use client";

import { createContext, useContext, type ReactNode } from "react";

const SignalProgressUiContext = createContext(false);

export function SignalProgressUiProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  return (
    <SignalProgressUiContext.Provider value={enabled}>
      {children}
    </SignalProgressUiContext.Provider>
  );
}

export function useSignalProgressUiEnabled(): boolean {
  return useContext(SignalProgressUiContext);
}

export type SignalAchievementFlagSnapshot = {
  achievementsEnabled: boolean;
  badgeCabinetEnabled: boolean;
  milestonesEnabled: boolean;
};

const SignalAchievementFlagsContext =
  createContext<SignalAchievementFlagSnapshot>({
    achievementsEnabled: false,
    badgeCabinetEnabled: false,
    milestonesEnabled: false,
  });

export function SignalAchievementFlagsProvider({
  flags,
  children,
}: {
  flags: SignalAchievementFlagSnapshot;
  children: ReactNode;
}) {
  return (
    <SignalAchievementFlagsContext.Provider value={flags}>
      {children}
    </SignalAchievementFlagsContext.Provider>
  );
}

export function useSignalAchievementFlags(): SignalAchievementFlagSnapshot {
  return useContext(SignalAchievementFlagsContext);
}
