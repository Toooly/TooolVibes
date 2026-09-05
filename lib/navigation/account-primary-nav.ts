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
        href: "/account",
        label: "Spazio",
        canonicalLabel: "Spazio",
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

  if (path === "/archivio" && pathname.startsWith("/toools/")) return true;
  return pathname === path || (path !== "/" && pathname.startsWith(`${path}/`));
}
