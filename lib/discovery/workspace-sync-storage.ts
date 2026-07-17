import { workspaceStateV1Schema } from "@/lib/discovery/schema";
import {
  WORKSPACE_SYNC_PREVIOUS_KEY,
  WORKSPACE_SYNC_RECOVERY_KEY,
} from "@/lib/discovery/workspace-storage-keys";
import { normalizeWorkspaceState } from "@/lib/discovery/workspace-state";
import {
  loadWorkspaceStateFromStorage,
  persistWorkspaceStateToStorage,
  type WorkspaceStorage,
} from "@/lib/discovery/workspace-storage";
import { mergeWorkspaceForSync } from "@/lib/discovery/workspace-sync";
import type { WorkspaceOwner } from "@/lib/discovery/workspace-owner-storage";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";

export type WorkspaceSyncReason =
  | "attach"
  | "cross-tab"
  | "hydrate"
  | "logout"
  | "save";

export type WorkspaceSyncOwner = WorkspaceOwner;

type PreviousSnapshot = {
  formatVersion: 1;
  capturedAt: string;
  reason: WorkspaceSyncReason;
  owner: WorkspaceSyncOwner;
  state: WorkspaceStateV1;
};

type RecoveryEntry = PreviousSnapshot & { pending: true };

type RecoveryEnvelope = {
  formatVersion: 1;
  entries: Record<string, RecoveryEntry>;
};

export type WorkspaceSyncApplyResult = {
  state: WorkspaceStateV1;
  applied: boolean;
  recoveryRequired: boolean;
};

function ownerKey(owner: WorkspaceSyncOwner) {
  return owner.kind === "guest" ? "guest" : `account:${owner.userId}`;
}

function validOwner(value: unknown): value is WorkspaceSyncOwner {
  if (!value || typeof value !== "object") return false;
  const owner = value as Partial<WorkspaceSyncOwner> & { userId?: unknown };
  return owner.kind === "guest" ||
    (owner.kind === "account" && typeof owner.userId === "string" &&
      owner.userId.length > 0 && owner.userId.length <= 160);
}

function nowIso(value?: string) {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function readJson(storage: WorkspaceStorage, key: string): unknown {
  try {
    const raw = storage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeVerified(storage: WorkspaceStorage, key: string, value: unknown) {
  const raw = JSON.stringify(value);
  try {
    storage.setItem(key, raw);
    return storage.getItem(key) === raw;
  } catch {
    return false;
  }
}

function parsePrevious(value: unknown): PreviousSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<PreviousSnapshot>;
  const state = workspaceStateV1Schema.safeParse(item.state);
  if (item.formatVersion !== 1 || typeof item.capturedAt !== "string" ||
      typeof item.reason !== "string" || !validOwner(item.owner) || !state.success) {
    return null;
  }
  return {
    formatVersion: 1,
    capturedAt: item.capturedAt,
    reason: item.reason as WorkspaceSyncReason,
    owner: item.owner,
    state: state.data,
  };
}

function readRecoveryEnvelope(storage: WorkspaceStorage): RecoveryEnvelope {
  const value = readJson(storage, WORKSPACE_SYNC_RECOVERY_KEY);
  if (!value || typeof value !== "object") return { formatVersion: 1, entries: {} };
  const envelope = value as Partial<RecoveryEnvelope>;
  if (envelope.formatVersion !== 1 || !envelope.entries ||
      typeof envelope.entries !== "object" || Array.isArray(envelope.entries)) {
    return { formatVersion: 1, entries: {} };
  }
  const entries = Object.fromEntries(Object.entries(envelope.entries).flatMap(([key, raw]) => {
    const parsed = parsePrevious(raw);
    return parsed && (raw as Partial<RecoveryEntry>).pending === true
      ? [[key, { ...parsed, pending: true as const }]]
      : [];
  }));
  return { formatVersion: 1, entries };
}

export function captureWorkspaceSyncPrevious(
  storage: WorkspaceStorage,
  state: WorkspaceStateV1,
  options: { owner: WorkspaceSyncOwner; reason: WorkspaceSyncReason; now?: string },
) {
  const snapshot: PreviousSnapshot = {
    formatVersion: 1,
    capturedAt: nowIso(options.now),
    reason: options.reason,
    owner: options.owner,
    state: normalizeWorkspaceState(state),
  };
  return writeVerified(storage, WORKSPACE_SYNC_PREVIOUS_KEY, snapshot);
}

export function putWorkspaceSyncRecovery(
  storage: WorkspaceStorage,
  state: WorkspaceStateV1,
  options: { owner: WorkspaceSyncOwner; reason: WorkspaceSyncReason; now?: string },
) {
  const envelope = readRecoveryEnvelope(storage);
  const key = ownerKey(options.owner);
  const existing = envelope.entries[key];
  const normalized = normalizeWorkspaceState(state);
  if (existing?.reason === "logout" && normalized.clearedAt !== null) {
    return true;
  }
  const merged = existing
    ? mergeWorkspaceForSync(existing.state, normalized)
    : normalized;
  envelope.entries[key] = {
    formatVersion: 1,
    capturedAt: nowIso(options.now),
    reason: options.reason,
    owner: options.owner,
    state: merged,
    pending: true,
  };
  return writeVerified(storage, WORKSPACE_SYNC_RECOVERY_KEY, envelope);
}

export function readWorkspaceSyncRecovery(
  storage: WorkspaceStorage,
  owner: WorkspaceSyncOwner,
) {
  return readRecoveryEnvelope(storage).entries[ownerKey(owner)]?.state ?? null;
}

function isLogoutIsolationBoundary(
  local: WorkspaceStateV1,
  recovery: RecoveryEntry,
) {
  return recovery.reason === "logout" &&
    local.clearedAt === recovery.capturedAt;
}

function removeLogoutIsolationBoundary(
  localInput: WorkspaceStateV1,
  recovery: RecoveryEntry,
) {
  const local = normalizeWorkspaceState(localInput);
  if (!isLogoutIsolationBoundary(local, recovery)) {
    return local;
  }

  const restoreListBoundary = (list: WorkspaceStateV1["saved"]) =>
    list.slugs.length === 0 && list.updatedAt === recovery.capturedAt
      ? { ...list, updatedAt: null }
      : list;

  return normalizeWorkspaceState({
    ...local,
    clearedAt: null,
    saved: restoreListBoundary(local.saved),
    compare: restoreListBoundary(local.compare),
    stack: restoreListBoundary(local.stack),
  });
}

export function mergeWorkspaceWithSyncRecovery(
  storage: WorkspaceStorage,
  local: WorkspaceStateV1,
  owner: WorkspaceSyncOwner,
) {
  const normalizedLocal = normalizeWorkspaceState(local);
  const recovery = readRecoveryEnvelope(storage).entries[ownerKey(owner)];
  if (!recovery) {
    const previous = parsePrevious(
      readJson(storage, WORKSPACE_SYNC_PREVIOUS_KEY),
    );
    return previous && isLogoutIsolationBoundary(normalizedLocal, {
      ...previous,
      pending: true,
    })
      ? removeLogoutIsolationBoundary(normalizedLocal, {
          ...previous,
          pending: true,
        })
      : normalizedLocal;
  }
  const merged = mergeWorkspaceForSync(
    recovery.state,
    removeLogoutIsolationBoundary(normalizedLocal, recovery),
  );
  if (!isLogoutIsolationBoundary(normalizedLocal, recovery)) return merged;

  const preserveAccountAndGuestAdditions = (
    accountList: WorkspaceStateV1["saved"],
    guestList: WorkspaceStateV1["saved"],
  ) => {
    if (guestList.slugs.length === 0 &&
        guestList.updatedAt === recovery.capturedAt) {
      return accountList;
    }
    return {
      slugs: Array.from(new Set([...accountList.slugs, ...guestList.slugs])),
      updatedAt: guestList.updatedAt ?? accountList.updatedAt,
    };
  };

  return normalizeWorkspaceState({
    ...merged,
    saved: preserveAccountAndGuestAdditions(
      recovery.state.saved,
      normalizedLocal.saved,
    ),
    compare: preserveAccountAndGuestAdditions(
      recovery.state.compare,
      normalizedLocal.compare,
    ),
    stack: preserveAccountAndGuestAdditions(
      recovery.state.stack,
      normalizedLocal.stack,
    ),
  });
}

export function clearWorkspaceSyncRecovery(
  storage: WorkspaceStorage,
  owner: WorkspaceSyncOwner,
) {
  const envelope = readRecoveryEnvelope(storage);
  delete envelope.entries[ownerKey(owner)];
  return writeVerified(storage, WORKSPACE_SYNC_RECOVERY_KEY, envelope);
}

export function hasWorkspaceSyncRecovery(
  storage: WorkspaceStorage,
  owner?: WorkspaceSyncOwner,
) {
  const entries = readRecoveryEnvelope(storage).entries;
  return owner ? Boolean(entries[ownerKey(owner)]) : Object.keys(entries).length > 0;
}

export function applyWorkspaceSyncSnapshot(
  storage: WorkspaceStorage,
  incoming: WorkspaceStateV1,
  options: { owner: WorkspaceSyncOwner; reason: WorkspaceSyncReason; now?: string },
): WorkspaceSyncApplyResult {
  const stored = loadWorkspaceStateFromStorage(storage, { now: options.now }).state;
  const current = options.reason === "attach"
    ? mergeWorkspaceWithSyncRecovery(storage, stored, options.owner)
    : stored;
  const merged = mergeWorkspaceForSync(incoming, current);
  if (JSON.stringify(current) === JSON.stringify(merged)) {
    return { state: current, applied: false, recoveryRequired: false };
  }
  if (!captureWorkspaceSyncPrevious(storage, current, options)) {
    putWorkspaceSyncRecovery(storage, current, options);
    return { state: current, applied: false, recoveryRequired: true };
  }
  const result = persistWorkspaceStateToStorage(storage, merged, { now: options.now });
  if (!result.persisted) {
    putWorkspaceSyncRecovery(storage, current, options);
    return { state: current, applied: false, recoveryRequired: true };
  }
  return { state: result.state, applied: true, recoveryRequired: false };
}

