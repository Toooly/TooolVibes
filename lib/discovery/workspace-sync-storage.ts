import { workspaceStateV1Schema } from "@/lib/discovery/schema";
import {
  WORKSPACE_SYNC_PREVIOUS_KEY,
  WORKSPACE_SYNC_RECOVERY_KEY,
} from "@/lib/discovery/workspace-storage-keys";
import {
  createEmptyWorkspaceState,
  normalizeWorkspaceState,
} from "@/lib/discovery/workspace-state";
import {
  loadWorkspaceStateFromStorage,
  persistWorkspaceStateToStorage,
  type WorkspaceStorage,
} from "@/lib/discovery/workspace-storage";
import { mergeWorkspaceForSync } from "@/lib/discovery/workspace-sync";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";

export type WorkspaceSyncReason =
  | "attach"
  | "cross-tab"
  | "hydrate"
  | "logout"
  | "save";

export type WorkspaceSyncOwner =
  | { kind: "guest" }
  | { kind: "account"; userId: string };

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
  const merged = existing
    ? mergeWorkspaceForSync(existing.state, state)
    : normalizeWorkspaceState(state);
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
  const current = loadWorkspaceStateFromStorage(storage, { now: options.now }).state;
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

export function isolateGuestWorkspace(
  storage: WorkspaceStorage,
  options: { accountUserId: string; now?: string },
): WorkspaceSyncApplyResult {
  const owner: WorkspaceSyncOwner = { kind: "account", userId: options.accountUserId };
  const current = loadWorkspaceStateFromStorage(storage, { now: options.now }).state;
  const recoveryStored = putWorkspaceSyncRecovery(storage, current, {
    owner,
    reason: "logout",
    now: options.now,
  });
  const previousStored = captureWorkspaceSyncPrevious(storage, current, {
    owner,
    reason: "logout",
    now: options.now,
  });
  if (!recoveryStored || !previousStored) {
    return { state: current, applied: false, recoveryRequired: true };
  }
  const empty = createEmptyWorkspaceState();
  const result = persistWorkspaceStateToStorage(storage, empty, { now: options.now });
  return result.persisted
    ? { state: empty, applied: true, recoveryRequired: true }
    : { state: current, applied: false, recoveryRequired: true };
}
