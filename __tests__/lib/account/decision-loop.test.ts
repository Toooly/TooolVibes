import { afterEach, describe, expect, it } from "vitest";

import {
  addToolToWorkingPersonalStack,
  archivePersonalStack,
  deferWorkspaceTool,
  markWorkspaceToolUsing,
  restorePersonalStack,
  setWorkspaceDecision,
  setWorkspaceStage,
  toggleWorkspaceCompare,
  toggleWorkspaceSaved,
} from "@/lib/account/workspace-actions";
import { chooseResumeAction } from "@/lib/account/workspace-pipeline";
import { leftoverLegacyStackSlugs, workingPersonalStackSlugs } from "@/lib/account/workspace-stack-target";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import {
  activateToolWorkspaceOwner,
  getCanonicalToolWorkspaceState,
} from "@/lib/stores/tool-workspace-store";

afterEach(() => {
  activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
});

describe("decision loop 1.0", () => {
  it("saves, evaluates, compares, decides, defers, and resumes after reload", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());

    toggleWorkspaceSaved("cursor");
    setWorkspaceStage("cursor", "review");
    toggleWorkspaceSaved("v0");
    setWorkspaceStage("v0", "top");
    toggleWorkspaceCompare("cursor");
    toggleWorkspaceCompare("v0");

    let state = getCanonicalToolWorkspaceState();
    expect(state.saved.slugs).toEqual(["cursor", "v0"]);
    expect(state.compare.slugs).toEqual(["cursor", "v0"]);
    expect(chooseResumeAction(state).kind).toBe("continue_compare");

    setWorkspaceDecision("cursor", "selected");
    deferWorkspaceTool("v0", "2026-07-01T00:00:00.000Z");

    state = getCanonicalToolWorkspaceState();
    expect(state.toolStates.cursor?.decision?.outcome).toBe("selected");
    expect(state.toolStates.v0?.decision?.outcome).toBe("deferred");
    expect(state.toolStates.v0?.revisitAt).toBe("2026-07-01T00:00:00.000Z");
    expect(state.toolStates.cursor?.alternatives).toEqual(["cursor", "v0"]);
    expect(state.compare.slugs).toEqual([]);
    expect(state.events.some((event) => event.type === "decided" && event.slug === "cursor")).toBe(true);

    const reloaded = activateToolWorkspaceOwner({ kind: "guest" }).state;
    expect(reloaded.toolStates.v0?.revisitAt).toBe("2026-07-01T00:00:00.000Z");
    expect(chooseResumeAction(reloaded, "2026-08-01T00:00:00.000Z")).toEqual({
      kind: "review_decision",
      slug: "v0",
    });

    setWorkspaceDecision("v0", null);
    expect(getCanonicalToolWorkspaceState().toolStates.v0?.decision?.outcome).toBeNull();
    expect(getCanonicalToolWorkspaceState().toolStates.v0?.revisitAt).toBeNull();
  });

  it("marks using and persists after reload", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    toggleWorkspaceSaved("cursor");
    markWorkspaceToolUsing("cursor");

    const state = getCanonicalToolWorkspaceState();
    expect(state.toolStates.cursor?.usage).toBe("using");
    expect(state.toolStates.cursor?.decision?.outcome).toBe("selected");

    const reloaded = activateToolWorkspaceOwner({ kind: "guest" }).state;
    expect(reloaded.toolStates.cursor?.usage).toBe("using");
    expect(reloaded.toolStates.cursor?.decision?.outcome).toBe("selected");
  });

  it("adds, archives and restores a personal stack without writing legacy stack", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    toggleWorkspaceSaved("cursor");
    addToolToWorkingPersonalStack("cursor");

    const state = getCanonicalToolWorkspaceState();
    expect(workingPersonalStackSlugs(state)).toEqual(["cursor"]);
    expect(state.stack.slugs).toEqual([]);
    expect(leftoverLegacyStackSlugs(state)).toEqual([]);

    const id = state.personalStacks[0]?.id as string;
    archivePersonalStack(id);
    expect(getCanonicalToolWorkspaceState().personalStacks[0]?.archivedAt).toBeTruthy();
    restorePersonalStack(id);
    expect(getCanonicalToolWorkspaceState().personalStacks[0]?.archivedAt).toBeNull();
  });
});
