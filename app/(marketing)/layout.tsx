import { cookies } from "next/headers";

import { AccountProvider } from "@/components/account/account-provider";
import { RewardAuthBridge } from "@/components/rewards/reward-auth-bridge";
import { SignalDeliveryBridge } from "@/components/rewards/signal-delivery-bridge";
import { SignalProductBridge } from "@/components/rewards/signal-product-bridge";
import {
  SignalAchievementFlagsProvider,
  SignalProgressUiProvider,
} from "@/lib/signal-progression/release-context";
import { DiscoveryPersistenceProvider } from "@/components/discovery/canonical-discovery-persistence-provider";
import { PageTransition } from "@/components/app/page-transition";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { MobileTopBar } from "@/components/layout/mobile-top-bar";
import { CommandBar } from "@/components/layout/command-bar";
import { SiteFooterV2 } from "@/components/layout/site-footer-v2";
import { OrbitalProvider } from "@/components/app/orbital-system";
import { releaseFeatures } from "@/lib/config/release-features";
import { buildSignalClientFlagSnapshot } from "@/lib/signal-progression/client-flags";
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
  const signalDeliveryEnabled =
    releaseFeatures.rewardRuntime.enabled &&
    releaseFeatures.rewardDelivery.enabled &&
    releaseFeatures.gamification.rewardBackboneEnabled;
  const signalProgressUiEnabled =
    releaseFeatures.signalProgressUi.enabled &&
    releaseFeatures.gamification.rewardBackboneEnabled;
  const signalClientFlags = buildSignalClientFlagSnapshot({
    gamificationEnabled: releaseFeatures.gamification.enabled,
    rewardBackboneEnabled: releaseFeatures.gamification.rewardBackboneEnabled,
    signalEventWritesEnabled: releaseFeatures.signalEventWrites.enabled,
    signalProgressUiEnabled: releaseFeatures.signalProgressUi.enabled,
    rewardDeliveryEnabled: releaseFeatures.rewardDelivery.enabled,
    rewardRuntimeEnabled: releaseFeatures.rewardRuntime.enabled,
    signalAchievementsEnabled: releaseFeatures.signalAchievements.enabled,
    signalBadgeCabinetEnabled: releaseFeatures.signalBadgeCabinet.enabled,
    rewardMilestonesEnabled: releaseFeatures.rewardMilestones.enabled,
  });

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
          <SignalProgressUiProvider enabled={signalProgressUiEnabled}>
          <SignalAchievementFlagsProvider flags={signalClientFlags}>
          <RewardAuthBridge />
          <SignalDeliveryBridge enabled={signalDeliveryEnabled} />
          <SignalProductBridge flags={signalClientFlags} />
          <DiscoveryPersistenceProvider>
            {/* Definitive shell (2026-07-24): CommandBar (xl+), MobileTopBar (<xl),
                MobileBottomNav (<xl). The previous SiteHeaderV2 is removed. */}
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
          </DiscoveryPersistenceProvider>
          </SignalAchievementFlagsProvider>
          </SignalProgressUiProvider>
        </AccountProvider>
      </OrbitalProvider>
    </div>
  );
}
