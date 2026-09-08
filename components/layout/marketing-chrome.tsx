"use client";

import { TinyAdzLoader } from "@/components/ads/tinyadz-loader";
import { PageTransition } from "@/components/app/page-transition";
import { CommandBar } from "@/components/layout/command-bar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { MobileTopBar } from "@/components/layout/mobile-top-bar";
import { CompareSessionDock } from "@/components/layout/compare-session-dock";
import { SiteFooterV2 } from "@/components/layout/site-footer-v2";

export function isAccountAppPath(pathname: string | null | undefined): boolean {
  return pathname === "/account" || Boolean(pathname?.startsWith("/account/"));
}

export function MarketingChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CommandBar />
      <MobileTopBar />
      <main
        id="main-content"
        tabIndex={-1}
        className="relative z-10"
      >
        <PageTransition>{children}</PageTransition>
      </main>
      <CompareSessionDock />
      <SiteFooterV2 />
      <MobileBottomNav />
      <TinyAdzLoader />
    </>
  );
}
