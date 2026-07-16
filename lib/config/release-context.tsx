"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { setReleaseAudioEnabled } from "@/lib/config/audio-runtime";

type ExperienceReleaseContextValue = Readonly<{
  threeDEnabled: boolean;
  audioEnabled: boolean;
}>;

const ExperienceReleaseContext = createContext<ExperienceReleaseContextValue>({
  threeDEnabled: false,
  audioEnabled: false,
});

export function ExperienceReleaseProvider({
  children,
  threeDEnabled,
  audioEnabled,
}: {
  children: ReactNode;
  threeDEnabled: boolean;
  audioEnabled: boolean;
}) {
  setReleaseAudioEnabled(audioEnabled);
  const value = useMemo(
    () => ({ audioEnabled, threeDEnabled }),
    [audioEnabled, threeDEnabled],
  );

  return (
    <ExperienceReleaseContext.Provider value={value}>
      {children}
    </ExperienceReleaseContext.Provider>
  );
}

export function useExperienceRelease() {
  return useContext(ExperienceReleaseContext);
}
