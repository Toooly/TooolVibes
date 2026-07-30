import "server-only";

import {
  releaseFeatures,
  type ReleaseFeatureConfig,
} from "@/lib/config/release-features";

export function canWriteSignalEvents(
  config: ReleaseFeatureConfig = releaseFeatures,
): boolean {
  return (
    config.gamification.rewardBackboneEnabled &&
    config.signalEventWrites.enabled
  );
}

export function canDeliverSignalRewards(
  config: ReleaseFeatureConfig = releaseFeatures,
): boolean {
  return (
    config.gamification.rewardBackboneEnabled &&
    config.rewardDelivery.enabled &&
    config.rewardRuntime.enabled
  );
}

export function canReadSignalProgressionUi(
  config: ReleaseFeatureConfig = releaseFeatures,
): boolean {
  return (
    config.gamification.rewardBackboneEnabled &&
    config.signalProgressUi.enabled
  );
}

export function canReadSignalProgress(
  config: ReleaseFeatureConfig = releaseFeatures,
): boolean {
  return canReadSignalProgressionUi(config);
}

export function canEvaluateSignalAchievements(
  config: ReleaseFeatureConfig = releaseFeatures,
): boolean {
  return (
    config.gamification.rewardBackboneEnabled &&
    config.signalAchievements.enabled
  );
}

export function canReadSignalBadgeCabinet(
  config: ReleaseFeatureConfig = releaseFeatures,
): boolean {
  return (
    config.gamification.rewardBackboneEnabled &&
    config.signalProgressUi.enabled &&
    config.signalBadgeCabinet.enabled
  );
}

export function canPresentRewardMilestones(
  config: ReleaseFeatureConfig = releaseFeatures,
): boolean {
  return (
    config.gamification.rewardBackboneEnabled &&
    config.rewardRuntime.enabled &&
    config.rewardMilestones.enabled
  );
}
