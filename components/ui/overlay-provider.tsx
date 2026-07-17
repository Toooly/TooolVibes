"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type OverlayContextValue = {
  portalContainer: HTMLDivElement | null;
};

const OverlayContext = createContext<OverlayContextValue | null>(null);

/**
 * Owns the single portal destination used by interactive floating surfaces.
 * Focus trapping, inert state, Escape handling and scroll locking remain with
 * Base UI/Vaul, which already coordinate those accessibility behaviours.
 */
export function OverlayProvider({ children }: { children: ReactNode }) {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null,
  );
  const value = useMemo(() => ({ portalContainer }), [portalContainer]);

  return (
    <OverlayContext.Provider value={value}>
      {children}
      <div
        ref={setPortalContainer}
        data-tv-overlay-portal-host=""
        data-testid="overlay-portal-host"
      />
    </OverlayContext.Provider>
  );
}

/** Returns `undefined` outside the app provider so primitives fall back to body. */
export function useOverlayPortalContainer() {
  return useContext(OverlayContext)?.portalContainer ?? undefined;
}

