"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { BrandLogo } from "./brand-logo";
import { MusicToggleButton } from "../app/music-toggle-button";
import { SoundToggleButton } from "../app/sound-toggle-button";
import { DirectoryHeaderSearch } from "../directory/directory-header-search";
import { GameProfileBar } from "../gamification/game-profile-bar";
import { CircuitPill, PILL_CONFIGS } from "./navbar-circuit-markers";
import { useNavItems } from "@/lib/navigation/navigation-release-context";
import { isNavRouteActive } from "@/lib/navigation/selectors";
import { useMobileUIStore } from "@/lib/stores/mobile-ui-store";
import { useGamificationReleaseSummary } from "@/lib/gamification/release-context";
import {
  X,
  Search,
  Sparkles,
  ChevronRight,
  User,
  UserPlus,
} from "lucide-react";
import { useHeaderAccountCta } from "./workspace-nav-selectors";

const DEFAULT_MOBILE_LINK_TONE = ["#6a3cff", "#39d2f6", "#B388FF"] as const;

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`site-header-v2__nav-link group${isActive ? " is-active" : ""}`}
      data-sonic-action="nav"
      aria-current={isActive ? "page" : undefined}
    >
      <span className="site-header-v2__nav-orbit" aria-hidden="true" />
      <span className="site-header-v2__nav-content">
        {Icon ? (
          <Icon
            size={16}
            className={`site-header-v2__nav-icon transition-colors duration-200 ${
              isActive ? "text-[#7C4DFF]" : "text-[#B388FF]"
            }`}
          />
        ) : null}
        <span
          className={`site-header-v2__nav-label text-sm font-medium transition-colors duration-200 ${
            isActive
              ? "text-[#F0EFFF]"
              : "text-[#B388FF]"
          }`}
        >
          {label}
        </span>
        {isActive && <span className="site-header-v2__active-dot" aria-hidden="true" />}
      </span>
    </Link>
  );
}

export function SiteHeaderV2() {
  const pathname = usePathname();
  const desktopNavLinks = useNavItems("header-v2-desktop");
  const mobileNavLinks = useNavItems("header-v2-mobile");
  const { hasRewardedSurface } = useGamificationReleaseSummary();
  // BATCH 30 (IA-502): unica CTA account risolta dal selector canonico.
  const accountCta = useHeaderAccountCta();
  const AccountCtaIcon =
    accountCta.state === "guest" || accountCta.state === "legacy"
      ? UserPlus
      : User;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const spatialRoute = pathname === "/" || pathname?.startsWith("/archivio");
  const brandRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const activeSearchTriggerRef = useRef<HTMLButtonElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const setOverlayOpen = useMobileUIStore((s) => s.setOverlayOpen);
  useEffect(() => {
    setOverlayOpen(menuOpen || searchOpen);
  }, [menuOpen, searchOpen, setOverlayOpen]);

  const closeSearch = useCallback((restoreFocus = true) => {
    setSearchOpen(false);

    if (restoreFocus) {
      window.requestAnimationFrame(() => activeSearchTriggerRef.current?.focus());
    }
  }, []);

  const closeMenu = useCallback((restoreFocus = true) => {
    setMenuOpen(false);

    if (restoreFocus) {
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    }
  }, []);

  const toggleMobileMenu = () => {
    setSearchOpen(false);
    setMenuOpen((open) => !open);
  };

  useEffect(() => {
    if (!menuOpen && !searchOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (searchOpen) {
        closeSearch();
      }

      if (menuOpen) {
        closeMenu();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeMenu, closeSearch, menuOpen, searchOpen]);

  return (
    <>
      <header
        data-overlay-open={menuOpen || searchOpen ? "true" : undefined}
        className={`site-header-v2 fixed left-0 right-0 top-0 transition-all duration-500${
          scrolled || spatialRoute ? " is-elevated" : ""
        }`}
        style={{ transform: "translateZ(0)", willChange: "transform" }}
      >
        <div
          className={`site-header-v2__shell mx-auto max-w-[1440px] bg-[#060612] transition-all duration-500 lg:bg-transparent ${
            scrolled || spatialRoute
              ? "lg:mx-3 lg:mt-3 lg:rounded-2xl lg:border lg:border-[rgba(106,60,255,0.12)] lg:bg-[rgba(6,6,14,0.82)] lg:shadow-[0_4px_20px_rgba(0,0,0,0.35)] lg:backdrop-blur-xl"
              : ""
          }`}
        >
          <div className="site-header-v2__inner relative grid h-16 grid-cols-[auto_1fr_auto] items-center px-4 md:flex md:items-center md:justify-between md:px-6">
            {/* Logo */}
            <div ref={brandRef} className="site-header-v2__brand navbar-circuit-pill group relative flex items-center gap-2.5 justify-self-start sm:gap-3">
              <span className="site-header-v2__brand-aura" aria-hidden="true" />
              <Link href="/" className="site-header-v2__brand-logo relative transition-transform duration-300 group-hover:scale-105" data-sonic-action="brand">
                <BrandLogo size={36} fallback="png" priority />
              </Link>
              <Link
                href="/"
                className="site-header-v2__brand-word hidden text-lg font-bold sm:inline-block"
                style={{
                  background: "linear-gradient(135deg, #6a3cff 0%, #39d2f6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                TOOOLVIBES
              </Link>
            </div>

            {/* Mobile title */}
            <div className="col-start-2 flex justify-center md:hidden">
              <span
                className="site-header-v2__mobile-title pointer-events-none hidden text-[0.92rem] font-black uppercase text-white min-[430px]:inline"
                aria-hidden="true"
              >
                TooolVibes
              </span>
            </div>

            {/* Desktop Nav */}
            <nav ref={navRef} className="site-header-v2__nav navbar-circuit-pill hidden items-center gap-1 lg:flex" aria-label="Navigazione principale">
              <CircuitPill config={PILL_CONFIGS.nav} containerRef={navRef} />
              {desktopNavLinks.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  icon={link.icon}
                  isActive={isNavRouteActive(pathname, link.href)}
                />
              ))}
            </nav>

            {/* Right Actions */}
            <div ref={actionsRef} className="site-header-v2__actions navbar-circuit-pill flex items-center gap-2 justify-self-end">
              <CircuitPill config={PILL_CONFIGS.actions} containerRef={actionsRef} />
              <button
                className="site-header-v2__search-trigger relative hidden rounded-xl p-2.5 text-[#4f4970] transition-colors hover:bg-[rgba(106,60,255,0.08)] hover:text-[#6a3cff] md:flex"
                onClick={(event) => {
                  activeSearchTriggerRef.current = event.currentTarget;
                  setMenuOpen(false);
                  setSearchOpen(!searchOpen);
                }}
                type="button"
                aria-controls="site-search-overlay"
                aria-expanded={searchOpen}
              >
                <span className="flex items-center gap-2 text-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <span className="hidden lg:inline">Cerca</span>
                </span>
                <kbd className="site-header-v2__kbd ml-1 hidden rounded-md border border-[rgba(56,42,122,0.15)] bg-[rgba(236,232,255,0.6)] px-1.5 py-0.5 text-xs font-medium text-[#4f4970] lg:inline">
                  ⌘K
                </kbd>
              </button>

              <div className="site-header-v2__sound hidden items-center gap-1.5 md:flex">
                <SoundToggleButton />
                <MusicToggleButton />
              </div>

              {hasRewardedSurface && (
                <GameProfileBar className="hidden lg:flex" />
              )}

              {accountCta.visible && (
                <Link
                  href={accountCta.href}
                  className="site-header-v2__primary-action group relative hidden items-center gap-2 rounded-xl bg-gradient-to-r from-[#6a3cff] to-[#4f46e5] px-4 py-2 text-sm font-medium text-white shadow-[0_4px_16px_rgba(106,60,255,0.25)] transition-all hover:shadow-[0_6px_20px_rgba(106,60,255,0.35)] md:flex"
                  data-sonic-action="tap"
                  data-account-state={accountCta.state}
                  aria-busy={accountCta.ariaBusy || undefined}
                >
                  <AccountCtaIcon size={14} className="transition-transform group-hover:scale-110" />
                  {accountCta.label}
                </Link>
              )}

              <button
                className="site-header-v2__mobile-search grid size-11 shrink-0 touch-manipulation place-items-center rounded-xl text-white transition-colors active:scale-95 md:hidden"
                onClick={(event) => {
                  activeSearchTriggerRef.current = event.currentTarget;
                  setMenuOpen(false);
                  setSearchOpen(true);
                }}
                type="button"
                aria-controls="site-search-overlay"
                aria-expanded={searchOpen}
                aria-label="Cerca nel catalogo"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <Search size={19} aria-hidden="true" />
              </button>

              {/* Mobile menu toggle */}
              <button
                ref={menuButtonRef}
                className={`site-header-v2__menu-button relative z-20 grid size-11 touch-manipulation place-items-center rounded-xl text-white transition-colors active:scale-95 lg:hidden${
                  menuOpen ? " is-open" : ""
                }`}
                aria-controls="mobile-site-menu"
                aria-expanded={menuOpen}
                aria-label={menuOpen ? "Chiudi menu" : "Apri menu"}
                onClick={toggleMobileMenu}
                style={{ WebkitTapHighlightColor: "transparent" }}
                type="button"
              >
                <span className="site-header-v2__menu-glyph" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            id="site-search-overlay"
            className="tv-kbd-overlay fixed inset-0 z-[var(--tv-z-overlay)] flex items-end justify-center bg-[rgba(18,13,47,0.5)] p-3 pt-[calc(5rem+env(safe-area-inset-top))] backdrop-blur-sm md:items-start md:p-0 md:pt-24"
            onClick={() => closeSearch()}
            role="dialog"
            aria-modal="true"
            aria-label="Cerca nel catalogo TooolVibes"
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="mx-0 w-full max-w-none md:mx-4 md:max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="tv-kbd-sheet overflow-hidden rounded-t-[24px] border border-[rgba(106,60,255,0.15)] bg-[rgba(255,255,255,0.97)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_16px_48px_rgba(106,60,255,0.12)] backdrop-blur-xl md:rounded-2xl md:pb-4">
                <DirectoryHeaderSearch compact autoFocus onSubmitted={() => closeSearch(false)} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="site-header-v2__mobile-backdrop fixed inset-0 z-[var(--tv-z-overlay)] bg-[rgba(6,6,14,0.55)] lg:hidden"
            onClick={() => closeMenu()}
            >
            <motion.nav
              id="mobile-site-menu"
              initial={{ x: "100%", opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="mobile-menu-panel site-header-v2__mobile-panel absolute right-0 top-0 h-full w-[300px] max-w-[85vw] overflow-y-auto border-l border-[rgba(106,60,255,0.12)] bg-[#f8f7ff] p-6 pt-[max(1.15rem,env(safe-area-inset-top))] shadow-[-12px_0_40px_rgba(0,0,0,0.18)] max-[374px]:w-screen max-[374px]:max-w-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="site-header-v2__mobile-panel-head mb-6 flex items-center justify-between gap-4">
                <Link href="/" className="site-header-v2__mobile-brand flex items-center gap-2" onClick={() => setMenuOpen(false)}>
                  <BrandLogo size={34} fallback="png" priority />
                  <span
                    className="text-sm font-black uppercase"
                    style={{
                      background: "linear-gradient(110deg, #6a3cff 0%, #39d2f6 62%, #f3bf4c 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    TooolVibes
                  </span>
                </Link>
                <button
                  type="button"
                  className="site-header-v2__mobile-close grid size-11 place-items-center rounded-xl border border-[rgba(106,60,255,0.2)] bg-white text-[#120d2f]"
                  aria-label="Chiudi menu"
                  onClick={() => closeMenu()}
                >
                  <X size={22} />
                </button>
              </div>
              <div className="site-header-v2__mobile-eyebrow mb-5 flex items-center gap-2 text-xs font-medium uppercase text-[#6b6580]">
                <Sparkles size={12} className="text-[#6a3cff]" />
                Navigazione
              </div>
              <div className="site-header-v2__mobile-links flex flex-col gap-1 border-b border-[rgba(18,13,47,0.08)] pb-4">
                {mobileNavLinks.map((link, i) => {
                  const isActive = isNavRouteActive(pathname, link.href);
                  const Icon = link.icon;
                  const tone = link.tone ?? DEFAULT_MOBILE_LINK_TONE;
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 + 0.1 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        className={`site-header-v2__mobile-link group flex min-h-[44px] items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                          isActive
                            ? "is-active border-[rgba(106,60,255,0.45)] bg-[#ede9fe] text-[#4c1d95]"
                            : "border-[rgba(106,60,255,0.12)] bg-white text-[#120d2f] hover:border-[rgba(106,60,255,0.28)] hover:bg-[#f0edff]"
                        }`}
                        style={{
                          "--mobile-link-a": tone[0],
                          "--mobile-link-b": tone[1],
                          "--mobile-link-c": tone[2],
                        } as React.CSSProperties}
                        data-sonic-action="nav"
                        aria-current={isActive ? "page" : undefined}
                      >
                        <span className="flex items-center gap-3">
                          {Icon ? <Icon size={20} className="text-[#6a3cff]" /> : null}
                          <span className="font-medium">{link.label}</span>
                        </span>
                        <ChevronRight
                          size={16}
                          className="text-[#6a3cff] opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100"
                        />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {accountCta.visible && (
                <div className="mt-4 pt-4">
                  <Link
                    href={accountCta.href}
                    onClick={() => setMenuOpen(false)}
                    className="site-header-v2__mobile-primary flex items-center justify-center gap-2 rounded-xl bg-[#6a3cff] px-4 py-3 text-sm font-medium text-white shadow-[0_6px_18px_rgba(106,60,255,0.22)]"
                    data-account-state={accountCta.state}
                    aria-busy={accountCta.ariaBusy || undefined}
                  >
                    <AccountCtaIcon size={16} />
                    {accountCta.label}
                  </Link>
                </div>
              )}
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BATCH 37 (MOB-701): il launcher Vibe Rush non vive piu' qui — unico
          slot floating governato dalla GamificationShell (.shell-floating-dock),
          flaggabile via surface vibeRush (B04). */}

      {/* Spacer */}
      <div className="site-header-v2__spacer h-16" />
    </>
  );
}
