import {
  mergeWorkspaceStates,
  normalizeWorkspaceState,
} from "@/lib/discovery/workspace-state";
import { workspaceSyncStateV1Schema } from "@/lib/discovery/schema";
import { MAX_COMPARE_TOOLS } from "@/lib/discovery/workspace-constants";
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

function latestTimestamp(left: string | null, right: string | null) {
  if (!left) return right;
  if (!right) return left;
  return new Date(left).getTime() >= new Date(right).getTime() ? left : right;
}

/**
 * A guest handoff is a contribution, never an account-wide replacement.
 * Guest clear/removal timestamps therefore cannot erase existing account
 * state; collisions keep account metadata while guest-only data is added.
 */
export function mergeGuestWorkspaceContribution(
  accountInput: unknown,
  guestInput: unknown,
) {
  const account = normalizeWorkspaceState(accountInput);
  const guest = normalizeWorkspaceState(guestInput);
  const union = (accountSlugs: string[], guestSlugs: string[]) =>
    Array.from(new Set([...accountSlugs, ...guestSlugs]));

  return normalizeWorkspaceState({
    ...account,
    clearedAt: account.clearedAt,
    saved: {
      slugs: union(account.saved.slugs, guest.saved.slugs),
      updatedAt: latestTimestamp(account.saved.updatedAt, guest.saved.updatedAt),
    },
    compare: {
      slugs: union(account.compare.slugs, guest.compare.slugs)
        .slice(0, MAX_COMPARE_TOOLS),
      updatedAt: latestTimestamp(account.compare.updatedAt, guest.compare.updatedAt),
    },
    stack: {
      slugs: union(account.stack.slugs, guest.stack.slugs),
      updatedAt: latestTimestamp(account.stack.updatedAt, guest.stack.updatedAt),
    },
    personalStacks: [
      ...account.personalStacks,
      ...guest.personalStacks.filter(
        (stack) =>
          !account.personalStacks.some((item) => item.id === stack.id),
      ),
    ],
    toolStates: {
      ...guest.toolStates,
      ...account.toolStates,
    },
    events: [...account.events, ...guest.events],
  });
}

function assertRemoteCapacity(state: WorkspaceStateV1) {
  if (!workspaceSyncStateV1Schema.safeParse(state).success) {
    throw new WorkspaceCapacityError(state);
  }
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
  options: {
    operationId: string;
    maxConflictRetries?: number;
    guestContribution?: WorkspaceStateV1;
  },
): Promise<WorkspaceSyncResult> {
  const local = normalizeWorkspaceState(localInput);
  let remote = await repository.load();
  let accountDesired = mergeWorkspaceForSync(remote.state, local);
  let desired = options.guestContribution
    ? mergeGuestWorkspaceContribution(accountDesired, options.guestContribution)
    : accountDesired;
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
    assertRemoteCapacity(desired);
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
    accountDesired = mergeWorkspaceForSync(remote.state, accountDesired);
    desired = options.guestContribution
      ? mergeGuestWorkspaceContribution(accountDesired, options.guestContribution)
      : accountDesired;

    if (retries >= maxRetries) {
      throw new WorkspaceSyncConflictError(desired, remote.revision, retries + 1);
    }

    retries += 1;
  }
}

export class WorkspaceCapacityError extends Error {
  constructor(readonly state: WorkspaceStateV1) {
    super("Workspace exceeds the safe remote sync capacity.");
    this.name = "WorkspaceCapacityError";
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
