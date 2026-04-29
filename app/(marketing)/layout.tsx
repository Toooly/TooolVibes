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
    <div className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_22%_0%,rgba(168,85,247,0.24),transparent_58%),radial-gradient(circle_at_78%_6%,rgba(57,210,246,0.1),transparent_52%)]" />
      <AccountProvider>
        <DiscoveryPersistenceProvider>
          <SiteHeader />
          <main className="pb-20 lg:pb-0">{children}</main>
          <SiteFooter />
          <MobileBottomNav />
        </DiscoveryPersistenceProvider>
      </AccountProvider>
    </div>
  );
}
