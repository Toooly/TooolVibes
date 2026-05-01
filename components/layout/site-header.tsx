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
    <div className="flex items-center gap-2" aria-hidden="true">
      <div
        className={cn(
          "rounded-full border border-white/10 bg-white/8",
          compact ? "h-[42px] flex-1" : "h-[42px] w-full",
        )}
      />
      {compact ? null : (
        <div className="h-[42px] w-[74px] rounded-full bg-[linear-gradient(135deg,var(--accent),#8a61ff)] opacity-70" />
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
    <header className="page-shell sticky top-0 z-40 py-2.5 sm:py-4">
      <div className="rounded-[30px] border border-white/10 bg-[#0c0c1b]/82 px-4 py-3 shadow-[0_20px_70px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:px-5 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Vai alla home TooolVibes">
            <BrandLogo size={46} priority />
            <div className="min-w-0">
              <p className="truncate text-[0.9rem] font-semibold uppercase tracking-[0.2em] text-white sm:text-[0.98rem]">
                TooolVibes
              </p>
              <p className="hidden text-[0.76rem] text-white/48 2xl:block">
                AI tools discovery premium
              </p>
            </div>
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-2 text-[0.82rem] font-semibold transition-all duration-200",
                  isActive(item.href)
                    ? "bg-white/10 text-white"
                    : "text-white/62 hover:bg-white/8 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden w-full max-w-[18rem] lg:block 2xl:max-w-[22rem]">
            <Suspense fallback={<HeaderSearchFallback />}>
              <DirectoryHeaderSearch />
            </Suspense>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/account"
              className="hidden rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-semibold text-white/78 transition-colors hover:border-white/20 hover:text-white 2xl:inline-flex"
            >
              Login
            </Link>
            <PremiumLink href="/wishlist" size="sm" className="px-4">
              Suggerisci
            </PremiumLink>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white xl:hidden"
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
          <div className="mt-4 space-y-4 border-t border-white/10 pt-4 xl:hidden">
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
                    "rounded-[18px] border px-4 py-3 text-sm font-semibold",
                    isActive(item.href)
                      ? "border-white/18 bg-white/12 text-white"
                      : "border-white/10 bg-white/6 text-white/76",
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
                className="rounded-full border border-white/10 bg-white/8 px-4 py-3 text-center text-sm font-semibold text-white/82"
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
