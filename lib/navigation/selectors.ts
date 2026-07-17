import { navigationRegistry } from "./destinations";
import {
  defaultNavigationRelease,
  type NavigationRelease,
} from "./release";
import type {
  NavAudience,
  NavDestination,
  NavDestinationKind,
  NavScope,
  NavSurface,
  NavTone,
} from "./types";
import type { LucideIcon } from "lucide-react";

/**
 * BATCH 29 — Selector canonici del registry di navigazione.
 *
 * Funzioni pure (nessuna dipendenza React): usabili da server component
 * (footer legacy) e dai hook client (`./navigation-release-context.tsx`).
 */

export type ResolvedNavItem = Readonly<{
  id: string;
  kind: NavDestinationKind;
  href: string;
  /** Label effettiva nella surface (override di placement o canonical). */
  label: string;
  /** Label canonica del registry. */
  canonicalLabel: string;
  owner: string;
  audience: NavAudience;
  scope: NavScope;
  icon?: LucideIcon;
  tone?: NavTone;
  /** true per destinazioni external (http/mailto): usare <a>, non <Link>. */
  external: boolean;
  destination: NavDestination;
}>;

export function getNavDestination(id: string): NavDestination {
  const destination = navigationRegistry.find((entry) => entry.id === id);
  if (!destination) {
    throw new Error(`Unknown navigation destination "${id}".`);
  }
  return destination;
}

export function isNavDestinationEnabled(
  destination: NavDestination,
  release: NavigationRelease = defaultNavigationRelease,
): boolean {
  return release[destination.releaseFlag];
}

export function getNavItemsForSurface(
  surface: NavSurface,
  release: NavigationRelease = defaultNavigationRelease,
): readonly ResolvedNavItem[] {
  const items: ResolvedNavItem[] = [];

  for (const destination of navigationRegistry) {
    if (!isNavDestinationEnabled(destination, release)) {
      continue;
    }

    const placement = destination.placements.find(
      (entry) => entry.surface === surface,
    );
    if (!placement) {
      continue;
    }

    items.push({
      id: destination.id,
      kind: destination.kind,
      href: destination.href,
      label: placement.label ?? destination.label,
      canonicalLabel: destination.label,
      owner: destination.owner,
      audience: destination.audience,
      scope: destination.scope,
      icon: placement.icon,
      tone: placement.tone,
      external: destination.kind === "external",
      destination,
    });
  }

  return Object.freeze(
    items.sort((left, right) => {
      const leftOrder = left.destination.placements.find(
        (entry) => entry.surface === surface,
      )?.order;
      const rightOrder = right.destination.placements.find(
        (entry) => entry.surface === surface,
      )?.order;
      return (leftOrder ?? 0) - (rightOrder ?? 0);
    }),
  );
}

/**
 * Matcher attivo canonico (IA-501): identico output dei tre matcher locali
 * precedenti per ogni route reale del sito —
 * - header v2 / legacy: match esatto o prefisso con boundary "/";
 * - bottom nav: usava startsWith senza boundary, equivalente perché nessuna
 *   route registrata è prefisso lessicale di un'altra;
 * - gli href con hash (#wishlist) attivano la route base (come in legacy).
 */
export function isNavRouteActive(
  pathname: string | null,
  href: string,
): boolean {
  if (!pathname || !href.startsWith("/")) {
    return false;
  }
  const path = href.split("#")[0]?.split("?")[0] || "/";
  return pathname === path || (path !== "/" && pathname.startsWith(`${path}/`));
}
