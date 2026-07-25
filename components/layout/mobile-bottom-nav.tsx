"use client";

/**
 * TooolVibes — Mobile Bottom Nav (Definitive)
 * 2026-07-24
 *
 * Substantially different from the previous site-mobile-footer-nav:
 *  - Elevated glass shell with brand-gradient border + top scan line
 *  - Active route marker uses motion layoutId for smooth transitions
 *  - Animated signal node on Radar (always pulsing)
 *  - Badge pop-in animation for compare / saved counts
 *  - Per-item glyph + uppercase mono label
 *  - Hidden on desktop (xl = 1280px)
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Home, LayoutGrid, Radar, Columns3, Bookmark } from "lucide-react";

import { cn } from "@/lib/utils";
import { isNavRouteActive } from "@/lib/navigation/selectors";
import { useMobileUIStore } from "@/lib/stores/mobile-ui-store";
import {
  isHeaderAccountAwareEnabled,
  useWorkspaceNavCounts,
} from "./workspace-nav-selectors";

type NavSpec = {
  id: string;
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string; "aria-hidden"?: React.AriaAttributes["aria-hidden"] }>;
  /** Show animated signal node (always pulsing) on this item */
  hasNode?: boolean;
  /** Show count badge based on this counter */
  badge?: "compare" | "saved";
};

const NAV_SPECS: readonly NavSpec[] = [
  { id: "home", href: "/", label: "Home", Icon: Home },
  { id: "catalog", href: "/archivio", label: "Catalogo", Icon: LayoutGrid },
  { id: "radar", href: "/radar", label: "Radar", Icon: Radar, hasNode: true },
  { id: "compare", href: "/compare", label: "Confronto", Icon: Columns3, badge: "compare" },
  { id: "saved", href: "/shortlist", label: "Salvati", Icon: Bookmark, badge: "saved" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const isOverlayOpen = useMobileUIStore((s) => s.isOverlayOpen);
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
      const isDesktop = window.matchMedia("(min-width: 1280px)").matches;
      if (isDesktop) {
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

  if (!mounted || pathname.startsWith("/admin")) {
    return null;
  }

  const nav = (
    <div
      className={cn(
        "mobile-bottom-shell",
        isOverlayOpen && "pointer-events-none opacity-0",
      )}
      aria-hidden={isOverlayOpen || undefined}
    >
      <nav
        aria-label="Navigazione mobile principale"
        className="mobile-bottom-shell__inner"
      >
        {NAV_SPECS.map((item) => {
          const isActive = isNavRouteActive(pathname, item.href);
          const badgeCount = item.badge === "compare"
            ? compareCount
            : item.badge === "saved"
              ? savedCount
              : 0;
          const badgeAria = item.badge === "compare"
            ? `${compareCount} tool in confronto`
            : item.badge === "saved"
              ? `${savedCount} tool salvati`
              : undefined;
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              aria-label={badgeCount > 0 && badgeAria ? `${item.label}, ${badgeAria}` : undefined}
              className={cn("mobile-bottom-item", isActive && "is-active")}
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
                <item.Icon
                  size={18}
                  className="mobile-bottom-item__glyph"
                  aria-hidden="true"
                />
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
                {item.hasNode ? (
                  <span
                    aria-hidden="true"
                    className="mobile-bottom-item__node"
                  />
                ) : null}
              </span>
              <span className="mobile-bottom-item__label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return createPortal(nav, document.body);
}

export default MobileBottomNav;
