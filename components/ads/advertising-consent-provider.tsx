"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  advertisingConsentFromRecord,
  readAdvertisingConsentRecord,
  writeAdvertisingConsentRecord,
  type AdvertisingConsent,
  type AdvertisingConsentRecord,
} from "@/lib/ads/advertising-consent";
import {
  bestEffortHideTinyAdz,
  reloadOnce,
  tinyadzRuntimeActive,
} from "@/components/ads/tinyadz-runtime";

const UNKNOWN_RECORD: AdvertisingConsentRecord = {
  state: "unknown",
  version: 1,
  updatedAt: 0,
};

type AdvertisingConsentContextValue = {
  /** Canonical, persisted state. Never assumed before a real user choice. */
  state: AdvertisingConsent;
  /** True once the persisted value has been hydrated in the browser. */
  loaded: boolean;
  /** Settings dialog visibility. */
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  /** Accept everything (grants advertising). */
  grantAll: () => void;
  /** Reject non-necessary (denies advertising). */
  denyNonNecessary: () => void;
  /** Withdraw an existing advertising grant at any time. */
  withdraw: () => void;
  /**
   * Persist a specific advertising preference from the customize panel.
   * `enabled=true` grants advertising, `false` denies it.
   */
  saveAdvertisingPreference: (enabled: boolean) => void;
  /** Advertising data subject to consent (i.e. TinyAdz). */
  advertisingLabel: string;
};

const AdvertisingConsentContext =
  createContext<AdvertisingConsentContextValue | null>(null);

export function useAdvertisingConsent(): AdvertisingConsentContextValue {
  const value = useContext(AdvertisingConsentContext);
  if (!value) {
    throw new Error(
      "useAdvertisingConsent must be used within AdvertisingConsentProvider",
    );
  }
  return value;
}

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Persists the choice and tears down the TinyAdz runtime when advertising is
 * disabled. Because no official destroy API exists, teardown is best-effort
 * and the page performs one controlled reload so the loader stays absent.
 */
function persistAndTearDown(state: AdvertisingConsent): void {
  const storage = getBrowserStorage();
  writeAdvertisingConsentRecord(storage, state);
  const runtimePresent = tinyadzRuntimeActive();
  if (state !== "granted" && runtimePresent) {
    bestEffortHideTinyAdz();
    reloadOnce(state === "denied" ? "withdraw" : "setpreference");
  }
}

export function AdvertisingConsentProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [record, setRecord] = useState<AdvertisingConsentRecord>(UNKNOWN_RECORD);
  const [loaded, setLoaded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const storage = getBrowserStorage();
    const persisted = readAdvertisingConsentRecord(storage);
    setRecord(persisted);
    setLoaded(true);
  }, []);

  const state = advertisingConsentFromRecord(record);

  const openSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  const grantAll = useCallback(() => {
    const storage = getBrowserStorage();
    const next = writeAdvertisingConsentRecord(storage, "granted");
    setRecord(next);
    setSettingsOpen(false);
  }, []);

  const denyNonNecessary = useCallback(() => {
    setSettingsOpen(false);
    persistAndTearDown("denied");
    const storage = getBrowserStorage();
    setRecord(readAdvertisingConsentRecord(storage));
  }, []);

  const withdraw = useCallback(() => {
    setSettingsOpen(false);
    persistAndTearDown("denied");
    const storage = getBrowserStorage();
    setRecord(readAdvertisingConsentRecord(storage));
  }, []);

  const saveAdvertisingPreference = useCallback((enabled: boolean) => {
    const storage = getBrowserStorage();
    if (enabled) {
      const next = writeAdvertisingConsentRecord(storage, "granted");
      setRecord(next);
      setSettingsOpen(false);
    } else {
      setSettingsOpen(false);
      persistAndTearDown("denied");
      const reread = getBrowserStorage();
      setRecord(readAdvertisingConsentRecord(reread));
    }
  }, []);

  const value = useMemo<AdvertisingConsentContextValue>(
    () => ({
      state,
      loaded,
      settingsOpen,
      openSettings,
      closeSettings,
      grantAll,
      denyNonNecessary,
      withdraw,
      saveAdvertisingPreference,
      advertisingLabel: "Pubblicità e misurazione TinyAdz",
    }),
    [
      state,
      loaded,
      settingsOpen,
      openSettings,
      closeSettings,
      grantAll,
      denyNonNecessary,
      withdraw,
      saveAdvertisingPreference,
    ],
  );

  return (
    <AdvertisingConsentContext.Provider value={value}>
      {children}
    </AdvertisingConsentContext.Provider>
  );
}

/** Convenience guard so consumed components can stay presentational. */
export function useAdvertisingConsentState(): AdvertisingConsent {
  return useAdvertisingConsent().state;
}
