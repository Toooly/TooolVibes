"use client";

import { createContext, useContext } from "react";

const LoopShellContext = createContext(false);

export function LoopShellProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LoopShellContext.Provider value={true}>{children}</LoopShellContext.Provider>
  );
}

export function useLoopShell(): boolean {
  return useContext(LoopShellContext);
}
