/** Client-safe flag snapshot passed from server layouts. Never includes secrets. */

export type SignalClientFlagSnapshot = {
  eventWritesEnabled: boolean;
  progressionUiEnabled: boolean;
  deliveryEnabled: boolean;
  runtimeEnabled: boolean;
  achievementsEnabled: boolean;
  badgeCabinetEnabled: boolean;
  milestonesEnabled: boolean;
};

export function buildSignalClientFlagSnapshot(input: {
  gamificationEnabled: boolean;
  rewardBackboneEnabled: boolean;
  signalEventWritesEnabled: boolean;
  signalProgressUiEnabled: boolean;
  rewardDeliveryEnabled: boolean;
  rewardRuntimeEnabled: boolean;
  signalAchievementsEnabled: boolean;
  signalBadgeCabinetEnabled: boolean;
  rewardMilestonesEnabled: boolean;
}): SignalClientFlagSnapshot {
  const backbone = input.gamificationEnabled && input.rewardBackboneEnabled;
  return {
    eventWritesEnabled: backbone && input.signalEventWritesEnabled,
    progressionUiEnabled: backbone && input.signalProgressUiEnabled,
    deliveryEnabled:
      backbone && input.rewardDeliveryEnabled && input.rewardRuntimeEnabled,
    runtimeEnabled: input.rewardRuntimeEnabled,
    achievementsEnabled: backbone && input.signalAchievementsEnabled,
    badgeCabinetEnabled:
      backbone &&
      input.signalProgressUiEnabled &&
      input.signalBadgeCabinetEnabled,
    milestonesEnabled:
      backbone && input.rewardRuntimeEnabled && input.rewardMilestonesEnabled,
  };
}
