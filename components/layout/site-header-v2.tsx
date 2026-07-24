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

const DEFAULT_MOBILE_LINK_TONE = [
  "var(--tv-accent-primary)",
  "var(--tv-accent-cyan)",
  "var(--tv-accent-primary)",
] as const;

const MODAL_FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function getModalFocusables(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(MODAL_FOCUSABLE_SELECTOR),
  ).filter(
    (element) =>
      !element.hidden &&
      element.getAttribute("aria-hidden") !== "true" &&
      !element.closest("[inert]"),
  );
}

/**
 * Isolate every DOM branch outside the active dialog. Walking toward `body`
 * also covers portalled chrome such as the mobile bottom navigation.
 */
function isolateModalBackground(dialog: HTMLElement) {
  const previousAttributes = new Map<
    HTMLElement,
    { ariaHidden: string | null; inert: string | null }
  >();
  let activeBranch: HTMLElement = dialog;

  while (activeBranch.parentElement) {
    const parent = activeBranch.parentElement;

    for (const sibling of Array.from(parent.children)) {
      if (!(sibling instanceof HTMLElement) || sibling === activeBranch) {
        continue;
      }

      previousAttributes.set(sibling, {
        ariaHidden: sibling.getAttribute("aria-hidden"),
        inert: sibling.getAttribute("inert"),
      });
      sibling.setAttribute("aria-hidden", "true");
      sibling.setAttribute("inert", "");
    }

    if (parent === document.body) {
      break;
    }
    activeBranch = parent;
  }

  return () => {
    for (const [element, previous] of previousAttributes) {
      if (previous.ariaHidden === null) {
        element.removeAttribute("aria-hidden");
      } else {
        element.setAttribute("aria-hidden", previous.ariaHidden);
      }

      if (previous.inert === null) {
        element.removeAttribute("inert");
      } else {
        element.setAttribute("inert", previous.inert);
      }
    }
  };
}

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
          <Icon size={16} className="site-header-v2__nav-icon" />
        ) : null}
        <span className="site-header-v2__nav-label">
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
  const activeSearchTriggerRef = useRef<HTMLButtonElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const searchDialogRef = useRef<HTMLDivElement>(null);
  const menuDialogRef = useRef<HTMLDivElement>(null);
  const menuCloseButtonRef = useRef<HTMLButtonElement>(null);
  const restoreSearchFocusRef = useRef(true);
  const restoreMenuFocusRef = useRef(true);
  

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
    restoreSearchFocusRef.current = restoreFocus;
    setSearchOpen(false);
  }, []);

  const closeMenu = useCallback((restoreFocus = true) => {
    restoreMenuFocusRef.current = restoreFocus;
    setMenuOpen(false);
  }, []);

  const toggleMobileMenu = () => {
    restoreSearchFocusRef.current = false;
    restoreMenuFocusRef.current = true;
    setSearchOpen(false);
    setMenuOpen((open) => !open);
  };

  useEffect(() => {
    const dialog = searchOpen
      ? searchDialogRef.current
      : menuOpen
        ? menuDialogRef.current
        : null;

    if (!dialog) {
      return;
    }

    const restoreBackground = isolateModalBackground(dialog);
    const restoreFocusTarget = searchOpen
      ? activeSearchTriggerRef.current
      : menuButtonRef.current;
    const shouldRestoreFocusRef = searchOpen
      ? restoreSearchFocusRef
      : restoreMenuFocusRef;
    const preferredFocus = searchOpen
      ? dialog.querySelector<HTMLElement>("input:not([disabled])")
      : menuCloseButtonRef.current;
    (preferredFocus ?? getModalFocusables(dialog)[0] ?? dialog).focus({
      preventScroll: true,
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        if (searchOpen) {
          closeSearch();
        } else {
          closeMenu();
        }
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusables = getModalFocusables(dialog);
      if (focusables.length === 0) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const activeIndex =
        active instanceof HTMLElement ? focusables.indexOf(active) : -1;

      if (event.shiftKey && activeIndex <= 0) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && activeIndex === focusables.length - 1) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      } else if (!dialog.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      if (event.target instanceof Node && dialog.contains(event.target)) {
        return;
      }

      (getModalFocusables(dialog)[0] ?? dialog).focus({
        preventScroll: true,
      });
    };

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("focusin", onFocusIn, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("focusin", onFocusIn, true);
      restoreBackground();
      if (shouldRestoreFocusRef.current && restoreFocusTarget?.isConnected) {
        window.requestAnimationFrame(() => {
          if (restoreFocusTarget.isConnected) {
            restoreFocusTarget.focus({ preventScroll: true });
          }
        });
      }
    };
  }, [closeMenu, closeSearch, menuOpen, searchOpen]);

  return (
    <>
      <header
        data-overlay-open={menuOpen || searchOpen ? "true" : undefined}
        className={`site-header-v2 fixed inset-x-0 top-0${
          scrolled || spatialRoute ? " is-elevated" : ""
        }`}
        style={{ transform: "translateZ(0)", willChange: "transform" }}
      >
        <div
          className={`site-header-v2__shell${
            scrolled || spatialRoute ? " is-elevated" : ""
          }`}
        >
          <div className="site-header-v2__inner relative grid h-16 grid-cols-[auto_1fr_auto] items-center px-4 md:flex md:items-center md:justify-between md:px-6">
            {/* Logo */}
            <div className="site-header-v2__brand group relative flex items-center gap-2.5 justify-self-start sm:gap-3">
              <span className="site-header-v2__brand-aura" aria-hidden="true" />
              <Link href="/" className="site-header-v2__brand-logo relative transition-transform duration-300 group-hover:scale-105" data-sonic-action="brand">
                <BrandLogo size={36} fallback="png" priority />
              </Link>
              <Link
                href="/"
                className="site-header-v2__brand-word hidden sm:inline-block"
              >
                TOOOLVIBES
              </Link>
            </div>

            {/* Mobile title — removed in Batch 1; the logo already carries
               the brand. The previous 'TooolVibes' centered title was a
               redundant mark that fought the logo for attention. */}

            {/* Desktop Nav */}
            <nav className="site-header-v2__nav hidden items-center gap-1 xl:flex" aria-label="Navigazione principale">
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
            <div className="site-header-v2__actions col-start-3 flex items-center gap-2 justify-self-end">
              <button
                className="site-header-v2__search-trigger relative hidden md:flex"
                onClick={(event) => {
                  activeSearchTriggerRef.current = event.currentTarget;
                  restoreSearchFocusRef.current = true;
                  restoreMenuFocusRef.current = false;
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
                  <span className="hidden xl:inline">Cerca</span>
                </span>
                <kbd className="site-header-v2__kbd hidden xl:inline-flex">
                  ⌘K
                </kbd>
              </button>

              <div className="site-header-v2__sound hidden items-center gap-1.5 md:flex">
                <SoundToggleButton />
                <MusicToggleButton />
              </div>

              {hasRewardedSurface && (
                <GameProfileBar className="hidden xl:flex" />
              )}

              {accountCta.visible && (
                <Link
                  href={accountCta.href}
                  className="site-header-v2__primary-action group relative hidden md:flex"
                  data-sonic-action="tap"
                  data-account-state={accountCta.state}
                  aria-busy={accountCta.ariaBusy || undefined}
                >
                  <AccountCtaIcon size={14} className="transition-transform group-hover:scale-110" />
                  {accountCta.label}
                </Link>
              )}

              <button
                className="site-header-v2__mobile-search grid size-11 shrink-0 place-items-center md:hidden"
                onClick={(event) => {
                  activeSearchTriggerRef.current = event.currentTarget;
                  restoreSearchFocusRef.current = true;
                  restoreMenuFocusRef.current = false;
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
                className={`site-header-v2__menu-button relative z-20 grid size-11 place-items-center xl:hidden${
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
            ref={searchDialogRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            id="site-search-overlay"
            className="tv-kbd-overlay site-header-v2__search-overlay fixed inset-0 z-[var(--tv-z-overlay)] flex items-end justify-center md:items-start"
            onClick={() => closeSearch()}
            role="dialog"
            aria-modal="true"
            aria-label="Cerca nel catalogo TooolVibes"
            tabIndex={-1}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="site-header-v2__search-dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="tv-kbd-sheet site-header-v2__search-sheet">
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
            ref={menuDialogRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="site-header-v2__mobile-backdrop fixed inset-0 z-[var(--tv-z-overlay)] xl:hidden"
            onClick={() => closeMenu()}
            role="dialog"
            aria-modal="true"
            aria-label="Menu di navigazione"
            tabIndex={-1}
            >
            <motion.nav
              id="mobile-site-menu"
              initial={{ x: "100%", opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="mobile-menu-panel site-header-v2__mobile-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="site-header-v2__mobile-panel-head mb-6 flex items-center justify-between gap-4">
                <Link href="/" className="site-header-v2__mobile-brand flex items-center gap-2" onClick={() => closeMenu(false)}>
                  <BrandLogo size={34} fallback="png" priority />
                  <span className="site-header-v2__mobile-brand-word">
                    TooolVibes
                  </span>
                </Link>
                <button
                  ref={menuCloseButtonRef}
                  type="button"
                  className="site-header-v2__mobile-close grid size-11 place-items-center"
                  aria-label="Chiudi menu"
                  onClick={() => closeMenu()}
                >
                  <X size={22} />
                </button>
              </div>
              <div className="site-header-v2__mobile-eyebrow mb-5 flex items-center gap-2">
                <Sparkles size={12} />
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
                        onClick={() => closeMenu(false)}
                        className={`site-header-v2__mobile-link group${
                          isActive ? " is-active" : ""
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
                          {Icon ? <Icon size={20} /> : null}
                          <span className="font-medium">{link.label}</span>
                        </span>
                        <ChevronRight
                          size={16}
                          className="site-header-v2__mobile-chevron"
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
                    onClick={() => closeMenu(false)}
                    className="site-header-v2__mobile-primary flex items-center justify-center gap-2"
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
