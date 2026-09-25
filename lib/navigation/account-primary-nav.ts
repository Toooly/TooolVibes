import { ClipboardCheck } from "lucide-react";

import type { ResolvedNavItem } from "./selectors";

export function applyAuthenticatedPrimaryNav(
  items: readonly ResolvedNavItem[],
  authenticated: boolean,
): readonly ResolvedNavItem[] {
  if (!authenticated) return items;

  return items.map((item) => {
    if (item.id === "home") {
      return {
        ...item,
        href: "/",
        label: "Home",
        canonicalLabel: "Home",
      };
    }
    if (item.id === "shortlist") {
      return {
        ...item,
        href: "/account?view=salvati",
      };
    }
    if (item.id === "collections") {
      return {
        ...item,
        id: "decisions",
        href: "/account?view=decisioni",
        label: "Decisioni",
        canonicalLabel: "Decisioni",
        icon: ClipboardCheck,
      };
    }
    return item;
  });
}

export type NavFamily =
  | "editorial"
  | "resource"
  | "workflow"
  | "signal"
  | "personal"
  | "decision"
  | "commercial"
  | "institutional";

/** Route family for chrome accents (dot markers). Brand-wide, no product logic. */
export function navFamilyForHref(href: string): NavFamily {
  const path = href.split("?")[0];
  if (path === "/") return "editorial";
  if (path.startsWith("/archivio") || path.startsWith("/toools")) return "resource";
  if (path.startsWith("/collections")) return "workflow";
  if (path.startsWith("/radar")) return "signal";
  if (path.startsWith("/posts")) return "editorial";
  if (path.startsWith("/compare")) return "decision";
  if (path.startsWith("/shortlist") || path.startsWith("/account")) return "personal";
  if (path.startsWith("/sponsorizza") || path.startsWith("/shop")) return "commercial";
  if (
    path.startsWith("/chi-siamo") ||
    path.startsWith("/metodo") ||
    path.startsWith("/privacy") ||
    path.startsWith("/termini") ||
    path.startsWith("/cookie")
  )
    return "institutional";
  return "editorial";
}

export function isAuthenticatedNavActive(
  pathname: string | null,
  search: string,
  href: string,
): boolean {
  if (!pathname || !href.startsWith("/")) return false;
  const target = new URL(href, "https://tooolvibes.eu");
  const path = target.pathname;
  const view = target.searchParams.get("view");
  const currentView = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get(
    "view",
  );

  if (path === "/account") {
    if (pathname !== "/account") return false;
    if (!view || view === "riprendi") {
      return !currentView || currentView === "riprendi";
    }
    return currentView === view;
  }

  if (path === "/") return pathname === "/";
  if (path === "/archivio" && pathname.startsWith("/toools/")) return true;
  return pathname === path || (path !== "/" && pathname.startsWith(`${path}/`));
}
