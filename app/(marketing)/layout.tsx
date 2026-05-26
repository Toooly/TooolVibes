import { AccountProvider } from "@/components/account/account-provider";
import { DiscoveryPersistenceProvider } from "@/components/discovery/discovery-persistence-provider";
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
      <div className="absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(circle_at_22%_0%,rgba(167,139,250,0.22),transparent_58%),radial-gradient(circle_at_78%_6%,rgba(94,226,255,0.13),transparent_52%)]" />
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
