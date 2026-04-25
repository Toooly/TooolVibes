import { AccountProvider } from "@/components/account/account-provider";
import { DiscoveryPersistenceProvider } from "@/components/discovery/discovery-persistence-provider";
import { CompareTray } from "@/components/tools/compare-tray";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),transparent_62%)]" />
      <AccountProvider>
        <DiscoveryPersistenceProvider>
          <SiteHeader />
          <main>{children}</main>
          <CompareTray />
          <SiteFooter />
        </DiscoveryPersistenceProvider>
      </AccountProvider>
    </div>
  );
}
