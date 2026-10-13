"use client";

import { LanguagePicker } from "@/components/i18n/language-picker";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
/**
 * TooolVibes — Command Bar
 * Definitive UI shell replacement (2026-07-24)
 *
 * Substantially different from the previous tab-strip header:
 *  - Full-bleed sticky control surface (not a centered pill)
 *  - Reliable brand asset on the left
 *  - Active route marker
 *  - Integrated search input with keyboard hint
 *  - Vertical-tab destinations with active state
 *  - Right-side utility cluster (sound / music / account)
 *
 * The previous site-header-v2.tsx is replaced by this component
 * (kept around as legacy alias for one cycle).
 */

import Link from "@/components/ui/app-link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { layoutMarkerTransition } from "@/lib/motion/transitions";
import { Search } from "lucide-react";
import { MusicToggleButton } from "@/components/app/music-toggle-button";
import { SoundToggleButton } from "@/components/app/sound-toggle-button";
import { BrandLogo } from "./brand-logo";
import { useChromeViewport } from "./chrome-viewport";
import { HeaderAccountControl } from "./header-account-control";
import { useAuthenticatedNavItems } from "@/components/layout/use-authenticated-nav-items";
import { isAuthenticatedNavActive, navFamilyForHref } from "@/lib/navigation/account-primary-nav";
import { useLocationSearch } from "@/components/layout/use-authenticated-nav-items";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import { useMobileUIStore } from "@/lib/stores/mobile-ui-store";
import { cn } from "@/lib/utils";

function CommandBarBrand() {
  return (
    <LocalizedAttributes><Link
      href="/"
      prefetch={false}
      aria-label="TooolVibes — home"
      className="command-bar__brand group relative flex items-center gap-3"
    >
      <div className="command-bar__brand-mark">
        <BrandLogo size={40} fallback="png" priority />
      </div>
      <div className="command-bar__brand-text">
        <span className="command-bar__brand-word"><LocalizedText>{"TOOOLVIBES"}</LocalizedText></span>
      </div>
    </Link></LocalizedAttributes>
  );
}

/**
 * The main command bar.
 */
export function CommandBar() {
  const pathname = usePathname() ?? "/";
  const search = useLocationSearch();
  const setCommandOpen = useToolWorkspaceStore((state) => state.setCommandOpen);
  const items = useAuthenticatedNavItems("header-v2-desktop");
  const preferReducedMotion = useReducedMotion();
  const isHome = pathname === "/";
  const heroSearchVisible = useMobileUIStore((state) => state.heroSearchVisible);
  const suppressSearch = isHome && heroSearchVisible;
  const viewport = useChromeViewport();

  if (viewport === "mobile") {
    return null;
  }

  return (
    <header
      role="banner"
      className="command-bar"
    >
      <div className="command-bar__inner">
        {/* Left: brand mark */}
        <CommandBarBrand />

        {/* Center: destinations as vertical-tab style */}
        <LocalizedAttributes><nav
          aria-label="Destinazioni principali"
          className="command-bar__nav"
        >
          {items.map((item) => {
            const active = isAuthenticatedNavActive(pathname, search, item.href);
            const Glyph = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={`command-bar__nav-item ${active ? "is-active" : ""}`}
                data-family={navFamilyForHref(item.href)}
                aria-current={active ? "page" : undefined}
              >
                <span className="command-bar__nav-glyph">
                  {Glyph ? <Glyph size={17} strokeWidth={1.8} aria-hidden="true" /> : null}
                </span>
                <span className="command-bar__nav-label"><LocalizedText>{item.label}</LocalizedText></span>
                {active ? (
                  <motion.span
                    layoutId="command-bar-marker"
                    initial={false}
                    aria-hidden="true"
                    className="command-bar__nav-marker"
                    transition={layoutMarkerTransition({ preferReducedMotion })}
                  />
                ) : null}
              </Link>
            );
          })}
        </nav></LocalizedAttributes>

        {/* Right: search + utilities + account CTA */}
        <div className="command-bar__right">
          <LanguagePicker />
          <LocalizedAttributes><button
            type="button"
            className={cn(
              "command-bar__search",
              suppressSearch && "is-hero-suppressed",
            )}
            aria-label="Apri ricerca"
            aria-hidden={suppressSearch || undefined}
            tabIndex={suppressSearch ? -1 : undefined}
            onClick={() => setCommandOpen(true)}
          >
            <Search size={15} aria-hidden="true" />
            <span className="command-bar__search-text"><LocalizedText>{"Cerca tool, raccolte…"}</LocalizedText></span>
            <kbd className="command-bar__search-kbd"><LocalizedText>{"⌘K"}</LocalizedText></kbd>
          </button></LocalizedAttributes>

          <div className="command-bar__utilities">
            <SoundToggleButton className="command-bar__util" />
            <MusicToggleButton className="command-bar__util" />
          </div>

          <HeaderAccountControl
            linkClassName="command-bar__account"
            menuClassName="command-bar__account-menu"
            panelClassName="command-bar__account-panel"
          />
        </div>
      </div>
    </header>
  );
}

export default CommandBar;
