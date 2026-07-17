import { afterEach, describe, expect, it, vi } from "vitest";

import {
  applyCanonicalRemotePayload,
  finalizeGuestWorkspaceClaim,
  getWorkspaceAttachSnapshot,
  getWorkspaceGuestContribution,
  initializeWorkspaceOwnerProvenance,
  isolateWorkspaceAfterLogout,
  stageWorkspaceForAccount,
} from "@/lib/discovery/workspace-sync-client";
import {
  markGuestWorkspaceOwner,
  scopeWorkspaceStorage,
  workspaceStorageKeyForOwner,
} from "@/lib/discovery/workspace-owner-storage";
import {
  WORKSPACE_UNOWNED_BACKUP_KEY,
} from "@/lib/discovery/workspace-storage-keys";
import {
  persistWorkspaceStateToStorage,
  type WorkspaceStorage,
} from "@/lib/discovery/workspace-storage";
import {
  createEmptyWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-state";
import {
  activateToolWorkspaceOwner,
  getCanonicalToolWorkspaceState,
} from "@/lib/stores/tool-workspace-store";

const T0 = "2026-07-17T10:00:00.000Z";

class MemoryStorage implements WorkspaceStorage {
  readonly values = new Map<string, string>();
  readonly failedWrites = new Set<string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    if (this.failedWrites.has(key)) {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    }
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

function browser(storage: MemoryStorage) {
  const target = new EventTarget() as EventTarget & {
    localStorage: MemoryStorage;
  };
  target.localStorage = storage;
  return target;
}

afterEach(() => {
  activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
  vi.unstubAllGlobals();
});

describe("account workspace isolation", () => {
  it("preserves a pre-marker guest workspace during the owner upgrade", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "tooolvibes:workspace:v1",
      JSON.stringify(saved("legacy-unknown-owner")),
    );
    vi.stubGlobal("window", browser(storage));

    const result = initializeWorkspaceOwnerProvenance({ kind: "guest" });

    expect(result).toMatchObject({
      ready: true,
      legacyQuarantined: false,
      recoveryRequired: false,
    });
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual([
      "legacy-unknown-owner",
    ]);
    expect(storage.getItem(WORKSPACE_UNOWNED_BACKUP_KEY)).toBeNull();
  });

  it("quarantines ambiguous pre-marker bytes before an authenticated boot", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "tooolvibes:workspace:v1",
      JSON.stringify(saved("legacy-unknown-owner")),
    );
    vi.stubGlobal("window", browser(storage));

    const result = initializeWorkspaceOwnerProvenance({
      kind: "account",
      userId: "account-a",
    });

    expect(result).toMatchObject({
      ready: true,
      legacyQuarantined: true,
      recoveryRequired: false,
    });
    expect(getCanonicalToolWorkspaceState()).toEqual(createEmptyWorkspaceState());
    expect(storage.getItem(WORKSPACE_UNOWNED_BACKUP_KEY)).toContain(
      "legacy-unknown-owner",
    );
  });

  it("does not attach account A data when account B signs in after logout", () => {
    const storage = new MemoryStorage();
    vi.stubGlobal("window", browser(storage));
    expect(markGuestWorkspaceOwner(storage)).toBe(true);
    const accountA = saved("account-a-tool");
    const accountB = saved("account-b-tool");

    stageWorkspaceForAccount("account-a", accountA);
    isolateWorkspaceAfterLogout("account-a");
    persistWorkspaceStateToStorage(
      scopeWorkspaceStorage(storage, {
        kind: "account",
        userId: "account-b",
      }),
      accountB,
      { now: T0 },
    );

    const snapshotB = getWorkspaceAttachSnapshot("account-b");

    expect(snapshotB.saved.slugs).toEqual(["account-b-tool"]);
    expect(snapshotB.saved.slugs).not.toContain("account-a-tool");
  });

  it("fails closed in memory when browser storage is unavailable at logout", () => {
    const restrictedWindow = new EventTarget();
    Object.defineProperty(restrictedWindow, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Storage blocked", "SecurityError");
      },
    });
    vi.stubGlobal("window", restrictedWindow);
    activateToolWorkspaceOwner(
      { kind: "account", userId: "account-a" },
      saved("private-account-note"),
    );

    const result = isolateWorkspaceAfterLogout("account-a");

    expect(result.applied).toBe(false);
    expect(result.recoveryRequired).toBe(true);
    expect(getCanonicalToolWorkspaceState()).toEqual(
      createEmptyWorkspaceState(),
    );
  });

  it("recovers an inactive account volatile workspace after logout and relogin", () => {
    const restrictedWindow = new EventTarget();
    Object.defineProperty(restrictedWindow, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Storage blocked", "SecurityError");
      },
    });
    vi.stubGlobal("window", restrictedWindow);
    activateToolWorkspaceOwner(
      { kind: "account", userId: "account-a" },
      saved("account-a-volatile"),
    );
    isolateWorkspaceAfterLogout("account-a");

    expect(getWorkspaceAttachSnapshot("account-a").saved.slugs).toEqual([
      "account-a-volatile",
    ]);
  });

  it("keeps guest handoff additive when guest timestamps are newer", () => {
    const storage = new MemoryStorage();
    vi.stubGlobal("window", browser(storage));
    expect(markGuestWorkspaceOwner(storage)).toBe(true);
    const accountOwner = { kind: "account" as const, userId: "account-b" };
    const account = saved("account-tool");
    const guest = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "saved/set",
      slug: "guest-tool",
      saved: true,
      at: "2026-07-17T12:00:00.000Z",
    });
    persistWorkspaceStateToStorage(
      scopeWorkspaceStorage(storage, accountOwner),
      account,
      { now: T0 },
    );
    persistWorkspaceStateToStorage(storage, guest, { now: T0 });

    const accountSnapshot = getWorkspaceAttachSnapshot("account-b");
    const contribution = getWorkspaceGuestContribution("account-b");
    const staged = stageWorkspaceForAccount(
      "account-b",
      accountSnapshot,
      contribution,
    );

    expect(staged.ready).toBe(true);
    expect(staged.state.saved.slugs).toEqual([
      "account-tool",
      "guest-tool",
    ]);
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual([
      "account-tool",
      "guest-tool",
    ]);
    expect(getWorkspaceGuestContribution("account-b").saved.slugs).toEqual([
      "guest-tool",
    ]);
  });

  it("reserves an uncleared guest claim for only the account that claimed it", () => {
    const storage = new MemoryStorage();
    vi.stubGlobal("window", browser(storage));
    expect(markGuestWorkspaceOwner(storage)).toBe(true);
    const guest = saved("guest-private");
    persistWorkspaceStateToStorage(storage, guest, { now: T0 });
    storage.failedWrites.add("tooolvibes:workspace:v1");

    const stagedA = stageWorkspaceForAccount(
      "account-a",
      createEmptyWorkspaceState(),
      getWorkspaceGuestContribution("account-a"),
    );

    expect(stagedA.ready).toBe(true);
    expect(stagedA.guestCleared).toBe(false);
    expect(stagedA.state.saved.slugs).toEqual(["guest-private"]);
    expect(getWorkspaceGuestContribution("account-a").saved.slugs).toEqual([
      "guest-private",
    ]);
    expect(getWorkspaceGuestContribution("account-b")).toEqual(
      createEmptyWorkspaceState(),
    );
    expect(getWorkspaceAttachSnapshot("account-b").saved.slugs).toEqual([]);
  });

  it("keeps the guest overlay visible and idempotent across attach retries", () => {
    const storage = new MemoryStorage();
    vi.stubGlobal("window", browser(storage));
    expect(markGuestWorkspaceOwner(storage)).toBe(true);
    persistWorkspaceStateToStorage(storage, saved("guest-retry"), { now: T0 });

    const firstGuest = getWorkspaceGuestContribution("account-retry");
    const first = stageWorkspaceForAccount(
      "account-retry",
      createEmptyWorkspaceState(),
      firstGuest,
    );
    const retryAccount = getWorkspaceAttachSnapshot("account-retry");
    const retryGuest = getWorkspaceGuestContribution("account-retry");
    const second = stageWorkspaceForAccount(
      "account-retry",
      retryAccount,
      retryGuest,
    );

    expect(first.state.saved.slugs).toEqual(["guest-retry"]);
    expect(second.state.saved.slugs).toEqual(["guest-retry"]);
    expect(retryGuest.saved.slugs).toEqual(["guest-retry"]);
  });

  it("restores a pending guest claim when logout happens before attach succeeds", () => {
    const storage = new MemoryStorage();
    vi.stubGlobal("window", browser(storage));
    expect(markGuestWorkspaceOwner(storage)).toBe(true);
    persistWorkspaceStateToStorage(storage, saved("guest-before-login"), {
      now: T0,
    });
    stageWorkspaceForAccount(
      "account-a",
      createEmptyWorkspaceState(),
      getWorkspaceGuestContribution("account-a"),
    );

    const result = isolateWorkspaceAfterLogout("account-a");

    expect(result.state.saved.slugs).toEqual(["guest-before-login"]);
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual([
      "guest-before-login",
    ]);
  });

  it("merges post-claim guest-tab changes when a pending attach is rolled back", () => {
    const storage = new MemoryStorage();
    vi.stubGlobal("window", browser(storage));
    expect(markGuestWorkspaceOwner(storage)).toBe(true);
    persistWorkspaceStateToStorage(storage, saved("guest-before-login"), {
      now: T0,
    });
    stageWorkspaceForAccount(
      "account-a",
      createEmptyWorkspaceState(),
      getWorkspaceGuestContribution("account-a"),
    );
    persistWorkspaceStateToStorage(
      scopeWorkspaceStorage(storage, { kind: "guest" }),
      saved("guest-other-tab"),
      { now: T0 },
    );

    isolateWorkspaceAfterLogout("account-a");
    activateToolWorkspaceOwner({ kind: "guest" });

    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual([
      "guest-before-login",
      "guest-other-tab",
    ]);
  });

  it("does not expose a successfully claimed guest snapshot to another account", () => {
    const storage = new MemoryStorage();
    vi.stubGlobal("window", browser(storage));
    expect(markGuestWorkspaceOwner(storage)).toBe(true);
    persistWorkspaceStateToStorage(storage, saved("claimed-by-a"), { now: T0 });
    stageWorkspaceForAccount(
      "account-a",
      createEmptyWorkspaceState(),
      getWorkspaceGuestContribution("account-a"),
    );
    persistWorkspaceStateToStorage(
      scopeWorkspaceStorage(storage, { kind: "guest" }),
      saved("new-guest-tab"),
      { now: T0 },
    );

    expect(finalizeGuestWorkspaceClaim("account-a")).toBe(true);
    activateToolWorkspaceOwner({ kind: "guest" });

    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual([
      "new-guest-tab",
    ]);
    expect(getWorkspaceGuestContribution("account-b").saved.slugs).toEqual([
      "new-guest-tab",
    ]);
    expect(getWorkspaceGuestContribution("account-b").saved.slugs).not.toContain(
      "claimed-by-a",
    );
  });

  it("retains volatile local intent when applying a remote payload cannot persist", () => {
    const storage = new MemoryStorage();
    vi.stubGlobal("window", browser(storage));
    const owner = { kind: "account" as const, userId: "account-a" };
    persistWorkspaceStateToStorage(
      scopeWorkspaceStorage(storage, owner),
      createEmptyWorkspaceState(),
      { now: T0 },
    );
    activateToolWorkspaceOwner(owner);
    storage.failedWrites.add(workspaceStorageKeyForOwner(owner));
    const local = saved("local-volatile");
    activateToolWorkspaceOwner(owner, local);
    const remote = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "compare/toggle",
      slug: "remote-tool",
      at: T0,
    });

    const result = applyCanonicalRemotePayload({
      data: remote,
      meta: {
        mode: "remote",
        remote_available: true,
        viewer_kind: "account",
        synced_at: T0,
        error: null,
        revision: "2",
        recovery_required: false,
      },
    }, { owner, reason: "save" });

    expect(result.recoveryRequired).toBe(true);
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual([
      "local-volatile",
    ]);
    expect(getCanonicalToolWorkspaceState().compare.slugs).toEqual([
      "remote-tool",
    ]);
  });
});
