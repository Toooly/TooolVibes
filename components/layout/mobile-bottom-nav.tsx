"use client";

/**
 * TooolVibes — Mobile Bottom Nav
 * Dynamic chrome: expanded labels → compact icons-only on scroll-down,
 * restored on scroll-up, pause, near page end, or focus interactions.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { layoutMarkerTransition, microPopTransition } from "@/lib/motion/transitions";

import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";
import { getShellScroller, readLiveScrollTop, readMaxScroll } from "@/lib/shell/scroll-port";
import {
  CHROME_DESKTOP_MEDIA_QUERY,
  useChromeViewport,
} from "@/components/layout/chrome-viewport";
import { isAuthenticatedNavActive, navFamilyForHref } from "@/lib/navigation/account-primary-nav";
import {
  useAuthenticatedNavItems,
  useLocationSearch,
} from "@/components/layout/use-authenticated-nav-items";
import { useMobileUIStore } from "@/lib/stores/mobile-ui-store";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import {
  isHeaderAccountAwareEnabled,
  useWorkspaceNavCounts,
} from "./workspace-nav-selectors";

type NavChromeState = "expanded" | "compact";

const SCROLL_DELTA_THRESHOLD = 16;
const COMPACT_AFTER = 72;
const EXPAND_AFTER = 96;
const BOTTOM_REVEAL_PX = 120;
const TOP_FORCE_EXPAND_PX = 24;

// Haptic feedback via shared utility (native vibrate + iOS audio fallback)

export function MobileBottomNav() {
  const preferReducedMotion = useReducedMotion();
  const viewport = useChromeViewport();
  const pathname = usePathname();
  const search = useLocationSearch();
  const navItems = useAuthenticatedNavItems("bottom-nav");
  const [mounted, setMounted] = useState(false);
  const [chromeState, setChromeState] = useState<NavChromeState>("expanded");
  const isOverlayOpen = useMobileUIStore((s) => s.isOverlayOpen);
  const isCommandOpen = useToolWorkspaceStore((s) => s.isCommandOpen);
  const navCounts = useWorkspaceNavCounts();
  const accountAware = isHeaderAccountAwareEnabled();
  const compareCount = navCounts.compare;
  const savedCount = accountAware ? navCounts.saved : 0;

  const lastScrollY = useRef(0);
  const downDistance = useRef(0);
  const upDistance = useRef(0);
  const lockedByInteraction = useRef(false);
  const rafId = useRef<number | null>(null);
  const pauseTimer = useRef<number | null>(null);
  const innerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setChromeState("expanded");
    downDistance.current = 0;
    lastScrollY.current = typeof window !== "undefined" ? readLiveScrollTop() : 0;
  }, [pathname]);

  const publishNavTotal = useCallback(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const isDesktop =
      typeof window.matchMedia === "function" &&
      window.matchMedia(CHROME_DESKTOP_MEDIA_QUERY).matches;
    const navHidden = (pathname ?? "").startsWith("/admin");
    if (isDesktop || navHidden) {
      root.style.setProperty("--tv-bottom-nav-total", "0px");
      root.dataset.tvBottomNav = "off";
      return;
    }
    // Always reserve expanded chrome height so content never jumps when
    // the nav compacts or slides away.
    const expandedHeight = 52;
    const padding = 6;
    const safe = Number.parseFloat(
      getComputedStyle(root).getPropertyValue("env(safe-area-inset-bottom)") || "0",
    );
    // safe-area is already applied in CSS padding; reserve nav + tray slack.
    const total = expandedHeight + padding;
    root.style.setProperty("--tv-bottom-nav-total", `${total}px`);
    root.dataset.tvBottomNav = chromeState;
    void safe;
  }, [pathname, chromeState]);

  useEffect(() => {
    if (!mounted) return;
    publishNavTotal();
    window.addEventListener("resize", publishNavTotal);
    return () => window.removeEventListener("resize", publishNavTotal);
  }, [mounted, publishNavTotal]);

  useEffect(() => {
    if (!mounted) return;
    if (viewport === "desktop") return;
    if (typeof window === "undefined") return;

    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      return Boolean(
        target.closest(
          "input, textarea, select, [contenteditable='true'], [role='textbox'], [data-tv-keep-nav]",
        ),
      );
    };

    const clearPauseTimer = () => {
      if (pauseTimer.current !== null) {
        window.clearTimeout(pauseTimer.current);
        pauseTimer.current = null;
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      if (isEditableTarget(event.target) || isOverlayOpen || isCommandOpen) {
        lockedByInteraction.current = true;
        setChromeState("expanded");
      }
    };
    const onFocusOut = () => {
      window.setTimeout(() => {
        const active = document.activeElement;
        if (!isEditableTarget(active) && !isOverlayOpen && !isCommandOpen) {
          lockedByInteraction.current = false;
        }
      }, 0);
    };

    const onScroll = () => {
      if (rafId.current !== null) return;
      rafId.current = window.requestAnimationFrame(() => {
        rafId.current = null;
        if (lockedByInteraction.current || isOverlayOpen || isCommandOpen) {
          setChromeState("expanded");
          lastScrollY.current = readLiveScrollTop();
          return;
        }

        const y = readLiveScrollTop();
        const prev = lastScrollY.current;
        const delta = y - prev;
        const maxScroll = readMaxScroll(getShellScroller());
        const nearBottom = maxScroll > 0 && y >= maxScroll - BOTTOM_REVEAL_PX;

        if (y <= TOP_FORCE_EXPAND_PX || nearBottom) {
          downDistance.current = 0;
          upDistance.current = 0;
          clearPauseTimer();
          setChromeState("expanded");
          lastScrollY.current = y;
          return;
        }

        if (Math.abs(delta) < SCROLL_DELTA_THRESHOLD) {
          lastScrollY.current = y;
          return;
        }

        if (delta > 0) {
          downDistance.current += delta;
          upDistance.current = 0;
          if (downDistance.current >= COMPACT_AFTER) {
            setChromeState("compact");
          }
        } else {
          upDistance.current += Math.abs(delta);
          downDistance.current = 0;
          if (upDistance.current >= EXPAND_AFTER) {
            clearPauseTimer();
            setChromeState("expanded");
          }
        }

        lastScrollY.current = y;
      });
    };

    const shell = document.querySelector(".marketing-shell");
    const onShellScroll = () => onScroll();
    lastScrollY.current = readLiveScrollTop();
    document.addEventListener("scroll", onShellScroll, { capture: true, passive: true });
    shell?.addEventListener("scroll", onShellScroll, { passive: true });
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("scroll", onShellScroll, { capture: true });
      shell?.removeEventListener("scroll", onShellScroll);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      if (rafId.current !== null) {
        window.cancelAnimationFrame(rafId.current);
      }
      if (pauseTimer.current !== null) {
        window.clearTimeout(pauseTimer.current);
      }
    };
  }, [mounted, viewport, isOverlayOpen, isCommandOpen]);

  useEffect(() => {
    if (isOverlayOpen || isCommandOpen) {
      lockedByInteraction.current = true;
      setChromeState("expanded");
    } else {
      lockedByInteraction.current = false;
    }
  }, [isOverlayOpen, isCommandOpen]);

  if (!mounted || viewport === "desktop" || (pathname ?? "").startsWith("/admin")) {
    return null;
  }

  const suppressed = isOverlayOpen || isCommandOpen;

  const nav = (
    <div
      className={cn(
        "mobile-bottom-shell",
        `mobile-bottom-shell--${chromeState}`,
        preferReducedMotion && "mobile-bottom-shell--reduced",
      )}
      data-state={chromeState}
    >
      <nav
        ref={(node) => {
          innerRef.current = node;
        }}
        aria-label="Navigazione mobile principale"
        className={cn(
          "mobile-bottom-shell__inner mobile-bottom-motion",
          suppressed && "is-suppressed pointer-events-none opacity-0",
        )}
      >
        <div className="mobile-bottom-shell__grid">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isAuthenticatedNavActive(pathname ?? "", search, item.href);
            const badgeCount =
              item.id === "compare"
                ? compareCount
                : item.id === "shortlist"
                  ? savedCount
                  : 0;
            const badgeAria =
              item.id === "compare"
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
                aria-label={
                  badgeCount > 0 && badgeAria
                    ? `${item.label}, ${badgeAria}`
                    : undefined
                }
                className={cn("mobile-bottom-item", isActive && "is-active")}
                data-family={navFamilyForHref(item.href)}
                onClick={() => haptic("light")}
              >
                <span className="mobile-bottom-item__icon-wrap">
                  {isActive ? (
                    <motion.span
                      layoutId="mobile-bottom-marker"
                      className="mobile-bottom-item__marker"
                      transition={layoutMarkerTransition({ preferReducedMotion })}
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
                      initial={preferReducedMotion ? false : { scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={microPopTransition({ preferReducedMotion })}
                      className="mobile-bottom-item__badge"
                      aria-label={badgeAria}
                    >
                      {badgeCount}
                    </motion.span>
                  ) : null}
                  {item.id === "radar" ? (
                    <span aria-hidden="true" className="mobile-bottom-item__node" />
                  ) : null}
                </span>
                <span className="mobile-bottom-item__label">{item.label}</span>
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
