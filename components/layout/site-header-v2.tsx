"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { BrandLogo } from "./brand-logo";
import { SoundToggleButton } from "../app/sound-toggle-button";
import { DirectoryHeaderSearch } from "../directory/directory-header-search";
import { useMobileUIStore } from "@/lib/stores/mobile-ui-store";
import {
  Menu,
  X,
  Sparkles,
  Compass,
  Radar,
  Heart,
  ShoppingBag,
  Users,
  LayoutGrid,
  Zap,
  ChevronRight,
  LockKeyhole,
} from "lucide-react";

const navLinks = [
  { href: "/", label: "Home", icon: Sparkles },
  { href: "/archivio", label: "Catalogo", icon: LayoutGrid },
  { href: "/product-hunt", label: "Radar", icon: Radar },
  { href: "/compare", label: "Compare", icon: Zap },
  { href: "/shortlist", label: "Shortlist", icon: Compass },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/community", label: "Community", icon: Users },
];

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  isActive: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={href}
      className="group relative flex items-center gap-2 px-3 py-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-sonic-action="nav"
    >
      <span
        className={`absolute inset-0 rounded-xl transition-opacity duration-200 ${
          isActive
            ? "bg-gradient-to-r from-[rgba(106,60,255,0.12)] to-[rgba(57,210,246,0.08)] opacity-100"
            : "bg-[rgba(106,60,255,0.06)] opacity-0 group-hover:opacity-100"
        }`}
      />
      <span className="relative z-10 flex items-center gap-2">
        <Icon
          size={16}
          className={`transition-colors duration-200 ${
            isActive ? "text-[#6a3cff]" : isHovered ? "text-[#39d2f6]" : "text-[#4f4970]"
          }`}
        />
        <span
          className={`text-sm font-medium transition-colors duration-200 ${
            isActive ? "text-[#6a3cff]" : isHovered ? "text-[#120d2f]" : "text-[#4f4970]"
          }`}
        >
          {label}
        </span>
        {isActive && (
          <span className="absolute -bottom-0.5 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-[#6a3cff] to-[#39d2f6]" />
        )}
      </span>
    </Link>
  );
}

export function SiteHeaderV2() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const spatialRoute = pathname === "/" || pathname?.startsWith("/archivio");

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

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 transition-all duration-500" style={{ transform: "translateZ(0)", willChange: "transform" }}>
        <div
          className={`mx-auto max-w-[1440px] transition-all duration-500 ${
            scrolled || spatialRoute
              ? "mx-3 mt-3 rounded-2xl border border-[rgba(106,60,255,0.1)] bg-[rgba(255,255,255,0.82)] shadow-[0_4px_20px_rgba(106,60,255,0.08)] backdrop-blur-xl"
              : "bg-transparent"
          }`}
        >
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            {/* Logo */}
            <Link href="/" className="group relative flex items-center gap-3" data-sonic-action="brand">
              <div className="relative transition-transform duration-300 group-hover:scale-105">
                <BrandLogo size={36} priority />
              </div>
              <span
                className="hidden text-lg font-bold tracking-tight sm:inline-block"
                style={{
                  background: "linear-gradient(135deg, #6a3cff 0%, #39d2f6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                TOOOLVIBES
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden items-center gap-1 lg:flex">
              {navLinks.slice(0, 6).map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  icon={link.icon}
                  isActive={pathname === link.href || pathname?.startsWith(link.href + "/")}
                />
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <button
                className="relative hidden rounded-xl p-2.5 text-[#4f4970] transition-colors hover:bg-[rgba(106,60,255,0.08)] hover:text-[#6a3cff] md:flex"
                onClick={() => setSearchOpen(!searchOpen)}
                type="button"
              >
                <span className="flex items-center gap-2 text-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <span className="hidden lg:inline">Cerca</span>
                </span>
                <kbd className="ml-1 hidden rounded-md border border-[rgba(56,42,122,0.15)] bg-[rgba(236,232,255,0.6)] px-1.5 py-0.5 text-[10px] font-medium text-[#4f4970] lg:inline">
                  ⌘K
                </kbd>
              </button>

              <div className="hidden md:block">
                <SoundToggleButton />
              </div>

              <Link
                href="/admin/login"
                aria-label="Apri il login amministratore"
                className="group relative hidden items-center gap-2 rounded-xl border border-[rgba(106,60,255,0.12)] bg-white/70 px-3 py-2 text-sm font-medium text-[#4f4970] shadow-[0_4px_16px_rgba(106,60,255,0.08)] transition-all hover:border-[rgba(106,60,255,0.22)] hover:bg-white hover:text-[#6a3cff] md:flex"
                data-sonic-action="tap"
              >
                <LockKeyhole size={14} className="transition-transform group-hover:scale-105" />
                Admin
              </Link>

              <Link
                href="/account"
                className="group relative hidden items-center gap-2 rounded-xl bg-gradient-to-r from-[#6a3cff] to-[#4f46e5] px-4 py-2 text-sm font-medium text-white shadow-[0_4px_16px_rgba(106,60,255,0.25)] transition-all hover:shadow-[0_6px_20px_rgba(106,60,255,0.35)] md:flex"
                data-sonic-action="tap"
              >
                <Sparkles size={14} className="transition-transform group-hover:rotate-12" />
                Account
              </Link>

              {/* Mobile menu toggle */}
              <button
                className="flex rounded-xl p-2.5 text-[#4f4970] transition-colors hover:bg-[rgba(106,60,255,0.08)] lg:hidden"
                onClick={() => setMenuOpen(!menuOpen)}
                type="button"
              >
                <motion.div animate={{ rotate: menuOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                  {menuOpen ? <X size={22} /> : <Menu size={22} />}
                </motion.div>
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
            className="fixed inset-0 z-[60] flex items-start justify-center bg-[rgba(18,13,47,0.5)] backdrop-blur-sm pt-24"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-2xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="overflow-hidden rounded-2xl border border-[rgba(106,60,255,0.15)] bg-[rgba(255,255,255,0.95)] shadow-[0_16px_48px_rgba(106,60,255,0.12)] backdrop-blur-xl p-4">
                <DirectoryHeaderSearch onSubmitted={() => setSearchOpen(false)} />
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
            className="fixed inset-0 z-[55] bg-[rgba(18,13,47,0.4)] backdrop-blur-md lg:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <motion.nav
              initial={{ x: "100%", opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute right-0 top-0 h-full w-[300px] max-w-[85vw] border-l border-[rgba(106,60,255,0.1)] bg-[rgba(255,255,255,0.96)] p-6 pt-20 shadow-[-16px_0_48px_rgba(106,60,255,0.08)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-[#4f4970]">
                <Sparkles size={12} className="text-[#6a3cff]" />
                Navigazione
              </div>
              <div className="flex flex-col gap-1">
                {navLinks.map((link, i) => {
                  const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 + 0.1 }}
                    >
                      <Link
                        href={link.href}
                        className={`group flex items-center justify-between rounded-xl px-4 py-3 transition-all ${
                          isActive
                            ? "bg-gradient-to-r from-[rgba(106,60,255,0.1)] to-[rgba(57,210,246,0.05)] text-[#6a3cff]"
                            : "text-[#4f4970] hover:bg-[rgba(106,60,255,0.04)] hover:text-[#120d2f]"
                        }`}
                        data-sonic-action="nav"
                      >
                        <span className="flex items-center gap-3">
                          <link.icon size={18} />
                          <span className="font-medium">{link.label}</span>
                        </span>
                        <ChevronRight
                          size={14}
                          className="opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100"
                        />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-6 border-t border-[rgba(106,60,255,0.08)] pt-6">
                <Link
                  href="/admin/login"
                  className="mb-3 flex items-center justify-center gap-2 rounded-xl border border-[rgba(106,60,255,0.12)] bg-white/72 px-4 py-3 text-sm font-medium text-[#4f4970] shadow-[0_4px_16px_rgba(106,60,255,0.08)] transition hover:bg-white hover:text-[#6a3cff]"
                  data-sonic-action="tap"
                >
                  <LockKeyhole size={16} />
                  Login amministratore
                </Link>
                <Link
                  href="/account"
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6a3cff] to-[#4f46e5] px-4 py-3 text-sm font-medium text-white shadow-[0_4px_16px_rgba(106,60,255,0.25)]"
                >
                  <Sparkles size={16} />
                  Account
                </Link>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
}
