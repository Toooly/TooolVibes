"use client";

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

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  Bookmark,
  Columns2,
  Grid2X2,
  Home,
  Radar,
  Search,
  User,
  UserPlus,
} from "lucide-react";
import { MusicToggleButton } from "@/components/app/music-toggle-button";
import { SoundToggleButton } from "@/components/app/sound-toggle-button";
import { BrandLogo } from "./brand-logo";
import { useHeaderAccountCta } from "./workspace-nav-selectors";
import { useNavItems } from "@/lib/navigation/navigation-release-context";
import { isNavRouteActive } from "@/lib/navigation/selectors";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

type NavItem = {
  href: string;
  label: string;
  short: string;
  glyph: typeof Home;
};

function CommandBarBrand() {
  return (
    <Link
      href="/"
      aria-label="TooolVibes — home"
      className="command-bar__brand group relative flex items-center gap-3"
    >
      <div className="command-bar__brand-mark">
        <BrandLogo size={40} fallback="png" priority />
      </div>
      <div className="command-bar__brand-text">
        <span className="command-bar__brand-word">TOOOLVIBES</span>
      </div>
    </Link>
  );
}

/**
 * The main command bar.
 */
export function CommandBar() {
  const pathname = usePathname() ?? "/";
  const setCommandOpen = useToolWorkspaceStore((state) => state.setCommandOpen);
  // The order is fixed (Home / Catalogo / Radar / Confronto / Salvati).
  // Surface stays an internal concept here — the items are rendered with our
  // own glyphs/labels to match the definitive command-bar geometry.
  void useNavItems;
  const items: NavItem[] = [
    { href: "/", label: "Home", short: "Home", glyph: Home },
    { href: "/archivio", label: "Catalogo", short: "Catalogo", glyph: Grid2X2 },
    { href: "/radar", label: "Radar", short: "Radar", glyph: Radar },
    { href: "/compare", label: "Confronto", short: "Confronto", glyph: Columns2 },
    { href: "/shortlist", label: "Salvati", short: "Salvati", glyph: Bookmark },
  ];
  const accountCta = useHeaderAccountCta();
  const accountIcon =
    accountCta.state === "guest" || accountCta.state === "legacy"
      ? UserPlus
      : User;

  return (
    <header
      role="banner"
      className="command-bar"
    >
      {/* Top scan line — a horizontal signal trace that pulses on mount */}
      <div aria-hidden="true" className="command-bar__scanline" />

      <div className="command-bar__inner">
        {/* Left: brand mark */}
        <CommandBarBrand />

        {/* Center: destinations as vertical-tab style */}
        <nav
          aria-label="Destinazioni principali"
          className="command-bar__nav"
        >
          {items.map((item) => {
            const active = isNavRouteActive(pathname, item.href);
            const Glyph = item.glyph;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`command-bar__nav-item ${active ? "is-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <span className="command-bar__nav-glyph">
                  <Glyph size={17} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="command-bar__nav-label">{item.label}</span>
                {active ? (
                  <motion.span
                    layoutId="command-bar-marker"
                    aria-hidden="true"
                    className="command-bar__nav-marker"
                    transition={{ type: "spring", stiffness: 360, damping: 28 }}
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Right: search + utilities + account CTA */}
        <div className="command-bar__right">
          <button
            type="button"
            className="command-bar__search"
            aria-label="Apri ricerca"
            onClick={() => setCommandOpen(true)}
          >
            <Search size={15} aria-hidden="true" />
            <span className="command-bar__search-text">Cerca tool, raccolte…</span>
            <kbd className="command-bar__search-kbd">⌘K</kbd>
          </button>

          <div className="command-bar__utilities">
            <SoundToggleButton className="command-bar__util" />
            <MusicToggleButton className="command-bar__util" />
          </div>

          <Link
            href={accountCta.href}
            className="command-bar__account"
            aria-label={accountCta.label}
          >
            {accountIcon === UserPlus ? (
              <UserPlus size={14} aria-hidden="true" />
            ) : (
              <User size={14} aria-hidden="true" />
            )}
            <span className="command-bar__account-label">{accountCta.label}</span>
          </Link>
        </div>
      </div>

      {/* Bottom border with subtle scan trace */}
      <div aria-hidden="true" className="command-bar__bottom-border" />
    </header>
  );
}

export default CommandBar;
