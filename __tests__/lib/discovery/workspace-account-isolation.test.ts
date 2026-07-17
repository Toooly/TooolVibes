import { afterEach, describe, expect, it, vi } from "vitest";

import {
  applyCanonicalRemotePayload,
  finalizeGuestWorkspaceClaim as finalizeGuestWorkspaceClaimWithPolicy,
  getWorkspaceAttachSnapshot,
  getWorkspaceGuestContribution,
  hasQuarantinedWorkspaceRecovery,
  initializeWorkspaceOwnerProvenance,
  isolateWorkspaceAfterLogout as isolateWorkspaceAfterLogoutWithPolicy,
  restoreLatestQuarantinedWorkspace,
  stageWorkspaceForAccount as stageWorkspaceForAccountWithPolicy,
} from "@/lib/discovery/workspace-sync-client";
import {
  markGuestWorkspaceOwner,
  scopeWorkspaceStorage,
  workspaceStorageKeyForOwner,
} from "@/lib/discovery/workspace-owner-storage";
import {
  WORKSPACE_GUEST_CLAIM_KEY,
  WORKSPACE_STORAGE_KEY,
  WORKSPACE_UNOWNED_BACKUP_KEY,
} from "@/lib/discovery/workspace-storage-keys";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";
import {
  workspaceSyncStateV1Schema,
} from "@/lib/discovery/schema";
import {
  loadWorkspaceStateFromStorage,
  persistWorkspaceStateToStorage,
  type WorkspaceStorage,
} from "@/lib/discovery/workspace-storage";
import {
  createEmptyWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-state";
import {
  activateToolWorkspaceOwner,
  commitCanonicalToolWorkspaceState,
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

function stageWorkspaceForAccount(
  userId: string,
  accountSnapshot: WorkspaceStateV1,
  guestContribution?: WorkspaceStateV1,
) {
  return stageWorkspaceForAccountWithPolicy(
    userId,
    accountSnapshot,
    guestContribution,
    { guestClaimLockHeld: true },
  );
}

function finalizeGuestWorkspaceClaim(userId: string) {
  return finalizeGuestWorkspaceClaimWithPolicy(userId, {
    guestClaimLockHeld: true,
  });
}

function isolateWorkspaceAfterLogout(userId: string) {
  return isolateWorkspaceAfterLogoutWithPolicy(userId, {
    guestClaimLockHeld: true,
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
  it("quarantines a pre-marker workspace instead of attributing it to a guest", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "tooolvibes:workspace:v1",
      JSON.stringify(saved("legacy-unknown-owner")),
    );
    vi.stubGlobal("window", browser(storage));

    const result = initializeWorkspaceOwnerProvenance({ kind: "guest" });

    expect(result).toMatchObject({
      ready: true,
      legacyQuarantined: true,
      recoveryRequired: false,
    });
    expect(getCanonicalToolWorkspaceState()).toEqual(createEmptyWorkspaceState());
    expect(storage.getItem(WORKSPACE_UNOWNED_BACKUP_KEY)).toContain(
      "legacy-unknown-owner",
    );
    expect(hasQuarantinedWorkspaceRecovery()).toBe(true);
  });

  it("restores the latest quarantined workspace only after explicit consent", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "tooolvibes:workspace:v1",
      JSON.stringify(saved("legacy-explicit-recovery")),
    );
    vi.stubGlobal("window", browser(storage));
    initializeWorkspaceOwnerProvenance({ kind: "guest" });

    expect(getCanonicalToolWorkspaceState()).toEqual(createEmptyWorkspaceState());

    const result = restoreLatestQuarantinedWorkspace({ kind: "guest" });

    expect(result).toMatchObject({ restored: true, recoveryRecorded: true });
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual([
      "legacy-explicit-recovery",
    ]);
    expect(hasQuarantinedWorkspaceRecovery()).toBe(false);
    expect(storage.getItem(WORKSPACE_UNOWNED_BACKUP_KEY)).toContain(
      "restoredAt",
    );
  });

  it("selects the newest recoverable quarantine snapshot", () => {
    const storage = new MemoryStorage();
    vi.stubGlobal("window", browser(storage));
    expect(markGuestWorkspaceOwner(storage)).toBe(true);
    storage.setItem(WORKSPACE_UNOWNED_BACKUP_KEY, JSON.stringify({
      formatVersion: 1,
      snapshots: [
        { capturedAt: T0, state: saved("older-backup") },
        { capturedAt: "2026-07-17T11:00:00.000Z", state: saved("newer-backup") },
      ],
    }));
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());

    const result = restoreLatestQuarantinedWorkspace({ kind: "guest" });

    expect(result.restored).toBe(true);
    expect(getCanonicalToolWorkspaceState().saved.slugs).toEqual([
      "newer-backup",
    ]);
  });

  it("keeps the quarantine recoverable when the explicit restore cannot persist", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "tooolvibes:workspace:v1",
      JSON.stringify(saved("legacy-retryable")),
    );
    vi.stubGlobal("window", browser(storage));
    initializeWorkspaceOwnerProvenance({ kind: "guest" });
    storage.failedWrites.add("tooolvibes:workspace:v1");

    const result = restoreLatestQuarantinedWorkspace({ kind: "guest" });

    expect(result).toEqual({ restored: false, reason: "persist-failed" });
    expect(getCanonicalToolWorkspaceState()).toEqual(createEmptyWorkspaceState());
    expect(hasQuarantinedWorkspaceRecovery()).toBe(true);
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

  it("does not resurrect a guest item removed after a pending attach", () => {
    const storage = new MemoryStorage();
    vi.stubGlobal("window", browser(storage));
    expect(markGuestWorkspaceOwner(storage)).toBe(true);
    persistWorkspaceStateToStorage(storage, saved("guest-remove"), { now: T0 });

    const first = stageWorkspaceForAccount(
      "account-retry",
      createEmptyWorkspaceState(),
      getWorkspaceGuestContribution("account-retry"),
    );
    const removed = reduceWorkspaceState(first.state, {
      type: "saved/set",
      slug: "guest-remove",
      saved: false,
      at: "2026-07-17T11:00:00.000Z",
    });
    commitCanonicalToolWorkspaceState(removed);

    const retry = stageWorkspaceForAccount(
      "account-retry",
      getWorkspaceAttachSnapshot("account-retry"),
      getWorkspaceGuestContribution("account-retry"),
    );

    expect(retry.state.saved.slugs).not.toContain("guest-remove");
    expect(retry.requestAccountState.saved.slugs).not.toContain("guest-remove");
    expect(retry.requestGuestState.saved.slugs).not.toContain("guest-remove");
  });

  it("makes an oversized pending claim recoverable after a local reduction", () => {
    const storage = new MemoryStorage();
    vi.stubGlobal("window", browser(storage));
    expect(markGuestWorkspaceOwner(storage)).toBe(true);
    const slugs = Array.from({ length: 501 }, (_, index) => `tool-${index}`);
    const oversized = {
      ...createEmptyWorkspaceState(),
      saved: { slugs, updatedAt: T0 },
    };
    persistWorkspaceStateToStorage(storage, oversized, { now: T0 });

    const first = stageWorkspaceForAccount(
      "account-capacity",
      createEmptyWorkspaceState(),
      getWorkspaceGuestContribution("account-capacity"),
    );
    const reduced = {
      ...first.state,
      saved: {
        slugs: first.state.saved.slugs.slice(0, 500),
        updatedAt: "2026-07-17T11:00:00.000Z",
      },
    };
    commitCanonicalToolWorkspaceState(reduced);

    const retry = stageWorkspaceForAccount(
      "account-capacity",
      getWorkspaceAttachSnapshot("account-capacity"),
      getWorkspaceGuestContribution("account-capacity"),
    );

    expect(retry.state.saved.slugs).toHaveLength(500);
    expect(workspaceSyncStateV1Schema.safeParse(
      retry.requestAccountState,
    ).success).toBe(true);
    expect(workspaceSyncStateV1Schema.safeParse(
      retry.requestGuestState,
    ).success).toBe(true);
  });

  it("lets a second account claim the next guest generation", () => {
    const storage = new MemoryStorage();
    vi.stubGlobal("window", browser(storage));
    expect(markGuestWorkspaceOwner(storage)).toBe(true);
    persistWorkspaceStateToStorage(storage, saved("guest-a"), { now: T0 });

    const stagedA = stageWorkspaceForAccount(
      "account-a",
      createEmptyWorkspaceState(),
      getWorkspaceGuestContribution("account-a"),
    );
    persistWorkspaceStateToStorage(
      scopeWorkspaceStorage(storage, { kind: "guest" }),
      saved("guest-b"),
      { now: T0 },
    );
    const stagedB = stageWorkspaceForAccount(
      "account-b",
      createEmptyWorkspaceState(),
      getWorkspaceGuestContribution("account-b"),
    );

    expect(stagedA.ready).toBe(true);
    expect(stagedB.ready).toBe(true);
    expect(stagedA.state.saved.slugs).toEqual(["guest-a"]);
    expect(stagedB.state.saved.slugs).toEqual(["guest-b"]);
    expect(getWorkspaceGuestContribution("account-a").saved.slugs).toEqual([
      "guest-a",
    ]);
    expect(getWorkspaceGuestContribution("account-b").saved.slugs).toEqual([
      "guest-b",
    ]);
  });

  it("rejects a stale guest contribution without contaminating another account", () => {
    const storage = new MemoryStorage();
    vi.stubGlobal("window", browser(storage));
    expect(markGuestWorkspaceOwner(storage)).toBe(true);
    persistWorkspaceStateToStorage(storage, saved("guest-once"), { now: T0 });
    const staleContribution = getWorkspaceGuestContribution("account-a");

    const stagedB = stageWorkspaceForAccount(
      "account-b",
      createEmptyWorkspaceState(),
      getWorkspaceGuestContribution("account-b"),
    );
    const stagedA = stageWorkspaceForAccount(
      "account-a",
      createEmptyWorkspaceState(),
      staleContribution,
    );

    expect(stagedB.state.saved.slugs).toEqual(["guest-once"]);
    expect(stagedA.ready).toBe(false);
    expect(stagedA.state).toEqual(createEmptyWorkspaceState());
    expect(getWorkspaceAttachSnapshot("account-a")).toEqual(
      createEmptyWorkspaceState(),
    );
  });

  it("does not retain guest data when the account staging write fails", () => {
    const storage = new MemoryStorage();
    vi.stubGlobal("window", browser(storage));
    expect(markGuestWorkspaceOwner(storage)).toBe(true);
    persistWorkspaceStateToStorage(storage, saved("guest-write-failure"), {
      now: T0,
    });
    const accountA = { kind: "account" as const, userId: "account-a" };
    storage.failedWrites.add(workspaceStorageKeyForOwner(accountA));

    const stagedA = stageWorkspaceForAccount(
      accountA.userId,
      createEmptyWorkspaceState(),
      getWorkspaceGuestContribution(accountA.userId),
    );

    expect(stagedA.ready).toBe(false);
    expect(stagedA.state).toEqual(createEmptyWorkspaceState());
    expect(getWorkspaceAttachSnapshot(accountA.userId)).toEqual(
      createEmptyWorkspaceState(),
    );
    expect(getWorkspaceGuestContribution("account-b").saved.slugs).toEqual([
      "guest-write-failure",
    ]);
  });

  it("does not resurrect a pending format-v1 guest after an upgrade", () => {
    const storage = new MemoryStorage();
    vi.stubGlobal("window", browser(storage));
    expect(markGuestWorkspaceOwner(storage)).toBe(true);
    const oldGuest = saved("legacy-pending-remove");
    storage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(oldGuest));
    storage.setItem(WORKSPACE_GUEST_CLAIM_KEY, JSON.stringify({
      formatVersion: 1,
      status: "pending",
      claimedBy: "account-v1",
      claimedAt: T0,
      guestRaw: JSON.stringify(oldGuest),
    }));
    persistWorkspaceStateToStorage(
      scopeWorkspaceStorage(storage, {
        kind: "account",
        userId: "account-v1",
      }),
      createEmptyWorkspaceState(),
      { now: T0 },
    );

    const staged = stageWorkspaceForAccount(
      "account-v1",
      getWorkspaceAttachSnapshot("account-v1"),
      getWorkspaceGuestContribution("account-v1"),
    );

    expect(staged.state).toEqual(createEmptyWorkspaceState());
    expect(staged.requestAccountState).toEqual(createEmptyWorkspaceState());
    expect(staged.requestGuestState).toEqual(createEmptyWorkspaceState());
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

  it("keeps a pending claim isolated until logout can acquire the claim lock", () => {
    const storage = new MemoryStorage();
    vi.stubGlobal("window", browser(storage));
    expect(markGuestWorkspaceOwner(storage)).toBe(true);
    persistWorkspaceStateToStorage(storage, saved("guest-locked-logout"), {
      now: T0,
    });
    stageWorkspaceForAccount(
      "account-a",
      createEmptyWorkspaceState(),
      getWorkspaceGuestContribution("account-a"),
    );

    const hidden = isolateWorkspaceAfterLogoutWithPolicy("account-a");

    expect(hidden.state).toEqual(createEmptyWorkspaceState());
    expect(hidden.recoveryRequired).toBe(true);
    expect(
      loadWorkspaceStateFromStorage(
        scopeWorkspaceStorage(storage, { kind: "guest" }),
      ).state,
    ).toEqual(createEmptyWorkspaceState());
    expect(getWorkspaceGuestContribution("account-a").saved.slugs).toEqual([
      "guest-locked-logout",
    ]);

    const restored = isolateWorkspaceAfterLogout("account-a");
    expect(restored.state.saved.slugs).toEqual(["guest-locked-logout"]);
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

    expect(new Set(getCanonicalToolWorkspaceState().saved.slugs)).toEqual(
      new Set(["guest-before-login", "guest-other-tab"]),
    );
  });

  it("keeps newer guest-overlay metadata when rolling back a pending claim", () => {
    const storage = new MemoryStorage();
    vi.stubGlobal("window", browser(storage));
    expect(markGuestWorkspaceOwner(storage)).toBe(true);
    const oldGuest = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "tool/note",
      slug: "same-tool",
      note: "old note",
      at: T0,
    });
    persistWorkspaceStateToStorage(storage, oldGuest, { now: T0 });
    stageWorkspaceForAccount(
      "account-a",
      createEmptyWorkspaceState(),
      getWorkspaceGuestContribution("account-a"),
    );
    const newGuest = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "tool/note",
      slug: "same-tool",
      note: "new note",
      at: "2026-07-17T12:00:00.000Z",
    });
    persistWorkspaceStateToStorage(
      scopeWorkspaceStorage(storage, { kind: "guest" }),
      newGuest,
      { now: T0 },
    );

    const result = isolateWorkspaceAfterLogout("account-a");

    expect(result.state.toolStates["same-tool"]?.note).toBe("new note");
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

  it("does not complete a pending claim without the shared claim lock", () => {
    const storage = new MemoryStorage();
    vi.stubGlobal("window", browser(storage));
    expect(markGuestWorkspaceOwner(storage)).toBe(true);
    persistWorkspaceStateToStorage(storage, saved("claim-needs-lock"), { now: T0 });
    stageWorkspaceForAccount(
      "account-a",
      createEmptyWorkspaceState(),
      getWorkspaceGuestContribution("account-a"),
    );

    expect(finalizeGuestWorkspaceClaimWithPolicy("account-a")).toBe(false);
    expect(getWorkspaceGuestContribution("account-a").saved.slugs).toEqual([
      "claim-needs-lock",
    ]);
    expect(finalizeGuestWorkspaceClaim("account-a")).toBe(true);
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
