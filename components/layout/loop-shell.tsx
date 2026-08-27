"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useAccount } from "@/components/account/account-provider";
import { TinyAdzLoader } from "@/components/ads/tinyadz-loader";
import { PageTransition } from "@/components/app/page-transition";
import { CompareLiveChip } from "@/components/layout/compare-live-chip";
import { LoopShellProvider } from "@/components/layout/loop-shell-context";
import { SiteFooterV2 } from "@/components/layout/site-footer-v2";
import { emailLocalPart } from "@/components/account/workspace/workspace-model";
import {
  LOOP_RAIL_MIN_WIDTH_PX,
  loopPrimaryDestinations,
  loopShowsCatalogFooter,
  loopWordmarkHref,
  resolveLoopActiveDestination,
  type LoopAccountStatus,
  type LoopDestination,
  type LoopDestinationId,
} from "@/lib/navigation/loop-routes";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

import "@/styles/loop-shell.css";

function LoopSearchControl() {
  const setCommandOpen = useToolWorkspaceStore((state) => state.setCommandOpen);
  return (
    <button
      type="button"
      className="tv-loop__search"
      aria-label="Cerca"
      onClick={() => setCommandOpen(true)}
    >
      Cerca
    </button>
  );
}

function LoopAccountControl({ status }: { status: LoopAccountStatus }) {
  const account = useAccount();

  if (!account.authEnabled || status === "unavailable") return null;

  if (status === "loading") {
    return (
      <span className="tv-loop__account" aria-busy="true">
        Account
      </span>
    );
  }

  if (status !== "authenticated") {
    return (
      <Link href="/account" prefetch={false} className="tv-loop__account">
        Accedi
      </Link>
    );
  }

  return (
    <details className="tv-loop__account-menu">
      <summary className="tv-loop__account" aria-label="Account">
        {emailLocalPart(account.user?.email)}
      </summary>
      <div className="tv-loop__account-panel">
        <Link href="/account/settings" prefetch={false}>
          Impostazioni
        </Link>
        <button type="button" onClick={() => void account.signOut()}>
          Esci
        </button>
      </div>
    </details>
  );
}

function LoopPrimaryNav({
  destinations,
  active,
  variant,
}: {
  destinations: readonly LoopDestination[];
  active: LoopDestinationId | null;
  variant: "rail" | "tabs";
}) {
  if (destinations.length === 0) return null;

  return (
    <nav
      className={`tv-loop__nav tv-loop__nav--${variant}`}
      aria-label="Navigazione principale"
      data-loop-primary-nav={variant}
      style={{ ["--tv-loop-dest-count" as string]: String(destinations.length) }}
    >
      {destinations.map((item) => (
        <Link
          key={`${variant}-${item.id}`}
          href={item.href}
          prefetch={false}
          className="tv-loop__dest"
          data-loop-dest={item.id}
          aria-current={item.id === active ? "page" : undefined}
        >
          <span className="tv-loop__dest-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

function LoopShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const account = useAccount();
  const compareCount = useToolWorkspaceStore((state) => state.compareSlugs.length);
  const status: LoopAccountStatus = account.status;
  const destinations = loopPrimaryDestinations(status);
  const active = resolveLoopActiveDestination(
    pathname,
    searchParams?.toString() ?? "",
  );
  const showCatalogChrome = loopShowsCatalogFooter(pathname);
  const liveCompare = compareCount >= 1;

  useEffect(() => {
    document.body.dataset.loopShell = "on";
    return () => {
      delete document.body.dataset.loopShell;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      const desktop =
        typeof window.matchMedia === "function" &&
        window.matchMedia(`(min-width: ${LOOP_RAIL_MIN_WIDTH_PX}px)`).matches;
      if (desktop) {
        root.style.setProperty("--tv-bottom-nav-total", "0px");
        root.dataset.tvBottomNav = "off";
        return;
      }
      root.style.setProperty("--tv-bottom-nav-total", "62px");
      root.dataset.tvBottomNav = "loop";
    };
    sync();
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("resize", sync);
    };
  }, []);

  return (
    <div
      className="tv-loop"
      data-loop-shell=""
      data-loop-auth={status}
      data-compare-live={liveCompare ? "true" : "false"}
    >
      <header className="tv-loop__top">
        <Link
          href={loopWordmarkHref(status)}
          prefetch={false}
          className="tv-loop__brand"
        >
          TOOOLVIBES
        </Link>
        <div className="tv-loop__top-tools">
          <CompareLiveChip placement="header" />
          <LoopSearchControl />
          <LoopAccountControl status={status} />
        </div>
      </header>

      <div className="tv-loop__body">
        <aside className="tv-loop__rail">
          <LoopPrimaryNav
            destinations={destinations}
            active={active}
            variant="rail"
          />
        </aside>
        <main id="main-content" tabIndex={-1} className="tv-loop__main">
          <PageTransition>{children}</PageTransition>
          {showCatalogChrome ? <SiteFooterV2 /> : null}
        </main>
      </div>

      <div className="tv-loop__dock">
        <CompareLiveChip placement="dock" />
        <LoopPrimaryNav
          destinations={destinations}
          active={active}
          variant="tabs"
        />
      </div>
      {showCatalogChrome ? <TinyAdzLoader /> : null}
    </div>
  );
}

export function LoopShell({ children }: { children: React.ReactNode }) {
  return (
    <LoopShellProvider>
      <LoopShellInner>{children}</LoopShellInner>
    </LoopShellProvider>
  );
}

export function LoopShellFallback({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="tv-loop" data-loop-shell="" data-loop-pending="true">
      <main id="main-content" tabIndex={-1} className="tv-loop__main">
        {children}
      </main>
    </div>
  );
}
