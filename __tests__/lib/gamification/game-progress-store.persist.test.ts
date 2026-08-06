// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { useGameProgressStore } from "@/lib/gamification/game-progress-store";

describe("game progress persistence", () => {
  it("does not persist celebration triggers", () => {
    useGameProgressStore.getState().setPendingBadge({ id: "badge", name: "Badge" } as never);
    useGameProgressStore.getState().setPendingLevelUp(4);
    const options = useGameProgressStore.persist.getOptions();
    const persisted = options.partialize?.(useGameProgressStore.getState());
    expect(persisted).not.toHaveProperty("pendingBadge");
    expect(persisted).not.toHaveProperty("pendingLevelUp");
  });

  it("migrates old state without pending celebration fields", () => {
    const migrate = useGameProgressStore.persist.getOptions().migrate;
    const migrated = migrate?.({
      claimedRewards: {}, totalXp: 4, profile: null, missions: [], badges: [],
      pendingBadge: { id: "old" }, pendingLevelUp: 3,
    }, 2) as Record<string, unknown>;
    expect(migrated).not.toHaveProperty("pendingBadge");
    expect(migrated).not.toHaveProperty("pendingLevelUp");
  });
});
