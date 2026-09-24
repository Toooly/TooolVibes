"use client";

/**
 * TooolVibes — Mobile Top Bar
 * Definitive UI shell replacement (2026-07-24)
 *
 * Substantially different from the previous mobile header:
 *  - Full wordmark on the left
 *  - Compact search trigger in the center (touch-first, 44px hit area)
 *  - Hamburger / account on the right
 *  - Live route label below (shows where you are)
 *  - Subtle scan line + signal trace
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { useChromeViewport } from "./chrome-viewport";
import { HeaderAccountControl } from "./header-account-control";
import { getNavDestinationForPathname } from "@/lib/navigation/selectors";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import { useMobileUIStore } from "@/lib/stores/mobile-ui-store";
import { cn } from "@/lib/utils";

/**
 * V3 route-context policy (Phase 1): the compact strip exists only inside
 * task/product areas where it answers "where am I inside the product?".
 * Editorial/marketing/utility routes repeat their own page title and must
 * not carry bureaucratic chrome. Keep this list explicit and small.
 */
export const ROUTE_STRIP_PATH_PREFIXES = [
  "/archivio",
  "/collections",
  "/radar",
  "/shortlist",
  "/compare",
  "/toools",
] as const;

export function hasRouteStrip(pathname: string): boolean {
  if (pathname === "/") return false;
  return ROUTE_STRIP_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function getRouteLabel(pathname: string): string {
  const destination = getNavDestinationForPathname(pathname);
  if (destination) return destination.label;
  if (pathname.startsWith("/toools")) return "Tool";
  if (pathname.startsWith("/account")) return "Account";
  if (pathname.startsWith("/community")) return "Contributi";
  if (pathname.startsWith("/affiliati")) return "Affiliati";
  return "TooolVibes";
}

export function MobileTopBar() {
  const pathname = usePathname() ?? "/";
  const isHome = pathname === "/";
  const routeLabel = getRouteLabel(pathname);
  const setCommandOpen = useToolWorkspaceStore((state) => state.setCommandOpen);
  const heroSearchVisible = useMobileUIStore((state) => state.heroSearchVisible);
  const suppressSearch = isHome && heroSearchVisible;
  const viewport = useChromeViewport();

  if (viewport === "desktop") {
    return null;
  }

  return (
    <header
      role="banner"
      className={cn("mobile-top-bar", isHome && "mobile-top-bar--home")}
    >
      <div className="mobile-top-bar__inner">
        <Link
          href="/"
          prefetch={false}
          aria-label="TooolVibes home"
          className="mobile-top-bar__brand"
        >
          <span className="mobile-top-bar__brand-mark">
            <BrandLogo size={24} fallback="png" priority />
          </span>
          <span className="mobile-top-bar__brand-text">TooolVibes</span>
        </Link>

        <button
          type="button"
          className={cn(
            "mobile-top-bar__search",
            suppressSearch && "is-hero-suppressed",
          )}
          aria-label="Apri ricerca"
          aria-hidden={suppressSearch || undefined}
          tabIndex={suppressSearch ? -1 : undefined}
          onClick={() => setCommandOpen(true)}
        >
          <Search size={16} aria-hidden="true" />
          <span className="mobile-top-bar__search-text">Cerca tool…</span>
        </button>

        <button
          type="button"
          className="mobile-top-bar__bell"
          aria-label="Notifiche"
        >
          <Bell size={16} aria-hidden="true" />
        </button>

        <HeaderAccountControl
          linkClassName="mobile-top-bar__account"
          menuClassName="mobile-top-bar__account-menu"
          panelClassName="mobile-top-bar__account-panel"
          showLabel={false}
        />
      </div>

      {isHome || !hasRouteStrip(pathname) ? null : (
        <div className="mobile-top-bar__route">
          <span aria-hidden="true" className="mobile-top-bar__route-dot" />
          <span className="mobile-top-bar__route-label">{routeLabel}</span>
        </div>
      )}
    </header>
  );
}

export default MobileTopBar;
