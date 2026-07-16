export const WORKSPACE_STORAGE_KEY = "tooolvibes:workspace:v1";
export const WORKSPACE_LEGACY_BACKUP_KEY =
  "tooolvibes:workspace:legacy-backup:v1";
export const WORKSPACE_QUARANTINE_KEY =
  "tooolvibes:workspace:quarantine:v1";
export const WORKSPACE_SYNC_PREVIOUS_KEY =
  "tooolvibes:workspace:sync-previous:v1";
export const WORKSPACE_SYNC_RECOVERY_KEY =
  "tooolvibes:workspace:sync-recovery:v1";

export const LEGACY_TOOL_WORKSPACE_STORAGE_KEY =
  "tooolvibes-tool-workspace";

export const DISCOVERY_STORAGE_KEYS = {
  visitedTools: "tooolvibes:visited-tools",
  exploredCategories: "tooolvibes:explored-categories",
  shortlist: "tooolvibes:shortlist",
  shortlistState: "tooolvibes:shortlist-state",
  decisionMemory: "tooolvibes:decision-memory",
  compare: "tooolvibes:compare",
  toolStateMeta: "tooolvibes:tool-state-meta",
  compareMeta: "tooolvibes:compare-meta",
} as const;

/**
 * `visitedTools` and `exploredCategories` remain independent discovery
 * telemetry. They are included in the rollback backup, but they are not part
 * of WorkspaceStateV1 and must not be projected into it.
 */
export const LEGACY_DISCOVERY_WORKSPACE_STORAGE_KEYS = [
  DISCOVERY_STORAGE_KEYS.shortlist,
  DISCOVERY_STORAGE_KEYS.shortlistState,
  DISCOVERY_STORAGE_KEYS.decisionMemory,
  DISCOVERY_STORAGE_KEYS.compare,
  DISCOVERY_STORAGE_KEYS.toolStateMeta,
  DISCOVERY_STORAGE_KEYS.compareMeta,
] as const;

export const LEGACY_WORKSPACE_BACKUP_STORAGE_KEYS = [
  LEGACY_TOOL_WORKSPACE_STORAGE_KEY,
  ...Object.values(DISCOVERY_STORAGE_KEYS),
] as const;
