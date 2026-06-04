"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { BrandLogo } from "./brand-logo";
import { SoundToggleButton } from "../app/sound-toggle-button";
import { DirectoryHeaderSearch } from "../directory/directory-header-search";
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

function MagneticButton({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.25;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.25;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => setPosition({ x: 0, y: 0 });

  return (
    <button
      ref={ref}
      type="button"
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: "transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      }}
    >
      {children}
    </button>
  );
}

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
      <motion.span
        className={`absolute inset-0 rounded-xl ${isActive ? "bg-gradient-to-r from-[rgba(106,60,255,0.15)] to-[rgba(57,210,246,0.1)]" : ""}`}
        animate={{
          scale: isHovered || isActive ? 1 : 0.8,
          opacity: isHovered || isActive ? 1 : 0,
        }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      />
      <span className="relative z-10 flex items-center gap-2">
        <motion.span
          animate={{ rotate: isHovered ? [0, -10, 10, 0] : 0 }}
          transition={{ duration: 0.5 }}
        >
          <Icon
            size={16}
            className={`transition-colors duration-200 ${
              isActive
                ? "text-[#6a3cff]"
                : isHovered
                  ? "text-[#39d2f6]"
                  : "text-[#4f4970]"
            }`}
          />
        </motion.span>
        <span
          className={`text-sm font-medium transition-colors duration-200 ${
            isActive
              ? "text-[#6a3cff]"
              : isHovered
                ? "text-[#120d2f]"
                : "text-[#4f4970]"
          }`}
        >
          {label}
        </span>
        {isActive && (
          <motion.span
            layoutId="activeNavIndicator"
            className="absolute -bottom-0.5 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-[#6a3cff] to-[#39d2f6]"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
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
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // 3D tilt effect on header
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const handleHeaderMouseMove = useCallback((e: React.MouseEvent) => {
    if (!headerRef.current) return;
    const rect = headerRef.current.getBoundingClientRect();
    const x = (e.clientY - rect.top - rect.height / 2) / 20;
    const y = (e.clientX - rect.left - rect.width / 2) / -20;
    setTilt({ x: Math.max(-3, Math.min(3, x)), y: Math.max(-3, Math.min(3, y)) });
  }, []);

  const handleHeaderMouseLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <>
      <header
        ref={headerRef}
        className="fixed left-0 right-0 top-0 z-50 transition-all duration-500"
        onMouseMove={handleHeaderMouseMove}
        onMouseLeave={handleHeaderMouseLeave}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        <div
          className={`mx-auto max-w-[1440px] transition-all duration-500 ${
            scrolled
              ? "mx-3 mt-3 rounded-2xl border border-[rgba(106,60,255,0.12)] bg-[rgba(255,255,255,0.82)] shadow-[0_8px_32px_rgba(106,60,255,0.1),0_0_0_1px_rgba(255,255,255,0.5)_inset] backdrop-blur-xl"
              : "bg-transparent"
          }`}
        >
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            {/* Logo */}
            <Link href="/" className="group relative flex items-center gap-3" data-sonic-action="brand">
              <motion.div
                whileHover={{ scale: 1.08, rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className="absolute inset-0 rounded-xl bg-[rgba(106,60,255,0.2)] blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <BrandLogo size={36} priority />
              </motion.div>
              <motion.span
                className="hidden text-lg font-bold tracking-tight sm:inline-block"
                style={{
                  background: "linear-gradient(135deg, #6a3cff 0%, #39d2f6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
                whileHover={{ scale: 1.02 }}
              >
                TOOOLVIBES
              </motion.span>
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
              <MagneticButton
                className="relative hidden rounded-xl p-2.5 text-[#4f4970] transition-colors hover:bg-[rgba(106,60,255,0.08)] hover:text-[#6a3cff] md:flex"
                onClick={() => setSearchOpen(!searchOpen)}
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
              </MagneticButton>

              <div className="hidden md:block">
                <SoundToggleButton />
              </div>

              <Link
                href="/account"
                className="group relative hidden items-center gap-2 rounded-xl bg-gradient-to-r from-[#6a3cff] to-[#4f46e5] px-4 py-2 text-sm font-medium text-white shadow-[0_4px_16px_rgba(106,60,255,0.35)] transition-all hover:shadow-[0_6px_24px_rgba(106,60,255,0.5)] hover:scale-[1.02] active:scale-[0.98] md:flex"
                data-sonic-action="tap"
              >
                <Sparkles size={14} className="transition-transform group-hover:rotate-12" />
                Account
              </Link>

              {/* Mobile menu toggle */}
              <MagneticButton
                className="flex rounded-xl p-2.5 text-[#4f4970] transition-colors hover:bg-[rgba(106,60,255,0.08)] lg:hidden"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <motion.div animate={{ rotate: menuOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                  {menuOpen ? <X size={22} /> : <Menu size={22} />}
                </motion.div>
              </MagneticButton>
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
            className="fixed inset-0 z-[60] flex items-start justify-center bg-[rgba(18,13,47,0.6)] backdrop-blur-sm pt-24"
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
              <div className="overflow-hidden rounded-2xl border border-[rgba(106,60,255,0.2)] bg-[rgba(255,255,255,0.95)] shadow-[0_24px_64px_rgba(106,60,255,0.2)] backdrop-blur-xl p-4">
                <DirectoryHeaderSearch
                  onSubmitted={() => setSearchOpen(false)}
                />
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
            className="fixed inset-0 z-[48] bg-[rgba(18,13,47,0.5)] backdrop-blur-md lg:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <motion.nav
              initial={{ x: "100%", opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute right-0 top-0 h-full w-[300px] max-w-[85vw] border-l border-[rgba(106,60,255,0.15)] bg-gradient-to-b from-[rgba(255,255,255,0.96)] to-[rgba(247,245,255,0.98)] p-6 pt-20 shadow-[-24px_0_64px_rgba(106,60,255,0.15)]"
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
                            ? "bg-gradient-to-r from-[rgba(106,60,255,0.12)] to-[rgba(57,210,246,0.08)] text-[#6a3cff]"
                            : "text-[#4f4970] hover:bg-[rgba(106,60,255,0.06)] hover:text-[#120d2f]"
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

              <div className="mt-6 border-t border-[rgba(106,60,255,0.1)] pt-6">
                <Link
                  href="/account"
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6a3cff] to-[#4f46e5] px-4 py-3 text-sm font-medium text-white shadow-[0_4px_16px_rgba(106,60,255,0.35)]"
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
