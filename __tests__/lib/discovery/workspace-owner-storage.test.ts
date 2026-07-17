import { afterEach, describe, expect, it } from "vitest";

import {
  scopeWorkspaceStorage,
  setActiveWorkspaceOwner,
  workspaceStorageKeyForOwner,
} from "@/lib/discovery/workspace-owner-storage";
import {
  loadWorkspaceStateFromStorage,
  persistWorkspaceStateToStorage,
  type WorkspaceStorage,
} from "@/lib/discovery/workspace-storage";
import { LEGACY_TOOL_WORKSPACE_STORAGE_KEY } from "@/lib/discovery/workspace-storage-keys";
import {
  createEmptyWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-state";

const T0 = "2026-07-17T10:00:00.000Z";

class MemoryStorage implements WorkspaceStorage {
  readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

function saved(slug: string) {
  return reduceWorkspaceState(createEmptyWorkspaceState(), {
    type: "saved/set",
    slug,
    saved: true,
    at: T0,
  });
}

afterEach(() => {
  setActiveWorkspaceOwner({ kind: "guest" });
});

describe("owner-scoped workspace storage", () => {
  it("keeps guest and account workspaces physically isolated", () => {
    const storage = new MemoryStorage();
    const accountA = { kind: "account" as const, userId: "account-a" };
    const accountB = { kind: "account" as const, userId: "account-b" };

    persistWorkspaceStateToStorage(storage, saved("guest-tool"), { now: T0 });
    persistWorkspaceStateToStorage(
      scopeWorkspaceStorage(storage, accountA),
      saved("account-a-tool"),
      { now: T0 },
    );
    persistWorkspaceStateToStorage(
      scopeWorkspaceStorage(storage, accountB),
      saved("account-b-tool"),
      { now: T0 },
    );

    expect(loadWorkspaceStateFromStorage(storage).state.saved.slugs).toEqual([
      "guest-tool",
    ]);
    expect(loadWorkspaceStateFromStorage(
      scopeWorkspaceStorage(storage, accountA),
    ).state.saved.slugs).toEqual(["account-a-tool"]);
    expect(loadWorkspaceStateFromStorage(
      scopeWorkspaceStorage(storage, accountB),
    ).state.saved.slugs).toEqual(["account-b-tool"]);
    expect(storage.getItem(workspaceStorageKeyForOwner(accountA))).not.toBeNull();
    expect(storage.getItem(workspaceStorageKeyForOwner(accountB))).not.toBeNull();
  });

  it("never migrates guest legacy bytes into a new account scope", () => {
    const storage = new MemoryStorage();
    storage.setItem(LEGACY_TOOL_WORKSPACE_STORAGE_KEY, JSON.stringify({
      state: { savedSlugs: ["guest-legacy"] },
      version: 0,
    }));

    const account = loadWorkspaceStateFromStorage(scopeWorkspaceStorage(
      storage,
      { kind: "account", userId: "account-a" },
    ));

    expect(account.state).toEqual(createEmptyWorkspaceState());
    expect(storage.getItem(LEGACY_TOOL_WORKSPACE_STORAGE_KEY)).toContain(
      "guest-legacy",
    );
  });
});
