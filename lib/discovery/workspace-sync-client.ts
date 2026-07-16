"use client";

import { workspaceStateV1Schema } from "@/lib/discovery/schema";
import { DISCOVERY_SYNC_EVENT } from "@/lib/discovery/local-storage";
import { getBrowserWorkspaceStorage } from "@/lib/discovery/workspace-storage";
import {
  applyWorkspaceSyncSnapshot,
  clearWorkspaceSyncRecovery,
  isolateGuestWorkspace,
  putWorkspaceSyncRecovery,
  readWorkspaceSyncRecovery,
  type WorkspaceSyncOwner,
  type WorkspaceSyncReason,
} from "@/lib/discovery/workspace-sync-storage";
import { mergeWorkspaceForSync } from "@/lib/discovery/workspace-sync";
import type { WorkspacePersistencePayload, WorkspaceStateV1 } from "@/lib/discovery/types";
import {
  getCanonicalToolWorkspaceState,
  replaceToolWorkspaceStateFromCanonical,
} from "@/lib/stores/tool-workspace-store";

function dispatchWorkspaceChange(source: "local" | "remote") {
  window.dispatchEvent(new CustomEvent(DISCOVERY_SYNC_EVENT, { detail: { source } }));
}

export function getWorkspaceAttachSnapshot(userId?: string) {
  const local = getCanonicalToolWorkspaceState();
  const storage = getBrowserWorkspaceStorage();
  if (!storage || !userId) return local;
  const recovery = readWorkspaceSyncRecovery(storage, { kind: "account", userId });
  return recovery ? mergeWorkspaceForSync(recovery, local) : local;
}

function parsePayload(value: unknown): WorkspacePersistencePayload | null {
  if (!value || typeof value !== "object") return null;
  const payload = value as Partial<WorkspacePersistencePayload>;
  const state = workspaceStateV1Schema.safeParse(payload.data);
  if (!state.success || !payload.meta || typeof payload.meta !== "object") return null;
  return { data: state.data, meta: payload.meta };
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
      body: JSON.stringify({ state, base_revision: revision, operation_id: operationId }),
    });
    const payload = parsePayload(await response.json().catch(() => null));
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
    const payload = parsePayload(await response.json().catch(() => null));
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
  options: { owner: WorkspaceSyncOwner; reason: WorkspaceSyncReason },
) {
  const storage = getBrowserWorkspaceStorage();
  if (!storage) {
    const state = mergeWorkspaceForSync(payload.data, getCanonicalToolWorkspaceState());
    replaceToolWorkspaceStateFromCanonical(state);
    dispatchWorkspaceChange("remote");
    return { state, applied: true, recoveryRequired: true };
  }
  const result = applyWorkspaceSyncSnapshot(storage, payload.data, options);
  replaceToolWorkspaceStateFromCanonical(result.state);
  if (result.applied) dispatchWorkspaceChange("remote");
  return result;
}

export function clearAccountWorkspaceRecovery(userId: string) {
  const storage = getBrowserWorkspaceStorage();
  return storage ? clearWorkspaceSyncRecovery(storage, { kind: "account", userId }) : false;
}

export function preserveAccountWorkspaceRecovery(userId: string, reason: WorkspaceSyncReason) {
  const storage = getBrowserWorkspaceStorage();
  return storage
    ? putWorkspaceSyncRecovery(storage, getCanonicalToolWorkspaceState(), {
        owner: { kind: "account", userId }, reason,
      })
    : false;
}

export function isolateWorkspaceAfterLogout(userId: string) {
  const storage = getBrowserWorkspaceStorage();
  if (!storage) {
    return { state: getCanonicalToolWorkspaceState(), applied: false, recoveryRequired: true };
  }
  const result = isolateGuestWorkspace(storage, { accountUserId: userId });
  replaceToolWorkspaceStateFromCanonical(result.state);
  if (result.applied) dispatchWorkspaceChange("remote");
  return result;
}
