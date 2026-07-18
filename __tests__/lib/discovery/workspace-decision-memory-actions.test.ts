import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getDiscoveryLocalSnapshot,
  getToolDecisionOutcome,
  reopenToolDecision,
  setShortlistStage,
  setToolDecisionOutcome,
  updateToolDecisionMemory,
} from "@/lib/discovery/local-storage";
import {
  markGuestWorkspaceOwner,
  workspaceStorageKeyForOwner,
} from "@/lib/discovery/workspace-owner-storage";
import { WORKSPACE_STORAGE_KEY } from "@/lib/discovery/workspace-storage-keys";
import {
  createEmptyWorkspaceState,
  parseWorkspaceState,
} from "@/lib/discovery/workspace-state";
import {
  activateToolWorkspaceOwner,
  getCanonicalToolWorkspaceState,
} from "@/lib/stores/tool-workspace-store";

class MemoryStorage {
  readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

function setupGuestWindow(entries: Record<string, string> = {}) {
  const storage = new MemoryStorage();
  for (const [key, value] of Object.entries(entries)) {
    storage.values.set(key, value);
  }
  expect(markGuestWorkspaceOwner(storage)).toBe(true);
  const target = new EventTarget() as EventTarget & {
    localStorage: MemoryStorage;
  };
  target.localStorage = storage;
  vi.stubGlobal("window", target);
  return storage;
}

afterEach(() => {
  activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
  vi.unstubAllGlobals();
});

describe("B32 decision memory actions — guest persistence", () => {
  it("persists note and stage edits across reloads for a guest", () => {
    setupGuestWindow();
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());

    setShortlistStage("alpha", "review");
    updateToolDecisionMemory("alpha", { note: "Provare sul progetto X" });

    activateToolWorkspaceOwner({ kind: "guest" }); // reload from durable storage
    const snapshot = getDiscoveryLocalSnapshot();
    expect(snapshot.shortlistStages.alpha).toBe("review");
    expect(snapshot.decisionMemories.alpha.note).toBe("Provare sul progetto X");
  });

  it("clears the note when the draft is empty and rejects notes over 2000 chars", () => {
    setupGuestWindow();
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());

    updateToolDecisionMemory("alpha", { note: "da cancellare" });
    updateToolDecisionMemory("alpha", { note: "   " });
    expect(getCanonicalToolWorkspaceState().toolStates.alpha.note).toBeNull();

    updateToolDecisionMemory("alpha", { note: "x".repeat(2000) });
    expect(getCanonicalToolWorkspaceState().toolStates.alpha.note).toHaveLength(
      2000,
    );

    updateToolDecisionMemory("alpha", { note: "y".repeat(2001) });
    expect(getCanonicalToolWorkspaceState().toolStates.alpha.note).toBe(
      "x".repeat(2000),
    );
  });

  it("records and reopens a decision through the canonical reducer", () => {
    const storage = setupGuestWindow();
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());

    expect(setToolDecisionOutcome("alpha", "selected")).toBe("selected");
    let state = getCanonicalToolWorkspaceState();
    expect(state.toolStates.alpha.decision?.outcome).toBe("selected");
    expect(state.toolStates.alpha.decision?.updatedAt).toBeTruthy();
    expect(state.saved.slugs).toContain("alpha");
    expect(getDiscoveryLocalSnapshot().decisionOutcomes?.alpha).toBe(
      "selected",
    );

    activateToolWorkspaceOwner({ kind: "guest" }); // reload
    expect(getToolDecisionOutcome("alpha")).toBe("selected");

    expect(reopenToolDecision("alpha")).toBeNull();
    state = getCanonicalToolWorkspaceState();
    expect(state.toolStates.alpha.decision?.outcome).toBeNull();
    expect(state.toolStates.alpha.decision?.updatedAt).toBeTruthy();
    expect(
      getDiscoveryLocalSnapshot().decisionOutcomes?.alpha,
    ).toBeUndefined();

    const persisted = parseWorkspaceState(
      JSON.parse(storage.values.get(WORKSPACE_STORAGE_KEY) ?? "null"),
    );
    expect(persisted.toolStates.alpha.decision?.outcome).toBeNull();
  });
});

describe("B32 decision memory actions — guest/auth isolation", () => {
  it("keeps guest and account decision memory in separate owner scopes", () => {
    const storage = setupGuestWindow();
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    setToolDecisionOutcome("alpha", "selected");
    updateToolDecisionMemory("alpha", { note: "nota guest" });

    const account = { kind: "account" as const, userId: "user-a" };
    activateToolWorkspaceOwner(account, createEmptyWorkspaceState());
    expect(getToolDecisionOutcome("alpha")).toBeNull();

    setShortlistStage("alpha", "top");
    setToolDecisionOutcome("alpha", "rejected");

    const accountRaw = storage.values.get(workspaceStorageKeyForOwner(account));
    expect(accountRaw).toBeTruthy();
    const accountState = parseWorkspaceState(JSON.parse(accountRaw ?? "null"));
    expect(accountState.toolStates.alpha.stage).toBe("top");
    expect(accountState.toolStates.alpha.decision?.outcome).toBe("rejected");
    expect(accountState.toolStates.alpha.note).toBeNull();

    activateToolWorkspaceOwner(account); // reload as the logged-in account
    expect(getToolDecisionOutcome("alpha")).toBe("rejected");
    expect(getCanonicalToolWorkspaceState().toolStates.alpha.stage).toBe(
      "top",
    );

    activateToolWorkspaceOwner({ kind: "guest" }); // back to guest
    expect(getToolDecisionOutcome("alpha")).toBe("selected");
    expect(getCanonicalToolWorkspaceState().toolStates.alpha.note).toBe(
      "nota guest",
    );
    const guestState = parseWorkspaceState(
      JSON.parse(storage.values.get(WORKSPACE_STORAGE_KEY) ?? "null"),
    );
    expect(guestState.toolStates.alpha.stage).toBe("saved");
  });
});

describe("B32 decision memory actions — B16 migration fixture", () => {
  const b16Fixture = {
    schemaVersion: 1,
    clearedAt: null,
    saved: {
      slugs: ["alpha", "beta"],
      updatedAt: "2026-07-16T09:00:00.000Z",
    },
    compare: { slugs: [], updatedAt: null },
    stack: { slugs: [], updatedAt: null },
    toolStates: {
      alpha: {
        stage: "review",
        note: "Nota legacy B16",
        saveReason: "compare",
        pinned: true,
        decision: {
          outcome: "deferred",
          updatedAt: "2026-07-16T09:30:00.000Z",
        },
        updatedAt: "2026-07-16T09:30:00.000Z",
      },
    },
  };

  it("edits decision memory on a B16 fixture without breaking the contract", () => {
    const storage = setupGuestWindow({
      [WORKSPACE_STORAGE_KEY]: JSON.stringify(b16Fixture),
    });
    activateToolWorkspaceOwner({ kind: "guest" });

    const snapshot = getDiscoveryLocalSnapshot();
    expect(snapshot.shortlistStages.alpha).toBe("review");
    expect(snapshot.decisionOutcomes?.alpha).toBe("deferred");
    expect(snapshot.decisionMemories.alpha).toMatchObject({
      note: "Nota legacy B16",
      save_reason: "compare",
      is_pinned: true,
    });

    setToolDecisionOutcome("alpha", "selected");
    updateToolDecisionMemory("alpha", { note: "Nota aggiornata B32" });
    setShortlistStage("beta", "top");

    const persisted = parseWorkspaceState(
      JSON.parse(storage.values.get(WORKSPACE_STORAGE_KEY) ?? "null"),
    );
    expect(persisted.saved.slugs).toEqual(["alpha", "beta"]);
    expect(persisted.toolStates.alpha).toMatchObject({
      stage: "review",
      note: "Nota aggiornata B32",
      saveReason: "compare",
      pinned: true,
    });
    expect(persisted.toolStates.alpha.decision?.outcome).toBe("selected");
    expect(persisted.toolStates.beta.stage).toBe("top");

    activateToolWorkspaceOwner({ kind: "guest" }); // reload
    const reloaded = getDiscoveryLocalSnapshot();
    expect(reloaded.decisionOutcomes?.alpha).toBe("selected");
    expect(reloaded.decisionMemories.alpha.note).toBe("Nota aggiornata B32");
    expect(reloaded.shortlistStages.beta).toBe("top");
  });
});
