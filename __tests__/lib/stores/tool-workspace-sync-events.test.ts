import { afterEach, describe, expect, it, vi } from "vitest";

import { handleWorkspaceStorageEvent } from "@/lib/discovery/client-store";
import {
  markGuestWorkspaceOwner,
  workspaceStorageKeyForOwner,
} from "@/lib/discovery/workspace-owner-storage";
import {
  createEmptyWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-state";
import { WORKSPACE_STORAGE_KEY } from "@/lib/discovery/workspace-storage-keys";
import {
  DISCOVERY_SYNC_EVENT,
  type WorkspaceChangeEventDetail,
} from "@/lib/discovery/workspace-events";
import {
  activateToolWorkspaceOwner,
  commitCanonicalToolWorkspaceState,
  getCanonicalToolWorkspaceState,
  useToolWorkspaceStore,
} from "@/lib/stores/tool-workspace-store";

const T0 = "2026-07-17T10:00:00.000Z";

class MemoryStorage {
  readonly values = new Map<string, string>([
    [WORKSPACE_STORAGE_KEY, JSON.stringify(createEmptyWorkspaceState())],
  ]);
  readonly failedWrites = new Set<string>();
  writes = 0;

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.writes += 1;
    if (this.failedWrites.has(key)) {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    }
    this.values.set(key, value);
  }
}

afterEach(() => {
  activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
  vi.unstubAllGlobals();
});

describe("tool workspace sync events", () => {
  it("notifies the canonical persistence provider after a same-tab mutation", () => {
    const target = new EventTarget() as EventTarget & {
      localStorage: MemoryStorage;
    };
    target.localStorage = new MemoryStorage();
    vi.stubGlobal("window", target);
    const details: WorkspaceChangeEventDetail[] = [];
    target.addEventListener(DISCOVERY_SYNC_EVENT, (event) => {
      details.push((event as CustomEvent<WorkspaceChangeEventDetail>).detail);
    });
    useToolWorkspaceStore.setState({
      savedSlugs: [],
      compareSlugs: [],
      stackSlugs: [],
      selectedSlug: null,
      isCommandOpen: false,
    });

    expect(useToolWorkspaceStore.getState().toggleSaved("alpha")).toBe(true);

    expect(details).toEqual([{ source: "local", scope: "workspace" }]);
  });

  it("keeps the desired mutation available when canonical storage rejects the write", () => {
    const storage = new MemoryStorage();
    const target = new EventTarget() as EventTarget & {
      localStorage: MemoryStorage;
    };
    target.localStorage = storage;
    vi.stubGlobal("window", target);
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
    storage.failedWrites.add(WORKSPACE_STORAGE_KEY);

    expect(useToolWorkspaceStore.getState().toggleSaved("volatile-alpha")).toBe(true);

    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual([
      "volatile-alpha",
    ]);
  });

  it("ignores cross-tab events owned by a different account", () => {
    const storage = new MemoryStorage();
    const target = new EventTarget() as EventTarget & {
      localStorage: MemoryStorage;
    };
    target.localStorage = storage;
    vi.stubGlobal("window", target);
    const accountA = { kind: "account" as const, userId: "account-a" };
    const accountB = { kind: "account" as const, userId: "account-b" };
    const stateA = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "saved/set",
      slug: "account-a-tool",
      saved: true,
      at: T0,
    });
    const stateB = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "saved/set",
      slug: "account-b-tool",
      saved: true,
      at: T0,
    });
    activateToolWorkspaceOwner(accountB, stateB);

    handleWorkspaceStorageEvent({
      key: workspaceStorageKeyForOwner(accountA),
      oldValue: null,
      newValue: JSON.stringify(stateA),
    } as StorageEvent);

    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual([
      "account-b-tool",
    ]);
  });

  it("treats a stale StorageEvent as invalidation without rolling durable state back", () => {
    const storage = new MemoryStorage();
    expect(markGuestWorkspaceOwner(storage)).toBe(true);
    const target = new EventTarget() as EventTarget & {
      localStorage: MemoryStorage;
    };
    target.localStorage = storage;
    vi.stubGlobal("window", target);
    const stale = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "saved/set",
      slug: "stale-alpha",
      saved: true,
      at: T0,
    });
    const current = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "saved/set",
      slug: "current-beta",
      saved: true,
      at: "2026-07-17T11:00:00.000Z",
    });
    storage.values.set(WORKSPACE_STORAGE_KEY, JSON.stringify(current));
    activateToolWorkspaceOwner({ kind: "guest" });
    const writesBefore = storage.writes;

    handleWorkspaceStorageEvent({
      key: WORKSPACE_STORAGE_KEY,
      oldValue: null,
      newValue: JSON.stringify(stale),
    } as StorageEvent);

    expect(getCanonicalToolWorkspaceState()).toEqual(current);
    expect(storage.values.get(WORKSPACE_STORAGE_KEY)).toBe(
      JSON.stringify(current),
    );
    expect(storage.writes).toBe(writesBefore);
  });

  it("preserves an unpersisted local mutation across a cross-tab refresh", () => {
    const storage = new MemoryStorage();
    expect(markGuestWorkspaceOwner(storage)).toBe(true);
    const target = new EventTarget() as EventTarget & {
      localStorage: MemoryStorage;
    };
    target.localStorage = storage;
    vi.stubGlobal("window", target);
    const durable = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "saved/set",
      slug: "durable-alpha",
      saved: true,
      at: T0,
    });
    storage.values.set(WORKSPACE_STORAGE_KEY, JSON.stringify(durable));
    activateToolWorkspaceOwner({ kind: "guest" });
    storage.failedWrites.add(WORKSPACE_STORAGE_KEY);
    expect(useToolWorkspaceStore.getState().toggleSaved("volatile-beta")).toBe(true);
    const writesBefore = storage.writes;

    handleWorkspaceStorageEvent({
      key: WORKSPACE_STORAGE_KEY,
      oldValue: null,
      newValue: JSON.stringify(createEmptyWorkspaceState()),
    } as StorageEvent);

    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual([
      "durable-alpha",
      "volatile-beta",
    ]);
    expect(storage.writes).toBe(writesBefore);
  });

  it("rebases a failed local pin with a concurrent remote note", () => {
    const storage = new MemoryStorage();
    expect(markGuestWorkspaceOwner(storage)).toBe(true);
    const target = new EventTarget() as EventTarget & {
      localStorage: MemoryStorage;
    };
    target.localStorage = storage;
    vi.stubGlobal("window", target);
    const base = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "tool/note",
      slug: "alpha",
      note: "base note",
      at: T0,
    });
    storage.values.set(WORKSPACE_STORAGE_KEY, JSON.stringify(base));
    activateToolWorkspaceOwner({ kind: "guest" });
    storage.failedWrites.add(WORKSPACE_STORAGE_KEY);
    const localPinned = reduceWorkspaceState(base, {
      type: "tool/pin",
      slug: "alpha",
      pinned: true,
      at: "2026-07-17T11:00:00.000Z",
    });
    commitCanonicalToolWorkspaceState(localPinned);
    const remoteNote = reduceWorkspaceState(base, {
      type: "tool/note",
      slug: "alpha",
      note: "remote note",
      at: "2026-07-17T12:00:00.000Z",
    });
    storage.values.set(WORKSPACE_STORAGE_KEY, JSON.stringify(remoteNote));

    handleWorkspaceStorageEvent({
      key: WORKSPACE_STORAGE_KEY,
      oldValue: null,
      newValue: JSON.stringify(remoteNote),
    } as StorageEvent);

    expect(getCanonicalToolWorkspaceState().toolStates.alpha).toMatchObject({
      note: "remote note",
      pinned: true,
    });
  });

  it("keeps a failed local removal while preserving a concurrent remote add", () => {
    const storage = new MemoryStorage();
    expect(markGuestWorkspaceOwner(storage)).toBe(true);
    const target = new EventTarget() as EventTarget & {
      localStorage: MemoryStorage;
    };
    target.localStorage = storage;
    vi.stubGlobal("window", target);
    const base = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "saved/set",
      slug: "alpha",
      saved: true,
      at: T0,
    });
    storage.values.set(WORKSPACE_STORAGE_KEY, JSON.stringify(base));
    activateToolWorkspaceOwner({ kind: "guest" });
    storage.failedWrites.add(WORKSPACE_STORAGE_KEY);
    commitCanonicalToolWorkspaceState(reduceWorkspaceState(base, {
      type: "saved/set",
      slug: "alpha",
      saved: false,
      at: "2026-07-17T11:00:00.000Z",
    }));
    const remote = reduceWorkspaceState(base, {
      type: "saved/set",
      slug: "beta",
      saved: true,
      at: "2026-07-17T12:00:00.000Z",
    });
    storage.values.set(WORKSPACE_STORAGE_KEY, JSON.stringify(remote));

    handleWorkspaceStorageEvent({
      key: WORKSPACE_STORAGE_KEY,
      oldValue: null,
      newValue: JSON.stringify(remote),
    } as StorageEvent);

    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual(["beta"]);
  });

  it("respects clear boundaries while retaining genuinely later remote work", () => {
    const storage = new MemoryStorage();
    expect(markGuestWorkspaceOwner(storage)).toBe(true);
    const target = new EventTarget() as EventTarget & {
      localStorage: MemoryStorage;
    };
    target.localStorage = storage;
    vi.stubGlobal("window", target);
    const base = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "saved/set",
      slug: "alpha",
      saved: true,
      at: T0,
    });
    storage.values.set(WORKSPACE_STORAGE_KEY, JSON.stringify(base));
    activateToolWorkspaceOwner({ kind: "guest" });
    storage.failedWrites.add(WORKSPACE_STORAGE_KEY);
    commitCanonicalToolWorkspaceState(reduceWorkspaceState(base, {
      type: "workspace/clear",
      at: "2026-07-17T12:00:00.000Z",
    }));
    const remoteAfterClear = reduceWorkspaceState(base, {
      type: "saved/set",
      slug: "beta",
      saved: true,
      at: "2026-07-17T13:00:00.000Z",
    });
    storage.values.set(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify(remoteAfterClear),
    );

    handleWorkspaceStorageEvent({
      key: WORKSPACE_STORAGE_KEY,
      oldValue: null,
      newValue: JSON.stringify(remoteAfterClear),
    } as StorageEvent);

    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual(["beta"]);
    expect(getCanonicalToolWorkspaceState().clearedAt).toBe(
      "2026-07-17T12:00:00.000Z",
    );
  });

  it("applies a failed local stack reorder without dropping a remote addition", () => {
    const storage = new MemoryStorage();
    expect(markGuestWorkspaceOwner(storage)).toBe(true);
    const target = new EventTarget() as EventTarget & {
      localStorage: MemoryStorage;
    };
    target.localStorage = storage;
    vi.stubGlobal("window", target);
    let base = createEmptyWorkspaceState();
    for (const slug of ["alpha", "beta", "gamma"]) {
      base = reduceWorkspaceState(base, {
        type: "stack/add",
        slug,
        at: T0,
      });
    }
    storage.values.set(WORKSPACE_STORAGE_KEY, JSON.stringify(base));
    activateToolWorkspaceOwner({ kind: "guest" });
    storage.failedWrites.add(WORKSPACE_STORAGE_KEY);
    commitCanonicalToolWorkspaceState(reduceWorkspaceState(base, {
      type: "stack/reorder",
      slugs: ["gamma", "beta", "alpha"],
      at: "2026-07-17T11:00:00.000Z",
    }));
    const remote = reduceWorkspaceState(base, {
      type: "stack/add",
      slug: "delta",
      at: "2026-07-17T12:00:00.000Z",
    });
    storage.values.set(WORKSPACE_STORAGE_KEY, JSON.stringify(remote));

    handleWorkspaceStorageEvent({
      key: WORKSPACE_STORAGE_KEY,
      oldValue: null,
      newValue: JSON.stringify(remote),
    } as StorageEvent);

    expect(getCanonicalToolWorkspaceState().stack.slugs).toEqual([
      "gamma",
      "beta",
      "alpha",
      "delta",
    ]);
  });
});
