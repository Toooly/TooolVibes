"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Ephemeral Speed 2 open key. One overflow at a time.
 * Do not persist this into WorkspaceStateV1.
 */
let openKey: string | null = null;
const listeners = new Set<() => void>();
let navigationBound = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function bindNavigationClose() {
  if (navigationBound || typeof window === "undefined") return;
  navigationBound = true;
  window.addEventListener("popstate", () => {
    if (openKey !== null) {
      openKey = null;
      emit();
    }
  });
}

export function getOpenSaveOverflowKey() {
  return openKey;
}

export function setOpenSaveOverflowKey(key: string | null) {
  bindNavigationClose();
  if (openKey === key) return;
  openKey = key;
  emit();
}

export function openSaveOverflow(key: string) {
  setOpenSaveOverflowKey(key);
}

export function closeSaveOverflow() {
  setOpenSaveOverflowKey(null);
}

export function subscribeSaveOverflow(listener: () => void) {
  bindNavigationClose();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSaveOverflowOpen(key: string) {
  const open = useSyncExternalStore(
    subscribeSaveOverflow,
    () => getOpenSaveOverflowKey() === key,
    () => false,
  );

  const setOpen = useCallback(
    (next: boolean) => {
      if (next) {
        setOpenSaveOverflowKey(key);
        return;
      }
      if (getOpenSaveOverflowKey() === key) {
        setOpenSaveOverflowKey(null);
      }
    },
    [key],
  );

  const openOverflow = useCallback(() => {
    setOpenSaveOverflowKey(key);
  }, [key]);

  return { open, setOpen, openOverflow };
}
