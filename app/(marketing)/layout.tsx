import { cookies } from "next/headers";

import { AccountProvider } from "@/components/account/account-provider";
import { DiscoveryPersistenceProvider } from "@/components/discovery/canonical-discovery-persistence-provider";
import { PageTransition } from "@/components/app/page-transition";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteFooterV2 } from "@/components/layout/site-footer-v2";
import { SiteHeaderV2 } from "@/components/layout/site-header-v2";
import { OrbitalProvider } from "@/components/app/orbital-system";
import { releaseFeatures } from "@/lib/config/release-features";
import { gateCookieName } from "@/lib/gate/constants";
import { verifyGateToken } from "@/lib/gate/session";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export default async function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const gateCookie = cookieStore.get(gateCookieName);
  const isGateOpen =
    !releaseFeatures.publicGate.enabled ||
    (gateCookie ? await verifyGateToken(gateCookie.value) : false);
  const { url: supabaseUrl, anonKey: supabaseAnonKey } =
    getSupabasePublicEnv();
  const initialAuthEnabled = Boolean(supabaseUrl && supabaseAnonKey);

  if (!isGateOpen) {
    return <>{children}</>;
  }

  return (
    <div className="marketing-shell relative isolate overflow-x-clip" style={{ background: "var(--tv-bg-base)" }}>
      <a href="#main-content" className="skip-link">
        Salta al contenuto
      </a>
      <OrbitalProvider>
        <AccountProvider initialAuthEnabled={initialAuthEnabled}>
          <DiscoveryPersistenceProvider>
            <SiteHeaderV2 />
            <main id="main-content" tabIndex={-1} className="relative z-10 pb-mobile-nav pt-[var(--tv-header-height)] md:pt-[var(--tv-header-height)] md:pb-0">
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
