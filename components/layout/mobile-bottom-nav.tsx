"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { useNavItems } from "@/lib/navigation/navigation-release-context";
import { isNavRouteActive } from "@/lib/navigation/selectors";
import { useMobileUIStore } from "@/lib/stores/mobile-ui-store";
import {
  isHeaderAccountAwareEnabled,
  useWorkspaceNavCounts,
} from "./workspace-nav-selectors";

export function MobileBottomNav() {
  const pathname = usePathname();
  const mobileItems = useNavItems("bottom-nav");
  const [mounted, setMounted] = useState(false);
  const isOverlayOpen = useMobileUIStore((s) => s.isOverlayOpen);
  // BATCH 30 (IA-502): conteggi dal selector workspace canonico; con la flag
  // account-aware OFF resta l'adapter legacy (solo badge Confronto).
  const navCounts = useWorkspaceNavCounts();
  const accountAware = isHeaderAccountAwareEnabled();
  const compareCount = navCounts.compare;
  const savedCount = accountAware ? navCounts.saved : 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || pathname.startsWith("/admin")) {
    return null;
  }

  const nav = (
    <nav
      aria-label="Navigazione mobile principale"
      inert={isOverlayOpen || undefined}
      className={cn(
        "mobile-bottom-motion site-mobile-footer-nav fixed z-[var(--tv-z-nav)] mx-auto w-auto max-w-[25rem]",
        "md:hidden",
        "rounded-[1.5rem] border border-white/25 bg-white/85 backdrop-blur-lg",
        "shadow-[0_8px_24px_rgba(47,33,126,0.12)]",
        "transition-opacity duration-300",
        isOverlayOpen && "opacity-0 pointer-events-none"
      )}
    >
      <div className="grid w-full grid-cols-5 gap-1.5 p-1.5">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const isCompareItem = item.id === "compare";
          const isShortlistItem = item.id === "shortlist";
          const active = isNavRouteActive(pathname, item.href);
          const compareHasItems = isCompareItem && compareCount > 0;
          const badgeCount = isCompareItem
            ? compareCount
            : isShortlistItem
              ? savedCount
              : 0;
          const badgeAriaLabel = isCompareItem
            ? `${compareCount} tool in confronto`
            : `${savedCount} tool salvati`;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={badgeCount > 0 ? `${item.label}, ${badgeAriaLabel}` : undefined}
              aria-current={active ? "page" : undefined}
              className={cn(
                "mobile-bottom-link flex h-[3.55rem] min-w-0 flex-col items-center justify-center gap-1 rounded-[1.2rem] px-1 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200/80",
                active ? "is-active text-[#ffffff]" : "text-[#16112d] hover:bg-white/72 hover:text-[#6a3cff]",
                active && "[&_.mobile-bottom-link__icon-wrap>svg]:scale-110",
                compareHasItems && "mobile-bottom-link--compare-ready"
              )}
            >
              <span className="mobile-bottom-link__icon-wrap">
                {Icon ? <Icon className="size-5 transition-transform" aria-hidden="true" /> : null}
                {badgeCount > 0 ? (
                  <span
                    key={badgeCount}
                    className="mobile-bottom-link__badge animate-compare-ping"
                    aria-label={badgeAriaLabel}
                  >
                    {badgeCount}
                  </span>
                ) : null}
              </span>
              <span className="mobile-bottom-link__label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );

  return createPortal(nav, document.body);
}
