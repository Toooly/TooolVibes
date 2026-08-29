/**
 * Wave 0 characterization — CURRENT contracts before VNext Wave 1.
 *
 * VNext-flip: `tool/decision` currently leaves the compare tray intact
 * (zombie battle). Wave 1 adds `workspace/decide`, which must clear it.
 */
import { describe, expect, it } from "vitest";

import { chooseResumeAction } from "@/lib/account/workspace-pipeline";
import {
  buildWorkspaceExportPayload,
  isWorkspaceResetConfirmed,
} from "@/lib/account/workspace-export";
import { MAX_COMPARE_TOOLS } from "@/lib/discovery/workspace-constants";
import {
  createEmptyWorkspaceState,
  mergeWorkspaceStates,
  normalizeWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-contract";
import { mergeGuestWorkspaceContribution } from "@/lib/discovery/workspace-sync";
import { workspaceStateV1Schema } from "@/lib/discovery/schema";
import type { WorkspaceAction } from "@/lib/discovery/types";

const T0 = "2026-08-01T10:00:00.000Z";
const T1 = "2026-08-01T11:00:00.000Z";
const T2 = "2026-08-01T12:00:00.000Z";

function apply(actions: WorkspaceAction[]) {
  return actions.reduce(
    (state, action) => reduceWorkspaceState(state, action),
    createEmptyWorkspaceState(),
  );
}

describe("NORMALIZATION CONTRACT", () => {
  it("loads a legacy v1 blob that has no events field", () => {
    const state = normalizeWorkspaceState({
      schemaVersion: 1,
      clearedAt: null,
      saved: { slugs: ["cursor"], updatedAt: T0 },
      compare: { slugs: [], updatedAt: null },
      stack: { slugs: [], updatedAt: null },
      personalStacks: [],
      toolStates: {
        cursor: {
          stage: "saved",
          note: null,
          saveReason: null,
          pinned: false,
          decision: { outcome: "selected", updatedAt: T0 },
          updatedAt: T0,
        },
      },
    });

    expect(state.schemaVersion).toBe(1);
    expect(state.saved.slugs).toEqual(["cursor"]);
    expect(state.toolStates.cursor?.decision?.outcome).toBe("selected");
    expect(state).not.toHaveProperty("schemaVersion", 2);
  });

  it("returns empty state for a missing or future schemaVersion", () => {
    expect(normalizeWorkspaceState({ schemaVersion: 2 })).toEqual(
      createEmptyWorkspaceState(),
    );
    expect(normalizeWorkspaceState(null)).toEqual(createEmptyWorkspaceState());
  });

  it("strict schema rejects unknown top-level keys", () => {
    const base = createEmptyWorkspaceState();
    expect(
      workspaceStateV1Schema.safeParse({ ...base, extra: true }).success,
    ).toBe(false);
  });
});

describe("REDUCER CONTRACT — save / compare / stacks", () => {
  it("saved/set adds and removes membership without fabricating toolStates on save", () => {
    const saved = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "saved/set",
      slug: "cursor",
      saved: true,
      at: T0,
    });
    expect(saved.saved.slugs).toEqual(["cursor"]);
    expect(saved.toolStates.cursor).toBeUndefined();

    const unsaved = reduceWorkspaceState(saved, {
      type: "saved/set",
      slug: "cursor",
      saved: false,
      at: T1,
    });
    expect(unsaved.saved.slugs).toEqual([]);
  });

  it("compare/toggle adds, removes, and refuses a sixth candidate", () => {
    let state = createEmptyWorkspaceState();
    const slugs = ["a", "b", "c", "d", "e", "f"];
    for (const slug of slugs) {
      state = reduceWorkspaceState(state, {
        type: "compare/toggle",
        slug,
        at: T0,
      });
    }
    expect(state.compare.slugs).toHaveLength(MAX_COMPARE_TOOLS);
    expect(state.compare.slugs).toEqual(["a", "b", "c", "d", "e"]);

    const removed = reduceWorkspaceState(state, {
      type: "compare/toggle",
      slug: "a",
      at: T1,
    });
    expect(removed.compare.slugs).toEqual(["b", "c", "d", "e"]);
  });

  it("compare/clear empties the tray", () => {
    const state = apply([
      { type: "compare/toggle", slug: "cursor", at: T0 },
      { type: "compare/toggle", slug: "v0", at: T0 },
      { type: "compare/clear", at: T1 },
    ]);
    expect(state.compare.slugs).toEqual([]);
    expect(state.compare.updatedAt).toBe(T1);
  });

  it("personal stacks create and add without writing legacy stack", () => {
    const state = apply([
      { type: "stacks/create", id: "ai-coding", name: "AI Coding", at: T0 },
      { type: "stacks/add", id: "ai-coding", slug: "cursor", at: T1 },
    ]);
    expect(state.personalStacks[0]?.slugs).toEqual(["cursor"]);
    expect(state.stack.slugs).toEqual([]);
  });
});

describe("REDUCER CONTRACT — decision / zombie tray (CURRENT)", () => {
  it("tool/decision writes outcome and freezes compare slugs as alternatives", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "saved/set", slug: "v0", saved: true, at: T0 },
      { type: "compare/toggle", slug: "cursor", at: T0 },
      { type: "compare/toggle", slug: "v0", at: T0 },
      { type: "tool/decision", slug: "cursor", outcome: "selected", at: T1 },
    ]);

    expect(state.toolStates.cursor?.decision?.outcome).toBe("selected");
    expect(state.toolStates.cursor?.alternatives).toEqual(["cursor", "v0"]);
  });

  // VNext-flip: Wave 1 `workspace/decide` must clear the tray in the same reduce.
  it("CURRENT: tool/decision leaves leftover compare state (zombie tray)", () => {
    const state = apply([
      { type: "compare/toggle", slug: "cursor", at: T0 },
      { type: "compare/toggle", slug: "v0", at: T0 },
      { type: "tool/decision", slug: "cursor", outcome: "selected", at: T1 },
    ]);

    expect(state.compare.slugs).toEqual(["cursor", "v0"]);
    expect(state.toolStates.cursor?.decision?.outcome).toBe("selected");
  });

  it("tool/decision outcome null keeps alternatives (reopen snapshot)", () => {
    const decided = apply([
      { type: "compare/toggle", slug: "cursor", at: T0 },
      { type: "compare/toggle", slug: "v0", at: T0 },
      { type: "tool/decision", slug: "cursor", outcome: "selected", at: T1 },
    ]);
    const reopened = reduceWorkspaceState(decided, {
      type: "tool/decision",
      slug: "cursor",
      outcome: null,
      at: T2,
    });
    expect(reopened.toolStates.cursor?.decision?.outcome).toBeNull();
    expect(reopened.toolStates.cursor?.decision?.updatedAt).toBe(T2);
    expect(reopened.toolStates.cursor?.alternatives).toEqual(["cursor", "v0"]);
  });
});

describe("RESUME CONTRACT (CURRENT)", () => {
  it("prefers continue_compare while the tray has ≥2 tools and any undecided slug", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "saved/set", slug: "v0", saved: true, at: T0 },
      { type: "compare/toggle", slug: "cursor", at: T0 },
      { type: "compare/toggle", slug: "v0", at: T0 },
      { type: "tool/decision", slug: "cursor", outcome: "selected", at: T1 },
    ]);

    expect(state.compare.slugs).toEqual(["cursor", "v0"]);
    expect(chooseResumeAction(state, T2)).toEqual({
      kind: "continue_compare",
      slug: "cursor",
    });
  });

  it("does not continue_compare when every tray slug already has an outcome", () => {
    const state = apply([
      { type: "compare/toggle", slug: "cursor", at: T0 },
      { type: "compare/toggle", slug: "v0", at: T0 },
      { type: "tool/decision", slug: "cursor", outcome: "selected", at: T1 },
      { type: "tool/decision", slug: "v0", outcome: "rejected", at: T1 },
    ]);

    expect(state.compare.slugs).toEqual(["cursor", "v0"]);
    expect(chooseResumeAction(state, T2).kind).not.toBe("continue_compare");
  });
});

describe("REDUCER CONTRACT — usage / revisit", () => {
  it("replaced requires a distinct slug and auto-selects", () => {
    const base = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "saved/set",
      slug: "linear",
      saved: true,
      at: T0,
    });
    const replaced = reduceWorkspaceState(base, {
      type: "tool/usage",
      slug: "linear",
      usage: "replaced",
      replacedBy: "cursor",
      at: T1,
    });
    expect(replaced.toolStates.linear?.usage).toBe("replaced");
    expect(replaced.toolStates.linear?.replacedBy).toBe("cursor");
    expect(replaced.toolStates.linear?.decision?.outcome).toBe("selected");
  });

  it("tool/revisit stores revisitAt", () => {
    const state = apply([
      { type: "saved/set", slug: "v0", saved: true, at: T0 },
      { type: "tool/decision", slug: "v0", outcome: "deferred", at: T1 },
      { type: "tool/revisit", slug: "v0", revisitAt: T2, at: T1 },
    ]);
    expect(state.toolStates.v0?.revisitAt).toBe(T2);
  });
});

describe("MERGE CONTRACT", () => {
  it("guest attach unions saved and keeps the newer note on collision", () => {
    const account = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/note", slug: "cursor", note: "account why", at: T0 },
    ]);
    const guest = apply([
      { type: "saved/set", slug: "v0", saved: true, at: T1 },
      { type: "saved/set", slug: "cursor", saved: true, at: T1 },
      { type: "tool/note", slug: "cursor", note: "guest why", at: T1 },
    ]);

    const merged = mergeGuestWorkspaceContribution(account, guest);
    expect(merged.saved.slugs.sort()).toEqual(["cursor", "v0"]);
    expect(merged.toolStates.cursor?.note).toBe("guest why");
  });

  it("sync merge is last-write-wins on tool metadata", () => {
    const left = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/note", slug: "cursor", note: "old", at: T0 },
    ]);
    const right = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T1 },
      { type: "tool/note", slug: "cursor", note: "new", at: T1 },
    ]);
    expect(mergeWorkspaceStates(left, right).toolStates.cursor?.note).toBe("new");
  });
});

describe("PERSISTENCE CONTRACT — export / reset", () => {
  it("export embeds the full v1 state and no secrets", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
    ]);
    const payload = buildWorkspaceExportPayload(state, new Date(T1));
    expect(payload.schemaVersion).toBe(1);
    expect(payload.state).toBe(state);
    expect(payload).not.toHaveProperty("email");
  });

  it("reset confirmation is the exact string RESET", () => {
    expect(isWorkspaceResetConfirmed("RESET")).toBe(true);
    expect(isWorkspaceResetConfirmed("reset")).toBe(false);
  });

  it("workspace/clear empties lists and toolStates", () => {
    const state = apply([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "compare/toggle", slug: "cursor", at: T0 },
      { type: "workspace/clear", at: T1 },
    ]);
    expect(state.saved.slugs).toEqual([]);
    expect(state.compare.slugs).toEqual([]);
    expect(state.toolStates).toEqual({});
    expect(state.clearedAt).toBe(T1);
  });
});
