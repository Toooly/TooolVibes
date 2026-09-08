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
import { Search } from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { HeaderAccountControl } from "./header-account-control";
import { getNavDestinationForPathname } from "@/lib/navigation/selectors";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import { useMobileUIStore } from "@/lib/stores/mobile-ui-store";
import { cn } from "@/lib/utils";

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

  return (
    <header
      role="banner"
      className={cn("mobile-top-bar", isHome && "mobile-top-bar--home")}
    >
      <div aria-hidden="true" className="mobile-top-bar__scanline" />
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

        <HeaderAccountControl
          linkClassName="mobile-top-bar__account"
          menuClassName="mobile-top-bar__account-menu"
          panelClassName="mobile-top-bar__account-panel"
          showLabel={false}
        />
      </div>

      {isHome ? null : (
        <div className="mobile-top-bar__route">
          <span aria-hidden="true" className="mobile-top-bar__route-dot" />
          <span className="mobile-top-bar__route-label">{routeLabel}</span>
        </div>
      )}
    </header>
  );
}

export default MobileTopBar;
