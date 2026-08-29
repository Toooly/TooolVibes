/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  getOpenPersonalInsightSlug,
  resetPersonalInsightLayerForTests,
} from "@/lib/auth/personal-insight-layer-state";
import {
  maybeOpenInsightLayerAfterReplay,
  replayInsightPersonalIntent,
} from "@/lib/auth/replay-insight-intent";
import type { PendingAuthIntent } from "@/lib/auth/pending-auth-intent";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import { activateToolWorkspaceOwner } from "@/lib/stores/tool-workspace-store";

function insightIntent(): PendingAuthIntent {
  return {
    version: 1,
    id: "intent-insight-replay",
    capability: "insight.personal",
    payload: { toolSlug: "blink" },
    returnTo: "/toools/blink",
    origin: "insight.tool",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };
}

describe("replay insight personal intent", () => {
  beforeEach(() => {
    resetPersonalInsightLayerForTests();
    activateToolWorkspaceOwner(
      { kind: "account", userId: "u1" },
      createEmptyWorkspaceState(),
    );
  });

  afterEach(() => {
    resetPersonalInsightLayerForTests();
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
  });

  it("opens the layer without writing workspace", () => {
    const result = replayInsightPersonalIntent(insightIntent());
    expect(result).toEqual({
      status: "ok",
      returnTo: "/toools/blink",
      openLayer: true,
    });
    maybeOpenInsightLayerAfterReplay(true, "blink");
    expect(getOpenPersonalInsightSlug()).toBe("blink");
  });

  it("skips when still guest", () => {
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    expect(replayInsightPersonalIntent(insightIntent()).status).toBe("skipped");
  });
});
