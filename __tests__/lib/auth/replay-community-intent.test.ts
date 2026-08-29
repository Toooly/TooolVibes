import { describe, expect, it } from "vitest";

import { replayCommunityWriteIntent } from "@/lib/auth/replay-community-intent";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import { activateToolWorkspaceOwner } from "@/lib/stores/tool-workspace-store";
import type { PendingAuthIntent } from "@/lib/auth/pending-auth-intent";

function intent(): PendingAuthIntent {
  return {
    version: 1,
    id: "intent-community-replay",
    capability: "community.write",
    payload: { toolSlug: "blink" },
    returnTo: "/toools/blink",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };
}

describe("replayCommunityWriteIntent", () => {
  it("skips guests and opens form for accounts without writing", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    expect(replayCommunityWriteIntent(intent()).status).toBe("skipped");
    activateToolWorkspaceOwner({ kind: "account", userId: "u1" }, createEmptyWorkspaceState());
    const result = replayCommunityWriteIntent(intent());
    expect(result).toEqual({ status: "ok", returnTo: "/toools/blink", openForm: true });
  });
});
