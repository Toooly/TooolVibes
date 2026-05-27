import { AccountProvider } from "@/components/account/account-provider";
import { DiscoveryPersistenceProvider } from "@/components/discovery/discovery-persistence-provider";
import { SiteDepthSystem } from "@/components/app/site-depth-system";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="marketing-shell relative overflow-x-clip">
      <div className="marketing-shell__backplane" />
      <SiteDepthSystem />
      <AccountProvider>
        <DiscoveryPersistenceProvider>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
          <MobileBottomNav />
        </DiscoveryPersistenceProvider>
      </AccountProvider>
    </div>
  );
}
