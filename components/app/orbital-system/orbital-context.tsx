"use client";

import { createContext, useContext, useState, useCallback, useRef, useMemo, type ReactNode } from "react";
import type { OrbitalContextValue, OrbitalSection } from "./types";

const OrbitalContext = createContext<OrbitalContextValue | null>(null);

export function useOrbitalContext() {
  const ctx = useContext(OrbitalContext);
  if (!ctx) throw new Error("useOrbitalContext must be used within OrbitalProvider");
  return ctx;
}

export function OrbitalProvider({ children }: { children: ReactNode }) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [coreMenuOpen, setCoreMenuOpen] = useState(false);
  const sectionsRef = useRef<Map<string, OrbitalSection>>(new Map());

  const registerSection = useCallback((section: OrbitalSection) => {
    sectionsRef.current.set(section.id, section);
  }, []);

  const unregisterSection = useCallback((id: string) => {
    sectionsRef.current.delete(id);
    setActiveSectionId((prev) => (prev === id ? null : prev));
  }, []);

  const getItemsForSection = useCallback((id: string) => {
    return sectionsRef.current.get(id)?.items ?? [];
  }, []);

  const value = useMemo<OrbitalContextValue>(
    () => ({
      activeSectionId,
      setActiveSectionId,
      registerSection,
      unregisterSection,
      getItemsForSection,
      hoveredItemId,
      setHoveredItemId,
      isPaused,
      setIsPaused,
      selectedItemId,
      setSelectedItemId,
      coreMenuOpen,
      setCoreMenuOpen,
    }),
    [activeSectionId, hoveredItemId, isPaused, selectedItemId, coreMenuOpen, registerSection, unregisterSection, getItemsForSection]
  );

  return <OrbitalContext.Provider value={value}>{children}</OrbitalContext.Provider>;
}
