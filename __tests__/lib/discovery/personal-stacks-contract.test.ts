import { describe, expect, it } from "vitest";

import {
  mergeWorkspaceStates,
  normalizeWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-contract";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import { workspaceStateV1Schema } from "@/lib/discovery/schema";

const T0 = "2026-08-01T10:00:00.000Z";
const T1 = "2026-08-01T11:00:00.000Z";

describe("personal stacks contract", () => {
  it("creates, renames, adds, reorders and archives without touching stack.slugs", () => {
    let state = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "stacks/create",
      id: "ai-coding",
      name: "AI Coding",
      description: "Editor e agenti",
      at: T0,
    });
    state = reduceWorkspaceState(state, {
      type: "saved/set",
      slug: "cursor",
      saved: true,
      at: T0,
    });
    state = reduceWorkspaceState(state, {
      type: "stacks/add",
      id: "ai-coding",
      slug: "cursor",
      at: T0,
    });
    state = reduceWorkspaceState(state, {
      type: "stacks/add",
      id: "ai-coding",
      slug: "v0",
      at: T0,
    });
    state = reduceWorkspaceState(state, {
      type: "stacks/reorder",
      id: "ai-coding",
      slugs: ["v0", "cursor"],
      at: T1,
    });
    state = reduceWorkspaceState(state, {
      type: "stacks/rename",
      id: "ai-coding",
      name: "AI coding desk",
      at: T1,
    });
    state = reduceWorkspaceState(state, {
      type: "stacks/archive",
      id: "ai-coding",
      at: T1,
    });

    expect(state.stack.slugs).toEqual([]);
    expect(state.personalStacks).toHaveLength(1);
    expect(state.personalStacks[0]).toMatchObject({
      id: "ai-coding",
      name: "AI coding desk",
      slugs: ["v0", "cursor"],
      archivedAt: T1,
    });
    expect(workspaceStateV1Schema.safeParse(state).success).toBe(true);
  });

  it("merges stacks by id with last-write-wins", () => {
    const left = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "stacks/create",
      id: "ai-coding",
      name: "Left",
      at: T0,
    });
    const right = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "stacks/create",
      id: "ai-coding",
      name: "Right",
      at: T1,
    });

    expect(mergeWorkspaceStates(left, right).personalStacks[0]?.name).toBe("Right");
  });

  it("snapshots compare slugs when a decision is recorded", () => {
    let state = normalizeWorkspaceState({
      schemaVersion: 1,
      saved: { slugs: ["cursor", "v0"], updatedAt: T0 },
      compare: { slugs: ["cursor", "v0"], updatedAt: T0 },
      stack: { slugs: [], updatedAt: null },
      toolStates: {},
    });
    state = reduceWorkspaceState(state, {
      type: "tool/decision",
      slug: "cursor",
      outcome: "selected",
      at: T1,
    });

    expect(state.toolStates.cursor.alternatives).toEqual(["cursor", "v0"]);
    expect(state.toolStates.cursor.decision).toEqual({
      outcome: "selected",
      updatedAt: T1,
    });
  });
});
