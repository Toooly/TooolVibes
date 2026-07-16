import { beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  getPublishedTools: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: dependencies.createClient,
}));
vi.mock("@/lib/supabase/admin-client", () => ({
  createAdminSupabaseClient: dependencies.createAdminClient,
}));
vi.mock("@/lib/supabase/tool-repository", () => ({
  getPublicPublishedToolsFromSupabase: dependencies.getPublishedTools,
}));
vi.mock("@/lib/config/release-features", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/config/release-features")
  >();
  return {
    ...actual,
    releaseFeatures: actual.createReleaseFeatureConfig(),
  };
});

import {
  checkAndAwardBadges,
  claimHiddenSignal,
  claimMission,
  createArenaBattle,
  createRadarPrediction,
  discoverTool,
  getOrCreateGameProfile,
  recordGameInteraction,
} from "@/lib/gamification/actions";

const guardedCalls = [
  ["shared profile", () => getOrCreateGameProfile()],
  ["XP interaction", () => recordGameInteraction("vibeRush", 10)],
  ["mission claim", () => claimMission("mission-id")],
  ["prediction", () => createRadarPrediction("tool-slug")],
  [
    "hidden signal",
    () => claimHiddenSignal("2026-07-16", "tool-slug", ["tool-slug"]),
  ],
  ["arena", () => createArenaBattle("1v1", ["one", "two"])],
  ["collection", () => discoverTool("tool-slug")],
  ["badge award", () => checkAndAwardBadges("missions")],
] as const;

describe("gamification server action release guards", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(guardedCalls)(
    "denies %s before any data client is created",
    async (_name, call) => {
      await expect(call()).rejects.toThrow(/denied/);
      expect(dependencies.createClient).not.toHaveBeenCalled();
      expect(dependencies.createAdminClient).not.toHaveBeenCalled();
      expect(dependencies.getPublishedTools).not.toHaveBeenCalled();
    },
  );
});
