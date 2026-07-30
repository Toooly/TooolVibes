import "server-only";

import {
  createReleaseFeatureConfig,
  type ReleaseFeatureConfig,
} from "@/lib/config/release-features";

export function canWriteSignalEvents(
  config: ReleaseFeatureConfig = createReleaseFeatureConfig(),
): boolean {
  return (
    config.gamification.rewardBackboneEnabled &&
    config.signalEventWrites.enabled
  );
}

export function canDeliverSignalRewards(
  config: ReleaseFeatureConfig = createReleaseFeatureConfig(),
): boolean {
  return (
    config.gamification.rewardBackboneEnabled &&
    config.rewardDelivery.enabled &&
    config.rewardRuntime.enabled
  );
}

export function canReadSignalProgressionUi(
  config: ReleaseFeatureConfig = createReleaseFeatureConfig(),
): boolean {
  return (
    config.gamification.rewardBackboneEnabled &&
    config.signalProgressUi.enabled
  );
}

export function canReadSignalProgress(
  config: ReleaseFeatureConfig = createReleaseFeatureConfig(),
): boolean {
  return canReadSignalProgressionUi(config);
}

export function canEvaluateSignalAchievements(
  config: ReleaseFeatureConfig = createReleaseFeatureConfig(),
): boolean {
  return (
    config.gamification.rewardBackboneEnabled &&
    config.signalAchievements.enabled
  );
}

export function canReadSignalBadgeCabinet(
  config: ReleaseFeatureConfig = createReleaseFeatureConfig(),
): boolean {
  return (
    config.gamification.rewardBackboneEnabled &&
    config.signalProgressUi.enabled &&
    config.signalBadgeCabinet.enabled
  );
}

export function canPresentRewardMilestones(
  config: ReleaseFeatureConfig = createReleaseFeatureConfig(),
): boolean {
  return (
    config.gamification.rewardBackboneEnabled &&
    config.rewardRuntime.enabled &&
    config.rewardMilestones.enabled
  );
}
