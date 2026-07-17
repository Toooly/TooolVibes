"use client";

import {
  workspaceStateV1Schema,
  workspaceSyncStateV1Schema,
} from "@/lib/discovery/schema";
import {
  getBrowserWorkspaceStorage,
  loadWorkspaceStateFromStorage,
  persistWorkspaceStateToStorage,
} from "@/lib/discovery/workspace-storage";
import { dispatchWorkspaceChange as dispatchWorkspaceChangeEvent } from "@/lib/discovery/workspace-events";
import {
  completeGuestWorkspaceClaim,
  getActiveWorkspaceOwner,
  hasGuestWorkspaceOwnerMarker,
  markGuestWorkspaceOwner,
  putGuestWorkspaceClaim,
  readGuestWorkspaceClaim,
  releaseGuestWorkspaceClaim,
  scopeWorkspaceStorage,
  workspaceOwnersMatch,
  type GuestWorkspaceClaim,
  type WorkspaceOwner,
} from "@/lib/discovery/workspace-owner-storage";
import {
  createEmptyWorkspaceState,
  hasWorkspaceData,
} from "@/lib/discovery/workspace-state";
import {
  LEGACY_DISCOVERY_WORKSPACE_STORAGE_KEYS,
  LEGACY_TOOL_WORKSPACE_STORAGE_KEY,
  LEGACY_WORKSPACE_BACKUP_STORAGE_KEYS,
  WORKSPACE_STORAGE_KEY,
  WORKSPACE_UNOWNED_BACKUP_KEY,
} from "@/lib/discovery/workspace-storage-keys";
import {
  applyWorkspaceSyncSnapshot,
  clearWorkspaceSyncRecovery,
  mergeWorkspaceWithSyncRecovery,
  putWorkspaceSyncRecovery,
  type WorkspaceSyncOwner,
  type WorkspaceSyncReason,
} from "@/lib/discovery/workspace-sync-storage";
import {
  mergeGuestWorkspaceContribution,
  mergeWorkspaceForSync,
} from "@/lib/discovery/workspace-sync";
import type { WorkspacePersistencePayload, WorkspaceStateV1 } from "@/lib/discovery/types";
import {
  activateToolWorkspaceOwner,
  activateVolatileToolWorkspaceOwnerWithoutStorage,
  getCanonicalToolWorkspaceState,
  getToolWorkspaceStateForOwner,
  rebaseWorkspaceIntent,
  retainVolatileToolWorkspaceOwner,
} from "@/lib/stores/tool-workspace-store";

function dispatchWorkspaceChange(source: "local" | "remote") {
  dispatchWorkspaceChangeEvent({ source, scope: "workspace" });
}

function workspaceStateFromGuestClaim(
  claim: GuestWorkspaceClaim | null,
) {
  return claim ? workspaceStateFromRaw(claim.guestRaw) : null;
}

function workspaceStateFromRaw(raw: string) {
  try {
    const parsed = workspaceStateV1Schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

type WorkspaceLockManager = {
  request<T>(
    name: string,
    options: { mode: "exclusive" },
    callback: () => T | Promise<T>,
  ): Promise<T>;
};

export async function withWorkspaceGuestClaimLock<T>(
  callback: (lockHeld: boolean) => T | Promise<T>,
) {
  const locks = typeof navigator === "undefined"
    ? undefined
    : (navigator as Navigator & { locks?: WorkspaceLockManager }).locks;
  return locks?.request
    ? locks.request(
        "tooolvibes:workspace:guest-claim",
        { mode: "exclusive" },
        () => callback(true),
      )
    : callback(false);
}

function writeVerified(
  storage: Pick<Storage, "getItem" | "setItem">,
  key: string,
  value: unknown,
) {
  const raw = JSON.stringify(value);
  try {
    storage.setItem(key, raw);
    return storage.getItem(key) === raw;
  } catch {
    return false;
  }
}

function appendUnownedWorkspaceBackup(
  storage: Pick<Storage, "getItem" | "setItem">,
  snapshot: Record<string, unknown>,
) {
  let snapshots: unknown[] = [];
  try {
    const raw = storage.getItem(WORKSPACE_UNOWNED_BACKUP_KEY);
    if (raw !== null) {
      const existing = JSON.parse(raw) as {
        formatVersion?: unknown;
        snapshots?: unknown;
      };
      if (existing.formatVersion !== 1 || !Array.isArray(existing.snapshots)) {
        return false;
      }
      snapshots = existing.snapshots;
    }
  } catch {
    return false;
  }
  const rawEntries = JSON.stringify(snapshot.rawEntries);
  if (!snapshots.some((item) =>
    item && typeof item === "object" &&
    JSON.stringify((item as { rawEntries?: unknown }).rawEntries) === rawEntries
  )) {
    snapshots = [...snapshots, snapshot];
  }
  return writeVerified(storage, WORKSPACE_UNOWNED_BACKUP_KEY, {
    formatVersion: 1,
    snapshots,
  });
}

type UnownedWorkspaceBackupSnapshot = {
  capturedAt?: unknown;
  reason?: unknown;
  state?: unknown;
  rawEntries?: unknown;
  restoredAt?: unknown;
  restoredOwner?: unknown;
};

type UnownedWorkspaceBackupEnvelope = {
  formatVersion: 1;
  snapshots: unknown[];
};

function readUnownedWorkspaceBackup(
  storage: Pick<Storage, "getItem">,
): UnownedWorkspaceBackupEnvelope | null {
  try {
    const raw = storage.getItem(WORKSPACE_UNOWNED_BACKUP_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as {
      formatVersion?: unknown;
      snapshots?: unknown;
    };
    if (parsed.formatVersion !== 1 || !Array.isArray(parsed.snapshots)) {
      return null;
    }
    return {
      formatVersion: 1,
      snapshots: parsed.snapshots,
    };
  } catch {
    return null;
  }
}

function latestRecoverableUnownedWorkspace(
  storage: Pick<Storage, "getItem">,
) {
  const envelope = readUnownedWorkspaceBackup(storage);
  if (!envelope) return null;
  for (let index = envelope.snapshots.length - 1; index >= 0; index -= 1) {
    const candidate = envelope.snapshots[index];
    if (!candidate || typeof candidate !== "object") continue;
    const snapshot = candidate as UnownedWorkspaceBackupSnapshot;
    if (typeof snapshot.restoredAt === "string") continue;
    const state = workspaceStateV1Schema.safeParse(snapshot.state);
    if (state.success && hasWorkspaceData(state.data)) {
      return { envelope, index, state: state.data };
    }
  }
  return null;
}

export function hasQuarantinedWorkspaceRecovery() {
  const storage = getBrowserWorkspaceStorage();
  return storage ? Boolean(latestRecoverableUnownedWorkspace(storage)) : false;
}

export function restoreLatestQuarantinedWorkspace(owner: WorkspaceOwner) {
  const storage = getBrowserWorkspaceStorage();
  if (!storage) {
    return { restored: false as const, reason: "storage-unavailable" as const };
  }
  if (!hasGuestWorkspaceOwnerMarker(storage)) {
    return { restored: false as const, reason: "owner-not-ready" as const };
  }
  const recovery = latestRecoverableUnownedWorkspace(storage);
  if (!recovery) {
    return { restored: false as const, reason: "backup-unavailable" as const };
  }

  const current = getToolWorkspaceStateForOwner(owner);
  const restoredState = mergeGuestWorkspaceContribution(current, recovery.state);
  const ownerStorage = scopeWorkspaceStorage(storage, owner);
  const persisted = persistWorkspaceStateToStorage(ownerStorage, restoredState);
  if (!persisted.persisted) {
    return { restored: false as const, reason: "persist-failed" as const };
  }

  const snapshots = recovery.envelope.snapshots.map((snapshot, index) =>
    index === recovery.index
      ? {
          ...(snapshot as UnownedWorkspaceBackupSnapshot),
          restoredAt: new Date().toISOString(),
          restoredOwner: owner,
        }
      : snapshot
  );
  const recoveryRecorded = writeVerified(storage, WORKSPACE_UNOWNED_BACKUP_KEY, {
    formatVersion: 1,
    snapshots,
  });
  activateToolWorkspaceOwner(owner);
  dispatchWorkspaceChange("remote");
  return {
    restored: true as const,
    state: persisted.state,
    recoveryRecorded,
  };
}

export function initializeWorkspaceOwnerProvenance(owner: WorkspaceOwner) {
  const storage = getBrowserWorkspaceStorage();
  if (!storage) {
    activateToolWorkspaceOwner(owner);
    return { ready: true, legacyQuarantined: false, recoveryRequired: true };
  }
  if (hasGuestWorkspaceOwnerMarker(storage)) {
    activateToolWorkspaceOwner(owner);
    return { ready: true, legacyQuarantined: false, recoveryRequired: false };
  }

  const rawEntries = Object.fromEntries([
    WORKSPACE_STORAGE_KEY,
    ...LEGACY_WORKSPACE_BACKUP_STORAGE_KEYS,
  ].map((key) => {
    try {
      return [key, storage.getItem(key)] as const;
    } catch {
      return [key, null] as const;
    }
  }));
  const legacyState = loadWorkspaceStateFromStorage(storage).state;

  const legacyQuarantined = [
    WORKSPACE_STORAGE_KEY,
    LEGACY_TOOL_WORKSPACE_STORAGE_KEY,
    ...LEGACY_DISCOVERY_WORKSPACE_STORAGE_KEYS,
  ].some((key) => rawEntries[key] !== null);

  if (legacyQuarantined && !appendUnownedWorkspaceBackup(storage, {
    capturedAt: new Date().toISOString(),
    reason: "pre-owner-canonical",
    state: legacyState,
    rawEntries,
  })) {
    retainVolatileToolWorkspaceOwner(owner, createEmptyWorkspaceState());
    return {
      ready: true,
      legacyQuarantined: true,
      recoveryRequired: true,
    };
  }

  const cleared = persistWorkspaceStateToStorage(
    storage,
    createEmptyWorkspaceState(),
  ).persisted;
  const marked = cleared && markGuestWorkspaceOwner(storage);
  if (!marked) {
    retainVolatileToolWorkspaceOwner(owner, createEmptyWorkspaceState());
    return {
      ready: true,
      legacyQuarantined,
      recoveryRequired: true,
    };
  }

  activateToolWorkspaceOwner(owner);
  dispatchWorkspaceChange("remote");
  return { ready: true, legacyQuarantined, recoveryRequired: false };
}

export function getWorkspaceAttachSnapshot(userId?: string) {
  if (!userId) return getCanonicalToolWorkspaceState();
  const owner: WorkspaceOwner = { kind: "account", userId };
  const local = getToolWorkspaceStateForOwner(owner);
  const storage = getBrowserWorkspaceStorage();
  if (!storage) {
    return local;
  }

  const accountStorage = scopeWorkspaceStorage(storage, owner);
  const recoveredAccount = mergeWorkspaceWithSyncRecovery(
    accountStorage,
    local,
    owner,
  );
  return recoveredAccount;
}

export function getWorkspaceGuestContribution(userId: string) {
  const storage = getBrowserWorkspaceStorage();
  const guestOwner: WorkspaceOwner = { kind: "guest" };
  if (!storage) return getToolWorkspaceStateForOwner(guestOwner);
  const claim = readGuestWorkspaceClaim(storage, userId);
  if (claim) {
    return workspaceStateFromGuestClaim(claim) ?? createEmptyWorkspaceState();
  }
  return getToolWorkspaceStateForOwner(guestOwner);
}

export function stageWorkspaceForAccount(
  userId: string,
  accountSnapshot: WorkspaceStateV1,
  guestContribution: WorkspaceStateV1 = createEmptyWorkspaceState(),
  options: { guestClaimLockHeld?: boolean } = {},
) {
  const owner: WorkspaceOwner = { kind: "account", userId };
  const storage = getBrowserWorkspaceStorage();
  const existingClaim = storage
    ? readGuestWorkspaceClaim(storage, userId)
    : null;
  const hasGuestContribution = Boolean(existingClaim) ||
    hasWorkspaceData(guestContribution);
  const claimBase = existingClaim
    ? workspaceStateFromRaw(existingClaim.accountBaseRaw)
    : null;
  const claimStaged = existingClaim
    ? workspaceStateFromRaw(existingClaim.stagedRaw)
    : null;
  const claimGuest = workspaceStateFromGuestClaim(existingClaim);
  const stagedState = existingClaim
    ? accountSnapshot
    : hasGuestContribution
      ? mergeGuestWorkspaceContribution(accountSnapshot, guestContribution)
      : accountSnapshot;
  const requestAccountState = existingClaim && claimBase && claimStaged && claimGuest
    ? rebaseWorkspaceIntent(claimStaged, accountSnapshot, claimBase)
    : accountSnapshot;
  const requestGuestState = existingClaim && claimBase && claimStaged && claimGuest
    ? rebaseWorkspaceIntent(claimStaged, accountSnapshot, claimGuest)
    : existingClaim
      ? createEmptyWorkspaceState()
      : guestContribution;
  if (hasGuestContribution && !options.guestClaimLockHeld) {
    retainVolatileToolWorkspaceOwner(owner, accountSnapshot);
    activateToolWorkspaceOwner(owner, accountSnapshot);
    dispatchWorkspaceChange("remote");
    return {
      state: accountSnapshot,
      persisted: false,
      guestCleared: false,
      ready: false,
      guestPending: true,
      requestAccountState: accountSnapshot,
      requestGuestState: createEmptyWorkspaceState(),
    };
  }
  if (!storage) {
    const state = hasGuestContribution ? accountSnapshot : stagedState;
    retainVolatileToolWorkspaceOwner(owner, state);
    dispatchWorkspaceChange("remote");
    return {
      state,
      persisted: false,
      guestCleared: false,
      ready: !hasGuestContribution,
      guestPending: hasGuestContribution,
      requestAccountState,
      requestGuestState,
    };
  }

  if (!hasGuestWorkspaceOwnerMarker(storage) && hasGuestContribution) {
    retainVolatileToolWorkspaceOwner(owner, accountSnapshot);
    activateToolWorkspaceOwner(owner, accountSnapshot);
    dispatchWorkspaceChange("remote");
    return {
      state: accountSnapshot,
      persisted: false,
      guestCleared: false,
      ready: false,
      guestPending: hasGuestContribution,
      requestAccountState,
      requestGuestState,
    };
  }

  const accountStorage = scopeWorkspaceStorage(storage, owner);
  const accountResult = persistWorkspaceStateToStorage(
    accountStorage,
    stagedState,
  );
  const state = accountResult.persisted
    ? accountResult.state
    : stagedState;
  if (!accountResult.persisted) {
    const safeState = hasGuestContribution ? accountSnapshot : state;
    retainVolatileToolWorkspaceOwner(owner, safeState);
    activateToolWorkspaceOwner(owner, safeState);
    dispatchWorkspaceChange("remote");
    return {
      state: safeState,
      persisted: false,
      guestCleared: false,
      ready: !hasGuestContribution,
      guestPending: hasGuestContribution,
      requestAccountState,
      requestGuestState,
    };
  }

  let claim = existingClaim;
  if (hasGuestContribution && !claim) {
    let guestRaw: string | null = null;
    try {
      guestRaw = scopeWorkspaceStorage(storage, { kind: "guest" })
        .getItem(WORKSPACE_STORAGE_KEY);
    } catch {
      guestRaw = null;
    }
    if (guestRaw) {
      claim = putGuestWorkspaceClaim(storage, userId, guestRaw, {
        accountBaseRaw: JSON.stringify(accountSnapshot),
        stagedRaw: JSON.stringify(stagedState),
      });
    }
  }
  if (hasGuestContribution && !claim) {
    const rollback = persistWorkspaceStateToStorage(
      accountStorage,
      accountSnapshot,
    );
    if (!rollback.persisted) {
      retainVolatileToolWorkspaceOwner(owner, accountSnapshot);
    }
    activateToolWorkspaceOwner(owner, accountSnapshot);
    dispatchWorkspaceChange("remote");
    return {
      state: accountSnapshot,
      persisted: false,
      guestCleared: false,
      ready: false,
      guestPending: true,
      requestAccountState: accountSnapshot,
      requestGuestState: createEmptyWorkspaceState(),
    };
  }

  activateToolWorkspaceOwner(owner);
  dispatchWorkspaceChange("remote");
  return {
    state,
    persisted: accountResult.persisted,
    guestCleared: false,
    ready: true,
    guestPending: hasGuestContribution,
    requestAccountState,
    requestGuestState,
  };
}

export function finalizeGuestWorkspaceClaim(
  userId: string,
  options: { guestClaimLockHeld?: boolean } = {},
) {
  const storage = getBrowserWorkspaceStorage();
  if (!storage) return false;
  const claim = readGuestWorkspaceClaim(storage, userId);
  if (!claim) return true;
  if (!options.guestClaimLockHeld) return false;
  return completeGuestWorkspaceClaim(storage, userId);
}

export function parseWorkspacePersistencePayload(
  value: unknown,
): WorkspacePersistencePayload | null {
  if (!value || typeof value !== "object") return null;
  const payload = value as Partial<WorkspacePersistencePayload>;
  const meta = payload.meta;
  if (!meta || typeof meta !== "object" ||
      (meta.mode !== "local" && meta.mode !== "remote") ||
      typeof meta.remote_available !== "boolean" ||
      (meta.viewer_kind !== undefined && meta.viewer_kind !== "guest" &&
        meta.viewer_kind !== "account") ||
      (meta.synced_at !== undefined && meta.synced_at !== null &&
        typeof meta.synced_at !== "string") ||
      (meta.error !== undefined && meta.error !== null &&
        typeof meta.error !== "string") ||
      (meta.revision !== undefined && meta.revision !== null &&
        typeof meta.revision !== "string") ||
      (meta.conflict_retries !== undefined &&
        (!Number.isSafeInteger(meta.conflict_retries) || meta.conflict_retries < 0)) ||
      (meta.recovery_required !== undefined &&
        typeof meta.recovery_required !== "boolean")) {
    return null;
  }
  const stateSchema = meta.mode === "remote"
    ? workspaceSyncStateV1Schema
    : workspaceStateV1Schema;
  const state = stateSchema.safeParse(payload.data);
  if (!state.success) return null;
  return { data: state.data, meta };
}

export async function requestWorkspaceMutation(
  path: string,
  token: string,
  initialState: WorkspaceStateV1,
  options: {
    revision?: string | null;
    fetcher?: typeof fetch;
    maxConflictRetries?: number;
    operationId?: string;
    guestState?: WorkspaceStateV1;
  } = {},
) {
  const fetcher = options.fetcher ?? fetch;
  const operationId = options.operationId ?? crypto.randomUUID();
  let state = initialState;
  let revision = options.revision ?? null;
  let retries = 0;

  while (true) {
    const response = await fetcher(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        state,
        guest_state: options.guestState,
        base_revision: revision,
        operation_id: operationId,
      }),
    });
    const payload = parseWorkspacePersistencePayload(
      await response.json().catch(() => null),
    );
    if (response.status !== 409 || !payload || retries >= (options.maxConflictRetries ?? 1)) {
      return { response, payload, sentState: state, conflictRetries: retries };
    }
    state = mergeWorkspaceForSync(payload.data, state);
    revision = payload.meta.revision ?? null;
    retries += 1;
  }
}

export async function requestWorkspaceSave(
  token: string,
  state: WorkspaceStateV1,
  options: Parameters<typeof requestWorkspaceMutation>[3] = {},
) {
  const fetcher = options.fetcher ?? fetch;
  const operationId = options.operationId ?? crypto.randomUUID();
  let desired = state;
  let revision = options.revision ?? null;
  let retries = 0;
  while (true) {
    const response = await fetcher("/api/workspace-state", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ state: desired, base_revision: revision, operation_id: operationId }),
    });
    const payload = parseWorkspacePersistencePayload(
      await response.json().catch(() => null),
    );
    if (response.status !== 409 || !payload || retries >= (options.maxConflictRetries ?? 1)) {
      return { response, payload, sentState: desired, conflictRetries: retries };
    }
    desired = mergeWorkspaceForSync(payload.data, desired);
    revision = payload.meta.revision ?? null;
    retries += 1;
  }
}

export function applyCanonicalRemotePayload(
  payload: WorkspacePersistencePayload,
  options: {
    owner: WorkspaceSyncOwner;
    reason: WorkspaceSyncReason;
    baseState?: WorkspaceStateV1;
  },
) {
  const desiredBefore = getToolWorkspaceStateForOwner(options.owner);
  const candidate = options.baseState
    ? rebaseWorkspaceIntent(options.baseState, desiredBefore, payload.data)
    : mergeWorkspaceForSync(payload.data, desiredBefore);
  const storage = getBrowserWorkspaceStorage();
  if (!storage) {
    const state = retainVolatileToolWorkspaceOwner(options.owner, candidate);
    dispatchWorkspaceChange("remote");
    return { state, applied: true, recoveryRequired: true };
  }
  const ownerStorage = scopeWorkspaceStorage(storage, options.owner);
  const result = applyWorkspaceSyncSnapshot(ownerStorage, candidate, options);
  if (result.recoveryRequired) {
    retainVolatileToolWorkspaceOwner(options.owner, candidate);
  } else {
    activateToolWorkspaceOwner(options.owner);
  }
  if (result.applied) dispatchWorkspaceChange("remote");
  return result.recoveryRequired
    ? { ...result, state: candidate }
    : result;
}

export function clearAccountWorkspaceRecovery(userId: string) {
  const storage = getBrowserWorkspaceStorage();
  const owner: WorkspaceOwner = { kind: "account", userId };
  return storage
    ? clearWorkspaceSyncRecovery(scopeWorkspaceStorage(storage, owner), owner)
    : false;
}

export function preserveAccountWorkspaceRecovery(userId: string, reason: WorkspaceSyncReason) {
  const storage = getBrowserWorkspaceStorage();
  if (!storage) return false;
  const owner: WorkspaceOwner = { kind: "account", userId };
  const ownerStorage = scopeWorkspaceStorage(storage, owner);
  const current = workspaceOwnersMatch(getActiveWorkspaceOwner(), owner)
    ? getCanonicalToolWorkspaceState()
    : loadWorkspaceStateFromStorage(ownerStorage).state;
  return putWorkspaceSyncRecovery(ownerStorage, current, { owner, reason });
}

export function isolateWorkspaceAfterLogout(
  userId: string,
  options: { guestClaimLockHeld?: boolean } = {},
) {
  const empty = createEmptyWorkspaceState();
  if (options.guestClaimLockHeld !== true) {
    activateVolatileToolWorkspaceOwnerWithoutStorage({ kind: "guest" }, empty);
    dispatchWorkspaceChange("remote");
    return { state: empty, applied: false, recoveryRequired: true };
  }

  const storage = getBrowserWorkspaceStorage();
  const owner: WorkspaceOwner = { kind: "account", userId };
  if (!storage) {
    activateVolatileToolWorkspaceOwnerWithoutStorage({ kind: "guest" }, empty);
    dispatchWorkspaceChange("remote");
    return { state: empty, applied: false, recoveryRequired: true };
  }
  const ownerStorage = scopeWorkspaceStorage(storage, owner);
  const accountState = workspaceOwnersMatch(getActiveWorkspaceOwner(), owner)
    ? getCanonicalToolWorkspaceState()
    : loadWorkspaceStateFromStorage(ownerStorage).state;
  const recoveryStored = putWorkspaceSyncRecovery(ownerStorage, accountState, {
    owner,
    reason: "logout",
  });
  const guestClaim = readGuestWorkspaceClaim(storage, userId);
  const pendingGuest = guestClaim
    ? workspaceStateFromGuestClaim(guestClaim)
    : null;
  const guestStorage = scopeWorkspaceStorage(storage, { kind: "guest" });
  const currentGuest = loadWorkspaceStateFromStorage(guestStorage).state;
  const guestState = pendingGuest
    ? mergeGuestWorkspaceContribution(currentGuest, pendingGuest)
    : currentGuest;
  const guestResult = persistWorkspaceStateToStorage(guestStorage, guestState);
  const guestClaimReleased = guestClaim
    ? guestResult.persisted && releaseGuestWorkspaceClaim(storage, userId)
    : true;
  activateToolWorkspaceOwner({ kind: "guest" }, guestState);
  dispatchWorkspaceChange("remote");
  return {
    state: guestState,
    applied: guestResult.persisted,
    recoveryRequired:
      !recoveryStored || !guestResult.persisted || !guestClaimReleased,
  };
}
