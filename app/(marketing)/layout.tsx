import { cookies } from "next/headers";

import { AccountProvider } from "@/components/account/account-provider";
import { DiscoveryPersistenceProvider } from "@/components/discovery/discovery-persistence-provider";
import { PageTransition } from "@/components/app/page-transition";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteFooterV2 } from "@/components/layout/site-footer-v2";
import { SiteHeaderV2 } from "@/components/layout/site-header-v2";
import { Global3DLayer } from "@/components/3d-maestoso/global-3d-layer";
import { OrbitalProvider, OrbitalLayer } from "@/components/app/orbital-system";
import { gateCookieName } from "@/lib/gate/constants";
import { verifyGateToken } from "@/lib/gate/session";

export default async function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const gateCookie = cookieStore.get(gateCookieName);
  const isGateOpen = gateCookie ? await verifyGateToken(gateCookie.value) : false;

  if (!isGateOpen) {
    return <>{children}</>;
  }

  return (
    <div className="marketing-shell tv-figma-theme relative isolate overflow-x-clip" style={{ background: "var(--tv-bg-base)" }}>
      <a href="#main-content" className="skip-link">
        Salta al contenuto
      </a>
      <Global3DLayer />
      <OrbitalProvider>
        <OrbitalLayer />
        <AccountProvider>
          <DiscoveryPersistenceProvider>
            <SiteHeaderV2 />
            <main id="main-content" tabIndex={-1} className="relative z-10 pb-mobile-nav md:pb-0">
              <PageTransition>{children}</PageTransition>
            </main>
            <SiteFooterV2 />
            <MobileBottomNav />
          </DiscoveryPersistenceProvider>
        </AccountProvider>
      </OrbitalProvider>
    </div>
  );
}
