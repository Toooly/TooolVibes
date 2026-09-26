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

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { useChromeViewport } from "./chrome-viewport";
import { HeaderAccountControl } from "./header-account-control";
import { getNavDestinationForPathname } from "@/lib/navigation/selectors";
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

/**
 * Pull-to-refresh: only activates when .marketing-shell is at scrollTop 0
 * and the user drags downward. Normal scrolling NEVER shows the refresh icon.
 */
function usePullToRefresh(onRefresh: () => void) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const PULL_THRESHOLD = 56;

  useEffect(() => {
    const shell = document.querySelector<HTMLElement>(".marketing-shell");
    if (!shell) return;

    
    const onTouchStart = (e: TouchEvent) => {
      if (isRefreshing) return;
      // Only start pull if at very top
      if (shell.scrollTop > 0) return;
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing) return;
      // Must still be at top — if user scrolled up, cancel
      if (shell.scrollTop > 0) {
        isPulling.current = false;
        setPullDistance(0);
        return;
      }
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0) {
        // Downward pull at top — prevent native overscroll
        if (!e.defaultPrevented) e.preventDefault();
        // Apply resistance (pull feels increasingly hard)
        const damped = Math.min(delta * 0.5, 90);
        setPullDistance(damped);
      }
    };

    const onTouchEnd = () => {
      if (!isPulling.current) return;
      isPulling.current = false;
      if (pullDistance >= PULL_THRESHOLD) {
        setIsRefreshing(true);
        onRefresh();
        // Brief spin then reset
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 600);
      } else {
        setPullDistance(0);
      }
    };

    // touchmove must be non-passive to allow preventDefault
    shell.addEventListener("touchstart", onTouchStart, { passive: true });
    shell.addEventListener("touchmove", onTouchMove, { passive: false });
    shell.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
            shell.removeEventListener("touchstart", onTouchStart);
      shell.removeEventListener("touchmove", onTouchMove);
      shell.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh, pullDistance, isRefreshing]);

  return { pullDistance, isRefreshing, PULL_THRESHOLD };
}

export function MobileTopBar() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const isHome = pathname === "/";
  const routeLabel = getRouteLabel(pathname);
  const viewport = useChromeViewport();

  const handleRefresh = useCallback(() => router.refresh(), [router]);
  const { pullDistance, isRefreshing, PULL_THRESHOLD } = usePullToRefresh(handleRefresh);

  if (viewport === "desktop") {
    return null;
  }

  // Pull indicator visibility: 0-15px invisible, 15-55px fade in, >=55px armed
  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const showPull = pullDistance > 12 && !isRefreshing;
  const isArmed = pullDistance >= PULL_THRESHOLD;

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

        <div className="mobile-top-bar__spacer" aria-hidden="true" />

        <div className="mobile-top-bar__actions">
          <span
            className={cn(
              "mobile-top-bar__pull-indicator",
              showPull && "is-visible",
              isArmed && "is-armed",
              isRefreshing && "is-spinning",
            )}
            style={{
              opacity: showPull ? pullProgress : isRefreshing ? 1 : 0,
              transform: `scale(${0.85 + 0.15 * pullProgress}) rotate(${pullDistance * 2}deg)`,
            }}
            aria-hidden="true"
          >
            <RefreshCw size={16} />
          </span>
          <HeaderAccountControl
            linkClassName="mobile-top-bar__account"
            menuClassName="mobile-top-bar__account-menu"
            panelClassName="mobile-top-bar__account-panel"
            showLabel={false}
          />
        </div>
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
