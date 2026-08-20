import { describe, expect, it, vi } from "vitest";

import {
  createEmptyWorkspaceState,
  hasWorkspaceData,
  mergeWorkspaceStates,
  normalizeWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-state";
import {
  adaptLegacyDiscoveryWorkspaceState,
  adaptLegacyToolWorkspaceState,
} from "@/lib/discovery/workspace-legacy-adapters";
import {
  MAX_COMPARE_TOOLS,
  MAX_WORKSPACE_COLLECTION_TOOLS,
} from "@/lib/discovery/workspace-constants";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import {
  workspaceStateV1Schema,
  workspaceSyncStateV1Schema,
} from "@/lib/discovery/schema";

const T0 = "2026-07-16T10:00:00.000Z";
const T1 = "2026-07-16T11:00:00.000Z";
const T2 = "2026-07-16T12:00:00.000Z";
const T1_5 = "2026-07-16T11:30:00.000Z";
const T3 = "2026-07-16T13:00:00.000Z";

function canonicalFixture() {
  return normalizeWorkspaceState({
    schemaVersion: 1,
    saved: {
      slugs: ["alpha"],
      updatedAt: T0,
    },
    compare: {
      slugs: ["alpha"],
      updatedAt: T0,
    },
    stack: {
      slugs: ["alpha"],
      updatedAt: T0,
    },
    toolStates: {
      alpha: {
        stage: "review",
        note: "Test in corso",
        saveReason: "test",
        pinned: true,
        decision: null,
        updatedAt: T0,
      },
    },
  });
}

describe("WorkspaceState v1 strict schema", () => {
  it("accepts a complete canonical payload", () => {
    const result = workspaceStateV1Schema.safeParse(canonicalFixture());

    expect(result.success).toBe(true);
  });

  it("rejects duplicates, compare overflow and un-timestamped decisions", () => {
    const base = createEmptyWorkspaceState();

    expect(
      workspaceStateV1Schema.safeParse({
        ...base,
        saved: { slugs: ["alpha", "alpha"], updatedAt: null },
      }).success,
    ).toBe(false);

    expect(
      workspaceStateV1Schema.safeParse({
        ...base,
        compare: {
          slugs: Array.from(
            { length: MAX_COMPARE_TOOLS + 1 },
            (_, index) => `tool-${index + 1}`,
          ),
          updatedAt: null,
        },
      }).success,
    ).toBe(false);

    expect(
      workspaceStateV1Schema.safeParse({
        ...base,
        toolStates: {
          alpha: {
            stage: "saved",
            note: null,
            saveReason: null,
            pinned: false,
            decision: { outcome: "selected" },
            updatedAt: T0,
          },
        },
      }).success,
    ).toBe(false);
  });
});

describe("canonical normalization", () => {
  it("fails closed for unknown versions and salvages a corrupt v1 payload", () => {
    expect(normalizeWorkspaceState(null)).toEqual(createEmptyWorkspaceState());
    expect(normalizeWorkspaceState({ schemaVersion: 2 })).toEqual(
      createEmptyWorkspaceState(),
    );

    const normalized = normalizeWorkspaceState({
      schemaVersion: 1,
      saved: {
        slugs: ["alpha", "", 42, "alpha", "bad slug"],
        updatedAt: "not-a-date",
      },
      compare: {
        slugs: [
          "one",
          "two",
          "three",
          "four",
          "five",
          "six",
          "two",
        ],
        updatedAt: T0,
      },
      stack: {
        slugs: ["gamma", "alpha", "gamma", "beta"],
        updatedAt: null,
      },
      toolStates: {
        "bad slug": {
          stage: "top",
        },
        alpha: {
          stage: "unknown",
          note: "  memo  ",
          saveReason: "invalid",
          pinned: "yes",
          decision: {
            outcome: "selected",
            updatedAt: "invalid",
          },
          updatedAt: T0,
        },
      },
    });

    expect(normalized.saved).toEqual({
      slugs: ["alpha"],
      updatedAt: null,
    });
    expect(normalized.compare.slugs).toEqual([
      "three",
      "four",
      "five",
      "six",
      "two",
    ]);
    expect(normalized.stack.slugs).toEqual(["gamma", "alpha", "beta"]);
    expect(normalized.toolStates).toEqual({
      alpha: {
        stage: "saved",
        note: "memo",
        saveReason: null,
        pinned: false,
        decision: null,
        useCase: null,
        alternatives: [],
        revisitAt: null,
        usage: null,
        replacedBy: null,
        compareObjective: null,
        updatedAt: T0,
      },
    });
  });

  it("is idempotent and normalizes timezone offsets to UTC", () => {
    const normalized = normalizeWorkspaceState({
      schemaVersion: 1,
      saved: {
        slugs: ["alpha"],
        updatedAt: "2026-07-16T12:00:00+02:00",
      },
      compare: { slugs: [], updatedAt: null },
      stack: { slugs: [], updatedAt: null },
      toolStates: {
        alpha: {
          stage: "saved",
          note: null,
          saveReason: null,
          pinned: false,
          decision: {
            outcome: "deferred",
            updatedAt: "2026-07-16T12:30:00+02:00",
          },
          updatedAt: "2026-07-16T12:30:00+02:00",
        },
      },
    });

    expect(normalized.saved.updatedAt).toBe("2026-07-16T10:00:00.000Z");
    expect(normalized.toolStates.alpha.decision?.updatedAt).toBe(
      "2026-07-16T10:30:00.000Z",
    );
    expect(normalizeWorkspaceState(normalized)).toEqual(normalized);
  });
});

describe("pure workspace reducer", () => {
  it("preserves insertion order and refuses a sixth compare tool", () => {
    let state = createEmptyWorkspaceState();

    for (let index = 1; index <= MAX_COMPARE_TOOLS; index += 1) {
      state = reduceWorkspaceState(state, {
        type: "compare/toggle",
        slug: `tool-${index}`,
        at: `2026-07-16T10:00:0${index}.000Z`,
      });
    }

    const fullState = state;
    state = reduceWorkspaceState(state, {
      type: "compare/toggle",
      slug: "tool-6",
      at: T1,
    });

    expect(state).toEqual(fullState);
    expect(state.compare.slugs).toEqual([
      "tool-1",
      "tool-2",
      "tool-3",
      "tool-4",
      "tool-5",
    ]);
  });

  it("reorders only the current stack membership", () => {
    let state = createEmptyWorkspaceState();

    for (const slug of ["alpha", "beta", "gamma"]) {
      state = reduceWorkspaceState(state, {
        type: "stack/add",
        slug,
        at: T0,
      });
    }

    state = reduceWorkspaceState(state, {
      type: "stack/reorder",
      slugs: ["gamma", "alpha", "beta"],
      at: T1,
    });

    expect(state.stack.slugs).toEqual(["gamma", "alpha", "beta"]);

    const beforeInvalidReorder = state;
    state = reduceWorkspaceState(state, {
      type: "stack/reorder",
      slugs: ["gamma", "alpha", "delta"],
      at: T2,
    });

    expect(state).toEqual(beforeInvalidReorder);
  });

  it("keeps decision outcome and clear tombstone timestamped", () => {
    let state = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "tool/decision",
      slug: "alpha",
      outcome: "selected",
      at: T0,
    });

    expect(state.saved.slugs).toEqual(["alpha"]);
    expect(state.toolStates.alpha.decision).toEqual({
      outcome: "selected",
      updatedAt: T0,
    });

    state = reduceWorkspaceState(state, {
      type: "tool/decision",
      slug: "alpha",
      outcome: null,
      at: T1,
    });

    expect(state.toolStates.alpha.decision).toEqual({
      outcome: null,
      updatedAt: T1,
    });

    const beforeInvalidTimestamp = state;
    state = reduceWorkspaceState(state, {
      type: "tool/note",
      slug: "alpha",
      note: "Non deve entrare",
      at: "invalid",
    });

    expect(state).toEqual(beforeInvalidTimestamp);
  });
});

describe("Zustand compatibility seam", () => {
  it("reports the reducer result for invalid slugs", () => {
    const persistWarning = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    useToolWorkspaceStore.setState({
      savedSlugs: [],
      compareSlugs: [],
      stackSlugs: [],
      selectedSlug: null,
      isCommandOpen: false,
    });
    const store = useToolWorkspaceStore.getState();

    expect(store.toggleSaved("Bad Slug")).toBe(false);
    expect(store.toggleCompare("Bad Slug")).toEqual({
      added: false,
      limited: false,
    });
    expect(store.addToStack("Bad Slug")).toBe(false);
    expect(useToolWorkspaceStore.getState()).toMatchObject({
      savedSlugs: [],
      compareSlugs: [],
      stackSlugs: [],
    });
    persistWarning.mockRestore();
  });
});

describe("workspace merge", () => {
  it("keeps oversized local merges lossless while rejecting remote sync capacity", () => {
    const build = (prefix: string) => normalizeWorkspaceState({
      ...createEmptyWorkspaceState(),
      saved: {
        slugs: Array.from(
          { length: 300 },
          (_, index) => `${prefix}-${index}`,
        ),
        updatedAt: null,
      },
      toolStates: Object.fromEntries(Array.from(
        { length: 300 },
        (_, index) => [`${prefix}-${index}`, {
          stage: "saved",
          note: null,
          saveReason: null,
          pinned: false,
          decision: null,
          updatedAt: null,
        }],
      )),
    });
    const left = build("left");
    const right = build("right");

    expect(workspaceSyncStateV1Schema.safeParse(left).success).toBe(true);
    expect(workspaceSyncStateV1Schema.safeParse(right).success).toBe(true);
    const merged = mergeWorkspaceStates(left, right);

    expect(merged.saved.slugs).toHaveLength(600);
    expect(Object.keys(merged.toolStates)).toHaveLength(600);
    expect(workspaceStateV1Schema.safeParse(merged).success).toBe(true);
    expect(workspaceSyncStateV1Schema.safeParse(merged).success).toBe(false);
    expect(merged.saved.slugs).toHaveLength(
      MAX_WORKSPACE_COLLECTION_TOOLS + 100,
    );
  });
  it("uses timestamp authority for removals and ordered union without timestamps", () => {
    const left = normalizeWorkspaceState({
      schemaVersion: 1,
      saved: { slugs: ["alpha"], updatedAt: T0 },
      compare: {
        slugs: ["one", "two", "three", "four"],
        updatedAt: null,
      },
      stack: { slugs: ["alpha", "beta"], updatedAt: null },
      toolStates: {},
    });
    const right = normalizeWorkspaceState({
      schemaVersion: 1,
      saved: { slugs: ["beta"], updatedAt: T1 },
      compare: {
        slugs: ["three", "four", "five", "six"],
        updatedAt: null,
      },
      stack: { slugs: ["beta", "gamma"], updatedAt: null },
      toolStates: {},
    });

    const merged = mergeWorkspaceStates(left, right);

    expect(merged.saved.slugs).toEqual(["beta"]);
    expect(merged.stack.slugs).toEqual(["alpha", "beta", "gamma"]);
    expect(merged.compare.slugs).toEqual([
      "two",
      "three",
      "four",
      "five",
      "six",
    ]);

    const removal = mergeWorkspaceStates(left, {
      ...right,
      saved: { slugs: [], updatedAt: T2 },
    });
    expect(removal.saved.slugs).toEqual([]);
  });

  it("uses tool and decision timestamps independently", () => {
    const left = normalizeWorkspaceState({
      schemaVersion: 1,
      saved: { slugs: ["alpha"], updatedAt: T0 },
      compare: { slugs: [], updatedAt: null },
      stack: { slugs: [], updatedAt: null },
      toolStates: {
        alpha: {
          stage: "top",
          note: "Vecchia nota",
          saveReason: "test",
          pinned: true,
          decision: { outcome: "selected", updatedAt: T0 },
          updatedAt: T0,
        },
      },
    });
    const right = normalizeWorkspaceState({
      schemaVersion: 1,
      saved: { slugs: ["alpha"], updatedAt: T1 },
      compare: { slugs: [], updatedAt: null },
      stack: { slugs: [], updatedAt: null },
      toolStates: {
        alpha: {
          stage: "review",
          note: "Nota nuova",
          saveReason: "compare",
          pinned: false,
          decision: { outcome: "deferred", updatedAt: T2 },
          updatedAt: T1,
        },
      },
    });

    const merged = mergeWorkspaceStates(left, right);

    expect(merged.toolStates.alpha).toMatchObject({
      stage: "review",
      note: "Nota nuova",
      saveReason: "compare",
      pinned: false,
      decision: { outcome: "deferred", updatedAt: T2 },
      updatedAt: T1,
    });
  });

  it("preserves newer note clears and decision tombstones", () => {
    const left = normalizeWorkspaceState({
      ...canonicalFixture(),
      toolStates: {
        alpha: {
          ...canonicalFixture().toolStates.alpha,
          decision: { outcome: "selected", updatedAt: T0 },
        },
      },
    });
    const right = normalizeWorkspaceState({
      ...left,
      toolStates: {
        alpha: {
          ...left.toolStates.alpha,
          note: null,
          decision: { outcome: null, updatedAt: T2 },
          updatedAt: T2,
        },
      },
    });

    const merged = mergeWorkspaceStates(left, right);

    expect(merged.toolStates.alpha.note).toBeNull();
    expect(merged.toolStates.alpha.decision).toEqual({
      outcome: null,
      updatedAt: T2,
    });
  });

  it("does not resurrect data older than a full clear boundary", () => {
    const older = canonicalFixture();
    const cleared = reduceWorkspaceState(older, {
      type: "workspace/clear",
      at: T2,
    });

    expect(mergeWorkspaceStates(cleared, older)).toEqual(cleared);
    expect(mergeWorkspaceStates(older, cleared)).toEqual(cleared);
    expect(hasWorkspaceData(cleared)).toBe(true);
    expect(cleared).toMatchObject({
      clearedAt: T2,
      saved: { slugs: [] },
      compare: { slugs: [] },
      stack: { slugs: [] },
      toolStates: {},
    });
  });


  it("filters metadata and decision independently across a clear boundary", () => {
    const cleared = reduceWorkspaceState(canonicalFixture(), {
      type: "workspace/clear",
      at: T1,
    });
    const decisionOnly = normalizeWorkspaceState({
      schemaVersion: 1,
      saved: { slugs: ["alpha"], updatedAt: T2 },
      compare: { slugs: [], updatedAt: null },
      stack: { slugs: [], updatedAt: null },
      toolStates: {
        alpha: {
          stage: "top",
          note: "Old metadata",
          saveReason: "test",
          pinned: true,
          decision: { outcome: "selected", updatedAt: T2 },
          updatedAt: T0,
        },
      },
    });
    const metadataOnly = normalizeWorkspaceState({
      schemaVersion: 1,
      saved: { slugs: ["alpha"], updatedAt: T1_5 },
      compare: { slugs: [], updatedAt: null },
      stack: { slugs: [], updatedAt: null },
      toolStates: {
        alpha: {
          stage: "review",
          note: "New metadata",
          saveReason: "compare",
          pinned: true,
          decision: { outcome: "rejected", updatedAt: T0 },
          updatedAt: T1_5,
        },
      },
    });

    expect(mergeWorkspaceStates(cleared, decisionOnly).toolStates.alpha).toEqual({
      stage: "saved",
      note: null,
      saveReason: null,
      pinned: false,
      decision: { outcome: "selected", updatedAt: T2 },
      useCase: null,
      alternatives: [],
      revisitAt: null,
      usage: null,
      replacedBy: null,
      compareObjective: null,
      updatedAt: null,
    });
    expect(mergeWorkspaceStates(cleared, metadataOnly).toolStates.alpha).toEqual({
      stage: "review",
      note: "New metadata",
      saveReason: "compare",
      pinned: true,
      decision: null,
      useCase: null,
      alternatives: [],
      revisitAt: null,
      usage: null,
      replacedBy: null,
      compareObjective: null,
      updatedAt: T1_5,
    });

    const combined = mergeWorkspaceStates(
      mergeWorkspaceStates(cleared, decisionOnly),
      mergeWorkspaceStates(cleared, metadataOnly),
    );
    expect(combined.toolStates.alpha).toMatchObject({
      note: "New metadata",
      decision: { outcome: "selected", updatedAt: T2 },
      updatedAt: T1_5,
    });
  });

  it("reasserts saved membership when a post-clear decision is edited", () => {
    const local = reduceWorkspaceState(canonicalFixture(), {
      type: "tool/decision",
      slug: "alpha",
      outcome: "selected",
      at: T3,
    });
    const remoteClear = reduceWorkspaceState(canonicalFixture(), {
      type: "workspace/clear",
      at: T2,
    });

    expect(local.saved.updatedAt).toBe(T3);

    const merged = mergeWorkspaceStates(local, remoteClear);
    expect(merged.saved.slugs).toEqual(["alpha"]);
    expect(merged.toolStates.alpha.decision).toEqual({
      outcome: "selected",
      updatedAt: T3,
    });
  });
  it("converges for divergent payloads with equal timestamps", () => {
    const left = normalizeWorkspaceState({
      schemaVersion: 1,
      saved: { slugs: ["alpha"], updatedAt: T1 },
      compare: { slugs: ["alpha", "beta"], updatedAt: T1 },
      stack: { slugs: ["beta", "alpha"], updatedAt: T1 },
      toolStates: {
        alpha: {
          stage: "review",
          note: "z-note",
          saveReason: "test",
          pinned: false,
          decision: { outcome: "selected", updatedAt: T1 },
          updatedAt: T1,
        },
      },
    });
    const right = normalizeWorkspaceState({
      schemaVersion: 1,
      saved: { slugs: ["beta"], updatedAt: T1 },
      compare: { slugs: ["beta", "alpha"], updatedAt: T1 },
      stack: { slugs: ["alpha", "beta"], updatedAt: T1 },
      toolStates: {
        alpha: {
          stage: "top",
          note: "a-note",
          saveReason: "compare",
          pinned: true,
          decision: { outcome: "rejected", updatedAt: T1 },
          updatedAt: T1,
        },
      },
    });

    const leftThenRight = mergeWorkspaceStates(left, right);
    const rightThenLeft = mergeWorkspaceStates(right, left);

    expect(leftThenRight).toEqual(rightThenLeft);
    expect(workspaceStateV1Schema.safeParse(leftThenRight).success).toBe(true);
  });
});

describe("read-only legacy adapters", () => {
  it("adapts the discovery sync shape without mutating it", () => {
    const legacy = {
      tool_states: {
        alpha: {
          is_saved: true,
          shortlist_stage: "review",
          note: "  Nota  ",
          save_reason: "compare",
          is_pinned: true,
          updated_at: T1,
        },
        beta: {
          is_saved: false,
          shortlist_stage: "saved",
          note: "Memoria non salvata",
          updated_at: T0,
        },
      },
      compare: {
        slugs: ["one", "two", "three", "four", "five", "six"],
        updated_at: T2,
      },
    };
    const before = JSON.stringify(legacy);
    const adapted = adaptLegacyDiscoveryWorkspaceState(legacy);

    expect(JSON.stringify(legacy)).toBe(before);
    expect(adapted.saved.slugs).toEqual(["alpha"]);
    expect(adapted.compare.slugs).toEqual([
      "two",
      "three",
      "four",
      "five",
      "six",
    ]);
    expect(adapted.stack.slugs).toEqual([]);
    expect(adapted.toolStates.alpha).toMatchObject({
      stage: "review",
      note: "Nota",
      saveReason: "compare",
      pinned: true,
      decision: null,
      updatedAt: T1,
    });
    expect(workspaceStateV1Schema.safeParse(adapted).success).toBe(true);
  });

  it("adapts the Zustand envelope with deterministic list order", () => {
    const legacy = {
      state: {
        savedSlugs: ["beta", "alpha", "beta"],
        compareSlugs: ["one", "two", "three", "four", "five", "six"],
        stackSlugs: ["gamma", "alpha", "gamma", "beta"],
      },
      version: 0,
    };
    const before = JSON.stringify(legacy);
    const adapted = adaptLegacyToolWorkspaceState(legacy);

    expect(JSON.stringify(legacy)).toBe(before);
    expect(adapted.saved.slugs).toEqual(["beta", "alpha"]);
    expect(adapted.compare.slugs).toEqual([
      "two",
      "three",
      "four",
      "five",
      "six",
    ]);
    expect(adapted.stack.slugs).toEqual(["gamma", "alpha", "beta"]);
    expect(adapted.toolStates).toEqual({});
    expect(workspaceStateV1Schema.safeParse(adapted).success).toBe(true);
  });
});
