import { afterEach, describe, expect, it, vi } from "vitest";

import {
  assertAnyPersistentRewardMutationAllowed,
  assertPersistentRewardMutationAllowed,
  createReleaseFeatureConfig,
  GAMIFICATION_SURFACE_KEYS,
  gamificationSurfaceRegistry,
  isAnyPersistentRewardMutationAllowed,
  isPersistentRewardMutationAllowed,
  readReleaseFeatureEnvironment,
  ReleaseFeatureConfigError,
  releaseFeatureRegistry,
  type ReleaseFeatureEnvironment,
} from "@/lib/config/release-features";

const rewardedEnvironment = {
  TOOOLVIBES_GAMIFICATION_ENABLED: "true",
  TOOOLVIBES_GAMIFICATION_PERSISTENCE_ENABLED: "true",
  TOOOLVIBES_REWARD_BACKBONE_ENABLED: "true",
} satisfies ReleaseFeatureEnvironment;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("release feature registry", () => {
  it("declares an owner and a safe default for every release feature", () => {
    for (const definition of Object.values(releaseFeatureRegistry)) {
      expect(definition.owner.length).toBeGreaterThan(0);
      expect(typeof definition.defaultEnabled).toBe("boolean");
      expect(definition.envKey.startsWith("TOOOLVIBES_")).toBe(true);
    }
  });

  it("declares owner, default and allowed modes for every game surface", () => {
    expect(Object.keys(gamificationSurfaceRegistry).sort()).toEqual(
      [...GAMIFICATION_SURFACE_KEYS].sort(),
    );

    for (const definition of Object.values(gamificationSurfaceRegistry)) {
      expect(definition.owner.length).toBeGreaterThan(0);
      expect(definition.allowedModes).toContain(definition.defaultMode);
      expect(definition.envKey.startsWith("TOOOLVIBES_GAME_")).toBe(true);
    }
  });

  it("does not allow a local-only leaderboard", () => {
    expect(
      gamificationSurfaceRegistry.leaderboard.allowedModes,
    ).not.toContain("LOCAL_NO_REWARD");

    expect(() =>
      createReleaseFeatureConfig({
        TOOOLVIBES_GAMIFICATION_ENABLED: "true",
        TOOOLVIBES_GAME_LEADERBOARD_MODE: "LOCAL_NO_REWARD",
      }),
    ).toThrow(ReleaseFeatureConfigError);
  });
});

describe("release feature resolution", () => {
  it("uses conservative SSR-safe defaults without reading browser globals", () => {
    const config = createReleaseFeatureConfig();

    expect(config.publicGate.enabled).toBe(false);
    expect(config.threeD.enabled).toBe(true);
    expect(config.audio.enabled).toBe(true);
    expect(config.gamification.enabled).toBe(false);
    expect(config.gamification.persistenceEnabled).toBe(false);
    expect(config.gamification.rewardBackboneEnabled).toBe(false);
    expect(config.gamification.hasEnabledSurface).toBe(false);
    expect(config.gamification.hasRewardedSurface).toBe(false);

    for (const surface of Object.values(config.gamification.surfaces)) {
      expect(surface.mode).toBe("OFF");
      expect(surface.surfaceEnabled).toBe(false);
      expect(surface.persistentRewardsEnabled).toBe(false);
    }
  });

  it("parses boolean flags explicitly", () => {
    const config = createReleaseFeatureConfig({
      TOOOLVIBES_PUBLIC_GATE_ENABLED: "0",
      TOOOLVIBES_3D_ENABLED: "off",
      TOOOLVIBES_AUDIO_ENABLED: "NO",
    });

    expect(config.publicGate.enabled).toBe(false);
    expect(config.threeD.enabled).toBe(false);
    expect(config.audio.enabled).toBe(false);
  });

  it("rejects malformed boolean and mode values", () => {
    expect(() =>
      createReleaseFeatureConfig({
        TOOOLVIBES_PUBLIC_GATE_ENABLED: "sometimes",
      }),
    ).toThrow(ReleaseFeatureConfigError);

    expect(() =>
      createReleaseFeatureConfig({
        TOOOLVIBES_GAMIFICATION_ENABLED: "true",
        TOOOLVIBES_GAME_MISSIONS_MODE: "PARTIAL",
      }),
    ).toThrow(ReleaseFeatureConfigError);
  });

  it.each(["OFF", "LOCAL_NO_REWARD"] as const)(
    "resolves missions mode %s without persistent rewards",
    (mode) => {
      const config = createReleaseFeatureConfig({
        TOOOLVIBES_GAMIFICATION_ENABLED: "true",
        TOOOLVIBES_GAME_MISSIONS_MODE: mode,
      });
      const missions = config.gamification.surfaces.missions;

      expect(missions.mode).toBe(mode);
      expect(missions.surfaceEnabled).toBe(mode !== "OFF");
      expect(missions.persistentRewardsEnabled).toBe(false);
      expect(
        isPersistentRewardMutationAllowed(config, "missions"),
      ).toBe(false);
    },
  );

  it("resolves REWARDED only with persistence and GAM-901 enabled", () => {
    const config = createReleaseFeatureConfig({
      ...rewardedEnvironment,
      TOOOLVIBES_GAME_MISSIONS_MODE: "REWARDED",
    });
    const missions = config.gamification.surfaces.missions;

    expect(missions.mode).toBe("REWARDED");
    expect(missions.surfaceEnabled).toBe(true);
    expect(missions.persistentRewardsEnabled).toBe(true);
    expect(config.gamification.hasRewardedSurface).toBe(true);
    expect(isPersistentRewardMutationAllowed(config, "missions")).toBe(true);
    expect(() =>
      assertPersistentRewardMutationAllowed(config, "missions"),
    ).not.toThrow();
  });

  it.each([
    {
      TOOOLVIBES_GAMIFICATION_ENABLED: "true",
      TOOOLVIBES_GAME_MISSIONS_MODE: "REWARDED",
    },
    {
      TOOOLVIBES_GAMIFICATION_ENABLED: "true",
      TOOOLVIBES_GAMIFICATION_PERSISTENCE_ENABLED: "true",
      TOOOLVIBES_GAME_MISSIONS_MODE: "REWARDED",
    },
    {
      TOOOLVIBES_GAMIFICATION_ENABLED: "true",
      TOOOLVIBES_REWARD_BACKBONE_ENABLED: "true",
      TOOOLVIBES_GAME_MISSIONS_MODE: "REWARDED",
    },
  ] satisfies ReleaseFeatureEnvironment[])(
    "rejects a rewarded surface with missing prerequisites",
    (environment) => {
      expect(() => createReleaseFeatureConfig(environment)).toThrow(
        /persistence and the GAM-901 reward backbone/,
      );
    },
  );

  it("uses the global gamification flag as an overriding kill switch", () => {
    const config = createReleaseFeatureConfig({
      TOOOLVIBES_GAMIFICATION_ENABLED: "false",
      TOOOLVIBES_GAMIFICATION_PERSISTENCE_ENABLED: "true",
      TOOOLVIBES_REWARD_BACKBONE_ENABLED: "true",
      TOOOLVIBES_GAME_MISSIONS_MODE: "REWARDED",
      TOOOLVIBES_GAME_ARENA_MODE: "LOCAL_NO_REWARD",
    });

    expect(config.gamification.enabled).toBe(false);
    expect(config.gamification.persistenceEnabled).toBe(false);
    expect(config.gamification.rewardBackboneEnabled).toBe(false);
    expect(config.gamification.surfaces.missions.configuredMode).toBe(
      "REWARDED",
    );
    expect(config.gamification.surfaces.missions.mode).toBe("OFF");
    expect(config.gamification.surfaces.arena.mode).toBe("OFF");
    expect(config.gamification.hasEnabledSurface).toBe(false);
  });

  it("allows shared reward access only when at least one surface is rewarded", () => {
    const disabledConfig = createReleaseFeatureConfig();
    expect(isAnyPersistentRewardMutationAllowed(disabledConfig)).toBe(false);
    expect(() =>
      assertAnyPersistentRewardMutationAllowed(disabledConfig),
    ).toThrow(/no gamification surface is REWARDED/);

    const rewardedConfig = createReleaseFeatureConfig({
      ...rewardedEnvironment,
      TOOOLVIBES_GAME_ARENA_MODE: "REWARDED",
    });
    expect(isAnyPersistentRewardMutationAllowed(rewardedConfig)).toBe(true);
    expect(() =>
      assertAnyPersistentRewardMutationAllowed(rewardedConfig),
    ).not.toThrow();
  });

  it("denies direct reward calls for OFF and LOCAL_NO_REWARD surfaces", () => {
    const config = createReleaseFeatureConfig({
      ...rewardedEnvironment,
      TOOOLVIBES_GAME_MISSIONS_MODE: "LOCAL_NO_REWARD",
      TOOOLVIBES_GAME_ARENA_MODE: "OFF",
    });

    expect(() =>
      assertPersistentRewardMutationAllowed(config, "missions"),
    ).toThrow(/denied for missions in mode LOCAL_NO_REWARD/);
    expect(() =>
      assertPersistentRewardMutationAllowed(config, "arena"),
    ).toThrow(/denied for arena in mode OFF/);
  });

  it.each(GAMIFICATION_SURFACE_KEYS)(
    "supports REWARDED for the %s surface when all invariants hold",
    (surfaceKey) => {
      const definition = gamificationSurfaceRegistry[surfaceKey];
      const config = createReleaseFeatureConfig({
        ...rewardedEnvironment,
        [definition.envKey]: "REWARDED",
      });

      expect(config.gamification.surfaces[surfaceKey].surfaceEnabled).toBe(
        true,
      );
      expect(
        config.gamification.surfaces[surfaceKey]
          .persistentRewardsEnabled,
      ).toBe(true);
      expect(
        isPersistentRewardMutationAllowed(config, surfaceKey),
      ).toBe(true);
    },
  );
});

describe("server environment allowlist", () => {
  it("reads only non-secret release flags", () => {
    vi.stubEnv("TOOOLVIBES_PUBLIC_GATE_ENABLED", "false");
    vi.stubEnv("TOOOLVIBES_SESSION_SECRET", "must-not-leak");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "must-not-leak");

    const environment = readReleaseFeatureEnvironment();

    expect(environment.TOOOLVIBES_PUBLIC_GATE_ENABLED).toBe("false");
    expect(environment).not.toHaveProperty("TOOOLVIBES_SESSION_SECRET");
    expect(environment).not.toHaveProperty("SUPABASE_SERVICE_ROLE_KEY");
  });
});
