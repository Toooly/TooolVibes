import { AccountProvider } from "@/components/account/account-provider";
import { DiscoveryPersistenceProvider } from "@/components/discovery/discovery-persistence-provider";
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
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 28%, rgba(237, 233, 254, 0.96) 0%, rgba(247, 245, 255, 0.98) 48%, #f7f5ff 100%)",
        }}
        aria-hidden="true"
      />
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
