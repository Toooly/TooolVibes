/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { excerptPrivateNote } from "@/lib/account/private-note";
import {
  commitWorkspaceDecision,
  setWorkspaceNote,
} from "@/lib/account/workspace-actions";
import { MAX_NOTE_LENGTH, WORKSPACE_SCHEMA_VERSION } from "@/lib/discovery/workspace-constants";
import { workspaceStateV1Schema } from "@/lib/discovery/schema";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import { workspaceTestFixtures } from "@/lib/account/test-fixtures";
import {
  activateToolWorkspaceOwner,
  getCanonicalToolWorkspaceState,
} from "@/lib/stores/tool-workspace-store";

describe("private note data", () => {
  beforeEach(() => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
  });

  afterEach(() => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
  });

  it("NOTE-DATA-01 create note", () => {
    setWorkspaceNote("blink", "Da provare sul client");
    const state = getCanonicalToolWorkspaceState();
    expect(state.toolStates.blink?.note).toBe("Da provare sul client");
    expect(state.saved.slugs).toContain("blink");
  });

  it("NOTE-DATA-02 edit note", () => {
    setWorkspaceNote("blink", "prima");
    setWorkspaceNote("blink", "dopo");
    expect(getCanonicalToolWorkspaceState().toolStates.blink?.note).toBe("dopo");
  });

  it("NOTE-DATA-03 delete note", () => {
    setWorkspaceNote("blink", "da togliere");
    setWorkspaceNote("blink", null);
    expect(getCanonicalToolWorkspaceState().toolStates.blink?.note).toBeNull();
    expect(getCanonicalToolWorkspaceState().saved.slugs).toContain("blink");
  });

  it("NOTE-DATA-04 empty normalization", () => {
    setWorkspaceNote("blink", "  ");
    expect(getCanonicalToolWorkspaceState().toolStates.blink?.note).toBeNull();
  });

  it("NOTE-DATA-05 max length", () => {
    setWorkspaceNote("blink", "x".repeat(MAX_NOTE_LENGTH));
    expect(getCanonicalToolWorkspaceState().toolStates.blink?.note).toHaveLength(
      MAX_NOTE_LENGTH,
    );
    setWorkspaceNote("blink", "y".repeat(MAX_NOTE_LENGTH + 1));
    expect(getCanonicalToolWorkspaceState().toolStates.blink?.note).toHaveLength(
      MAX_NOTE_LENGTH,
    );
  });

  it("NOTE-DATA-06 updatedAt", () => {
    setWorkspaceNote("blink", "uno");
    const first = getCanonicalToolWorkspaceState().toolStates.blink?.updatedAt;
    expect(first).toBeTruthy();
    setWorkspaceNote("blink", "due");
    const second = getCanonicalToolWorkspaceState().toolStates.blink?.updatedAt;
    expect(second && first && second >= first).toBe(true);
  });

  it("NOTE-DATA-07 other toolState fields unchanged", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, workspaceTestFixtures.withSaved);
    setWorkspaceNote("cursor", "memoria");
    commitWorkspaceDecision({
      slug: "cursor",
      outcome: "selected",
      reason: "Per il daily coding",
    });
    const tool = getCanonicalToolWorkspaceState().toolStates.cursor;
    expect(tool?.note).toBe("memoria");
    expect(tool?.decision?.outcome).toBe("selected");
    expect(getCanonicalToolWorkspaceState().events[0]?.reason).toBe(
      "Per il daily coding",
    );
  });

  it("NOTE-DATA-08 WorkspaceStateV1 valid", () => {
    setWorkspaceNote("blink", "ok");
    const parsed = workspaceStateV1Schema.safeParse(getCanonicalToolWorkspaceState());
    expect(parsed.success).toBe(true);
    expect(getCanonicalToolWorkspaceState().schemaVersion).toBe(
      WORKSPACE_SCHEMA_VERSION,
    );
  });

  it("NOTE-DATA-09 excerpt helper clamps", () => {
    expect(excerptPrivateNote("short")).toBe("short");
    expect(excerptPrivateNote("x".repeat(120), 80)?.endsWith("…")).toBe(true);
  });
});
