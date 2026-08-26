"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

import { TinyAdzLoader } from "@/components/ads/tinyadz-loader";
import { PageTransition } from "@/components/app/page-transition";
import { CommandBar } from "@/components/layout/command-bar";
import {
  LoopShell,
  LoopShellFallback,
} from "@/components/layout/loop-shell";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { MobileTopBar } from "@/components/layout/mobile-top-bar";
import { SiteFooterV2 } from "@/components/layout/site-footer-v2";
import { isLoopRoute } from "@/lib/navigation/loop-routes";

export function isAccountAppPath(pathname: string | null | undefined): boolean {
  return pathname === "/account" || Boolean(pathname?.startsWith("/account/"));
}

export function MarketingChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (isLoopRoute(pathname)) {
    return (
      <Suspense fallback={<LoopShellFallback>{children}</LoopShellFallback>}>
        <LoopShell>{children}</LoopShell>
      </Suspense>
    );
  }

  return (
    <>
      <CommandBar />
      <MobileTopBar />
      <main
        id="main-content"
        tabIndex={-1}
        className="relative z-10 pb-mobile-nav xl:pb-0"
      >
        <PageTransition>{children}</PageTransition>
      </main>
      <SiteFooterV2 />
      <MobileBottomNav />
      <TinyAdzLoader />
    </>
  );
}
