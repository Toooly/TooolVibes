import { describe, expect, it } from "vitest";

import { toRemoteWorkspaceState } from "@/lib/discovery/workspace-contract";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import type { WorkspaceStateV1, WorkspaceToolState } from "@/lib/discovery/types";

const T0 = "2026-08-20T10:00:00.000Z";

const tool: WorkspaceToolState = {
  stage: "saved",
  note: "keep this note",
  saveReason: null,
  pinned: false,
  decision: { outcome: "selected", updatedAt: T0 },
  useCase: null,
  alternatives: [],
  revisitAt: null,
  usage: null,
  replacedBy: null,
  compareObjective: null,
  updatedAt: T0,
};

function state(overrides: Partial<WorkspaceStateV1> = {}): WorkspaceStateV1 {
  return {
    ...createEmptyWorkspaceState(),
    saved: { slugs: ["agentx"], updatedAt: T0 },
    toolStates: { agentx: tool },
    ...overrides,
  };
}

describe("toRemoteWorkspaceState", () => {
  it("omits empty events and personalStacks so RPC payloads stay 6-key compatible", () => {
    const remote = toRemoteWorkspaceState(state());
    expect(Object.keys(remote).sort()).toEqual([
      "clearedAt",
      "compare",
      "saved",
      "schemaVersion",
      "stack",
      "toolStates",
    ]);
    expect(remote).not.toHaveProperty("events");
    expect(remote).not.toHaveProperty("personalStacks");
  });

  it("keeps only core toolState keys when software-memory fields are empty", () => {
    const remote = toRemoteWorkspaceState(state());
    const agentx = (remote.toolStates as Record<string, Record<string, unknown>>).agentx;
    expect(Object.keys(agentx).sort()).toEqual([
      "decision",
      "note",
      "pinned",
      "saveReason",
      "stage",
      "updatedAt",
    ]);
  });

  it("keeps events and personalStacks when they carry data", () => {
    const remote = toRemoteWorkspaceState(
      state({
        personalStacks: [
          {
            id: "uso-ora",
            name: "Uso ora",
            description: null,
            slugs: ["agentx"],
            archivedAt: null,
            updatedAt: T0,
          },
        ],
        events: [
          {
            id: "evt-1",
            type: "decided",
            slug: "agentx",
            at: T0,
            outcome: "selected",
            reason: "Prezzo",
          },
        ],
      }),
    );
    expect(remote).toHaveProperty("events");
    expect(remote).toHaveProperty("personalStacks");
    expect((remote.events as unknown[]).length).toBe(1);
  });
});
