/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { replayNotePrivateIntent } from "@/lib/auth/replay-note-intent";
import { writePendingAuthIntent } from "@/lib/auth/pending-auth-intent";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import {
  activateToolWorkspaceOwner,
  getCanonicalToolWorkspaceState,
} from "@/lib/stores/tool-workspace-store";

describe("replay note.private intent", () => {
  beforeEach(() => {
    window.localStorage.clear();
    activateToolWorkspaceOwner(
      { kind: "account", userId: "user-note" },
      createEmptyWorkspaceState(),
    );
  });

  afterEach(() => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
  });

  it("opens editor without writing a note", () => {
    const written = writePendingAuthIntent({
      capability: "note.private",
      toolSlug: "blink",
      returnTo: "/toools/blink",
    });
    expect(written.status).toBe("ready");
    if (written.status !== "ready") return;
    const result = replayNotePrivateIntent(written.intent);
    expect(result).toMatchObject({
      status: "ok",
      returnTo: "/toools/blink",
      openEditor: true,
    });
    expect(getCanonicalToolWorkspaceState().toolStates.blink).toBeUndefined();
  });

  it("skips when still guest", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    const written = writePendingAuthIntent({
      capability: "note.private",
      toolSlug: "blink",
      returnTo: "/toools/blink",
    });
    if (written.status !== "ready") return;
    expect(replayNotePrivateIntent(written.intent)).toMatchObject({
      status: "skipped",
      reason: "not-authenticated",
    });
  });
});
