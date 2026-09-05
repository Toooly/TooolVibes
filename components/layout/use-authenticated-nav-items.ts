"use client";

import { useMemo, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

import { useAccount } from "@/components/account/account-provider";
import {
  applyAuthenticatedPrimaryNav,
  isAuthenticatedNavActive,
} from "@/lib/navigation/account-primary-nav";
import { useNavItems } from "@/lib/navigation/navigation-release-context";
import type { NavSurface } from "@/lib/navigation/types";

function subscribeSearch(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function searchSnapshot() {
  return typeof window === "undefined" ? "" : window.location.search.replace(/^\?/, "");
}

export function useLocationSearch() {
  return useSyncExternalStore(subscribeSearch, searchSnapshot, () => "");
}

export function useAuthenticatedNavItems(surface: NavSurface) {
  const items = useNavItems(surface);
  const account = useAccount();
  const authenticated = account.status === "authenticated";
  return useMemo(
    () => applyAuthenticatedPrimaryNav(items, authenticated),
    [items, authenticated],
  );
}

export function useAuthenticatedNavActive(href: string) {
  const pathname = usePathname();
  const search = useLocationSearch();
  return isAuthenticatedNavActive(pathname, search, href);
}
