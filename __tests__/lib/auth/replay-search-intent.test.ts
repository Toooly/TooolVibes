
/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { replaySearchPersonalIntent } from "@/lib/auth/replay-search-intent";
import { writePendingAuthIntent } from "@/lib/auth/pending-auth-intent";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import { activateToolWorkspaceOwner } from "@/lib/stores/tool-workspace-store";

describe("replay search.personal", () => {
  beforeEach(() => {
    window.localStorage.clear();
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
  });
  afterEach(() => {
    window.localStorage.clear();
  });

  it("NOTE-CONT analog: skips while guest", () => {
    const written = writePendingAuthIntent({
      capability: "search.personal",
      query: "usage:using",
      returnTo: "/archivio",
    });
    expect(written.status).toBe("ready");
    if (written.status !== "ready") return;
    const result = replaySearchPersonalIntent(written.intent);
    expect(result.status).toBe("skipped");
  });

  it("NOTE-CONT-03 analog: opens resume query after auth", () => {
    activateToolWorkspaceOwner(
      { kind: "account", userId: "qa" },
      createEmptyWorkspaceState(),
    );
    const written = writePendingAuthIntent({
      capability: "search.personal",
      query: "note:yes",
      returnTo: "/archivio",
    });
    expect(written.status).toBe("ready");
    if (written.status !== "ready") return;
    const result = replaySearchPersonalIntent(written.intent);
    expect(result).toMatchObject({ status: "ok", query: "note:yes" });
  });
});
