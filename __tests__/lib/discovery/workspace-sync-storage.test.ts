import { describe, expect, it } from "vitest";

import {
  applyWorkspaceSyncSnapshot,
  readWorkspaceSyncRecovery,
} from "@/lib/discovery/workspace-sync-storage";
import {
  loadWorkspaceStateFromStorage,
  persistWorkspaceStateToStorage,
  type WorkspaceStorage,
} from "@/lib/discovery/workspace-storage";
import {
  WORKSPACE_STORAGE_KEY,
  WORKSPACE_SYNC_PREVIOUS_KEY,
} from "@/lib/discovery/workspace-storage-keys";
import {
  createEmptyWorkspaceState,
  normalizeWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-state";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";

const T0 = "2026-07-16T10:00:00.000Z";
const T2 = "2026-07-16T12:00:00.000Z";

class MemoryStorage implements WorkspaceStorage {
  readonly values = new Map<string, string>();
  readonly failedWrites = new Set<string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    if (this.failedWrites.has(key)) {
      throw new Error(`write blocked for ${key}`);
    }
    this.values.set(key, value);
  }
}

function save(
  state: WorkspaceStateV1,
  slug: string,
  at: string,
): WorkspaceStateV1 {
  return reduceWorkspaceState(state, {
    type: "saved/set",
    slug,
    saved: true,
    at,
  });
}

function undatedSaved(...slugs: string[]): WorkspaceStateV1 {
  return normalizeWorkspaceState({
    ...createEmptyWorkspaceState(),
    saved: { slugs, updatedAt: null },
  });
}

describe("canonical workspace sync storage", () => {
  it("captures the previous account snapshot before applying a merged remote snapshot", () => {
    const storage = new MemoryStorage();
    const current = undatedSaved("local-alpha");
    const incoming = undatedSaved("remote-beta");
    expect(persistWorkspaceStateToStorage(storage, current, { now: T0 }).persisted).toBe(true);

    const result = applyWorkspaceSyncSnapshot(storage, incoming, {
      owner: { kind: "account", userId: "account-1" },
      reason: "hydrate",
      now: T2,
    });

    expect(result).toMatchObject({
      applied: true,
      recoveryRequired: false,
    });
    expect(result.state.saved.slugs).toEqual(["remote-beta", "local-alpha"]);

    const previous = JSON.parse(storage.getItem(WORKSPACE_SYNC_PREVIOUS_KEY) ?? "null");
    expect(previous).toEqual({
      formatVersion: 1,
      capturedAt: T2,
      reason: "hydrate",
      owner: { kind: "account", userId: "account-1" },
      state: current,
    });
    expect(loadWorkspaceStateFromStorage(storage).state).toEqual(result.state);
  });

  it("keeps the current canonical state and stores recovery when the previous snapshot cannot be written", () => {
    const storage = new MemoryStorage();
    const current = save(createEmptyWorkspaceState(), "local-alpha", T0);
    const incoming = save(createEmptyWorkspaceState(), "remote-beta", T1);
    expect(persistWorkspaceStateToStorage(storage, current, { now: T0 }).persisted).toBe(true);
    storage.failedWrites.add(WORKSPACE_SYNC_PREVIOUS_KEY);

    const result = applyWorkspaceSyncSnapshot(storage, incoming, {
      owner: { kind: "account", userId: "account-1" },
      reason: "hydrate",
      now: T2,
    });

    expect(result).toEqual({
      state: current,
      applied: false,
      recoveryRequired: true,
    });
    expect(readWorkspaceSyncRecovery(storage, {
      kind: "account",
      userId: "account-1",
    })).toEqual(current);
    expect(JSON.parse(storage.getItem(WORKSPACE_STORAGE_KEY) ?? "null")).toEqual(current);
  });

});
