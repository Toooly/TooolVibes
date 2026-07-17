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
  getCanonicalToolWorkspaceState,
  getToolWorkspaceStateForOwner,
  rebaseWorkspaceIntent,
  retainVolatileToolWorkspaceOwner,
} from "@/lib/stores/tool-workspace-store";

function dispatchWorkspaceChange(source: "local" | "remote") {
  dispatchWorkspaceChangeEvent({ source, scope: "workspace" });
}

function workspaceStateFromGuestClaim(
  claim: ReturnType<typeof readGuestWorkspaceClaim>,
) {
  if (!claim) return null;
  try {
    const parsed = workspaceStateV1Schema.safeParse(JSON.parse(claim.guestRaw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
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

  if (owner.kind === "guest") {
    const marked = markGuestWorkspaceOwner(storage);
    if (!marked) {
      retainVolatileToolWorkspaceOwner(owner, legacyState);
      return {
        ready: true,
        legacyQuarantined: false,
        recoveryRequired: true,
      };
    }
    activateToolWorkspaceOwner(owner, legacyState);
    dispatchWorkspaceChange("remote");
    return {
      ready: true,
      legacyQuarantined: false,
      recoveryRequired: false,
    };
  }

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
  const claim = readGuestWorkspaceClaim(storage);
  if (claim?.claimedBy === userId) {
    return workspaceStateFromGuestClaim(claim) ?? createEmptyWorkspaceState();
  }
  return getToolWorkspaceStateForOwner(guestOwner);
}

export function stageWorkspaceForAccount(
  userId: string,
  accountSnapshot: WorkspaceStateV1,
  guestContribution: WorkspaceStateV1 = createEmptyWorkspaceState(),
) {
  const owner: WorkspaceOwner = { kind: "account", userId };
  const hasGuestContribution = hasWorkspaceData(guestContribution);
  const stagedState = hasGuestContribution
    ? mergeGuestWorkspaceContribution(accountSnapshot, guestContribution)
    : accountSnapshot;
  const storage = getBrowserWorkspaceStorage();
  if (!storage) {
    retainVolatileToolWorkspaceOwner(owner, stagedState);
    dispatchWorkspaceChange("remote");
    return {
      state: stagedState,
      persisted: false,
      guestCleared: false,
      ready: !hasGuestContribution,
      guestPending: hasGuestContribution,
    };
  }

  if (!hasGuestWorkspaceOwnerMarker(storage) && hasGuestContribution) {
    retainVolatileToolWorkspaceOwner(owner, stagedState);
    return {
      state: stagedState,
      persisted: false,
      guestCleared: false,
      ready: false,
      guestPending: hasGuestContribution,
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
    retainVolatileToolWorkspaceOwner(owner, state);
    dispatchWorkspaceChange("remote");
    return {
      state,
      persisted: false,
      guestCleared: false,
      ready: !hasGuestContribution,
      guestPending: hasGuestContribution,
    };
  }

  let claim = readGuestWorkspaceClaim(storage);
  if (hasGuestContribution && !claim) {
    let guestRaw: string | null = null;
    try {
      guestRaw = scopeWorkspaceStorage(storage, { kind: "guest" })
        .getItem(WORKSPACE_STORAGE_KEY);
    } catch {
      guestRaw = null;
    }
    if (guestRaw) {
      claim = putGuestWorkspaceClaim(storage, userId, guestRaw, guestRaw);
    }
  }
  if (hasGuestContribution && claim?.claimedBy !== userId) {
    persistWorkspaceStateToStorage(accountStorage, accountSnapshot);
    activateToolWorkspaceOwner({ kind: "guest" });
    dispatchWorkspaceChange("remote");
    return {
      state: accountSnapshot,
      persisted: false,
      guestCleared: false,
      ready: false,
      guestPending: true,
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
  };
}

export function finalizeGuestWorkspaceClaim(userId: string) {
  const storage = getBrowserWorkspaceStorage();
  if (!storage) return false;
  const claim = readGuestWorkspaceClaim(storage);
  if (!claim) return true;
  if (claim.claimedBy !== userId) return false;
  return completeGuestWorkspaceClaim(storage, userId);
}

export function parseWorkspacePersistencePayload(
  value: unknown,
): WorkspacePersistencePayload | null {
  if (!value || typeof value !== "object") return null;
  const payload = value as Partial<WorkspacePersistencePayload>;
  const state = workspaceSyncStateV1Schema.safeParse(payload.data);
  const meta = payload.meta;
  if (!state.success || !meta || typeof meta !== "object" ||
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

export function isolateWorkspaceAfterLogout(userId: string) {
  const storage = getBrowserWorkspaceStorage();
  const owner: WorkspaceOwner = { kind: "account", userId };
  const empty = createEmptyWorkspaceState();
  if (!storage) {
    activateToolWorkspaceOwner({ kind: "guest" }, empty);
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
  const guestClaim = readGuestWorkspaceClaim(storage);
  const pendingGuest = guestClaim?.claimedBy === userId
    ? workspaceStateFromGuestClaim(guestClaim)
    : null;
  const guestStorage = scopeWorkspaceStorage(storage, { kind: "guest" });
  const currentGuest = loadWorkspaceStateFromStorage(guestStorage).state;
  const guestState = pendingGuest
    ? mergeGuestWorkspaceContribution(pendingGuest, currentGuest)
    : currentGuest;
  const guestResult = persistWorkspaceStateToStorage(guestStorage, guestState);
  const guestClaimReleased = guestResult.persisted
    ? releaseGuestWorkspaceClaim(storage, userId)
    : false;
  activateToolWorkspaceOwner({ kind: "guest" }, guestState);
  dispatchWorkspaceChange("remote");
  return {
    state: guestState,
    applied: guestResult.persisted,
    recoveryRequired:
      !recoveryStored || !guestResult.persisted || !guestClaimReleased,
  };
}
