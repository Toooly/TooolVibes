import { afterEach, describe, expect, it } from "vitest";

import {
  createPersonalStackId,
  setWorkspacePinned,
  toggleWorkspaceCompare,
  toggleWorkspaceSaved,
} from "@/lib/account/workspace-actions";
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
});
