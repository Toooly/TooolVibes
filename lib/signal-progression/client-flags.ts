/** Client-safe flag snapshot passed from server layouts. Never includes secrets. */

export type SignalClientFlagSnapshot = {
  eventWritesEnabled: boolean;
  progressionUiEnabled: boolean;
  deliveryEnabled: boolean;
  runtimeEnabled: boolean;
};

export function buildSignalClientFlagSnapshot(input: {
  gamificationEnabled: boolean;
  rewardBackboneEnabled: boolean;
  signalEventWritesEnabled: boolean;
  signalProgressUiEnabled: boolean;
  rewardDeliveryEnabled: boolean;
  rewardRuntimeEnabled: boolean;
}): SignalClientFlagSnapshot {
  const backbone = input.gamificationEnabled && input.rewardBackboneEnabled;
  return {
    eventWritesEnabled: backbone && input.signalEventWritesEnabled,
    progressionUiEnabled: backbone && input.signalProgressUiEnabled,
    deliveryEnabled:
      backbone && input.rewardDeliveryEnabled && input.rewardRuntimeEnabled,
    runtimeEnabled: input.rewardRuntimeEnabled,
  };
}
