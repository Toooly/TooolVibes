"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import {
  defaultNavigationRelease,
  type NavigationRelease,
} from "./release";
import {
  getNavItemsForSurface,
  type ResolvedNavItem,
} from "./selectors";
import type { NavSurface } from "./types";

/**
 * BATCH 29 — Release di navigazione per i consumer client.
 *
 * Il default è `defaultNavigationRelease` (tutte le flag ai default, quindi
 * IA invariata): il provider serve a iniettare una release diversa — in test
 * o da un server wrapper futuro — senza toccare i consumer.
 */

const NavigationReleaseContext =
  createContext<NavigationRelease>(defaultNavigationRelease);

export function NavigationReleaseProvider({
  value,
  children,
}: {
  value: NavigationRelease;
  children: ReactNode;
}) {
  return (
    <NavigationReleaseContext.Provider value={value}>
      {children}
    </NavigationReleaseContext.Provider>
  );
}

export function useNavigationRelease(): NavigationRelease {
  return useContext(NavigationReleaseContext);
}

export function useNavItems(
  surface: NavSurface,
): readonly ResolvedNavItem[] {
  const release = useNavigationRelease();
  return useMemo(
    () => getNavItemsForSurface(surface, release),
    [surface, release],
  );
}
