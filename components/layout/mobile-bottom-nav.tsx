"use client";

/**
 * TooolVibes — Mobile Bottom Nav (Definitive)
 * 2026-07-24
 *
 * Canonical mobile navigation, isolated from the retired footer-nav aliases:
 *  - Solid opaque shell with clear active state
 *  - Active route marker uses motion layoutId for smooth transitions
 *  - Static signal node on Radar
 *  - Badge pop-in animation for compare / saved counts
 *  - Per-item glyph + uppercase mono label
 *  - Hidden on desktop (xl = 1280px)
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import { isNavRouteActive } from "@/lib/navigation/selectors";
import { useNavItems } from "@/lib/navigation/navigation-release-context";
import { useMobileUIStore } from "@/lib/stores/mobile-ui-store";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import {
  isHeaderAccountAwareEnabled,
  useWorkspaceNavCounts,
} from "./workspace-nav-selectors";

export function MobileBottomNav() {
  const pathname = usePathname();
  const navItems = useNavItems("bottom-nav");
  const [mounted, setMounted] = useState(false);
  const isOverlayOpen = useMobileUIStore((s) => s.isOverlayOpen);
  const isCommandOpen = useToolWorkspaceStore((s) => s.isCommandOpen);
  const navCounts = useWorkspaceNavCounts();
  const accountAware = isHeaderAccountAwareEnabled();
  const compareCount = navCounts.compare;
  const savedCount = accountAware ? navCounts.saved : 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  /* Fixed-surface contract (binding).
     MobileBottomNav publishes --tv-bottom-nav-total on <html> while it is
     mounted. Routes consume the value for their padding-bottom.
     Hidden on desktop (≥1280px) where the value collapses to 0. */
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const setValue = () => {
      const isDesktop =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(min-width: 1280px)").matches;
      const navHidden =
        (pathname ?? '').startsWith("/admin") || (pathname ?? '').startsWith("/account");
      if (isDesktop || navHidden) {
        root.style.setProperty("--tv-bottom-nav-total", "0px");
      } else {
        // computed = nav height + safe-area + tray bottom-padding (6px)
        const navEl = document.querySelector(".mobile-bottom-shell__inner");
        const measured = navEl instanceof HTMLElement ? navEl.getBoundingClientRect().height : 0;
        const safeArea = getComputedStyle(root).getPropertyValue("--tv-safe-area-bottom") || "0px";
        const total = measured + 6;
        if (total > 0) {
          root.style.setProperty("--tv-bottom-nav-total", `${total}px`);
        }
        // touch-safe-area is unused for now but available for future
        void safeArea;
      }
    };
    setValue();
    window.addEventListener("resize", setValue);
    return () => {
      window.removeEventListener("resize", setValue);
    };
  }, [mounted, pathname]);

  if (
    !mounted ||
    (pathname ?? '').startsWith("/admin") ||
    (pathname ?? '').startsWith("/account")
  ) {
    return null;
  }

  const nav = (
    <div className="mobile-bottom-shell">
      <nav
        aria-label="Navigazione mobile principale"
        className={cn(
          "mobile-bottom-shell__inner mobile-bottom-motion",
          (isOverlayOpen || isCommandOpen) &&
            "is-suppressed pointer-events-none opacity-0",
        )}
      >
        <div className="mobile-bottom-shell__grid">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isNavRouteActive(pathname, item.href);
          const badgeCount = item.id === "compare"
            ? compareCount
            : item.id === "shortlist"
              ? savedCount
              : 0;
          const badgeAria = item.id === "compare"
            ? `${compareCount} tool in confronto`
            : item.id === "shortlist"
              ? `${savedCount} tool salvati`
              : undefined;
          return (
            <Link
              key={item.id}
              href={item.href}
              prefetch={false}
              aria-current={isActive ? "page" : undefined}
              aria-label={badgeCount > 0 && badgeAria ? `${item.label}, ${badgeAria}` : undefined}
              className={cn(
                "mobile-bottom-item",
                isActive && "is-active",
              )}
            >
              <span className="mobile-bottom-item__icon-wrap">
                {isActive ? (
                  <motion.span
                    layoutId="mobile-bottom-marker"
                    className="mobile-bottom-item__marker"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    aria-hidden="true"
                  />
                ) : null}
                {Icon ? (
                  <Icon
                    size={18}
                    className="mobile-bottom-item__glyph"
                    aria-hidden="true"
                  />
                ) : null}
                {badgeCount > 0 ? (
                  <motion.span
                    key={badgeCount}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 22 }}
                    className="mobile-bottom-item__badge"
                    aria-label={badgeAria}
                  >
                    {badgeCount}
                  </motion.span>
                ) : null}
                {item.id === "radar" ? (
                  <span
                    aria-hidden="true"
                    className="mobile-bottom-item__node"
                  />
                ) : null}
              </span>
              <span className="mobile-bottom-item__label">
                {item.label}
              </span>
            </Link>
          );
        })}
        </div>
      </nav>
    </div>
  );

  return createPortal(nav, document.body);
}

export default MobileBottomNav;
