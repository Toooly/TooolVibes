import { describe, expect, it } from "vitest";

import {
  composeDecisionMemory,
  composeDecisionReason,
  currentDecisionMemories,
  listUsingStackSlugs,
} from "@/lib/account/decision-memory";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-contract";

describe("decision memory", () => {
  it("composes reason chips with an optional note", () => {
    expect(composeDecisionReason(["prezzo", "facilita"], "MVP in una settimana")).toBe(
      "Prezzo · Facilità · MVP in una settimana",
    );
    expect(composeDecisionReason([], "")).toBeNull();
  });

  it("lists using tools as the live stack", () => {
    const state = createEmptyWorkspaceState();
    state.toolStates.blink = {
      stage: "saved",
      note: null,
      saveReason: null,
      pinned: false,
      decision: { outcome: "selected", updatedAt: "2026-09-01T10:00:00.000Z" },
      useCase: null,
      alternatives: ["v0"],
      revisitAt: null,
      usage: "using",
      replacedBy: null,
      compareObjective: null,
      updatedAt: "2026-09-02T10:00:00.000Z",
    };
    state.toolStates.v0 = {
      ...state.toolStates.blink,
      usage: "stopped",
      updatedAt: "2026-09-03T10:00:00.000Z",
    };
    expect(listUsingStackSlugs(state)).toEqual(["blink"]);
  });

  it("keeps the latest non-archived decision per tool", () => {
    const state = createEmptyWorkspaceState();
    state.toolStates.blink = {
      stage: "top",
      note: null,
      saveReason: null,
      pinned: false,
      decision: { outcome: "selected", updatedAt: "2026-09-05T10:00:00.000Z" },
      useCase: "MVP",
      alternatives: ["v0"],
      revisitAt: null,
      usage: "using",
      replacedBy: null,
      compareObjective: null,
      updatedAt: "2026-09-05T10:00:00.000Z",
    };
    state.events = [
      {
        id: "old",
        type: "decided",
        slug: "blink",
        at: "2026-08-01T10:00:00.000Z",
        outcome: "selected",
        reason: "prima prova",
        alternatives: ["mocha"],
      },
      {
        id: "new",
        type: "decided",
        slug: "blink",
        at: "2026-09-05T10:00:00.000Z",
        outcome: "selected",
        reason: "Più veloce di v0",
        alternatives: ["v0"],
      },
    ];
    const history = composeDecisionMemory(state);
    expect(history).toHaveLength(2);
    expect(history[0]?.id).toBe("new");
    const current = currentDecisionMemories(state);
    expect(current).toHaveLength(1);
    expect(current[0]?.reason).toBe("Più veloce di v0");
    expect(current[0]?.vsSlugs).toEqual(["v0"]);
  });
});
