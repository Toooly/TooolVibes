/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { replayStackCreateIntent } from "@/lib/auth/replay-stack-intent";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import {
  activateToolWorkspaceOwner,
  getCanonicalToolWorkspaceState,
} from "@/lib/stores/tool-workspace-store";
import type { PendingAuthIntent } from "@/lib/auth/pending-auth-intent";

function intent(overrides: Partial<PendingAuthIntent["payload"]> = {}): PendingAuthIntent {
  return {
    version: 1,
    id: "intent-replay-01",
    capability: "stack.create",
    payload: { toolSlug: "blink", ...overrides },
    returnTo: "/toools/blink",
    createdAt: "2026-08-29T10:00:00.000Z",
    expiresAt: "2026-08-29T10:30:00.000Z",
  };
}

describe("replay stack create intent", () => {
  beforeEach(() => {
    window.localStorage.clear();
    activateToolWorkspaceOwner(
      { kind: "account", userId: "u1" },
      createEmptyWorkspaceState(),
    );
  });

  afterEach(() => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
  });

  it("creates a named stack and saves the tool", () => {
    const result = replayStackCreateIntent(
      intent({ desiredStackName: "Podcast" }),
    );
    expect(result.status).toBe("ok");
    const state = getCanonicalToolWorkspaceState();
    expect(state.saved.slugs).toContain("blink");
    expect(state.personalStacks.some((stack) => stack.name === "Podcast")).toBe(true);
    expect(
      state.personalStacks.find((stack) => stack.name === "Podcast")?.slugs,
    ).toContain("blink");
  });

  it("is idempotent when the tool is already in a stack of that name", () => {
    replayStackCreateIntent(intent({ desiredStackName: "Podcast" }));
    replayStackCreateIntent(intent({ desiredStackName: "Podcast" }));
    const stacks = getCanonicalToolWorkspaceState().personalStacks.filter(
      (stack) => stack.name === "Podcast",
    );
    expect(stacks).toHaveLength(1);
    expect(stacks[0].slugs.filter((slug) => slug === "blink")).toHaveLength(1);
  });

  it("skips when the viewer is still a guest", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    const result = replayStackCreateIntent(intent({ desiredStackName: "Podcast" }));
    expect(result.status).toBe("skipped");
    expect(getCanonicalToolWorkspaceState().personalStacks).toEqual([]);
  });
});
