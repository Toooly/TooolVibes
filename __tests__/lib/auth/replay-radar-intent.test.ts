import { beforeEach, describe, expect, it } from "vitest";

import { replayRadarPersonalIntent } from "@/lib/auth/replay-radar-intent";
import type { PendingAuthIntent } from "@/lib/auth/pending-auth-intent";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import { activateToolWorkspaceOwner } from "@/lib/stores/tool-workspace-store";
import {
  peekRadarPersonalOpen,
  resetRadarPersonalOpenForTests,
} from "@/lib/radar/radar-personal-resume";
import { maybeOpenRadarPersonalAfterReplay } from "@/lib/auth/replay-radar-intent";

function intent(overrides: Partial<PendingAuthIntent> = {}): PendingAuthIntent {
  return {
    version: 1,
    id: "intent-radar-replay-01",
    capability: "radar.personal",
    payload: {},
    returnTo: "/radar",
    origin: "radar.personal",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    ...overrides,
  };
}

describe("replayRadarPersonalIntent", () => {
  beforeEach(() => {
    resetRadarPersonalOpenForTests();
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
  });

  it("skips when still a guest", () => {
    expect(replayRadarPersonalIntent(intent()).status).toBe("skipped");
  });

  it("rejects extra payload", () => {
    activateToolWorkspaceOwner(
      { kind: "account", userId: "u1" },
      createEmptyWorkspaceState(),
    );
    const result = replayRadarPersonalIntent(
      intent({ payload: { toolSlug: "blink" } as never }),
    );
    expect(result.status).toBe("failed");
  });

  it("opens personal lens without writing", () => {
    activateToolWorkspaceOwner(
      { kind: "account", userId: "u1" },
      createEmptyWorkspaceState(),
    );
    const result = replayRadarPersonalIntent(intent());
    expect(result).toEqual({
      status: "ok",
      returnTo: "/radar",
      openPersonal: true,
    });
    maybeOpenRadarPersonalAfterReplay(true);
    expect(peekRadarPersonalOpen()).toBe(true);
  });
});
