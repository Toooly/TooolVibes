"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { BrandLogo } from "@/components/layout/brand-logo";
import {
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
  { href: "/admin", label: "Dashboard", icon: Gauge },
  { href: "/admin/tools", label: "Tool", icon: Wrench },
  { href: "/admin/tools/new", label: "Nuovo tool", icon: Plus, primary: true },
  { href: "/admin/articles", label: "Articoli", icon: FileText },
  { href: "/admin/collections", label: "Raccolte", icon: LayoutGrid },
  { href: "/admin/affiliates", label: "Affiliati", icon: Sparkles },
  { href: "/admin/affiliate-links", label: "Link", icon: LayoutGrid },
  { href: "/admin/suggestions", label: "Suggerimenti", icon: AlertCircle },
  { href: "/", label: "Sito", icon: Globe },
];

function StatusIndicator({ active, label }: { active: boolean; label: string }) {
  return (
    <motion.span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
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
      {label}
    </motion.span>
  );
}

function MetricOrb({
  label,
  value,
  detail,
  color,
}: {
  label: string;
  value: string;
  detail: string;
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-4 backdrop-blur-sm"
    >
      <div
        className="absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-20 blur-2xl"
        style={{ background: color }}
      />
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
        {label}
      </p>
      <div className="mt-2 flex items-end gap-2">
        <motion.p
          className="text-2xl font-bold text-white"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={value}
        >
          {value}
        </motion.p>
        <p className="pb-0.5 text-xs text-white/50">{detail}</p>
      </div>
      <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: "0%" }}
          animate={{ width: `${Math.min(100, parseInt(value) * 5)}%` }}
          transition={{ duration: 1, delay: 0.3 }}
        />
      </div>
    </motion.div>
  );
}

export function FounderControlCenterV2({ articlesRuntime, adminMetrics }: FounderControlCenterV2Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const publishedArticles = articlesRuntime.articles.filter(
    (article) => article.status === "published",
  ).length;
  const draftArticles = articlesRuntime.articles.length - publishedArticles;
  const runtimeWarningCount = articlesRuntime.warnings.length;

  const metrics = [
    {
      label: "Tool",
      value: String(adminMetrics?.tools ?? 0),
      detail: `${adminMetrics?.publishedTools ?? 0} pubblicati`,
      color: "#6a3cff",
    },
    {
      label: "Articoli",
      value: String(articlesRuntime.articles.length),
      detail: `${draftArticles} bozze`,
      color: "#39d2f6",
    },
    {
      label: "Submission",
      value: String(adminMetrics?.openSuggestions ?? 0),
      detail:
        runtimeWarningCount > 0
          ? `${runtimeWarningCount} avvisi`
          : adminMetrics?.writeReady
            ? "scrittura attiva"
            : "verifica salvataggi",
      color: runtimeWarningCount > 0 || !adminMetrics?.writeReady ? "#f3bf4c" : "#5cbf9c",
    },
  ];

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
                <span className="text-sm font-bold text-white">TOOOLVIBES</span>
                <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  Area admin
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => {
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
                      <span className="font-medium">{item.label}</span>
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              <StatusIndicator
                active={articlesRuntime.canWrite}
                label={articlesRuntime.canWrite ? "Modifica attiva" : "Sola lettura"}
              />
              <form action="/api/admin/logout" method="post" className="hidden sm:block">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.1)] bg-white/5 px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <LogOut size={12} />
                  Esci
                </motion.button>
              </form>
              <button
                className="flex rounded-xl p-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white md:hidden"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Metrics Bar */}
      <div className="mx-auto max-w-[1440px] px-4 pt-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {metrics.map((metric) => (
            <MetricOrb key={metric.label} {...metric} />
          ))}
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[rgba(5,3,19,0.8)] backdrop-blur-md md:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <motion.nav
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute right-0 top-0 h-full w-[280px] border-l border-[rgba(106,60,255,0.15)] bg-[#0d0823] p-6 pt-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-2">
                {navItems.map((item, i) => {
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname === item.href || pathname?.startsWith(item.href + "/");
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm transition-all ${
                          isActive
                            ? "bg-gradient-to-r from-[rgba(106,60,255,0.2)] to-transparent text-white border border-[rgba(106,60,255,0.15)]"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <item.icon size={16} />
                          {item.label}
                        </span>
                        <ChevronRight size={14} className={isActive ? "opacity-100" : "opacity-0"} />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-6 border-t border-white/10 pt-6">
                <form action="/api/admin/logout" method="post">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(255,255,255,0.1)] bg-white/5 px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/10"
                  >
                    <LogOut size={16} />
                    Esci
                  </button>
                </form>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
