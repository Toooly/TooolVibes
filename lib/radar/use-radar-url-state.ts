"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  DEFAULT_RADAR_URL_STATE,
  parseRadarUrlState,
  radarUrlStateEquals,
  serializeRadarUrlState,
  type RadarUrlState,
} from "@/lib/radar/radar-url-state";

/**
 * URL-backed Radar state (spec §36).
 *
 * Uses `window.location` + `history.replaceState` + `popstate` rather than
 * `useSearchParams` so the Radar route stays statically renderable and needs
 * no Suspense bailout. SSR-safe: starts from defaults and syncs on mount.
 */
export function useRadarUrlState(): {
  state: RadarUrlState;
  setState: (patch: Partial<RadarUrlState>) => void;
} {
  const [state, setStateValue] = useState<RadarUrlState>(DEFAULT_RADAR_URL_STATE);
  const stateRef = useRef(state);

  useEffect(() => {
    const syncFromLocation = () => {
      const next = parseRadarUrlState(
        new URLSearchParams(window.location.search),
      );
      if (!radarUrlStateEquals(stateRef.current, next)) {
        stateRef.current = next;
        setStateValue(next);
      }
    };
    syncFromLocation();
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, []);

  const setState = useCallback((patch: Partial<RadarUrlState>) => {
    const next = { ...stateRef.current, ...patch };
    if (radarUrlStateEquals(stateRef.current, next)) return;
    stateRef.current = next;
    setStateValue(next);

    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const serialized = serializeRadarUrlState(next);
    for (const key of ["v", "r", "c", "t", "q"]) {
      params.delete(key);
    }
    for (const [key, value] of Object.entries(serialized)) {
      params.set(key, value);
    }
    const query = params.toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ""}`;
    window.history.replaceState(window.history.state, "", url);
  }, []);

  return { state, setState };
}
