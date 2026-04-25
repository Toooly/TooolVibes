"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { DirectoryHeaderSearch } from "@/components/directory/directory-header-search";
import { BrandLogo } from "@/components/layout/brand-logo";
import { cn } from "@/lib/utils";

const primaryNav = [
  { href: "/", label: "Home" },
  { href: "/archivio", label: "Archivio dei Toools" },
  { href: "/tags", label: "Tags" },
  { href: "/shop", label: "Digital Shop" },
];

function HeaderSearchFallback({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      <div
        className={`rounded-full border border-[rgba(92,72,170,0.14)] bg-white/86 ${compact ? "h-[42px]" : "h-[42px]"} flex-1`}
      />
      <div className="h-[42px] w-[86px] rounded-full bg-[linear-gradient(135deg,var(--accent),#8a61ff)] opacity-70" />
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const isActive = useMemo(
    () => (href: string) =>
      pathname === href || (href !== "/" && pathname.startsWith(`${href}/`)),
    [pathname],
  );

  return (
    <header className="page-shell sticky top-0 z-40 py-2.5 sm:py-4">
      <div className="rounded-[30px] border border-[rgba(83,63,170,0.12)] bg-white/84 px-4 py-3 shadow-[0_20px_55px_rgba(32,19,99,0.08)] backdrop-blur sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <BrandLogo size={46} priority />
            <div className="min-w-0">
              <p className="truncate text-[0.9rem] font-semibold uppercase tracking-[0.2em] text-[var(--foreground)] sm:text-[0.98rem]">
                TooolVibes
              </p>
              <p className="hidden text-[0.76rem] text-[var(--muted)] lg:block">
                Premium directory per tool AI, no-code e vibe coding
              </p>
            </div>
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-center px-4 lg:flex">
            <nav className="flex items-center gap-2">
              {primaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200",
                    isActive(item.href)
                      ? "bg-[rgba(109,59,255,0.1)] text-[var(--accent-strong)]"
                      : "text-[var(--muted-strong)] hover:bg-[rgba(109,59,255,0.06)]",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden w-full max-w-[28rem] lg:block">
            <Suspense fallback={<HeaderSearchFallback />}>
              <DirectoryHeaderSearch />
            </Suspense>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/account"
              className="rounded-full border border-[rgba(83,63,170,0.12)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
            >
              Login
            </Link>
            <Link
              href="/account#account-upgrade"
              className="rounded-full bg-[linear-gradient(135deg,var(--accent),#8a61ff)] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(95,66,255,0.16)]"
            >
              Sign Up
            </Link>
            <Link
              href="/archivio"
              className="rounded-full border border-[rgba(83,63,170,0.12)] bg-[rgba(246,244,255,0.92)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)]"
            >
              Scopri i Toools
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(83,63,170,0.12)] bg-white text-[var(--foreground)] lg:hidden"
            aria-label={isOpen ? "Chiudi menu" : "Apri menu"}
            aria-expanded={isOpen}
          >
            <span className="flex flex-col gap-1.5">
              <span className={cn("h-0.5 w-5 rounded-full bg-current transition-transform duration-200", isOpen && "translate-y-2 rotate-45")} />
              <span className={cn("h-0.5 w-5 rounded-full bg-current transition-opacity duration-200", isOpen && "opacity-0")} />
              <span className={cn("h-0.5 w-5 rounded-full bg-current transition-transform duration-200", isOpen && "-translate-y-2 -rotate-45")} />
            </span>
          </button>
        </div>

        {isOpen ? (
          <div className="mt-4 space-y-4 border-t border-[rgba(83,63,170,0.08)] pt-4 lg:hidden">
            <Suspense fallback={<HeaderSearchFallback compact />}>
              <DirectoryHeaderSearch compact onSubmitted={() => setIsOpen(false)} />
            </Suspense>

            <nav className="grid gap-2">
              {primaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-[18px] border px-4 py-3 text-sm font-semibold",
                    isActive(item.href)
                      ? "border-[rgba(108,76,255,0.2)] bg-[rgba(109,59,255,0.08)] text-[var(--accent-strong)]"
                      : "border-[rgba(83,63,170,0.1)] bg-white text-[var(--foreground)]",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="grid gap-2 sm:grid-cols-3">
              <Link
                href="/account"
                className="rounded-full border border-[rgba(83,63,170,0.12)] bg-white px-4 py-3 text-center text-sm font-semibold text-[var(--foreground)]"
              >
                Login
              </Link>
              <Link
                href="/account#account-upgrade"
                className="rounded-full bg-[linear-gradient(135deg,var(--accent),#8a61ff)] px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Sign Up
              </Link>
              <Link
                href="/archivio"
                className="rounded-full border border-[rgba(83,63,170,0.12)] bg-[rgba(246,244,255,0.92)] px-4 py-3 text-center text-sm font-semibold text-[var(--accent-strong)]"
              >
                Scopri i Toools
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
