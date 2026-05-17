"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { DirectoryHeaderSearch } from "@/components/directory/directory-header-search";
import { BrandLogo } from "@/components/layout/brand-logo";
import { PremiumLink } from "@/components/ui/premium";
import { cn } from "@/lib/utils";

const primaryNav = [
  { href: "/", label: "Home" },
  { href: "/archivio", label: "Catalogo" },
  { href: "/product-hunt", label: "Radar live" },
  { href: "/wishlist", label: "Suggerisci" },
  { href: "/shop", label: "Shop" },
  { href: "/community", label: "Community" },
];

function HeaderSearchFallback({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[linear-gradient(135deg,#fff,#f3efff)] p-1.5" aria-hidden="true">
      <div
        className={cn(
          "rounded-full bg-[rgba(106,60,255,0.08)]",
          compact ? "h-9 flex-1" : "h-9 w-full",
        )}
      />
      {compact ? null : (
        <div className="h-9 w-[74px] rounded-full bg-[linear-gradient(135deg,var(--accent),#8a61ff)] opacity-70" />
      )}
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
    <header className="site-header-motion page-shell sticky top-0 z-40 py-2.5 sm:py-4">
      <div className="relative overflow-hidden rounded-[30px] border border-[rgba(76,55,166,0.14)] bg-[linear-gradient(135deg,#fffdf8_0%,#f4efff_52%,#edf7ff_100%)] px-3.5 py-3 shadow-[0_18px_54px_rgba(47,33,126,0.11)] sm:px-4 lg:px-5">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(106,60,255,0.28),transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(168,85,247,0.1),transparent_30%),radial-gradient(circle_at_82%_0%,rgba(57,210,246,0.08),transparent_28%)]" />
        <div className="relative flex items-center justify-between gap-3">
          <Link href="/" className="group/brand flex min-w-0 items-center gap-3" aria-label="Vai alla home TooolVibes">
            <BrandLogo size={44} priority />
            <div className="min-w-0">
              <p className="truncate text-[0.86rem] font-semibold uppercase tracking-[0.18em] text-[var(--foreground)] sm:text-[0.95rem]">
                TooolVibes
              </p>
              <p className="hidden items-center gap-1.5 text-[0.74rem] text-[var(--muted)] 2xl:flex">
                <span className="live-signal-dot scale-[0.72]" aria-hidden="true" />
                AI tools discovery system
              </p>
            </div>
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1.5 xl:flex">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "animated-link dynamic-link-card relative rounded-full px-3.5 py-2.5 text-[0.86rem] font-semibold transition-all duration-200",
                  isActive(item.href)
                    ? "bg-[rgba(106,60,255,0.12)] text-[var(--accent-strong)] shadow-[inset_0_1px_0_rgba(255,255,255,0.62)]"
                    : "text-[var(--muted-strong)] hover:bg-white/70 hover:text-[var(--accent-strong)]",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden w-full max-w-[19rem] lg:block 2xl:max-w-[24rem]">
            <Suspense fallback={<HeaderSearchFallback />}>
              <DirectoryHeaderSearch />
            </Suspense>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/account"
              className="premium-button premium-button-subtle hidden min-h-10 items-center rounded-full px-4 py-2 text-sm font-semibold 2xl:inline-flex"
            >
              Login
            </Link>
            <PremiumLink href="/wishlist" size="sm" tone="premium" className="px-4 shadow-[0_16px_42px_rgba(124,58,237,0.24)]">
              Suggerisci
            </PremiumLink>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="premium-button premium-button-subtle mobile-menu-button inline-flex h-11 w-11 items-center justify-center rounded-full xl:hidden"
            aria-label={isOpen ? "Chiudi menu" : "Apri menu"}
            aria-expanded={isOpen}
          >
            <span className="flex flex-col gap-1.5">
              <span
                className={cn(
                  "h-0.5 w-5 rounded-full bg-current transition-transform duration-200",
                  isOpen && "translate-y-2 rotate-45",
                )}
              />
              <span
                className={cn(
                  "h-0.5 w-5 rounded-full bg-current transition-opacity duration-200",
                  isOpen && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "h-0.5 w-5 rounded-full bg-current transition-transform duration-200",
                  isOpen && "-translate-y-2 -rotate-45",
                )}
              />
            </span>
          </button>
        </div>

        {isOpen ? (
          <div className="mobile-menu-panel relative mt-4 space-y-4 xl:hidden">
            <Suspense fallback={<HeaderSearchFallback compact />}>
              <DirectoryHeaderSearch compact onSubmitted={() => setIsOpen(false)} />
            </Suspense>

            <nav className="grid gap-2 sm:grid-cols-2">
              {primaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "animated-link dynamic-link-card mobile-nav-link rounded-[18px] px-4 py-3 text-sm font-semibold transition duration-200",
                    isActive(item.href)
                      ? "bg-[rgba(106,60,255,0.1)] text-[var(--accent-strong)] shadow-[inset_0_1px_0_rgba(255,255,255,0.62)]"
                      : "bg-white/62 text-[var(--muted-strong)] hover:bg-white/86 hover:text-[var(--accent-strong)]",
                  )}
                >
                  <span className="mobile-nav-link__signal" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="grid gap-2 sm:grid-cols-2">
              <PremiumLink href="/wishlist">
                Suggerisci un tool
              </PremiumLink>
              <Link
                href="/account"
                className="premium-button premium-button-subtle rounded-full px-4 py-3 text-center text-sm font-semibold"
              >
                Login
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
