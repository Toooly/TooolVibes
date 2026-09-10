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
import { CommercialClockProvider } from "@/components/monetization/commercial-clock";
import { ConsentBanner } from "@/components/ads/consent-banner";
import { ConsentSettingsDialog } from "@/components/ads/consent-settings-dialog";
import { MarketingChrome } from "@/components/layout/marketing-chrome";
import { OrbitalProvider } from "@/components/app/orbital-system";
import { releaseFeatures } from "@/lib/config/release-features";
import { buildSignalClientFlagSnapshot } from "@/lib/signal-progression/client-flags";
import { isPublicProductOpen } from "@/lib/gate/public-product-open";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export default async function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isGateOpen = isPublicProductOpen();
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
    // v3.2 P1: children (footer consent link, embeds) assume the consent
    // context even when the product gate is closed (E2E/prerender). The
    // banner, dialog and lifecycle stay inside the open branch.
    return <AdvertisingConsentProvider>{children}</AdvertisingConsentProvider>;
  }

  const renderNowMs = Date.now();

  return (
    <div className="marketing-shell relative isolate overflow-x-clip" style={{ background: "var(--tv-bg-base)" }}>
      <a href="#main-content" className="skip-link">
        Salta al contenuto
      </a>
      <AdvertisingConsentProvider>
      <CommercialClockProvider nowMs={renderNowMs}>
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
      </CommercialClockProvider>
      </AdvertisingConsentProvider>
    </div>
  );
}
