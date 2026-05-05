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
  { href: "/product-hunt", label: "Radar" },
  { href: "/wishlist", label: "Suggerisci" },
  { href: "/shop", label: "Shop" },
  { href: "/community", label: "Community" },
];

function HeaderSearchFallback({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/14 bg-white/9 p-1.5" aria-hidden="true">
      <div
        className={cn(
          "rounded-full bg-white/8",
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
      <div className="relative overflow-hidden rounded-[30px] border border-white/16 bg-[rgba(24,32,58,0.76)] px-3.5 py-3 shadow-[0_22px_70px_rgba(8,14,38,0.22)] backdrop-blur-2xl sm:px-4 lg:px-5">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.34),transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(168,85,247,0.12),transparent_30%),radial-gradient(circle_at_82%_0%,rgba(57,210,246,0.08),transparent_28%)]" />
        <div className="relative flex items-center justify-between gap-3">
          <Link href="/" className="group/brand flex min-w-0 items-center gap-3" aria-label="Vai alla home TooolVibes">
            <BrandLogo size={44} priority />
            <div className="min-w-0">
              <p className="truncate text-[0.86rem] font-semibold uppercase tracking-[0.18em] text-white sm:text-[0.95rem]">
                TooolVibes
              </p>
              <p className="hidden text-[0.74rem] text-white/50 2xl:block">
                AI tools discovery premium
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
                  "animated-link relative rounded-full px-3.5 py-2.5 text-[0.86rem] font-semibold transition-all duration-200",
                  isActive(item.href)
                    ? "bg-white/14 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]"
                    : "text-white/70 hover:bg-white/9 hover:text-white",
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
              className="premium-button premium-button-subtle hidden min-h-10 items-center rounded-full px-4 py-2 text-sm font-semibold text-white/78 transition-colors hover:text-white 2xl:inline-flex"
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
            className="premium-button premium-button-subtle mobile-menu-button inline-flex h-11 w-11 items-center justify-center rounded-full text-white xl:hidden"
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
          <div className="mobile-menu-panel relative mt-4 space-y-4 border-t border-white/10 pt-4 xl:hidden">
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
                    "animated-link rounded-[18px] border px-4 py-3 text-sm font-semibold transition duration-200",
                    isActive(item.href)
                      ? "border-violet-200/25 bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                      : "border-white/10 bg-white/6 text-white/76 hover:border-white/18 hover:bg-white/9 hover:text-white",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="grid gap-2 sm:grid-cols-2">
              <PremiumLink href="/wishlist">
                Suggerisci un tool
              </PremiumLink>
              <Link
                href="/account"
                className="premium-button premium-button-subtle rounded-full px-4 py-3 text-center text-sm font-semibold text-white/82"
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
