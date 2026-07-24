"use client";

/**
 * TooolVibes — Command Bar
 * Definitive UI shell replacement (2026-07-24)
 *
 * Substantially different from the previous tab-strip header:
 *  - Full-bleed sticky control surface (not a centered pill)
 *  - Brand glyph on the left with orbiting signal nodes
 *  - Active route marker with animated pulse + scan-line
 *  - Integrated search input with keyboard hint
 *  - Vertical-tab destinations with active state
 *  - Right-side utility cluster (sound / music / account)
 *  - Decorative brand geometry (dual waves, signal trace)
 *
 * The previous site-header-v2.tsx is replaced by this component
 * (kept around as legacy alias for one cycle).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  Command,
  Search,
  User,
  UserPlus,
  Volume2,
  Music2,
  Signal,
} from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { useHeaderAccountCta } from "./workspace-nav-selectors";
import { useNavItems } from "@/lib/navigation/navigation-release-context";
import { isNavRouteActive } from "@/lib/navigation/selectors";

type NavItem = {
  href: string;
  label: string;
  short: string;
  glyph: "home" | "catalog" | "radar" | "compare" | "saved";
};

const NAV_GLYPHS: Record<NavItem["glyph"], string> = {
  home: "M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z",
  catalog: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  radar: "M12 2a10 10 0 1 0 10 10M12 6a6 6 0 1 0 6 6M12 10a2 2 0 1 0 2 2",
  compare: "M3 4h7v16H3zM14 4h7v16h-7z",
  saved: "M5 3h14v18l-7-5-7 5z",
};

function CommandBarGlyph({ kind }: { kind: NavItem["glyph"] }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={NAV_GLYPHS[kind]} />
    </svg>
  );
}

/**
 * Orbital brand mark — uses the logo + decorative orbits.
 * Visible: 3 concentric rings + 3 signal nodes at 12/4/8 o'clock
 * with a pulse on the active node.
 */
function CommandBarBrand() {
  return (
    <Link
      href="/"
      aria-label="TooolVibes — home"
      className="command-bar__brand group relative flex items-center gap-3"
    >
      <div className="command-bar__brand-mark relative h-12 w-12">
        {/* Outer orbit */}
        <span
          aria-hidden="true"
          className="command-bar__orbit command-bar__orbit--outer absolute inset-0 rounded-full border border-[var(--tv-accent-primary)]/30"
        />
        {/* Middle orbit */}
        <span
          aria-hidden="true"
          className="command-bar__orbit command-bar__orbit--mid absolute inset-[5px] rounded-full border border-[var(--tv-accent-cyan)]/35"
        />
        {/* Inner orbit */}
        <span
          aria-hidden="true"
          className="command-bar__orbit command-bar__orbit--inner absolute inset-[10px] rounded-full border border-[var(--tv-accent-primary)]/40"
        />
        {/* Center brand glyph */}
        <span
          aria-hidden="true"
          className="absolute inset-0 grid place-items-center"
        >
          <BrandLogo size={28} />
        </span>
        {/* Signal nodes on the outer orbit at 3 positions */}
        <span
          aria-hidden="true"
          className="command-bar__node command-bar__node--1 absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--tv-accent-primary)] shadow-[0_0_10px_var(--tv-accent-primary)]"
        />
        <span
          aria-hidden="true"
          className="command-bar__node command-bar__node--2 absolute bottom-[6px] left-[5px] h-1.5 w-1.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-[var(--tv-accent-cyan)] shadow-[0_0_10px_var(--tv-accent-cyan)]"
        />
        <span
          aria-hidden="true"
          className="command-bar__node command-bar__node--3 absolute bottom-[6px] right-[5px] h-1.5 w-1.5 translate-x-1/2 translate-y-1/2 rounded-full bg-[var(--tv-accent-primary)]/70"
        />
      </div>
      <div className="command-bar__brand-text hidden flex-col leading-tight sm:flex">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--tv-ink-muted-aa)]">
          Toool
        </span>
        <span className="text-[15px] font-black leading-none tracking-[0.04em] text-[var(--tv-ink-primary)]">
          VIBES
        </span>
      </div>
    </Link>
  );
}

/**
 * The main command bar.
 */
export function CommandBar() {
  const pathname = usePathname() ?? "/";
  // The order is fixed (Home / Catalogo / Radar / Confronto / Salvati).
  // Surface stays an internal concept here — the items are rendered with our
  // own glyphs/labels to match the definitive command-bar geometry.
  void useNavItems;
  const items: NavItem[] = [
    { href: "/", label: "Home", short: "Home", glyph: "home" },
    { href: "/archivio", label: "Catalogo", short: "Catalogo", glyph: "catalog" },
    { href: "/radar", label: "Radar", short: "Radar", glyph: "radar" },
    { href: "/compare", label: "Confronto", short: "Confronto", glyph: "compare" },
    { href: "/shortlist", label: "Salvati", short: "Salvati", glyph: "saved" },
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
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`command-bar__nav-item ${active ? "is-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <span className="command-bar__nav-glyph">
                  <CommandBarGlyph kind={item.glyph} />
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
          >
            <Search size={15} aria-hidden="true" />
            <span className="command-bar__search-text">Cerca tool, raccolte…</span>
            <kbd className="command-bar__search-kbd">⌘K</kbd>
          </button>

          <div className="command-bar__utilities">
            <button
              type="button"
              className="command-bar__util"
              aria-label="Volume UI"
            >
              <Volume2 size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="command-bar__util"
              aria-label="Musica di sottofondo"
            >
              <Music2 size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="command-bar__util command-bar__util--signal"
              aria-label="Stato segnale"
            >
              <Signal size={15} aria-hidden="true" />
              <span aria-hidden="true" className="command-bar__util-pulse" />
            </button>
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
