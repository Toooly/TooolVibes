import { afterEach, describe, expect, it } from "vitest";

import {
  markWorkspaceToolReplaced,
  markWorkspaceToolStopped,
  markWorkspaceToolUsing,
  setWorkspaceCompareObjective,
  setWorkspaceDecision,
  setWorkspaceUsage,
} from "@/lib/account/workspace-actions";
import { workspaceTestFixtures } from "@/lib/account/test-fixtures";
import {
  mergeWorkspaceStates,
  normalizeWorkspaceState,
  reduceWorkspaceState,
  stripUnsetSoftwareMemory,
} from "@/lib/discovery/workspace-contract";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import {
  activateToolWorkspaceOwner,
  getCanonicalToolWorkspaceState,
} from "@/lib/stores/tool-workspace-store";

const T0 = "2026-08-20T10:00:00.000Z";
const T1 = "2026-08-20T11:00:00.000Z";

afterEach(() => {
  activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
});

describe("software memory persistence", () => {
  it("marks using, auto-selects, and persists after reload", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, workspaceTestFixtures.withSaved);
    expect(getCanonicalToolWorkspaceState().toolStates.cursor?.decision).toBeNull();

    markWorkspaceToolUsing("cursor");
    const using = getCanonicalToolWorkspaceState().toolStates.cursor;
    expect(using?.usage).toBe("using");
    expect(using?.replacedBy).toBeNull();
    expect(using?.decision?.outcome).toBe("selected");

    const reloaded = activateToolWorkspaceOwner({ kind: "guest" }).state;
    expect(reloaded.toolStates.cursor?.usage).toBe("using");
    expect(reloaded.toolStates.cursor?.decision?.outcome).toBe("selected");
  });

  it("requires a distinct valid replacedBy and no-ops otherwise", () => {
    const base = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "saved/set",
      slug: "cursor",
      saved: true,
      at: T0,
    });

    expect(
      reduceWorkspaceState(base, {
        type: "tool/usage",
        slug: "cursor",
        usage: "replaced",
        at: T1,
      }),
    ).toEqual(base);

    expect(
      reduceWorkspaceState(base, {
        type: "tool/usage",
        slug: "cursor",
        usage: "replaced",
        replacedBy: "cursor",
        at: T1,
      }),
    ).toEqual(base);

    expect(
      reduceWorkspaceState(base, {
        type: "tool/usage",
        slug: "cursor",
        usage: "replaced",
        replacedBy: "Not A Slug",
        at: T1,
      }),
    ).toEqual(base);

    expect(
      reduceWorkspaceState(base, {
        type: "tool/usage",
        slug: "cursor",
        usage: "not-a-usage" as "using",
        at: T1,
      }),
    ).toEqual(base);

    const replaced = reduceWorkspaceState(base, {
      type: "tool/usage",
      slug: "cursor",
      usage: "replaced",
      replacedBy: "linear",
      at: T1,
    });
    expect(replaced.toolStates.cursor.usage).toBe("replaced");
    expect(replaced.toolStates.cursor.replacedBy).toBe("linear");
    expect(replaced.toolStates.cursor.decision).toEqual({
      outcome: "selected",
      updatedAt: T1,
    });
  });

  it("clears replacedBy when usage is stopped", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, workspaceTestFixtures.withSaved);
    markWorkspaceToolReplaced("cursor", "linear");
    expect(getCanonicalToolWorkspaceState().toolStates.cursor?.replacedBy).toBe(
      "linear",
    );

    markWorkspaceToolStopped("cursor");
    const stopped = getCanonicalToolWorkspaceState().toolStates.cursor;
    expect(stopped?.usage).toBe("stopped");
    expect(stopped?.replacedBy).toBeNull();
    expect(stopped?.decision?.outcome).toBe("selected");
  });

  it("clears usage when a tool is rejected", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, workspaceTestFixtures.withSaved);
    markWorkspaceToolUsing("cursor");
    expect(getCanonicalToolWorkspaceState().toolStates.cursor?.usage).toBe("using");

    setWorkspaceDecision("cursor", "rejected");
    const rejected = getCanonicalToolWorkspaceState().toolStates.cursor;
    expect(rejected?.decision?.outcome).toBe("rejected");
    expect(rejected?.usage).toBeNull();
    expect(rejected?.replacedBy).toBeNull();
  });

  it("snapshots compareObjective only when tool/decision provides it", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, workspaceTestFixtures.withSaved);
    setWorkspaceDecision("cursor", "selected");
    expect(getCanonicalToolWorkspaceState().toolStates.cursor?.compareObjective).toBeNull();

    setWorkspaceDecision("cursor", "selected", undefined, "save-time");
    expect(getCanonicalToolWorkspaceState().toolStates.cursor?.compareObjective).toBe(
      "save-time",
    );

    setWorkspaceCompareObjective("cursor", null);
    expect(getCanonicalToolWorkspaceState().toolStates.cursor?.compareObjective).toBeNull();

    setWorkspaceUsage("cursor", "using");
    setWorkspaceDecision("cursor", "selected", undefined, "quality");
    expect(getCanonicalToolWorkspaceState().toolStates.cursor?.compareObjective).toBe(
      "quality",
    );
  });

  it("strips unknown toolState keys and defaults missing software memory fields", () => {
    const normalized = normalizeWorkspaceState({
      schemaVersion: 1,
      saved: { slugs: ["cursor"], updatedAt: T0 },
      compare: { slugs: [], updatedAt: null },
      stack: { slugs: [], updatedAt: null },
      toolStates: {
        cursor: {
          stage: "saved",
          note: null,
          saveReason: null,
          pinned: false,
          decision: null,
          updatedAt: T0,
          extraKey: "drop-me",
        },
      },
    });

    expect(normalized.toolStates.cursor).toMatchObject({
      usage: null,
      replacedBy: null,
      compareObjective: null,
    });
    expect(normalized.toolStates.cursor).not.toHaveProperty("extraKey");
  });

  it("lets later updatedAt win usage on merge", () => {
    const left = normalizeWorkspaceState({
      schemaVersion: 1,
      saved: { slugs: ["cursor"], updatedAt: T0 },
      compare: { slugs: [], updatedAt: null },
      stack: { slugs: [], updatedAt: null },
      toolStates: {
        cursor: {
          stage: "saved",
          note: null,
          saveReason: null,
          pinned: false,
          decision: { outcome: "selected", updatedAt: T0 },
          usage: "using",
          replacedBy: null,
          compareObjective: null,
          updatedAt: T0,
        },
      },
    });
    const right = normalizeWorkspaceState({
      schemaVersion: 1,
      saved: { slugs: ["cursor"], updatedAt: T1 },
      compare: { slugs: [], updatedAt: null },
      stack: { slugs: [], updatedAt: null },
      toolStates: {
        cursor: {
          stage: "saved",
          note: null,
          saveReason: null,
          pinned: false,
          decision: { outcome: "selected", updatedAt: T0 },
          usage: "stopped",
          replacedBy: null,
          compareObjective: "save-time",
          updatedAt: T1,
        },
      },
    });

    expect(mergeWorkspaceStates(left, right).toolStates.cursor.usage).toBe("stopped");
    expect(mergeWorkspaceStates(right, left).toolStates.cursor.usage).toBe("stopped");
  });

  it("omits unset software memory keys from the remote payload", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, workspaceTestFixtures.withSaved);
    const stripped = stripUnsetSoftwareMemory(getCanonicalToolWorkspaceState());
    expect(stripped.toolStates.cursor).not.toHaveProperty("usage");
    expect(stripped.toolStates.cursor).not.toHaveProperty("replacedBy");
    expect(stripped.toolStates.cursor).not.toHaveProperty("compareObjective");

    markWorkspaceToolUsing("cursor");
    const using = stripUnsetSoftwareMemory(getCanonicalToolWorkspaceState());
    expect(using.toolStates.cursor?.usage).toBe("using");
  });
});
