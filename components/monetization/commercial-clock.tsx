"use client";

import { createContext, useContext, type ReactNode } from "react";

const CommercialClockContext = createContext<number | null>(null);

export function CommercialClockProvider({
  nowMs,
  children,
}: {
  nowMs: number;
  children: ReactNode;
}) {
  return (
    <CommercialClockContext.Provider value={nowMs}>
      {children}
    </CommercialClockContext.Provider>
  );
}

export function useCommercialNow(): Date {
  const nowMs = useContext(CommercialClockContext);
  return new Date(nowMs ?? Date.now());
}
