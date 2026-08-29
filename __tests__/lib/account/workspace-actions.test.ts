import { afterEach, describe, expect, it } from "vitest";

import {
  commitWorkspaceDecision,
  createPersonalStackId,
  deferWorkspaceTool,
  markWorkspaceToolReplaced,
  markWorkspaceToolUsing,
  addToolToPersonalStack,
  restorePersonalStack,
  setWorkspaceDecision,
  setWorkspacePinned,
  toggleWorkspaceCompare,
  toggleWorkspaceSaved,
} from "@/lib/account/workspace-actions";
import { archivePersonalStack, createPersonalStack } from "@/lib/account/workspace-actions";
import { workspaceTestFixtures } from "@/lib/account/test-fixtures";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import {
  activateToolWorkspaceOwner,
  getCanonicalToolWorkspaceState,
} from "@/lib/stores/tool-workspace-store";

afterEach(() => {
  activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
});

describe("workspace action helpers", () => {
  it("slugifies stack names and avoids collisions", () => {
    expect(createPersonalStackId("AI Coding", [])).toBe("ai-coding");
    expect(createPersonalStackId("AI Coding", ["ai-coding"])).toBe("ai-coding-2");
  });

  it("pins and unpins through tool/pin", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, workspaceTestFixtures.withSaved);
    expect(getCanonicalToolWorkspaceState().toolStates.cursor?.pinned).toBe(false);

    setWorkspacePinned("cursor", true);
    expect(getCanonicalToolWorkspaceState().toolStates.cursor?.pinned).toBe(true);

    setWorkspacePinned("cursor", false);
    expect(getCanonicalToolWorkspaceState().toolStates.cursor?.pinned).toBe(false);
  });

  it("unsaves through saved/toggle", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, workspaceTestFixtures.withSaved);
    expect(getCanonicalToolWorkspaceState().saved.slugs).toContain("cursor");

    toggleWorkspaceSaved("cursor");
    expect(getCanonicalToolWorkspaceState().saved.slugs).not.toContain("cursor");
  });

  it("toggles compare through compare/toggle", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, workspaceTestFixtures.withSaved);
    expect(getCanonicalToolWorkspaceState().compare.slugs).not.toContain("cursor");

    toggleWorkspaceCompare("cursor");
    expect(getCanonicalToolWorkspaceState().compare.slugs).toContain("cursor");

    toggleWorkspaceCompare("cursor");
    expect(getCanonicalToolWorkspaceState().compare.slugs).not.toContain("cursor");
  });

  it("defers a tool with revisitAt and clears it when the outcome changes", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, workspaceTestFixtures.withSaved);
    deferWorkspaceTool("cursor", "2026-08-08T00:00:00.000Z");
    const deferred = getCanonicalToolWorkspaceState().toolStates.cursor;
    expect(deferred?.decision?.outcome).toBe("deferred");
    expect(deferred?.revisitAt).toBe("2026-08-08T00:00:00.000Z");

    setWorkspaceDecision("cursor", "selected");
    const selected = getCanonicalToolWorkspaceState().toolStates.cursor;
    expect(selected?.decision?.outcome).toBe("selected");
    expect(selected?.revisitAt).toBeNull();
  });

  it("marks a tool as using and auto-selects it", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, workspaceTestFixtures.withSaved);
    markWorkspaceToolUsing("cursor");
    const using = getCanonicalToolWorkspaceState().toolStates.cursor;
    expect(using?.usage).toBe("using");
    expect(using?.replacedBy).toBeNull();
    expect(using?.decision?.outcome).toBe("selected");
  });

  it("marks a tool as replaced by another slug", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, workspaceTestFixtures.withSaved);
    markWorkspaceToolReplaced("cursor", "linear");
    const replaced = getCanonicalToolWorkspaceState().toolStates.cursor;
    expect(replaced?.usage).toBe("replaced");
    expect(replaced?.replacedBy).toBe("linear");
    expect(replaced?.decision?.outcome).toBe("selected");
  });

  it("ignores replaced without a distinct valid slug", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, workspaceTestFixtures.withSaved);
    const before = getCanonicalToolWorkspaceState();
    markWorkspaceToolReplaced("cursor", "cursor");
    markWorkspaceToolReplaced("cursor", "Bad Slug");
    expect(getCanonicalToolWorkspaceState()).toEqual(before);
  });

  it("does not create a personal stack for a guest owner", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    createPersonalStack("AI Coding");
    expect(getCanonicalToolWorkspaceState().personalStacks).toEqual([]);
  });

  it("does not add to a leftover stack as a guest", () => {
    activateToolWorkspaceOwner(
      { kind: "guest" },
      workspaceTestFixtures.withStacks ?? createEmptyWorkspaceState(),
    );
    const before = getCanonicalToolWorkspaceState();
    const id = before.personalStacks[0]?.id;
    if (!id) return;
    addToolToPersonalStack(id, "cursor");
    expect(getCanonicalToolWorkspaceState().personalStacks[0]?.slugs).toEqual(
      before.personalStacks[0]?.slugs,
    );
  });

  it("restores an archived personal stack", () => {
    activateToolWorkspaceOwner(
      { kind: "account", userId: "user-stack-actions" },
      createEmptyWorkspaceState(),
    );
    createPersonalStack("AI Coding");
    const id = getCanonicalToolWorkspaceState().personalStacks[0]?.id;
    expect(id).toBeTruthy();
    archivePersonalStack(id as string);
    expect(getCanonicalToolWorkspaceState().personalStacks[0]?.archivedAt).toBeTruthy();
    restorePersonalStack(id as string);
    expect(getCanonicalToolWorkspaceState().personalStacks[0]?.archivedAt).toBeNull();
  });
});

describe("commitWorkspaceDecision", () => {
  it("writes reason and useCase on the same workspace/decide event", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, workspaceTestFixtures.withSaved);
    commitWorkspaceDecision({
      slug: "cursor",
      outcome: "selected",
      reason: "Per il daily coding",
      useCase: "pair programming",
      alternatives: ["v0"],
    });
    const state = getCanonicalToolWorkspaceState();
    expect(state.toolStates.cursor?.decision?.outcome).toBe("selected");
    expect(state.toolStates.cursor?.note).toBeNull();
    expect(state.toolStates.cursor?.useCase).toBe("pair programming");
    expect(state.events).toHaveLength(1);
    expect(state.events[0]).toMatchObject({
      type: "decided",
      reason: "Per il daily coding",
      useCase: "pair programming",
      alternatives: ["v0"],
    });
  });

  it("reuses eventId on retry and defaults deferred revisit to 90 days", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, workspaceTestFixtures.withSaved);
    const eventId = "decide-retry-1";
    commitWorkspaceDecision({
      slug: "cursor",
      outcome: "deferred",
      eventId,
    });
    commitWorkspaceDecision({
      slug: "cursor",
      outcome: "deferred",
      eventId,
    });
    const state = getCanonicalToolWorkspaceState();
    expect(state.events.filter((event) => event.type === "decided")).toHaveLength(1);
    expect(state.events[0]?.id).toBe(eventId);
    const revisit = state.toolStates.cursor?.revisitAt;
    expect(revisit).toBeTruthy();
    const delta = new Date(revisit as string).getTime() - Date.now();
    expect(delta).toBeGreaterThan(80 * 24 * 60 * 60 * 1000);
    expect(delta).toBeLessThan(100 * 24 * 60 * 60 * 1000);
  });
});
