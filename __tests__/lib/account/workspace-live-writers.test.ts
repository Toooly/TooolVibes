import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  deferWorkspaceTool,
  reopenWorkspaceDecision,
  setWorkspaceDecision,
  toggleWorkspaceCompare,
  toggleWorkspaceSaved,
} from "@/lib/account/workspace-actions";
import { chooseResumeAction } from "@/lib/account/workspace-pipeline";
import { buildWorkspaceExportPayload } from "@/lib/account/workspace-export";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import {
  activateToolWorkspaceOwner,
  getCanonicalToolWorkspaceState,
} from "@/lib/stores/tool-workspace-store";

afterEach(() => {
  activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
});

describe("Wave 2 live writer contract", () => {
  it("W2-T1/T3/T4/T5/T14: canonical Decide uses workspace/decide, clears tray, appends one event, persists", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    toggleWorkspaceSaved("cursor");
    toggleWorkspaceSaved("v0");
    toggleWorkspaceCompare("cursor");
    toggleWorkspaceCompare("v0");

    expect(getCanonicalToolWorkspaceState().compare.slugs).toEqual(["cursor", "v0"]);

    setWorkspaceDecision("cursor", "selected");

    const state = getCanonicalToolWorkspaceState();
    expect(state.toolStates.cursor?.decision?.outcome).toBe("selected");
    expect(state.compare.slugs).toEqual([]);
    expect(state.events.filter((event) => event.type === "decided")).toHaveLength(1);
    expect(state.events[0]).toMatchObject({
      type: "decided",
      slug: "cursor",
      outcome: "selected",
      alternatives: ["cursor", "v0"],
    });

    const reloaded = activateToolWorkspaceOwner({ kind: "guest" }).state;
    expect(reloaded.compare.slugs).toEqual([]);
    expect(reloaded.events).toHaveLength(1);
    expect(chooseResumeAction(reloaded).kind).not.toBe("continue_compare");
  });

  it("W2-T2: product Decide no longer leaves a zombie tray", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    toggleWorkspaceCompare("cursor");
    toggleWorkspaceCompare("v0");
    setWorkspaceDecision("cursor", "selected");
    expect(getCanonicalToolWorkspaceState().compare.slugs).toEqual([]);
  });

  it("W2-T6: legacy snapshot without events still mutates through the canonical API", () => {
    activateToolWorkspaceOwner(
      { kind: "guest" },
      {
        ...createEmptyWorkspaceState(),
        saved: { slugs: ["cursor"], updatedAt: "2026-08-01T00:00:00.000Z" },
        events: [],
      },
    );
    setWorkspaceDecision("cursor", "rejected");
    const state = getCanonicalToolWorkspaceState();
    expect(state.toolStates.cursor?.decision?.outcome).toBe("rejected");
    expect(state.events).toHaveLength(1);
  });

  it("W2-T7/T8: guest save and compare remain functional", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    toggleWorkspaceSaved("cursor");
    toggleWorkspaceCompare("cursor");
    const state = getCanonicalToolWorkspaceState();
    expect(state.saved.slugs).toEqual(["cursor"]);
    expect(state.compare.slugs).toEqual(["cursor"]);
  });

  it("W2-T11: Compare → Decide cannot resurrect the cleared tray", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    toggleWorkspaceCompare("cursor");
    toggleWorkspaceCompare("v0");
    setWorkspaceDecision("cursor", "selected");
    expect(getCanonicalToolWorkspaceState().compare.slugs).toEqual([]);
    setWorkspaceDecision("cursor", "selected");
    expect(getCanonicalToolWorkspaceState().compare.slugs).toEqual([]);
    expect(
      getCanonicalToolWorkspaceState().events.filter((event) => event.type === "decided"),
    ).toHaveLength(2);
  });

  it("W2-T12: export contains events after a canonical Decide", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    toggleWorkspaceCompare("cursor");
    toggleWorkspaceCompare("v0");
    setWorkspaceDecision("cursor", "selected");
    const payload = buildWorkspaceExportPayload(getCanonicalToolWorkspaceState());
    expect(payload.state.events).toHaveLength(1);
    expect(payload.state.events[0]?.type).toBe("decided");
  });

  it("W2-T13: reset clears canonical state and events", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    toggleWorkspaceSaved("cursor");
    setWorkspaceDecision("cursor", "selected");
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    const cleared = getCanonicalToolWorkspaceState();
    expect(cleared.events).toEqual([]);
    expect(cleared.saved.slugs).toEqual([]);
  });

  it("reopen still uses the compatibility path and does not invent a decided event", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    setWorkspaceDecision("cursor", "selected");
    reopenWorkspaceDecision("cursor");
    const state = getCanonicalToolWorkspaceState();
    expect(state.toolStates.cursor?.decision?.outcome).toBeNull();
    expect(state.events.map((event) => event.type)).toEqual([
      "decided",
      "reopened",
      "revisit_set",
    ]);
  });

  it("defer goes through workspace/decide and keeps revisitAt", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    deferWorkspaceTool("v0", "2026-09-01T00:00:00.000Z");
    const state = getCanonicalToolWorkspaceState();
    expect(state.toolStates.v0?.decision?.outcome).toBe("deferred");
    expect(state.toolStates.v0?.revisitAt).toBe("2026-09-01T00:00:00.000Z");
    expect(state.events[0]?.type).toBe("decided");
    expect(state.events[0]?.outcome).toBe("deferred");
  });
});

describe("W2-T15 live production callers of tool/decision", () => {
  const root = process.cwd();

  function read(rel: string) {
    return readFileSync(join(root, rel), "utf8");
  }

  it("live compare and shortlist UIs do not import local-storage writers or dispatch tool/decision", () => {
    const panel = read("components/tools/compare-decision-panel.tsx");
    const shortlist = read("components/tools/mobile-shortlist-board.tsx");
    const biblioteca = read("components/account/workspace/workspace-biblioteca.tsx");
    const sheet = read("components/account/workspace/decision-sheet.tsx");

    for (const source of [panel, shortlist, biblioteca, sheet]) {
      expect(source).not.toContain("@/lib/discovery/local-storage");
      expect(source).not.toContain('type: "tool/decision"');
      expect(source).not.toContain("setToolDecisionOutcome");
      expect(source).toContain("@/lib/account/workspace-actions");
    }
  });

  it("canonical helper commits Decide via workspace/decide", () => {
    const actions = read("lib/account/workspace-actions.ts");
    expect(actions).toContain('type: "workspace/decide"');
    expect(actions).toMatch(/outcome === null[\s\S]*type: "tool\/decision"/);
  });
});
