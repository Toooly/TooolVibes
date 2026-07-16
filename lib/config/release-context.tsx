"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

type ExperienceReleaseContextValue = Readonly<{
  threeDEnabled: boolean;
}>;

const ExperienceReleaseContext = createContext<ExperienceReleaseContextValue>({
  threeDEnabled: false,
});

export function ExperienceReleaseProvider({
  children,
  threeDEnabled,
}: {
  children: ReactNode;
  threeDEnabled: boolean;
}) {
  const value = useMemo(
    () => ({ threeDEnabled }),
    [threeDEnabled],
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
