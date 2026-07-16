import type { ShortlistStage } from "@/lib/types/tool";
import type { DiscoveryWorkspaceState, ToolUserState } from "@/lib/discovery/types";
import { MAX_COMPARE_TOOLS } from "@/lib/discovery/workspace-constants";

export {
  createEmptyWorkspaceState,
  hasWorkspaceData,
  mergeWorkspaceStates,
  normalizeWorkspaceState,
  parseWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-contract";

const stageRank: Record<ShortlistStage, number> = {
  saved: 1,
  review: 2,
  top: 3,
};

function normalizeNote(note: string | undefined) {
  const trimmed = note?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeTimestamp(timestamp: string | null | undefined) {
  if (!timestamp) {
    return undefined;
  }

  const value = new Date(timestamp);
  return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
}

function maxTimestamp(left?: string, right?: string) {
  if (!left) {
    return right;
  }

  if (!right) {
    return left;
  }

  return new Date(left).getTime() >= new Date(right).getTime() ? left : right;
}

export function normalizeToolUserState(input: Partial<ToolUserState> | undefined): ToolUserState | null {
  if (!input) {
    return null;
  }

  const note = normalizeNote(input.note);
  const isPinned = Boolean(input.is_pinned);
  const isSaved = Boolean(input.is_saved);
  const shortlistStage = input.shortlist_stage ?? "saved";
  const saveReason = input.save_reason ?? undefined;
  const updatedAt = normalizeTimestamp(input.updated_at);

  if (!isSaved && !note && !saveReason && !isPinned) {
    return null;
  }

  return {
    is_saved: isSaved,
    shortlist_stage: shortlistStage,
    note,
    save_reason: saveReason,
    is_pinned: isPinned,
    updated_at: updatedAt,
  };
}

export function normalizeDiscoveryWorkspaceState(
  input?: Partial<DiscoveryWorkspaceState> | null,
): DiscoveryWorkspaceState {
  const toolStates = input?.tool_states ?? {};
  const compareSlugs = Array.isArray(input?.compare?.slugs)
    ? input.compare.slugs.filter((value): value is string => typeof value === "string")
    : [];

  return {
    tool_states: Object.fromEntries(
      Object.entries(toolStates)
        .map(([slug, state]) => [slug, normalizeToolUserState(state)])
        .filter((entry): entry is [string, ToolUserState] => Boolean(entry[0] && entry[1])),
    ),
    compare: {
      slugs: Array.from(new Set(compareSlugs)).slice(-MAX_COMPARE_TOOLS),
      updated_at: normalizeTimestamp(input?.compare?.updated_at),
    },
  };
}

function chooseStage(left: ToolUserState | null, right: ToolUserState | null) {
  const leftStage = left?.shortlist_stage ?? "saved";
  const rightStage = right?.shortlist_stage ?? "saved";

  return stageRank[leftStage] >= stageRank[rightStage] ? leftStage : rightStage;
}

function chooseFieldByTimestamp<T extends string | boolean | null | undefined>(
  left: T,
  right: T,
  leftUpdatedAt?: string,
  rightUpdatedAt?: string,
) {
  if (left && !right) {
    return left;
  }

  if (right && !left) {
    return right;
  }

  if (left && right && leftUpdatedAt && rightUpdatedAt) {
    return new Date(leftUpdatedAt).getTime() >= new Date(rightUpdatedAt).getTime() ? left : right;
  }

  return left ?? right;
}

export function mergeToolUserStates(
  localState: ToolUserState | null,
  remoteState: ToolUserState | null,
): ToolUserState | null {
  const left = normalizeToolUserState(localState ?? undefined);
  const right = normalizeToolUserState(remoteState ?? undefined);

  if (!left && !right) {
    return null;
  }

  if (!left) {
    return right;
  }

  if (!right) {
    return left;
  }

  const updatedAt = maxTimestamp(left.updated_at ?? undefined, right.updated_at ?? undefined);
  const note = chooseFieldByTimestamp(
    left.note,
    right.note,
    left.updated_at ?? undefined,
    right.updated_at ?? undefined,
  );
  const saveReason = chooseFieldByTimestamp(
    left.save_reason,
    right.save_reason,
    left.updated_at ?? undefined,
    right.updated_at ?? undefined,
  );

  return {
    is_saved: left.is_saved || right.is_saved,
    shortlist_stage: chooseStage(left, right),
    note: note ?? undefined,
    save_reason: saveReason ?? undefined,
    is_pinned: left.is_pinned || right.is_pinned,
    updated_at: updatedAt ?? null,
  };
}

export function mergeDiscoveryWorkspaceStates(
  localState: DiscoveryWorkspaceState,
  remoteState: DiscoveryWorkspaceState,
) {
  const local = normalizeDiscoveryWorkspaceState(localState);
  const remote = normalizeDiscoveryWorkspaceState(remoteState);
  const allSlugs = new Set([
    ...Object.keys(local.tool_states),
    ...Object.keys(remote.tool_states),
  ]);

  const toolStates = Object.fromEntries(
    Array.from(allSlugs)
      .map((slug) => [
        slug,
        mergeToolUserStates(local.tool_states[slug] ?? null, remote.tool_states[slug] ?? null),
      ])
      .filter((entry): entry is [string, ToolUserState] => Boolean(entry[1])),
  );

  const compareSlugs = Array.from(
    new Set([...local.compare.slugs, ...remote.compare.slugs]),
  ).slice(-MAX_COMPARE_TOOLS);

  return normalizeDiscoveryWorkspaceState({
    tool_states: toolStates,
    compare: {
      slugs: compareSlugs,
      updated_at: maxTimestamp(local.compare.updated_at ?? undefined, remote.compare.updated_at ?? undefined) ?? null,
    },
  });
}

export function hasDiscoveryWorkspaceData(state: DiscoveryWorkspaceState) {
  const normalized = normalizeDiscoveryWorkspaceState(state);

  return (
    Object.keys(normalized.tool_states).length > 0 ||
    normalized.compare.slugs.length > 0
  );
}
