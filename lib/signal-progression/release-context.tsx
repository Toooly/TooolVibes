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
