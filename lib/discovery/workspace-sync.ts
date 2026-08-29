import {
  mergeWorkspaceStates,
  normalizeWorkspaceState,
} from "@/lib/discovery/workspace-state";
import { workspaceSyncStateV1Schema } from "@/lib/discovery/schema";
import {
  MAX_COMPARE_TOOLS,
  MAX_PERSONAL_STACKS,
  MAX_WORKSPACE_COLLECTION_TOOLS,
} from "@/lib/discovery/workspace-constants";
import type {
  PersonalStack,
  ViewerKind,
  WorkspaceStateV1,
  WorkspaceToolState,
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
 * state. Overlapping toolStates merge field-by-field; equal timestamps
 * keep the account value.
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
    personalStacks: mergeGuestPersonalStacks(
      account.personalStacks,
      guest.personalStacks,
    ),
    toolStates: mergeGuestToolStateMap(account.toolStates, guest.toolStates),
    events: [...account.events, ...guest.events],
  });
}

function timestampMs(value: string | null | undefined) {
  if (!value) return 0;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

function isEmptyText(value: string | null | undefined) {
  return value == null || value === "";
}

function pickContributedScalar<T>(
  accountValue: T,
  guestValue: T,
  accountTime: number,
  guestTime: number,
  isEmpty: (value: T) => boolean,
): T {
  const accountEmpty = isEmpty(accountValue);
  const guestEmpty = isEmpty(guestValue);
  if (accountEmpty && !guestEmpty) return guestValue;
  if (guestEmpty && !accountEmpty) return accountValue;
  if (accountEmpty && guestEmpty) return accountValue;
  if (Object.is(accountValue, guestValue)) return accountValue;
  if (guestTime > accountTime) return guestValue;
  return accountValue;
}

function mergeGuestToolState(
  accountState: WorkspaceToolState | undefined,
  guestState: WorkspaceToolState | undefined,
): WorkspaceToolState | undefined {
  if (!accountState) return guestState;
  if (!guestState) return accountState;

  const accountTime = timestampMs(accountState.updatedAt);
  const guestTime = timestampMs(guestState.updatedAt);

  const usage = pickContributedScalar(
    accountState.usage,
    guestState.usage,
    accountTime,
    guestTime,
    (value) => value == null,
  );
  const replacedBy = usage === "replaced"
    ? pickContributedScalar(
        accountState.replacedBy,
        guestState.replacedBy,
        accountTime,
        guestTime,
        (value) => value == null,
      )
    : null;

  const accountDecisionTime = timestampMs(accountState.decision?.updatedAt);
  const guestDecisionTime = timestampMs(guestState.decision?.updatedAt);
  let decision = accountState.decision;
  if (!accountState.decision && guestState.decision) {
    decision = guestState.decision;
  } else if (accountState.decision && !guestState.decision) {
    decision = accountState.decision;
  } else if (accountState.decision && guestState.decision) {
    if (guestDecisionTime > accountDecisionTime) {
      decision = guestState.decision;
    } else {
      decision = accountState.decision;
    }
  }

  const alternatives = Array.from(
    new Set([...accountState.alternatives, ...guestState.alternatives]),
  ).slice(0, MAX_COMPARE_TOOLS);

  let revisitAt = accountState.revisitAt;
  if (!accountState.revisitAt && guestState.revisitAt) {
    revisitAt = guestState.revisitAt;
  } else if (accountState.revisitAt && guestState.revisitAt) {
    revisitAt =
      timestampMs(guestState.revisitAt) > timestampMs(accountState.revisitAt)
        ? guestState.revisitAt
        : accountState.revisitAt;
  }

  return {
    stage: pickContributedScalar(
      accountState.stage,
      guestState.stage,
      accountTime,
      guestTime,
      () => false,
    ),
    note: pickContributedScalar(
      accountState.note,
      guestState.note,
      accountTime,
      guestTime,
      isEmptyText,
    ),
    saveReason: pickContributedScalar(
      accountState.saveReason,
      guestState.saveReason,
      accountTime,
      guestTime,
      (value) => value == null,
    ),
    pinned: accountState.pinned || guestState.pinned,
    decision,
    useCase: pickContributedScalar(
      accountState.useCase,
      guestState.useCase,
      accountTime,
      guestTime,
      isEmptyText,
    ),
    alternatives,
    revisitAt,
    usage,
    replacedBy,
    compareObjective: pickContributedScalar(
      accountState.compareObjective,
      guestState.compareObjective,
      accountTime,
      guestTime,
      (value) => value == null,
    ),
    updatedAt: latestTimestamp(accountState.updatedAt, guestState.updatedAt),
  };
}

function mergeGuestToolStateMap(
  accountStates: WorkspaceStateV1["toolStates"],
  guestStates: WorkspaceStateV1["toolStates"],
) {
  const slugs = new Set([
    ...Object.keys(accountStates),
    ...Object.keys(guestStates),
  ]);
  const next: WorkspaceStateV1["toolStates"] = {};
  for (const slug of slugs) {
    const merged = mergeGuestToolState(accountStates[slug], guestStates[slug]);
    if (merged) next[slug] = merged;
  }
  return next;
}

function mergeGuestPersonalStacks(
  accountStacks: PersonalStack[],
  guestStacks: PersonalStack[],
) {
  const accountById = new Map(accountStacks.map((stack) => [stack.id, stack]));
  const guestById = new Map(guestStacks.map((stack) => [stack.id, stack]));
  const merged: PersonalStack[] = [];

  for (const accountStack of accountStacks) {
    const guestStack = guestById.get(accountStack.id);
    if (!guestStack) {
      merged.push(accountStack);
      continue;
    }
    const accountTime = timestampMs(accountStack.updatedAt);
    const guestTime = timestampMs(guestStack.updatedAt);
    merged.push({
      id: accountStack.id,
      name: pickContributedScalar(
        accountStack.name,
        guestStack.name,
        accountTime,
        guestTime,
        isEmptyText,
      ),
      description: pickContributedScalar(
        accountStack.description,
        guestStack.description,
        accountTime,
        guestTime,
        isEmptyText,
      ),
      slugs: Array.from(
        new Set([...accountStack.slugs, ...guestStack.slugs]),
      ).slice(0, MAX_WORKSPACE_COLLECTION_TOOLS),
      archivedAt: pickContributedScalar(
        accountStack.archivedAt,
        guestStack.archivedAt,
        accountTime,
        guestTime,
        (value) => value == null,
      ),
      updatedAt:
        latestTimestamp(accountStack.updatedAt, guestStack.updatedAt) ??
        accountStack.updatedAt,
    });
  }

  for (const guestStack of guestStacks) {
    if (!accountById.has(guestStack.id)) {
      merged.push(guestStack);
    }
  }

  return merged.slice(0, MAX_PERSONAL_STACKS);
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
