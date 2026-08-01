export const GAMIFICATION_MODES = [
  "OFF",
  "LOCAL_NO_REWARD",
  "REWARDED",
] as const;

export type GamificationMode = (typeof GAMIFICATION_MODES)[number];

export const GAMIFICATION_SURFACE_KEYS = [
  "missions",
  "hiddenSignal",
  "arena",
  "prediction",
  "leaderboard",
  "vibeRush",
] as const;

export type GamificationSurfaceKey =
  (typeof GAMIFICATION_SURFACE_KEYS)[number];

type BooleanFeatureDefinition = Readonly<{
  owner: string;
  envKey: keyof ReleaseFeatureEnvironment;
  defaultEnabled: boolean;
}>;

type GamificationSurfaceDefinition = Readonly<{
  owner: string;
  envKey: keyof ReleaseFeatureEnvironment;
  defaultMode: GamificationMode;
  allowedModes: readonly GamificationMode[];
}>;

export type ReleaseFeatureEnvironment = Readonly<{
  TOOOLVIBES_PUBLIC_GATE_ENABLED?: string;
  TOOOLVIBES_3D_ENABLED?: string;
  TOOOLVIBES_AUDIO_ENABLED?: string;
  TOOOLVIBES_COMPARE_OBJECTIVE_ENABLED?: string;
  TOOOLVIBES_COMPARE_DECISION_ENABLED?: string;
  TOOOLVIBES_DECISION_MEMORY_BOARD_ENABLED?: string;
  TOOOLVIBES_UNIFIED_SEARCH_ENABLED?: string;
  TOOOLVIBES_GAMIFICATION_ENABLED?: string;
  TOOOLVIBES_GAMIFICATION_PERSISTENCE_ENABLED?: string;
  TOOOLVIBES_REWARD_BACKBONE_ENABLED?: string;
  TOOOLVIBES_REWARD_RUNTIME_ENABLED?: string;
  TOOOLVIBES_SIGNAL_EVENT_WRITES_ENABLED?: string;
  TOOOLVIBES_REWARD_DELIVERY_ENABLED?: string;
  TOOOLVIBES_SIGNAL_PROGRESS_UI_ENABLED?: string;
  TOOOLVIBES_SIGNAL_ACHIEVEMENTS_ENABLED?: string;
  TOOOLVIBES_SIGNAL_BADGE_CABINET_ENABLED?: string;
  TOOOLVIBES_REWARD_MILESTONES_ENABLED?: string;
  TOOOLVIBES_GAME_MISSIONS_MODE?: string;
  TOOOLVIBES_GAME_HIDDEN_SIGNAL_MODE?: string;
  TOOOLVIBES_GAME_ARENA_MODE?: string;
  TOOOLVIBES_GAME_PREDICTION_MODE?: string;
  TOOOLVIBES_GAME_LEADERBOARD_MODE?: string;
  TOOOLVIBES_GAME_VIBE_RUSH_MODE?: string;
}>;

export const releaseFeatureRegistry = {
  publicGate: {
    owner: "release-readiness",
    envKey: "TOOOLVIBES_PUBLIC_GATE_ENABLED",
    // The V1 product is public by default. A gate can still be enabled
    // explicitly for a contained maintenance window.
    defaultEnabled: false,
  },
  threeD: {
    owner: "frontend-experience",
    envKey: "TOOOLVIBES_3D_ENABLED",
    defaultEnabled: true,
  },
  audio: {
    owner: "frontend-experience",
    envKey: "TOOOLVIBES_AUDIO_ENABLED",
    defaultEnabled: true,
  },
  compareObjective: {
    owner: "product-compare",
    envKey: "TOOOLVIBES_COMPARE_OBJECTIVE_ENABLED",
    defaultEnabled: true,
  },
  compareDecision: {
    owner: "product-compare",
    envKey: "TOOOLVIBES_COMPARE_DECISION_ENABLED",
    defaultEnabled: true,
  },
  decisionMemoryBoard: {
    owner: "product-workspace",
    envKey: "TOOOLVIBES_DECISION_MEMORY_BOARD_ENABLED",
    defaultEnabled: true,
  },
  unifiedSearch: {
    owner: "product-discovery",
    envKey: "TOOOLVIBES_UNIFIED_SEARCH_ENABLED",
    defaultEnabled: true,
  },
  gamification: {
    owner: "product-engagement",
    envKey: "TOOOLVIBES_GAMIFICATION_ENABLED",
    defaultEnabled: false,
  },
  gamificationPersistence: {
    owner: "product-platform",
    envKey: "TOOOLVIBES_GAMIFICATION_PERSISTENCE_ENABLED",
    defaultEnabled: false,
  },
  rewardBackbone: {
    owner: "security-platform",
    envKey: "TOOOLVIBES_REWARD_BACKBONE_ENABLED",
    defaultEnabled: false,
  },
  rewardRuntime: {
    owner: "product-engagement",
    envKey: "TOOOLVIBES_REWARD_RUNTIME_ENABLED",
    defaultEnabled: false,
  },
  signalEventWrites: {
    owner: "security-platform",
    envKey: "TOOOLVIBES_SIGNAL_EVENT_WRITES_ENABLED",
    defaultEnabled: false,
  },
  rewardDelivery: {
    owner: "product-engagement",
    envKey: "TOOOLVIBES_REWARD_DELIVERY_ENABLED",
    defaultEnabled: false,
  },
  signalProgressUi: {
    owner: "product-engagement",
    envKey: "TOOOLVIBES_SIGNAL_PROGRESS_UI_ENABLED",
    defaultEnabled: false,
  },
  signalAchievements: {
    owner: "security-platform",
    envKey: "TOOOLVIBES_SIGNAL_ACHIEVEMENTS_ENABLED",
    defaultEnabled: false,
  },
  signalBadgeCabinet: {
    owner: "product-engagement",
    envKey: "TOOOLVIBES_SIGNAL_BADGE_CABINET_ENABLED",
    defaultEnabled: false,
  },
  rewardMilestones: {
    owner: "product-engagement",
    envKey: "TOOOLVIBES_REWARD_MILESTONES_ENABLED",
    defaultEnabled: false,
  },
} as const satisfies Record<string, BooleanFeatureDefinition>;

const ALL_GAMIFICATION_MODES = GAMIFICATION_MODES;
const NO_LOCAL_REWARD_MODE = ["OFF", "REWARDED"] as const;

export const gamificationSurfaceRegistry = {
  missions: {
    owner: "product-engagement",
    envKey: "TOOOLVIBES_GAME_MISSIONS_MODE",
    defaultMode: "OFF",
    allowedModes: ALL_GAMIFICATION_MODES,
  },
  hiddenSignal: {
    owner: "product-engagement",
    envKey: "TOOOLVIBES_GAME_HIDDEN_SIGNAL_MODE",
    defaultMode: "OFF",
    allowedModes: ALL_GAMIFICATION_MODES,
  },
  arena: {
    owner: "product-engagement",
    envKey: "TOOOLVIBES_GAME_ARENA_MODE",
    defaultMode: "OFF",
    allowedModes: ALL_GAMIFICATION_MODES,
  },
  prediction: {
    owner: "product-radar",
    envKey: "TOOOLVIBES_GAME_PREDICTION_MODE",
    defaultMode: "OFF",
    allowedModes: ALL_GAMIFICATION_MODES,
  },
  leaderboard: {
    owner: "product-engagement",
    envKey: "TOOOLVIBES_GAME_LEADERBOARD_MODE",
    defaultMode: "OFF",
    allowedModes: NO_LOCAL_REWARD_MODE,
  },
  vibeRush: {
    owner: "product-engagement",
    envKey: "TOOOLVIBES_GAME_VIBE_RUSH_MODE",
    defaultMode: "OFF",
    allowedModes: ALL_GAMIFICATION_MODES,
  },
} as const satisfies Record<
  GamificationSurfaceKey,
  GamificationSurfaceDefinition
>;

type ResolvedBooleanFeature = Readonly<{
  owner: string;
  defaultEnabled: boolean;
  enabled: boolean;
}>;

export type ResolvedGamificationSurface = Readonly<{
  owner: string;
  allowedModes: readonly GamificationMode[];
  defaultMode: GamificationMode;
  configuredMode: GamificationMode;
  mode: GamificationMode;
  surfaceEnabled: boolean;
  persistentRewardsEnabled: boolean;
}>;

export type ReleaseFeatureConfig = Readonly<{
  publicGate: ResolvedBooleanFeature;
  threeD: ResolvedBooleanFeature;
  audio: ResolvedBooleanFeature;
  compareObjective: ResolvedBooleanFeature;
  compareDecision: ResolvedBooleanFeature;
  decisionMemoryBoard: ResolvedBooleanFeature;
  unifiedSearch: ResolvedBooleanFeature;
  rewardRuntime: ResolvedBooleanFeature;
  signalEventWrites: ResolvedBooleanFeature;
  rewardDelivery: ResolvedBooleanFeature;
  signalProgressUi: ResolvedBooleanFeature;
  signalAchievements: ResolvedBooleanFeature;
  signalBadgeCabinet: ResolvedBooleanFeature;
  rewardMilestones: ResolvedBooleanFeature;
  gamification: Readonly<{
    owner: string;
    enabled: boolean;
    persistenceEnabled: boolean;
    rewardBackboneEnabled: boolean;
    hasEnabledSurface: boolean;
    hasRewardedSurface: boolean;
    surfaces: Readonly<
      Record<GamificationSurfaceKey, ResolvedGamificationSurface>
    >;
  }>;
}>;

export class ReleaseFeatureConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReleaseFeatureConfigError";
  }
}

function parseBooleanFlag(
  value: string | undefined,
  definition: BooleanFeatureDefinition,
) {
  if (value === undefined || value.trim() === "") {
    return definition.defaultEnabled;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "on", "yes"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "off", "no"].includes(normalized)) {
    return false;
  }

  throw new ReleaseFeatureConfigError(
    `${definition.envKey} must be a boolean flag (true/false or 1/0).`,
  );
}

function parseSurfaceMode(
  value: string | undefined,
  surfaceKey: GamificationSurfaceKey,
  definition: GamificationSurfaceDefinition,
) {
  const mode =
    value === undefined || value.trim() === ""
      ? definition.defaultMode
      : value.trim().toUpperCase();

  if (!GAMIFICATION_MODES.includes(mode as GamificationMode)) {
    throw new ReleaseFeatureConfigError(
      `${definition.envKey} has unknown mode "${mode}".`,
    );
  }

  if (!definition.allowedModes.includes(mode as GamificationMode)) {
    throw new ReleaseFeatureConfigError(
      `${surfaceKey} does not allow mode ${mode}. Allowed modes: ${definition.allowedModes.join(", ")}.`,
    );
  }

  return mode as GamificationMode;
}

function resolveBooleanFeature(
  environment: ReleaseFeatureEnvironment,
  definition: BooleanFeatureDefinition,
): ResolvedBooleanFeature {
  return Object.freeze({
    owner: definition.owner,
    defaultEnabled: definition.defaultEnabled,
    enabled: parseBooleanFlag(environment[definition.envKey], definition),
  });
}

function resolveSurface(
  environment: ReleaseFeatureEnvironment,
  surfaceKey: GamificationSurfaceKey,
  gamificationEnabled: boolean,
  persistenceEnabled: boolean,
  rewardBackboneEnabled: boolean,
): ResolvedGamificationSurface {
  const definition = gamificationSurfaceRegistry[surfaceKey];
  const configuredMode = parseSurfaceMode(
    environment[definition.envKey],
    surfaceKey,
    definition,
  );
  const mode = gamificationEnabled ? configuredMode : "OFF";

  if (
    mode === "REWARDED" &&
    (!persistenceEnabled || !rewardBackboneEnabled)
  ) {
    throw new ReleaseFeatureConfigError(
      `${surfaceKey} cannot be REWARDED unless gamification persistence and the GAM-901 reward backbone are enabled.`,
    );
  }

  return Object.freeze({
    owner: definition.owner,
    allowedModes: definition.allowedModes,
    defaultMode: definition.defaultMode,
    configuredMode,
    mode,
    surfaceEnabled: mode !== "OFF",
    persistentRewardsEnabled: mode === "REWARDED",
  });
}

export function createReleaseFeatureConfig(
  environment: ReleaseFeatureEnvironment = {},
): ReleaseFeatureConfig {
  const publicGate = resolveBooleanFeature(
    environment,
    releaseFeatureRegistry.publicGate,
  );
  const threeD = resolveBooleanFeature(
    environment,
    releaseFeatureRegistry.threeD,
  );
  const audio = resolveBooleanFeature(
    environment,
    releaseFeatureRegistry.audio,
  );
  const compareObjective = resolveBooleanFeature(
    environment,
    releaseFeatureRegistry.compareObjective,
  );
  const compareDecision = resolveBooleanFeature(
    environment,
    releaseFeatureRegistry.compareDecision,
  );
  const decisionMemoryBoard = resolveBooleanFeature(
    environment,
    releaseFeatureRegistry.decisionMemoryBoard,
  );
  const unifiedSearch = resolveBooleanFeature(
    environment,
    releaseFeatureRegistry.unifiedSearch,
  );
  const rewardRuntime = resolveBooleanFeature(
    environment,
    releaseFeatureRegistry.rewardRuntime,
  );
  const signalEventWrites = resolveBooleanFeature(
    environment,
    releaseFeatureRegistry.signalEventWrites,
  );
  const rewardDelivery = resolveBooleanFeature(
    environment,
    releaseFeatureRegistry.rewardDelivery,
  );
  const signalProgressUi = resolveBooleanFeature(
    environment,
    releaseFeatureRegistry.signalProgressUi,
  );
  const signalAchievements = resolveBooleanFeature(
    environment,
    releaseFeatureRegistry.signalAchievements,
  );
  const signalBadgeCabinet = resolveBooleanFeature(
    environment,
    releaseFeatureRegistry.signalBadgeCabinet,
  );
  const rewardMilestones = resolveBooleanFeature(
    environment,
    releaseFeatureRegistry.rewardMilestones,
  );
  const gamificationEnabled = parseBooleanFlag(
    environment[releaseFeatureRegistry.gamification.envKey],
    releaseFeatureRegistry.gamification,
  );
  const configuredPersistenceEnabled = parseBooleanFlag(
    environment[releaseFeatureRegistry.gamificationPersistence.envKey],
    releaseFeatureRegistry.gamificationPersistence,
  );
  const configuredRewardBackboneEnabled = parseBooleanFlag(
    environment[releaseFeatureRegistry.rewardBackbone.envKey],
    releaseFeatureRegistry.rewardBackbone,
  );

  // The global switch is a real kill switch: subordinate capabilities become
  // ineffective without requiring an emergency deployment that rewrites them.
  const persistenceEnabled =
    gamificationEnabled && configuredPersistenceEnabled;
  const rewardBackboneEnabled =
    gamificationEnabled && configuredRewardBackboneEnabled;

  const surfaces = Object.freeze({
    missions: resolveSurface(
      environment,
      "missions",
      gamificationEnabled,
      persistenceEnabled,
      rewardBackboneEnabled,
    ),
    hiddenSignal: resolveSurface(
      environment,
      "hiddenSignal",
      gamificationEnabled,
      persistenceEnabled,
      rewardBackboneEnabled,
    ),
    arena: resolveSurface(
      environment,
      "arena",
      gamificationEnabled,
      persistenceEnabled,
      rewardBackboneEnabled,
    ),
    prediction: resolveSurface(
      environment,
      "prediction",
      gamificationEnabled,
      persistenceEnabled,
      rewardBackboneEnabled,
    ),
    leaderboard: resolveSurface(
      environment,
      "leaderboard",
      gamificationEnabled,
      persistenceEnabled,
      rewardBackboneEnabled,
    ),
    vibeRush: resolveSurface(
      environment,
      "vibeRush",
      gamificationEnabled,
      persistenceEnabled,
      rewardBackboneEnabled,
    ),
  });
  const resolvedSurfaces = Object.values(surfaces);

  return Object.freeze({
    publicGate,
    threeD,
    audio,
    compareObjective,
    compareDecision,
    decisionMemoryBoard,
    unifiedSearch,
    rewardRuntime,
    signalEventWrites,
    rewardDelivery,
    signalProgressUi,
    signalAchievements,
    signalBadgeCabinet,
    rewardMilestones,
    gamification: Object.freeze({
      owner: releaseFeatureRegistry.gamification.owner,
      enabled: gamificationEnabled,
      persistenceEnabled,
      rewardBackboneEnabled,
      hasEnabledSurface: resolvedSurfaces.some(
        (surface) => surface.surfaceEnabled,
      ),
      hasRewardedSurface: resolvedSurfaces.some(
        (surface) => surface.persistentRewardsEnabled,
      ),
      surfaces,
    }),
  });
}

export function isPersistentRewardMutationAllowed(
  config: ReleaseFeatureConfig,
  surfaceKey: GamificationSurfaceKey,
) {
  const surface = config.gamification.surfaces[surfaceKey];
  return (
    config.gamification.enabled &&
    config.gamification.persistenceEnabled &&
    config.gamification.rewardBackboneEnabled &&
    surface.surfaceEnabled &&
    surface.persistentRewardsEnabled &&
    surface.mode === "REWARDED"
  );
}

export function isAnyPersistentRewardMutationAllowed(
  config: ReleaseFeatureConfig,
) {
  return GAMIFICATION_SURFACE_KEYS.some((surfaceKey) =>
    isPersistentRewardMutationAllowed(config, surfaceKey),
  );
}

export function assertAnyPersistentRewardMutationAllowed(
  config: ReleaseFeatureConfig,
) {
  if (!isAnyPersistentRewardMutationAllowed(config)) {
    throw new ReleaseFeatureConfigError(
      "Persistent reward access denied because no gamification surface is REWARDED.",
    );
  }
}

export function assertPersistentRewardMutationAllowed(
  config: ReleaseFeatureConfig,
  surfaceKey: GamificationSurfaceKey,
) {
  if (!isPersistentRewardMutationAllowed(config, surfaceKey)) {
    throw new ReleaseFeatureConfigError(
      `Persistent reward mutation denied for ${surfaceKey} in mode ${config.gamification.surfaces[surfaceKey].mode}.`,
    );
  }
}

export function readReleaseFeatureEnvironment(): ReleaseFeatureEnvironment {
  // Keep this allowlist explicit. In particular, secrets must never become
  // part of the serializable feature configuration passed to client layers.
  return {
    TOOOLVIBES_PUBLIC_GATE_ENABLED:
      process.env.TOOOLVIBES_PUBLIC_GATE_ENABLED,
    TOOOLVIBES_3D_ENABLED: process.env.TOOOLVIBES_3D_ENABLED,
    TOOOLVIBES_AUDIO_ENABLED: process.env.TOOOLVIBES_AUDIO_ENABLED,
    TOOOLVIBES_COMPARE_OBJECTIVE_ENABLED:
      process.env.TOOOLVIBES_COMPARE_OBJECTIVE_ENABLED,
    TOOOLVIBES_COMPARE_DECISION_ENABLED:
      process.env.TOOOLVIBES_COMPARE_DECISION_ENABLED,
    TOOOLVIBES_DECISION_MEMORY_BOARD_ENABLED:
      process.env.TOOOLVIBES_DECISION_MEMORY_BOARD_ENABLED,
    TOOOLVIBES_UNIFIED_SEARCH_ENABLED:
      process.env.TOOOLVIBES_UNIFIED_SEARCH_ENABLED,
    TOOOLVIBES_GAMIFICATION_ENABLED:
      process.env.TOOOLVIBES_GAMIFICATION_ENABLED,
    TOOOLVIBES_GAMIFICATION_PERSISTENCE_ENABLED:
      process.env.TOOOLVIBES_GAMIFICATION_PERSISTENCE_ENABLED,
    TOOOLVIBES_REWARD_BACKBONE_ENABLED:
      process.env.TOOOLVIBES_REWARD_BACKBONE_ENABLED,
    TOOOLVIBES_REWARD_RUNTIME_ENABLED:
      process.env.TOOOLVIBES_REWARD_RUNTIME_ENABLED,
    TOOOLVIBES_SIGNAL_EVENT_WRITES_ENABLED:
      process.env.TOOOLVIBES_SIGNAL_EVENT_WRITES_ENABLED,
    TOOOLVIBES_REWARD_DELIVERY_ENABLED:
      process.env.TOOOLVIBES_REWARD_DELIVERY_ENABLED,
    TOOOLVIBES_SIGNAL_PROGRESS_UI_ENABLED:
      process.env.TOOOLVIBES_SIGNAL_PROGRESS_UI_ENABLED,
    TOOOLVIBES_SIGNAL_ACHIEVEMENTS_ENABLED:
      process.env.TOOOLVIBES_SIGNAL_ACHIEVEMENTS_ENABLED,
    TOOOLVIBES_SIGNAL_BADGE_CABINET_ENABLED:
      process.env.TOOOLVIBES_SIGNAL_BADGE_CABINET_ENABLED,
    TOOOLVIBES_REWARD_MILESTONES_ENABLED:
      process.env.TOOOLVIBES_REWARD_MILESTONES_ENABLED,
    TOOOLVIBES_GAME_MISSIONS_MODE:
      process.env.TOOOLVIBES_GAME_MISSIONS_MODE,
    TOOOLVIBES_GAME_HIDDEN_SIGNAL_MODE:
      process.env.TOOOLVIBES_GAME_HIDDEN_SIGNAL_MODE,
    TOOOLVIBES_GAME_ARENA_MODE:
      process.env.TOOOLVIBES_GAME_ARENA_MODE,
    TOOOLVIBES_GAME_PREDICTION_MODE:
      process.env.TOOOLVIBES_GAME_PREDICTION_MODE,
    TOOOLVIBES_GAME_LEADERBOARD_MODE:
      process.env.TOOOLVIBES_GAME_LEADERBOARD_MODE,
    TOOOLVIBES_GAME_VIBE_RUSH_MODE:
      process.env.TOOOLVIBES_GAME_VIBE_RUSH_MODE,
  };
}

export const releaseFeatures = createReleaseFeatureConfig(
  readReleaseFeatureEnvironment(),
);
