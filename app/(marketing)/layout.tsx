import { AccountProvider } from "@/components/account/account-provider";
import { DiscoveryPersistenceProvider } from "@/components/discovery/discovery-persistence-provider";
import { SiteUniverseBackground } from "@/components/app/site-universe-background";
import { PageTransition } from "@/components/app/page-transition";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteFooterV2 } from "@/components/layout/site-footer-v2";
import { SiteHeaderV2 } from "@/components/layout/site-header-v2";
import { OrbitalProvider, OrbitalLayer } from "@/components/app/orbital-system";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="marketing-shell relative overflow-x-clip">
      <SiteUniverseBackground />
      <OrbitalProvider>
        <OrbitalLayer />
        <AccountProvider>
          <DiscoveryPersistenceProvider>
            <SiteHeaderV2 />
            <main className="relative z-10">
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
