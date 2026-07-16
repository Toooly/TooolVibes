import {
  mergeWorkspaceStates,
  normalizeWorkspaceState,
} from "@/lib/discovery/workspace-state";
import type {
  ViewerKind,
  WorkspaceStateV1,
} from "@/lib/discovery/types";

export type WorkspaceRemoteSnapshot = {
  state: WorkspaceStateV1;
  revision: string | null;
  viewerKind?: ViewerKind;
};

export type WorkspaceCompareAndSwapResult =
  | { status: "saved"; snapshot: WorkspaceRemoteSnapshot }
  | { status: "conflict"; snapshot: WorkspaceRemoteSnapshot };

export interface WorkspaceSyncRepository {
  load(): Promise<WorkspaceRemoteSnapshot>;
  compareAndSwap(input: {
    state: WorkspaceStateV1;
    expectedRevision: string | null;
    operationId: string;
  }): Promise<WorkspaceCompareAndSwapResult>;
}

export type WorkspaceSyncResult = {
  state: WorkspaceStateV1;
  revision: string | null;
  conflictRetries: number;
  changed: boolean;
};

function statesMatch(left: WorkspaceStateV1, right: WorkspaceStateV1) {
  return JSON.stringify(left) === JSON.stringify(right);
}

/**
 * Runtime sync always gives the already-persisted remote snapshot first
 * position. Timestamped changes still converge through the canonical merge;
 * this stable role order only matters for timestamp-free DATA-205 legacy
 * collections and prevents retry/device order from changing arbitrarily.
 */
export function mergeWorkspaceForSync(
  remoteInput: unknown,
  localInput: unknown,
) {
  return mergeWorkspaceStates(
    normalizeWorkspaceState(remoteInput),
    normalizeWorkspaceState(localInput),
  );
}

/**
 * Optimistic compare-and-swap convergence. A conflict never replaces the
 * caller state: the latest remote snapshot is merged and retried. Exhaustion
 * throws with the last merged state attached for an explicit 409 response.
 */
export async function synchronizeWorkspace(
  localInput: unknown,
  repository: WorkspaceSyncRepository,
  options: { operationId: string; maxConflictRetries?: number },
): Promise<WorkspaceSyncResult> {
  const local = normalizeWorkspaceState(localInput);
  let remote = await repository.load();
  let desired = mergeWorkspaceForSync(remote.state, local);
  let retries = 0;

  if (statesMatch(desired, remote.state)) {
    return {
      state: remote.state,
      revision: remote.revision,
      conflictRetries: 0,
      changed: false,
    };
  }

  const maxRetries = options.maxConflictRetries ?? 2;

  while (true) {
    const result = await repository.compareAndSwap({
      state: desired,
      expectedRevision: remote.revision,
      operationId: options.operationId,
    });

    if (result.status === "saved") {
      return {
        state: result.snapshot.state,
        revision: result.snapshot.revision,
        conflictRetries: retries,
        changed: true,
      };
    }

    remote = result.snapshot;
    desired = mergeWorkspaceForSync(remote.state, desired);

    if (retries >= maxRetries) {
      throw new WorkspaceSyncConflictError(desired, remote.revision, retries + 1);
    }

    retries += 1;
  }
}

export class WorkspaceSyncConflictError extends Error {
  constructor(
    readonly state: WorkspaceStateV1,
    readonly revision: string | null,
    readonly retries: number,
  ) {
    super("Workspace synchronization conflict could not be resolved safely.");
    this.name = "WorkspaceSyncConflictError";
  }
}
