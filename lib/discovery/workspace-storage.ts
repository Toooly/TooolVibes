import { workspaceStateV1Schema } from "@/lib/discovery/schema";
import {
  adaptLegacyDiscoveryWorkspaceState,
  adaptLegacyToolWorkspaceState,
} from "@/lib/discovery/workspace-legacy-adapters";
import {
  LEGACY_DISCOVERY_WORKSPACE_STORAGE_KEYS,
  LEGACY_TOOL_WORKSPACE_STORAGE_KEY,
  LEGACY_WORKSPACE_BACKUP_STORAGE_KEYS,
  WORKSPACE_LEGACY_BACKUP_KEY,
  WORKSPACE_QUARANTINE_KEY,
  WORKSPACE_STORAGE_KEY,
} from "@/lib/discovery/workspace-storage-keys";
import {
  createEmptyWorkspaceState,
  mergeWorkspaceStates,
  normalizeWorkspaceState,
} from "@/lib/discovery/workspace-state";
import { MAX_COMPARE_TOOLS } from "@/lib/discovery/workspace-constants";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";

export const WORKSPACE_MIGRATION_STATUS_KEY =
  "tooolvibes:workspace:migration:v1:status";

export type WorkspaceStorage = Pick<Storage, "getItem" | "setItem">;

export type WorkspaceStorageIssueCode =
  | "backup-invalid"
  | "backup-write-failed"
  | "canonical-corrupt"
  | "canonical-readback-failed"
  | "canonical-write-failed"
  | "compare-overflow"
  | "future-version"
  | "legacy-corrupt"
  | "quarantine-write-failed"
  | "status-canonical-missing"
  | "status-write-failed"
  | "storage-read-failed";

export type WorkspaceStorageIssue = {
  code: WorkspaceStorageIssueCode;
  key: string;
  detail?: string;
};

export type WorkspaceMigrationDiagnostics = {
  compareOverflow: string[];
  corruptKeys: string[];
};

export type WorkspaceStorageLoadResult = {
  state: WorkspaceStateV1;
  source:
    | "canonical"
    | "empty"
    | "future-version"
    | "legacy-degraded"
    | "migrated"
    | "recovered";
  persistence: "degraded" | "persisted" | "read-only";
  migrated: boolean;
  issues: WorkspaceStorageIssue[];
  diagnostics: WorkspaceMigrationDiagnostics;
};

export type WorkspaceStorageWriteResult = {
  state: WorkspaceStateV1;
  persisted: boolean;
  issues: WorkspaceStorageIssue[];
};

type RawEntry = {
  key: string;
  raw: string;
  reason: string;
};

type MigrationBackup = {
  migrationVersion: 1;
  capturedAt: string;
  fingerprint: string;
  entries: Record<string, string>;
};

type MigrationStatus = {
  migrationVersion: 1;
  status: "complete";
  completedAt: string;
  backupFingerprint: string | null;
};

type QuarantinePayload = {
  migrationVersion: 1;
  capturedAt: string;
  entries: RawEntry[];
};

type LegacyDecodeResult = {
  state: WorkspaceStateV1;
  present: boolean;
  compareCandidates: string[];
};

type LegacyMergeResult = {
  state: WorkspaceStateV1;
  compareOverflow: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nowIso(value?: string) {
  if (value) {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
}

function timestampValue(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

const legacySlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeLegacyCompareCandidates(input: unknown) {
  if (!Array.isArray(input)) {
    return [];
  }

  const slugs = input
    .map((value) => {
      if (typeof value !== "string") {
        return null;
      }

      const slug = value.trim();
      return slug.length <= 120 && legacySlugPattern.test(slug) ? slug : null;
    })
    .filter((slug): slug is string => slug !== null);
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (let index = slugs.length - 1; index >= 0; index -= 1) {
    const slug = slugs[index];

    if (!seen.has(slug)) {
      seen.add(slug);
      normalized.unshift(slug);
    }
  }

  return normalized;
}

function sameList(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function fingerprint(value: string) {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function safeRead(
  storage: WorkspaceStorage,
  key: string,
  issues: WorkspaceStorageIssue[],
) {
  try {
    return {
      raw: storage.getItem(key),
      failed: false,
    };
  } catch {
    issues.push({
      code: "storage-read-failed",
      key,
    });
    return {
      raw: null,
      failed: true,
    };
  }
}

function parseJson(
  key: string,
  raw: string,
  corruptEntries: RawEntry[],
) {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    corruptEntries.push({
      key,
      raw,
      reason: "invalid-json",
    });
    return null;
  }
}

function parseLegacyArray(
  key: string,
  raw: string | null,
  corruptEntries: RawEntry[],
) {
  if (raw === null) {
    return [];
  }

  const parsed = parseJson(key, raw, corruptEntries);

  if (!Array.isArray(parsed)) {
    if (parsed !== null) {
      corruptEntries.push({
        key,
        raw,
        reason: "expected-array",
      });
    }
    return [];
  }

  return parsed;
}

function parseLegacyRecord(
  key: string,
  raw: string | null,
  corruptEntries: RawEntry[],
) {
  if (raw === null) {
    return {};
  }

  const parsed = parseJson(key, raw, corruptEntries);

  if (!isRecord(parsed)) {
    if (parsed !== null) {
      corruptEntries.push({
        key,
        raw,
        reason: "expected-object",
      });
    }
    return {};
  }

  return parsed;
}

function getDiscoveryKey(name: string) {
  return `tooolvibes:${name}`;
}

function decodeLegacyDiscovery(
  rawEntries: Record<string, string | null>,
  corruptEntries: RawEntry[],
): LegacyDecodeResult {
  const shortlistKey = getDiscoveryKey("shortlist");
  const shortlistStateKey = getDiscoveryKey("shortlist-state");
  const decisionMemoryKey = getDiscoveryKey("decision-memory");
  const compareKey = getDiscoveryKey("compare");
  const toolStateMetaKey = getDiscoveryKey("tool-state-meta");
  const compareMetaKey = getDiscoveryKey("compare-meta");
  const present = LEGACY_DISCOVERY_WORKSPACE_STORAGE_KEYS.some(
    (key) => rawEntries[key] !== null,
  );
  const rawShortlist = parseLegacyArray(
    shortlistKey,
    rawEntries[shortlistKey] ?? null,
    corruptEntries,
  );
  const shortlist = rawShortlist.filter(
    (value): value is string => typeof value === "string",
  );
  const stages = parseLegacyRecord(
    shortlistStateKey,
    rawEntries[shortlistStateKey] ?? null,
    corruptEntries,
  );
  const memories = parseLegacyRecord(
    decisionMemoryKey,
    rawEntries[decisionMemoryKey] ?? null,
    corruptEntries,
  );
  const toolStateMeta = parseLegacyRecord(
    toolStateMetaKey,
    rawEntries[toolStateMetaKey] ?? null,
    corruptEntries,
  );
  const rawCompare = parseLegacyArray(
    compareKey,
    rawEntries[compareKey] ?? null,
    corruptEntries,
  );
  const compareCandidates = normalizeLegacyCompareCandidates(rawCompare);
  const compareMeta = parseLegacyRecord(
    compareMetaKey,
    rawEntries[compareMetaKey] ?? null,
    corruptEntries,
  );
  const allSlugs = unique([
    ...shortlist,
    ...Object.keys(stages),
    ...Object.keys(memories),
    ...Object.keys(toolStateMeta),
  ]);
  const toolStates = Object.fromEntries(
    allSlugs.map((slug) => {
      const memory = isRecord(memories[slug]) ? memories[slug] : {};
      const note = memory.note;

      if (typeof note === "string" && note.trim().length > 2000) {
        const raw = rawEntries[decisionMemoryKey];

        if (raw !== null && raw !== undefined) {
          corruptEntries.push({
            key: decisionMemoryKey,
            raw,
            reason: "note-too-long",
          });
        }
      }

      return [
        slug,
        {
          is_saved: shortlist.includes(slug),
          shortlist_stage: stages[slug],
          note: memory.note,
          save_reason: memory.save_reason,
          is_pinned: memory.is_pinned,
          updated_at:
            memory.updated_at ??
            (typeof toolStateMeta[slug] === "string"
              ? toolStateMeta[slug]
              : null),
        },
      ];
    }),
  );
  const legacy = {
    tool_states: toolStates,
    compare: {
      slugs: compareCandidates,
      updated_at:
        typeof compareMeta.updated_at === "string"
          ? compareMeta.updated_at
          : null,
    },
  };

  return {
    state: adaptLegacyDiscoveryWorkspaceState(legacy),
    present,
    compareCandidates,
  };
}

function decodeLegacyZustand(
  raw: string | null,
  corruptEntries: RawEntry[],
): LegacyDecodeResult {
  if (raw === null) {
    return {
      state: createEmptyWorkspaceState(),
      present: false,
      compareCandidates: [],
    };
  }

  const parsed = parseJson(
    LEGACY_TOOL_WORKSPACE_STORAGE_KEY,
    raw,
    corruptEntries,
  );

  if (!isRecord(parsed)) {
    if (parsed !== null) {
      corruptEntries.push({
        key: LEGACY_TOOL_WORKSPACE_STORAGE_KEY,
        raw,
        reason: "expected-zustand-object",
      });
    }

    return {
      state: createEmptyWorkspaceState(),
      present: true,
      compareCandidates: [],
    };
  }

  if ("state" in parsed && !isRecord(parsed.state)) {
    corruptEntries.push({
      key: LEGACY_TOOL_WORKSPACE_STORAGE_KEY,
      raw,
      reason: "invalid-zustand-envelope",
    });
  }

  const rawState = isRecord(parsed.state) ? parsed.state : parsed;
  const compareCandidates = normalizeLegacyCompareCandidates(rawState.compareSlugs);

  return {
    state: adaptLegacyToolWorkspaceState(parsed),
    present: true,
    compareCandidates,
  };
}

function fillCompare(primary: string[], secondary: string[]) {
  return unique([...primary, ...secondary]).slice(0, MAX_COMPARE_TOOLS);
}

/**
 * Dedicated one-time migration policy.
 *
 * Zustand A is the pre-migration source visible to the main CTA surfaces, so
 * saved membership is an ordered A-first union. Discovery B is the only
 * source for stage/note/reason/pin and its list timestamp is retained only
 * when it still describes the final membership. Compare gives priority to B
 * when B has a valid timestamp; otherwise A is primary. Overflow remains in
 * the immutable raw backup and is also returned as diagnostics.
 */
function mergeLegacySources(
  zustand: LegacyDecodeResult,
  discovery: LegacyDecodeResult,
): LegacyMergeResult {
  if (!zustand.present && !discovery.present) {
    return {
      state: createEmptyWorkspaceState(),
      compareOverflow: [],
    };
  }

  const saved = unique([
    ...zustand.state.saved.slugs,
    ...discovery.state.saved.slugs,
  ]);
  const savedMatchesDiscovery = sameList(
    saved,
    discovery.state.saved.slugs,
  );
  const discoveryCompareIsDated =
    timestampValue(discovery.state.compare.updatedAt) !== null;
  const primaryCompare = discoveryCompareIsDated
    ? discovery.state.compare.slugs
    : zustand.state.compare.slugs;
  const secondaryCompare = discoveryCompareIsDated
    ? zustand.state.compare.slugs
    : discovery.state.compare.slugs;
  const primaryCandidates = discoveryCompareIsDated
    ? discovery.compareCandidates
    : zustand.compareCandidates;
  const secondaryCandidates = discoveryCompareIsDated
    ? zustand.compareCandidates
    : discovery.compareCandidates;
  const allCompare = unique([...primaryCandidates, ...secondaryCandidates]);
  const compare = fillCompare(primaryCompare, secondaryCompare);
  const compareMatchesPrimary = sameList(compare, primaryCompare);

  return {
    state: normalizeWorkspaceState({
      schemaVersion: 1,
      clearedAt: null,
      saved: {
        slugs: saved,
        updatedAt: savedMatchesDiscovery
          ? discovery.state.saved.updatedAt
          : null,
      },
      compare: {
        slugs: compare,
        updatedAt:
          discoveryCompareIsDated && compareMatchesPrimary
            ? discovery.state.compare.updatedAt
            : null,
      },
      stack: {
        slugs: zustand.state.stack.slugs,
        updatedAt: null,
      },
      toolStates: discovery.state.toolStates,
    }),
    compareOverflow: allCompare.filter((slug) => !compare.includes(slug)),
  };
}

function mergeRecoveredCanonical(
  recovered: WorkspaceStateV1,
  legacy: WorkspaceStateV1,
) {
  const merged = mergeWorkspaceStates(recovered, legacy);

  return normalizeWorkspaceState({
    ...merged,
    saved: {
      slugs: unique([...recovered.saved.slugs, ...legacy.saved.slugs]),
      updatedAt: null,
    },
    stack: {
      slugs: unique([...recovered.stack.slugs, ...legacy.stack.slugs]),
      updatedAt: null,
    },
  });
}

function buildRawLegacyEntries(raw: Record<string, string | null>) {
  return Object.fromEntries(
    Object.entries(raw).flatMap(([key, value]) =>
      value === null ? [] : [[key, value]],
    ),
  );
}

function parseBackup(raw: string): MigrationBackup | null {
  try {
    const parsed = JSON.parse(raw) as unknown;

    if (
      !isRecord(parsed) ||
      parsed.migrationVersion !== 1 ||
      typeof parsed.capturedAt !== "string" ||
      typeof parsed.fingerprint !== "string" ||
      !isRecord(parsed.entries) ||
      Object.values(parsed.entries).some((value) => typeof value !== "string")
    ) {
      return null;
    }

    return parsed as MigrationBackup;
  } catch {
    return null;
  }
}

function parseStatus(raw: string | null): MigrationStatus | null {
  if (raw === null) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (
      !isRecord(parsed) ||
      parsed.migrationVersion !== 1 ||
      parsed.status !== "complete" ||
      typeof parsed.completedAt !== "string" ||
      !(
        parsed.backupFingerprint === null ||
        typeof parsed.backupFingerprint === "string"
      )
    ) {
      return null;
    }

    return parsed as MigrationStatus;
  } catch {
    return null;
  }
}

function ensureBackup(
  storage: WorkspaceStorage,
  entries: Record<string, string>,
  existingRaw: string | null,
  capturedAt: string,
  issues: WorkspaceStorageIssue[],
) {
  if (existingRaw !== null) {
    const existing = parseBackup(existingRaw);

    if (!existing) {
      issues.push({
        code: "backup-invalid",
        key: WORKSPACE_LEGACY_BACKUP_KEY,
      });
      return null;
    }

    return existing;
  }

  if (Object.keys(entries).length === 0) {
    return null;
  }

  const serializedEntries = JSON.stringify(entries);
  const backup: MigrationBackup = {
    migrationVersion: 1,
    capturedAt,
    fingerprint: fingerprint(serializedEntries),
    entries,
  };
  const raw = JSON.stringify(backup);

  try {
    storage.setItem(WORKSPACE_LEGACY_BACKUP_KEY, raw);

    if (storage.getItem(WORKSPACE_LEGACY_BACKUP_KEY) !== raw) {
      issues.push({
        code: "backup-write-failed",
        key: WORKSPACE_LEGACY_BACKUP_KEY,
        detail: "readback-mismatch",
      });
      return null;
    }

    return backup;
  } catch {
    issues.push({
      code: "backup-write-failed",
      key: WORKSPACE_LEGACY_BACKUP_KEY,
    });
    return null;
  }
}

function appendQuarantine(
  storage: WorkspaceStorage,
  entries: RawEntry[],
  capturedAt: string,
  issues: WorkspaceStorageIssue[],
) {
  if (entries.length === 0) {
    return true;
  }

  const existingRead = safeRead(storage, WORKSPACE_QUARANTINE_KEY, issues);

  if (existingRead.failed) {
    return false;
  }

  let previous: RawEntry[] = [];

  if (existingRead.raw !== null) {
    try {
      const parsed = JSON.parse(existingRead.raw) as unknown;

      if (
        !isRecord(parsed) ||
        parsed.migrationVersion !== 1 ||
        !Array.isArray(parsed.entries)
      ) {
        throw new Error("invalid-quarantine");
      }

      previous = parsed.entries.filter(
        (entry): entry is RawEntry =>
          isRecord(entry) &&
          typeof entry.key === "string" &&
          typeof entry.raw === "string" &&
          typeof entry.reason === "string",
      );
    } catch {
      issues.push({
        code: "quarantine-write-failed",
        key: WORKSPACE_QUARANTINE_KEY,
        detail: "existing-quarantine-invalid",
      });
      return false;
    }
  }

  const merged = [...previous];

  for (const entry of entries) {
    if (
      !merged.some(
        (current) =>
          current.key === entry.key &&
          current.raw === entry.raw &&
          current.reason === entry.reason,
      )
    ) {
      merged.push(entry);
    }
  }

  if (merged.length === previous.length) {
    return true;
  }

  const payload: QuarantinePayload = {
    migrationVersion: 1,
    capturedAt,
    entries: merged,
  };
  const raw = JSON.stringify(payload);

  try {
    storage.setItem(WORKSPACE_QUARANTINE_KEY, raw);

    if (storage.getItem(WORKSPACE_QUARANTINE_KEY) !== raw) {
      throw new Error("readback-mismatch");
    }

    return true;
  } catch {
    issues.push({
      code: "quarantine-write-failed",
      key: WORKSPACE_QUARANTINE_KEY,
    });
    return false;
  }
}

function writeCanonical(
  storage: WorkspaceStorage,
  state: WorkspaceStateV1,
  issues: WorkspaceStorageIssue[],
) {
  const raw = JSON.stringify(state);

  try {
    storage.setItem(WORKSPACE_STORAGE_KEY, raw);

    if (storage.getItem(WORKSPACE_STORAGE_KEY) !== raw) {
      issues.push({
        code: "canonical-readback-failed",
        key: WORKSPACE_STORAGE_KEY,
      });
      return false;
    }

    return true;
  } catch {
    issues.push({
      code: "canonical-write-failed",
      key: WORKSPACE_STORAGE_KEY,
    });
    return false;
  }
}

function writeStatus(
  storage: WorkspaceStorage,
  completedAt: string,
  backupFingerprint: string | null,
  issues: WorkspaceStorageIssue[],
) {
  const status: MigrationStatus = {
    migrationVersion: 1,
    status: "complete",
    completedAt,
    backupFingerprint,
  };

  try {
    storage.setItem(WORKSPACE_MIGRATION_STATUS_KEY, JSON.stringify(status));
    return true;
  } catch {
    issues.push({
      code: "status-write-failed",
      key: WORKSPACE_MIGRATION_STATUS_KEY,
    });
    return false;
  }
}

function canonicalVersion(input: unknown) {
  return isRecord(input) && typeof input.schemaVersion === "number"
    ? input.schemaVersion
    : null;
}

export function getBrowserWorkspaceStorage(): WorkspaceStorage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Synchronous bootstrap for Zustand hydration. A strict canonical payload is
 * authoritative and produces no writes. Legacy keys are consulted only when
 * canonical v1 is absent or recoverably corrupt; this temporary dual-read
 * prevents stale legacy values from resurrecting a canonical remove/clear.
 */
export function loadWorkspaceStateFromStorage(
  storage: WorkspaceStorage,
  options: {
    now?: string;
  } = {},
): WorkspaceStorageLoadResult {
  const capturedAt = nowIso(options.now);
  const issues: WorkspaceStorageIssue[] = [];
  const corruptEntries: RawEntry[] = [];
  const emptyDiagnostics: WorkspaceMigrationDiagnostics = {
    compareOverflow: [],
    corruptKeys: [],
  };
  const canonicalRead = safeRead(storage, WORKSPACE_STORAGE_KEY, issues);

  if (canonicalRead.raw !== null) {
    const parsed = parseJson(
      WORKSPACE_STORAGE_KEY,
      canonicalRead.raw,
      corruptEntries,
    );
    const strict = workspaceStateV1Schema.safeParse(parsed);

    if (strict.success) {
      return {
        state: strict.data,
        source: "canonical",
        persistence: "persisted",
        migrated: false,
        issues,
        diagnostics: emptyDiagnostics,
      };
    }

    const version = canonicalVersion(parsed);

    if (version !== null && version > 1) {
      issues.push({
        code: "future-version",
        key: WORKSPACE_STORAGE_KEY,
        detail: String(version),
      });
      return {
        state: createEmptyWorkspaceState(),
        source: "future-version",
        persistence: "read-only",
        migrated: false,
        issues,
        diagnostics: emptyDiagnostics,
      };
    }

    issues.push({
      code: "canonical-corrupt",
      key: WORKSPACE_STORAGE_KEY,
    });

    if (
      !corruptEntries.some((entry) => entry.key === WORKSPACE_STORAGE_KEY)
    ) {
      corruptEntries.push({
        key: WORKSPACE_STORAGE_KEY,
        raw: canonicalRead.raw,
        reason: "strict-schema-invalid",
      });
    }
  }

  const statusRead = safeRead(storage, WORKSPACE_MIGRATION_STATUS_KEY, issues);
  const status = parseStatus(statusRead.raw);

  if (canonicalRead.raw === null && status?.status === "complete") {
    issues.push({
      code: "status-canonical-missing",
      key: WORKSPACE_STORAGE_KEY,
    });
    return {
      state: createEmptyWorkspaceState(),
      source: "legacy-degraded",
      persistence: "read-only",
      migrated: false,
      issues,
      diagnostics: emptyDiagnostics,
    };
  }

  const rawLegacy: Record<string, string | null> = {};
  let legacyReadFailed = canonicalRead.failed || statusRead.failed;

  for (const key of LEGACY_WORKSPACE_BACKUP_STORAGE_KEYS) {
    const result = safeRead(storage, key, issues);
    rawLegacy[key] = result.raw;
    legacyReadFailed ||= result.failed;
  }

  const zustand = decodeLegacyZustand(
    rawLegacy[LEGACY_TOOL_WORKSPACE_STORAGE_KEY] ?? null,
    corruptEntries,
  );
  const discovery = decodeLegacyDiscovery(rawLegacy, corruptEntries);
  const legacyMerge = mergeLegacySources(zustand, discovery);
  let state = legacyMerge.state;
  let source: WorkspaceStorageLoadResult["source"] =
    zustand.present || discovery.present ? "migrated" : "empty";

  if (canonicalRead.raw !== null) {
    const parsed = parseJson(
      WORKSPACE_STORAGE_KEY,
      canonicalRead.raw,
      [],
    );
    const recovered = normalizeWorkspaceState(parsed);
    state = mergeRecoveredCanonical(recovered, legacyMerge.state);
    source = "recovered";
  }

  const diagnostics: WorkspaceMigrationDiagnostics = {
    compareOverflow: legacyMerge.compareOverflow,
    corruptKeys: unique(corruptEntries.map((entry) => entry.key)),
  };

  if (legacyMerge.compareOverflow.length > 0) {
    issues.push({
      code: "compare-overflow",
      key: WORKSPACE_STORAGE_KEY,
      detail: String(legacyMerge.compareOverflow.length),
    });
  }

  for (const key of diagnostics.corruptKeys) {
    if (key !== WORKSPACE_STORAGE_KEY) {
      issues.push({
        code: "legacy-corrupt",
        key,
      });
    }
  }

  if (legacyReadFailed) {
    return {
      state,
      source: "legacy-degraded",
      persistence: "read-only",
      migrated: false,
      issues,
      diagnostics,
    };
  }

  const backupRead = safeRead(storage, WORKSPACE_LEGACY_BACKUP_KEY, issues);

  if (backupRead.failed) {
    return {
      state,
      source: "legacy-degraded",
      persistence: "read-only",
      migrated: false,
      issues,
      diagnostics,
    };
  }

  const legacyEntries = buildRawLegacyEntries(rawLegacy);
  const backup = ensureBackup(
    storage,
    legacyEntries,
    backupRead.raw,
    capturedAt,
    issues,
  );

  if (Object.keys(legacyEntries).length > 0 && !backup) {
    return {
      state,
      source: "legacy-degraded",
      persistence: "degraded",
      migrated: false,
      issues,
      diagnostics,
    };
  }

  const canonicalCorrupt = corruptEntries.some(
    (entry) => entry.key === WORKSPACE_STORAGE_KEY,
  );
  const quarantineWritten = appendQuarantine(
    storage,
    corruptEntries,
    capturedAt,
    issues,
  );

  if (canonicalCorrupt && !quarantineWritten) {
    return {
      state,
      source: "legacy-degraded",
      persistence: "degraded",
      migrated: false,
      issues,
      diagnostics,
    };
  }

  const persisted = writeCanonical(storage, state, issues);

  if (!persisted) {
    return {
      state,
      source: "legacy-degraded",
      persistence: "degraded",
      migrated: false,
      issues,
      diagnostics,
    };
  }

  writeStatus(
    storage,
    capturedAt,
    backup?.fingerprint ?? null,
    issues,
  );

  return {
    state,
    source,
    persistence: "persisted",
    migrated: true,
    issues,
    diagnostics,
  };
}

export function persistWorkspaceStateToStorage(
  storage: WorkspaceStorage,
  input: unknown,
  options: {
    now?: string;
  } = {},
): WorkspaceStorageWriteResult {
  const state = normalizeWorkspaceState(input);
  const issues: WorkspaceStorageIssue[] = [];
  const currentRead = safeRead(storage, WORKSPACE_STORAGE_KEY, issues);

  if (currentRead.failed) {
    return {
      state,
      persisted: false,
      issues,
    };
  }

  if (currentRead.raw !== null) {
    const corruptEntries: RawEntry[] = [];
    const parsed = parseJson(
      WORKSPACE_STORAGE_KEY,
      currentRead.raw,
      corruptEntries,
    );
    const version = canonicalVersion(parsed);

    if (version !== null && version > 1) {
      issues.push({
        code: "future-version",
        key: WORKSPACE_STORAGE_KEY,
        detail: String(version),
      });
      return {
        state,
        persisted: false,
        issues,
      };
    }

    if (!workspaceStateV1Schema.safeParse(parsed).success) {
      const quarantined = appendQuarantine(
        storage,
        [
          {
            key: WORKSPACE_STORAGE_KEY,
            raw: currentRead.raw,
            reason: "overwritten-by-canonical-write",
          },
        ],
        nowIso(options.now),
        issues,
      );

      if (!quarantined) {
        return {
          state,
          persisted: false,
          issues,
        };
      }
    }
  }

  const persisted = writeCanonical(storage, state, issues);

  if (persisted) {
    const statusRead = safeRead(
      storage,
      WORKSPACE_MIGRATION_STATUS_KEY,
      issues,
    );

    if (!parseStatus(statusRead.raw)) {
      writeStatus(storage, nowIso(options.now), null, issues);
    }
  }

  return {
    state,
    persisted,
    issues,
  };
}

export function updateWorkspaceCollections(
  input: unknown,
  collections: {
    savedSlugs: string[];
    compareSlugs: string[];
    stackSlugs: string[];
  },
  at: string,
) {
  const state = normalizeWorkspaceState(input);
  const legacy = adaptLegacyToolWorkspaceState(collections);
  const timestamp = nowIso(at);
  const savedChanged = !sameList(state.saved.slugs, legacy.saved.slugs);
  const compareChanged = !sameList(
    state.compare.slugs,
    legacy.compare.slugs,
  );
  const stackChanged = !sameList(state.stack.slugs, legacy.stack.slugs);

  return normalizeWorkspaceState({
    ...state,
    saved: savedChanged
      ? { slugs: legacy.saved.slugs, updatedAt: timestamp }
      : state.saved,
    compare: compareChanged
      ? { slugs: legacy.compare.slugs, updatedAt: timestamp }
      : state.compare,
    stack: stackChanged
      ? { slugs: legacy.stack.slugs, updatedAt: timestamp }
      : state.stack,
  });
}

export function readWorkspaceLegacyBackup(
  storage: WorkspaceStorage,
): MigrationBackup | null {
  try {
    const raw = storage.getItem(WORKSPACE_LEGACY_BACKUP_KEY);
    return raw === null ? null : parseBackup(raw);
  } catch {
    return null;
  }
}
