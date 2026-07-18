import { describe, expect, it } from "vitest";

import {
  createReleaseFeatureConfig,
  ReleaseFeatureConfigError,
  releaseFeatureRegistry,
} from "@/lib/config/release-features";

describe("decisionMemoryBoard release flag (B32)", () => {
  it("is registered with owner, env key and a safe enabled default", () => {
    const definition = releaseFeatureRegistry.decisionMemoryBoard;

    expect(definition.owner.length).toBeGreaterThan(0);
    expect(definition.envKey).toBe("TOOOLVIBES_DECISION_MEMORY_BOARD_ENABLED");
    expect(definition.defaultEnabled).toBe(true);
  });

  it("defaults to enabled and resolves explicit boolean overrides", () => {
    expect(createReleaseFeatureConfig().decisionMemoryBoard.enabled).toBe(true);
    expect(
      createReleaseFeatureConfig({
        TOOOLVIBES_DECISION_MEMORY_BOARD_ENABLED: "0",
      }).decisionMemoryBoard.enabled,
    ).toBe(false);
    expect(
      createReleaseFeatureConfig({
        TOOOLVIBES_DECISION_MEMORY_BOARD_ENABLED: "true",
      }).decisionMemoryBoard.enabled,
    ).toBe(true);
  });

  it("rejects malformed flag values", () => {
    expect(() =>
      createReleaseFeatureConfig({
        TOOOLVIBES_DECISION_MEMORY_BOARD_ENABLED: "maybe",
      }),
    ).toThrow(ReleaseFeatureConfigError);
  });
});
