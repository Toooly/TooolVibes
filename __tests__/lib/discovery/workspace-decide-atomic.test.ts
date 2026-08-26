import { describe, expect, it } from "vitest";

import { chooseResumeAction } from "@/lib/account/workspace-pipeline";
import {
  createEmptyWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-contract";
import type { WorkspaceAction } from "@/lib/discovery/types";

const T0 = "2026-08-26T10:00:00.000Z";
const T1 = "2026-08-26T11:00:00.000Z";
const T2 = "2026-08-26T12:00:00.000Z";

function apply(actions: WorkspaceAction[]) {
  return actions.reduce(
    (state, action) => reduceWorkspaceState(state, action),
    createEmptyWorkspaceState(),
  );
}

function battleThenDecide(
  extra: Partial<Extract<WorkspaceAction, { type: "workspace/decide" }>> = {},
) {
  return apply([
    { type: "saved/set", slug: "cursor", saved: true, at: T0 },
    { type: "saved/set", slug: "v0", saved: true, at: T0 },
    { type: "saved/set", slug: "linear", saved: true, at: T0 },
    { type: "compare/toggle", slug: "cursor", at: T0 },
    { type: "compare/toggle", slug: "v0", at: T0 },
    { type: "stacks/create", id: "ai-coding", name: "AI Coding", at: T0 },
    { type: "stacks/add", id: "ai-coding", slug: "linear", at: T0 },
    {
      type: "workspace/decide",
      slug: "cursor",
      outcome: "selected",
      at: T1,
      eventId: "decide-cursor",
      ...extra,
    },
  ]);
}

describe("workspace/decide atomic contract", () => {
  it("T3: updates the relationship snapshot", () => {
    const state = battleThenDecide();
    expect(state.toolStates.cursor?.decision?.outcome).toBe("selected");
    expect(state.toolStates.cursor?.decision?.updatedAt).toBe(T1);
    expect(state.saved.slugs).toContain("cursor");
  });

  it("T4: appends exactly one decided event", () => {
    const state = battleThenDecide();
    expect(state.events).toHaveLength(1);
    expect(state.events[0]).toMatchObject({
      id: "decide-cursor",
      type: "decided",
      slug: "cursor",
      outcome: "selected",
    });
  });

  it("T5: freezes compare slugs as alternatives", () => {
    const state = battleThenDecide();
    expect(state.toolStates.cursor?.alternatives).toEqual(["cursor", "v0"]);
    expect(state.events[0]?.alternatives).toEqual(["cursor", "v0"]);
  });

  it("T6: clears the compare tray in the same reduce", () => {
    const state = battleThenDecide();
    expect(state.compare.slugs).toEqual([]);
    expect(state.compare.updatedAt).toBe(T1);
  });

  it("T7: preserves unrelated workspace state", () => {
    const state = battleThenDecide();
    expect(state.saved.slugs).toEqual(["cursor", "v0", "linear"]);
    expect(state.personalStacks[0]?.slugs).toEqual(["linear"]);
    expect(state.toolStates.linear).toBeUndefined();
  });

  it("T8: completed battle is no longer eligible for resume", () => {
    const state = battleThenDecide();
    expect(chooseResumeAction(state, T2).kind).not.toBe("continue_compare");
  });

  it("duplicate event id does not append a second decided event", () => {
    const first = battleThenDecide();
    const second = reduceWorkspaceState(first, {
      type: "workspace/decide",
      slug: "cursor",
      outcome: "selected",
      at: T2,
      eventId: "decide-cursor",
    });
    expect(second.events).toHaveLength(1);
    expect(second.compare.slugs).toEqual([]);
  });

  it("legacy tool/decision still leaves the tray (Wave 0 contract)", () => {
    const state = apply([
      { type: "compare/toggle", slug: "cursor", at: T0 },
      { type: "compare/toggle", slug: "v0", at: T0 },
      { type: "tool/decision", slug: "cursor", outcome: "selected", at: T1 },
    ]);
    expect(state.compare.slugs).toEqual(["cursor", "v0"]);
    expect(state.events).toEqual([]);
  });
});
