"use client";

import { LocalizedText } from "@/components/i18n/localized-text";
import Link from "@/components/ui/app-link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { AdminCommandPalette } from "@/components/admin/admin-command-palette";
import {
  BadgeDollarSign,
  LayoutGrid,
  FileText,
  Plus,
  Globe,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Gauge,
  MessageSquare,
  Wrench,
} from "lucide-react";
import type { AdminArticlesRuntime } from "@/lib/admin/article-queries";

type FounderControlCenterV2Props = {
  articlesRuntime: AdminArticlesRuntime;
  adminMetrics?: {
    tools: number;
    publishedTools: number;
    openSuggestions: number;
    writeReady: boolean;
  };
};

const navItems = [
  { href: "/admin", label: "Panoramica", icon: Gauge, group: "Panoramica" },
  { href: "/admin/tools", label: "Tool", icon: Wrench, group: "Contenuti" },
  { href: "/admin/tools/new", label: "Nuovo tool", icon: Plus, primary: true, group: "Contenuti" },
  { href: "/admin/articles", label: "Guide", icon: FileText, group: "Contenuti" },
  { href: "/admin/collections", label: "Raccolte", icon: LayoutGrid, group: "Contenuti" },
  { href: "/admin/composer", label: "Homepage", icon: Sparkles, group: "Composizione" },
  { href: "/admin/media", label: "Media", icon: LayoutGrid, group: "Composizione" },
  { href: "/admin/commercial/partners", label: "Partner", icon: BadgeDollarSign, group: "Commerciale" },
  { href: "/admin/commercial/campaigns", label: "Campagne", icon: BadgeDollarSign, group: "Commerciale" },
  { href: "/admin/commercial/placements", label: "Posizionamenti", icon: BadgeDollarSign, group: "Commerciale" },
  { href: "/admin/commercial/preview", label: "Anteprima", icon: BadgeDollarSign, group: "Commerciale" },
  { href: "/admin/monetization", label: "Monetizzazione", icon: BadgeDollarSign, group: "Commerciale" },
  { href: "/admin/affiliates", label: "Affiliati", icon: Sparkles, group: "Commerciale" },
  { href: "/admin/affiliate-links", label: "Link affiliati", icon: LayoutGrid, group: "Commerciale" },
  { href: "/admin/suggestions", label: "Suggerimenti", icon: AlertCircle, group: "Community" },
  { href: "/admin/experiences", label: "Esperienze", icon: MessageSquare, group: "Community" },
  { href: "/admin/experiences/reports", label: "Segnalazioni", icon: AlertCircle, group: "Community" },
  { href: "/", label: "Sito", icon: Globe, group: "System" },
];


const desktopNavItems = navItems.filter((item) =>
  [
    "/admin",
    "/admin/tools",
    "/admin/articles",
    "/admin/collections",
    "/admin/composer",
    "/admin/commercial/partners",
    "/admin/media",
    "/admin/experiences",
    "/",
  ].includes(item.href),
);

const navGroups = navItems.reduce<Array<{ label: string; items: typeof navItems }>>((groups, item) => {
  const last = groups.at(-1);
  if (!last || last.label !== item.group) {
    groups.push({ label: item.group, items: [item] });
    return groups;
  }
  last.items.push(item);
  return groups;
}, []);

function StatusIndicator({ active, label }: { active: boolean; label: string }) {
  return (
    <motion.span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider"
      style={{
        borderColor: active ? "rgba(57,210,246,0.3)" : "rgba(243,191,76,0.3)",
        background: active ? "rgba(57,210,246,0.1)" : "rgba(243,191,76,0.1)",
        color: active ? "#39d2f6" : "#f3bf4c",
      }}
    >
      <motion.span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: active ? "#39d2f6" : "#f3bf4c" }}
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <LocalizedText>{label}</LocalizedText>
    </motion.span>
  );
}

export function FounderControlCenterV2({ articlesRuntime, adminMetrics }: FounderControlCenterV2Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50">
        <motion.div
          className="mx-3 mt-3 rounded-2xl border border-[rgba(106,60,255,0.15)] bg-[rgba(18,13,46,0.85)] shadow-[0_8px_32px_rgba(106,60,255,0.15)] backdrop-blur-xl"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        >
          <div className="flex h-16 items-center justify-between px-4">
            {/* Logo */}
            <Link href="/admin" className="flex items-center gap-3">
              <motion.div whileHover={{ scale: 1.1, rotate: 5 }}>
                <BrandLogo size={32} priority />
              </motion.div>
              <div className="hidden sm:block">
                <span className="text-sm font-bold text-white"><LocalizedText>{"TOOOLVIBES"}</LocalizedText></span>
                <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-white/40"><LocalizedText>{"Control Center "}</LocalizedText></span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden items-center gap-1 lg:flex">
              {desktopNavItems.map((item) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all ${
                      isActive
                        ? "text-white"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="adminNavIndicator"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-[rgba(106,60,255,0.2)] to-[rgba(57,210,246,0.1)] border border-[rgba(106,60,255,0.15)]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <item.icon size={14} />
                      <span className="font-medium"><LocalizedText>{item.label}</LocalizedText></span>
                      {(adminMetrics?.openSuggestions ?? 0) > 0 && item.href === "/admin/suggestions" ? (
                        <span className="rounded-full bg-[rgba(57,210,246,0.18)] px-1.5 py-0.5 text-xs font-bold tabular-nums text-[rgb(57,210,246)]">
                          {adminMetrics?.openSuggestions}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              <AdminCommandPalette />
              <StatusIndicator
                active={articlesRuntime.canWrite}
                label={articlesRuntime.canWrite ? "CMS attivo" : "CMS in lettura"}
              />
              <form action="/api/admin/logout" method="post" className="hidden sm:block">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.1)] bg-white/5 px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <LogOut size={12} /><LocalizedText>{"Esci "}</LocalizedText></motion.button>
              </form>
              <button
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[rgba(5,3,19,0.8)] backdrop-blur-md lg:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <motion.nav
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="admin-mobile-nav absolute right-0 top-0 h-full w-[min(20rem,88vw)] border-l border-[rgba(106,60,255,0.2)] bg-[#120d2e] p-6 pt-20 "
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-5">
                {navGroups.map((group) => (
                  <div key={group.label}>
                    <p className="mb-2 px-4 text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                      <LocalizedText>{group.label}</LocalizedText>
                    </p>
                    <div className="flex flex-col gap-1">
                      {group.items.map((item) => {
                        const isActive =
                          item.href === "/admin"
                            ? pathname === "/admin"
                            : pathname === item.href || pathname?.startsWith(item.href + "/");
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm transition-all ${
                              isActive
                                ? "bg-gradient-to-r from-[rgba(106,60,255,0.2)] to-transparent text-white border border-[rgba(106,60,255,0.15)]"
                                : "text-white/60 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              <item.icon size={16} />
                              <LocalizedText>{item.label}</LocalizedText>
                            </span>
                            <ChevronRight size={14} className={isActive ? "opacity-100" : "opacity-0"} />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-white/10 pt-6">
                <form action="/api/admin/logout" method="post">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(255,255,255,0.1)] bg-white/5 px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/10"
                  >
                    <LogOut size={16} /><LocalizedText>{"Esci "}</LocalizedText></button>
                </form>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
