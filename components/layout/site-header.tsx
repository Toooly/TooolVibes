"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { marketingStrings } from "@/lib/config/strings";
import { siteConfig } from "@/lib/config/site";
import { getCompareTools } from "@/lib/discovery/local-storage";
import { cn } from "@/lib/utils";
import { AccountLink } from "@/components/account/account-link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ShortlistLink } from "@/components/tools/shortlist-link";

export function SiteHeader() {
  const pathname = usePathname();
  const [compareCount, setCompareCount] = useState(0);
  const primaryNav = useMemo(() => marketingStrings.nav, []);
  const isNavActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  const mobileSurface = useMemo(() => {
    if (pathname.startsWith("/archivio")) {
      return {
        label: "Archivio",
        badge: "Discovery",
      };
    }

    if (pathname.startsWith("/shortlist")) {
      return {
        label: "Workspace",
        badge: "Workspace",
      };
    }

    if (pathname.startsWith("/compare")) {
      return {
        label: "Compare",
        badge: "Decisione",
      };
    }

    if (pathname.startsWith("/collections/")) {
      return {
        label: "Collection",
        badge: "Percorso",
      };
    }

    if (pathname.startsWith("/collections")) {
      return {
        label: "Collections",
        badge: "Editoriale",
      };
    }

    if (pathname.startsWith("/posts")) {
      return {
        label: "Approfondimenti",
        badge: "Editoriale",
      };
    }

    if (pathname.startsWith("/toools/")) {
      return {
        label: "Profilo tool",
        badge: "Review",
      };
    }

    if (pathname.startsWith("/account")) {
      return {
        label: "Account",
        badge: "Persistenza",
      };
    }

    if (pathname.startsWith("/shop")) {
      return {
        label: "Premium",
        badge: "Premium",
      };
    }

    if (pathname.startsWith("/tags")) {
      return {
        label: "Tags",
        badge: "Mappa",
      };
    }

    return {
      label: "Home",
      badge: "TooolVibes",
    };
  }, [pathname]);

  useEffect(() => {
    const sync = () => setCompareCount(getCompareTools().length);

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("tooolvibes:discovery-sync", sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("tooolvibes:discovery-sync", sync);
    };
  }, []);

  return (
    <header className="page-shell sticky top-0 z-30 py-2 sm:py-3 lg:py-4">
      <div className="shell-panel brand-aura group rounded-[28px] px-3 py-2.5 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-2.5 sm:gap-4">
            <BrandLogo size={48} priority />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="font-display truncate text-[0.86rem] font-medium uppercase tracking-[0.18em] sm:text-[0.94rem] sm:tracking-[0.2em]">
                  {siteConfig.name}
                </p>
              </div>
              <p className="text-body-soft hidden max-w-[12.5rem] truncate text-[0.71rem] lg:block lg:max-w-none lg:text-[0.77rem]" style={{ color: "var(--muted-strong)" }}>
                Archivio editoriale AI e SaaS
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2.5 lg:flex">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "selection-chip shell-nav-pill text-ui-strong rounded-full px-4 py-2 text-sm font-medium",
                  isNavActive(item.href) && "is-active border text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
                  !isNavActive(item.href) && "text-[var(--muted-strong)]",
                )}
                style={{
                  borderColor: isNavActive(item.href) ? "var(--line)" : undefined,
                  background: isNavActive(item.href)
                    ? "linear-gradient(180deg, rgba(247,242,255,0.98), rgba(237,230,255,0.92))"
                    : undefined,
                  boxShadow: isNavActive(item.href)
                    ? "0 10px 28px rgba(67,48,199,0.08), inset 0 1px 0 rgba(255,255,255,0.58)"
                    : undefined,
                }}
              >
                {item.label}
              </Link>
            ))}
            <ShortlistLink
              label="Workspace"
              active={isNavActive("/shortlist")}
              className={cn(
                "shell-nav-pill",
                isNavActive("/shortlist") && "is-active border shadow-[0_10px_28px_rgba(67,48,199,0.08),inset_0_1px_0_rgba(255,255,255,0.58)]",
              )}
            />
            {compareCount > 1 || isNavActive("/compare") ? (
              <Link
                href="/compare"
                className={cn(
                  "selection-chip shell-nav-pill text-ui-strong inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium",
                  (isNavActive("/compare") || compareCount > 1) && "is-active",
                )}
                style={{
                  borderColor: isNavActive("/compare") ? "rgba(112,82,255,0.22)" : "var(--line)",
                  background:
                    isNavActive("/compare") || compareCount > 1
                      ? "linear-gradient(180deg, rgba(239,232,255,0.96), rgba(230,221,255,0.88))"
                      : "linear-gradient(180deg, rgba(252,249,255,0.88), rgba(246,241,255,0.84))",
                  color:
                    isNavActive("/compare") || compareCount > 1 ? "var(--accent-strong)" : "var(--muted-strong)",
                }}
              >
                <span>Compare</span>
                <span
                  className={`count-badge-live inline-flex min-w-[1.45rem] items-center justify-center rounded-full bg-white/80 px-1.5 py-0.5 text-[0.6rem] font-semibold ${
                    compareCount > 0 ? "is-active" : ""
                  } ${compareCount > 1 ? "is-ready" : ""}`}
                  style={{ color: compareCount > 0 ? "var(--accent-strong)" : "var(--muted)" }}
                >
                  {compareCount}
                </span>
              </Link>
            ) : null}
            <AccountLink className="shell-nav-pill" />
          </nav>
        </div>

        <div className="mt-2 space-y-2 border-t pt-2.5 soft-divider lg:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em]" style={{ color: "var(--muted)" }}>
              {mobileSurface.label}
            </p>
            <AccountLink variant="compact" />
          </div>

          <nav className="tool-rail -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "selection-chip shell-nav-pill text-ui-strong inline-flex shrink-0 items-center gap-2 rounded-full border px-3.25 py-1.5 text-[0.79rem] font-medium",
                  isNavActive(item.href) && "is-active",
                )}
                style={{
                  borderColor: "var(--line)",
                  background: isNavActive(item.href)
                    ? "linear-gradient(180deg, rgba(247,242,255,0.98), rgba(237,230,255,0.92))"
                    : "linear-gradient(180deg, rgba(252,249,255,0.88), rgba(246,241,255,0.84))",
                  color: isNavActive(item.href) ? "var(--foreground)" : "var(--muted-strong)",
                  boxShadow:
                    isNavActive(item.href)
                      ? "0 10px 24px rgba(67,48,199,0.08), inset 0 1px 0 rgba(255,255,255,0.58)"
                      : "inset 0 1px 0 rgba(255,255,255,0.48)",
                }}
              >
                <span>{item.label}</span>
              </Link>
            ))}
            <ShortlistLink
              label="Workspace"
              variant="subtle"
              active={isNavActive("/shortlist")}
              className="shell-nav-pill shrink-0"
            />
            {compareCount > 1 || isNavActive("/compare") ? (
              <Link
                href="/compare"
                className={cn(
                  "selection-chip shell-nav-pill text-ui-strong inline-flex shrink-0 items-center gap-2 rounded-full border px-3.25 py-1.5 text-[0.79rem] font-medium",
                  (isNavActive("/compare") || compareCount > 1) && "is-active",
                )}
                style={{
                  borderColor: isNavActive("/compare") ? "rgba(112,82,255,0.24)" : "var(--line)",
                  background:
                    isNavActive("/compare") || compareCount > 1
                      ? "linear-gradient(180deg, rgba(247,242,255,0.98), rgba(237,230,255,0.92))"
                      : "linear-gradient(180deg, rgba(252,249,255,0.88), rgba(246,241,255,0.84))",
                  color:
                    isNavActive("/compare") || compareCount > 1 ? "var(--foreground)" : "var(--muted-strong)",
                }}
              >
                <span>Compare</span>
                <span
                  className={`count-badge-live inline-flex min-w-[1.45rem] items-center justify-center rounded-full bg-white/80 px-1.5 py-0.5 text-[0.6rem] font-semibold ${
                    compareCount > 0 ? "is-active" : ""
                  } ${compareCount > 1 ? "is-ready" : ""}`}
                  style={{ color: compareCount > 0 ? "var(--accent-strong)" : "var(--muted)" }}
                >
                  {compareCount}
                </span>
              </Link>
            ) : null}
          </nav>
        </div>
      </div>
    </header>
  );
}
