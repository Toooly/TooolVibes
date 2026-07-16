import type {
  LegacyDiscoveryWorkspaceState,
  LegacyToolWorkspacePersistedState,
  ToolUserState,
  WorkspaceStateV1,
  WorkspaceToolState,
} from "@/lib/discovery/types";
import {
  createEmptyWorkspaceState,
  normalizeWorkspaceState,
} from "@/lib/discovery/workspace-state";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getLegacyZustandState(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  return isRecord(value.state) ? value.state : value;
}

function getTimestamp(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function getLatestTimestamp(values: Array<string | null>) {
  return values.reduce<string | null>((latest, value) => {
    if (!value) {
      return latest;
    }

    if (!latest || new Date(value).getTime() > new Date(latest).getTime()) {
      return value;
    }

    return latest;
  }, null);
}

function adaptLegacyToolState(value: unknown): WorkspaceToolState | null {
  if (!isRecord(value)) {
    return null;
  }

  const state = value as Partial<ToolUserState>;
  const stage =
    state.shortlist_stage === "review" || state.shortlist_stage === "top"
      ? state.shortlist_stage
      : "saved";
  const note = typeof state.note === "string" && state.note.trim()
    ? state.note.trim()
    : null;
  const saveReason =
    state.save_reason === "test" ||
    state.save_reason === "compare" ||
    state.save_reason === "design-fit" ||
    state.save_reason === "marketing-fit" ||
    state.save_reason === "client-project" ||
    state.save_reason === "observe"
      ? state.save_reason
      : null;

  return {
    stage,
    note,
    saveReason,
    pinned: state.is_pinned === true,
    decision: null,
    updatedAt: getTimestamp(state.updated_at),
  };
}

/**
 * Read-only compatibility boundary for the remote discovery workspace shape.
 * It never mutates or writes the legacy payload.
 */
export function adaptLegacyDiscoveryWorkspaceState(
  input: unknown,
): WorkspaceStateV1 {
  if (!isRecord(input)) {
    return createEmptyWorkspaceState();
  }

  const legacy = input as Partial<LegacyDiscoveryWorkspaceState>;
  const rawToolStates = isRecord(legacy.tool_states)
    ? legacy.tool_states
    : {};
  const toolStates: Record<string, WorkspaceToolState> = {};
  const savedSlugs: string[] = [];

  for (const [slug, rawState] of Object.entries(rawToolStates)) {
    const state = adaptLegacyToolState(rawState);

    if (!state) {
      continue;
    }

    toolStates[slug] = state;

    if (isRecord(rawState) && rawState.is_saved === true) {
      savedSlugs.push(slug);
    }
  }

  const compare: Record<string, unknown> = isRecord(legacy.compare)
    ? legacy.compare
    : {};
  const compareSlugs = Array.isArray(compare.slugs) ? compare.slugs : [];
  const compareUpdatedAt = getTimestamp(compare.updated_at);
  const savedUpdatedAt = getLatestTimestamp(
    savedSlugs.map((slug) => toolStates[slug]?.updatedAt ?? null),
  );

  return normalizeWorkspaceState({
    schemaVersion: 1,
    clearedAt: null,
    saved: {
      slugs: savedSlugs,
      updatedAt: savedUpdatedAt,
    },
    compare: {
      slugs: compareSlugs,
      updatedAt: compareUpdatedAt,
    },
    stack: {
      slugs: [],
      updatedAt: null,
    },
    toolStates,
  });
}

/**
 * Read-only compatibility boundary for the Zustand persisted collection shape.
 * Both the raw partial and Zustand's `{ state, version }` envelope are accepted.
 */
export function adaptLegacyToolWorkspaceState(
  input: unknown,
): WorkspaceStateV1 {
  const rawState = getLegacyZustandState(input);

  if (!rawState) {
    return createEmptyWorkspaceState();
  }

  const legacy = rawState as Partial<LegacyToolWorkspacePersistedState>;

  return normalizeWorkspaceState({
    schemaVersion: 1,
    clearedAt: null,
    saved: {
      slugs: Array.isArray(legacy.savedSlugs) ? legacy.savedSlugs : [],
      updatedAt: null,
    },
    compare: {
      slugs: Array.isArray(legacy.compareSlugs) ? legacy.compareSlugs : [],
      updatedAt: null,
    },
    stack: {
      slugs: Array.isArray(legacy.stackSlugs) ? legacy.stackSlugs : [],
      updatedAt: null,
    },
    toolStates: {},
  });
}
