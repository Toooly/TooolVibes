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
import { Search, User } from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { useHeaderAccountCta } from "./workspace-nav-selectors";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

function getRouteLabel(pathname: string): string {
  if (pathname === "/" || pathname === "") return "Home";
  if (pathname.startsWith("/archivio")) return "Catalogo";
  if (pathname.startsWith("/radar")) return "Radar";
  if (pathname.startsWith("/compare")) return "Confronto";
  if (pathname.startsWith("/shortlist")) return "Salvati";
  if (pathname.startsWith("/toools")) return "Tool";
  if (pathname.startsWith("/collections")) return "Raccolte";
  if (pathname.startsWith("/metodo")) return "Metodo";
  if (pathname.startsWith("/chi-siamo")) return "Chi siamo";
  if (pathname.startsWith("/account")) return "Account";
  if (pathname.startsWith("/community")) return "Community";
  if (pathname.startsWith("/affiliati")) return "Affiliati";
  return "TooolVibes";
}

export function MobileTopBar() {
  const pathname = usePathname() ?? "/";
  const routeLabel = getRouteLabel(pathname);
  const accountCta = useHeaderAccountCta();
  const setCommandOpen = useToolWorkspaceStore((state) => state.setCommandOpen);

  return (
    <header
      role="banner"
      className="mobile-top-bar"
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
          className="mobile-top-bar__search"
          aria-label="Apri ricerca"
          onClick={() => setCommandOpen(true)}
        >
          <Search size={16} aria-hidden="true" />
          <span className="mobile-top-bar__search-text">Cerca tool…</span>
        </button>

        <Link
          href={accountCta.href}
          prefetch={false}
          className="mobile-top-bar__account"
          aria-label={accountCta.label}
        >
          <User size={18} aria-hidden="true" />
        </Link>
      </div>

      <div className="mobile-top-bar__route">
        <span aria-hidden="true" className="mobile-top-bar__route-dot" />
        <span className="mobile-top-bar__route-label">{routeLabel}</span>
      </div>
    </header>
  );
}

export default MobileTopBar;
