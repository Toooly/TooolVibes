/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { replayCompareDeepIntent } from "@/lib/auth/replay-compare-intent";
import { writePendingAuthIntent } from "@/lib/auth/pending-auth-intent";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import { reduceWorkspaceState } from "@/lib/discovery/workspace-contract";
import {
  activateToolWorkspaceOwner,
  getCanonicalToolWorkspaceState,
} from "@/lib/stores/tool-workspace-store";

describe("replay compare.deep", () => {
  beforeEach(() => {
    window.localStorage.clear();
    activateToolWorkspaceOwner(
      { kind: "account", userId: "u1" },
      reduceWorkspaceState(createEmptyWorkspaceState(), {
        type: "compare/toggle",
        slug: "cursor",
        at: "2026-06-01T10:00:00.000Z",
      }),
    );
  });

  afterEach(() => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    window.localStorage.clear();
  });

  it("opens deep layer without rewriting compare slugs", () => {
    const written = writePendingAuthIntent({
      capability: "compare.deep",
      returnTo: "/compare",
      origin: "compare.deep",
    });
    expect(written.status).toBe("ready");
    if (written.status !== "ready") return;
    const before = getCanonicalToolWorkspaceState().compare.slugs.slice();
    const result = replayCompareDeepIntent(written.intent);
    expect(result.status).toBe("ok");
    expect(result.status === "ok" && result.returnTo).toBe("/compare");
    expect(getCanonicalToolWorkspaceState().compare.slugs).toEqual(before);
  });

  it("skips when still guest", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    const written = writePendingAuthIntent({
      capability: "compare.deep",
      returnTo: "/compare",
    });
    expect(written.status).toBe("ready");
    if (written.status !== "ready") return;
    expect(replayCompareDeepIntent(written.intent)).toEqual({
      status: "skipped",
      reason: "not-authenticated",
    });
  });
});
