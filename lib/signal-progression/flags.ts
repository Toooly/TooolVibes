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
