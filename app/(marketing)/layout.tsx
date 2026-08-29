import { cookies } from "next/headers";

import { AccountProvider } from "@/components/account/account-provider";
import { AuthContinuationProvider } from "@/components/account/auth-continuation-provider";
import { RewardAuthBridge } from "@/components/rewards/reward-auth-bridge";
import { SignalDeliveryBridge } from "@/components/rewards/signal-delivery-bridge";
import { SignalProductBridge } from "@/components/rewards/signal-product-bridge";
import {
  SignalAchievementFlagsProvider,
  SignalProgressUiProvider,
} from "@/lib/signal-progression/release-context";
import { DiscoveryPersistenceProvider } from "@/components/discovery/canonical-discovery-persistence-provider";
import { TinyAdzLifecycle } from "@/components/ads/tinyadz-lifecycle";
import { AdvertisingConsentProvider } from "@/components/ads/advertising-consent-provider";
import { ConsentBanner } from "@/components/ads/consent-banner";
import { ConsentSettingsDialog } from "@/components/ads/consent-settings-dialog";
import { MarketingChrome } from "@/components/layout/marketing-chrome";
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
      <AdvertisingConsentProvider>
      <OrbitalProvider>
        <AccountProvider initialAuthEnabled={initialAuthEnabled}>
          <AuthContinuationProvider>
          <SignalProgressUiProvider enabled={signalProgressUiEnabled}>
          <SignalAchievementFlagsProvider flags={signalClientFlags}>
          <RewardAuthBridge />
          <SignalDeliveryBridge enabled={signalDeliveryEnabled} />
          <SignalProductBridge flags={signalClientFlags} />
          <DiscoveryPersistenceProvider>
            <MarketingChrome>{children}</MarketingChrome>
          </DiscoveryPersistenceProvider>
          <TinyAdzLifecycle />
          <ConsentBanner />
          <ConsentSettingsDialog />
          </SignalAchievementFlagsProvider>
          </SignalProgressUiProvider>
          </AuthContinuationProvider>
        </AccountProvider>
      </OrbitalProvider>
      </AdvertisingConsentProvider>
    </div>
  );
}
