import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import { reduceWorkspaceState } from "@/lib/discovery/workspace-contract";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";
import type { SignalProgressHub } from "@/lib/signal-progression/hub-contracts";

const T0 = "2026-06-01T10:00:00.000Z";
const T_OLD = "2026-04-01T10:00:00.000Z";
const T1 = "2026-06-02T10:00:00.000Z";
const T2 = "2026-06-03T10:00:00.000Z";

function apply(
  state: WorkspaceStateV1,
  actions: Parameters<typeof reduceWorkspaceState>[1][],
) {
  return actions.reduce((current, action) => reduceWorkspaceState(current, action), state);
}

export const workspaceTestFixtures = {
  guestEmpty: createEmptyWorkspaceState(),
  newAuthenticated: createEmptyWorkspaceState(),
  withSaved: apply(createEmptyWorkspaceState(), [
    { type: "saved/set", slug: "cursor", saved: true, at: T0 },
    { type: "tool/save-reason", slug: "cursor", saveReason: "test", at: T0 },
  ]),
  withCompare: apply(createEmptyWorkspaceState(), [
    { type: "saved/set", slug: "cursor", saved: true, at: T0 },
    { type: "saved/set", slug: "v0", saved: true, at: T0 },
    { type: "compare/toggle", slug: "cursor", at: T1 },
    { type: "compare/toggle", slug: "v0", at: T1 },
  ]),
  withDecisions: apply(createEmptyWorkspaceState(), [
    { type: "saved/set", slug: "cursor", saved: true, at: T0 },
    { type: "saved/set", slug: "v0", saved: true, at: T0 },
    { type: "compare/toggle", slug: "cursor", at: T1 },
    { type: "compare/toggle", slug: "v0", at: T1 },
    { type: "tool/decision", slug: "cursor", outcome: "selected", at: T2 },
    { type: "tool/decision", slug: "v0", outcome: "rejected", at: T2 },
  ]),
  withStacks: apply(createEmptyWorkspaceState(), [
    { type: "saved/set", slug: "cursor", saved: true, at: T0 },
    {
      type: "stacks/create",
      id: "ai-coding",
      name: "AI Coding",
      description: "Agenti e editor",
      at: T1,
    },
    { type: "stacks/add", id: "ai-coding", slug: "cursor", at: T1 },
  ]),
  mature: apply(createEmptyWorkspaceState(), [
    ...Array.from({ length: 52 }, (_, index) => {
      const slug = index < 5
        ? (["cursor", "v0", "meku", "blink", "linear"] as const)[index]
        : `qa-tool-${String(index + 1).padStart(2, "0")}`;
      return {
        type: "saved/set" as const,
        slug,
        saved: true,
        at: index < 8 ? T_OLD : T0,
      };
    }),
    { type: "tool/stage", slug: "cursor", stage: "top", at: T0 },
    { type: "tool/stage", slug: "blink", stage: "review", at: T0 },
    { type: "tool/note", slug: "cursor", note: "Scelto per il daily coding.", at: T2 },
    { type: "tool/pin", slug: "cursor", pinned: true, at: T2 },
    { type: "tool/decision", slug: "cursor", outcome: "selected", at: T2 },
    { type: "tool/decision", slug: "v0", outcome: "rejected", at: T1 },
    { type: "tool/decision", slug: "meku", outcome: "deferred", at: T_OLD },
    { type: "tool/revisit", slug: "meku", revisitAt: T_OLD, at: T_OLD },
    { type: "tool/use-case", slug: "cursor", useCase: "pair programming", at: T2 },
    {
      type: "stacks/create",
      id: "client-stack",
      name: "Client stack",
      description: "Consegne clienti",
      at: T1,
    },
    { type: "stacks/add", id: "client-stack", slug: "linear", at: T1 },
    {
      type: "stacks/create",
      id: "ai-coding",
      name: "AI Coding",
      description: "Editor e agenti",
      at: T1,
    },
    { type: "stacks/add", id: "ai-coding", slug: "cursor", at: T1 },
    { type: "stacks/add", id: "ai-coding", slug: "v0", at: T1 },
    {
      type: "stacks/create",
      id: "free-stack",
      name: "Free stack",
      at: T2,
    },
    { type: "stacks/add", id: "free-stack", slug: "blink", at: T2 },
    { type: "compare/toggle", slug: "cursor", at: T2 },
    { type: "compare/toggle", slug: "blink", at: T2 },
    { type: "compare/toggle", slug: "linear", at: T2 },
  ]),
  degraded: createEmptyWorkspaceState(),
};

export function emptySignalHub(): SignalProgressHub {
  return {
    balance: 0,
    level: 1,
    levelTitle: "Esploratore",
    nextLevel: 2,
    nextThreshold: 150,
    progressInLevel: 0,
    explanation: "I Signal Point arrivano da azioni verificate.",
    missions: [],
    recentGrants: [],
    earnedBadgeCodes: [],
    badges: [],
    achievementProgress: {
      savedCount: 0,
      comparisonCount: 0,
      radarDays: 0,
      collectionJourneysCompleted: 0,
      profileComplete: false,
      level: 1,
    },
    profileContextComplete: false,
    profileContext: null,
    preferences: {
      reduceRewardAnimations: false,
      muteRewardSounds: false,
      quietMode: false,
      suppressAutomaticAchievements: false,
      suppressMajorCelebrations: false,
    },
    rulesVersion: "signal-progression-v1",
  };
}
