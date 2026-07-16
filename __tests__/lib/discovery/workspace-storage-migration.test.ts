import { afterEach, describe, expect, it, vi } from "vitest";

import {
  canonicalToolWorkspacePersistStorage,
} from "@/lib/stores/tool-workspace-store";
import {
  loadWorkspaceStateFromStorage,
  getBrowserWorkspaceStorage,
  persistWorkspaceStateToStorage,
  readWorkspaceLegacyBackup,
  updateWorkspaceCollections,
  WORKSPACE_MIGRATION_STATUS_KEY,
  type WorkspaceStorage,
} from "@/lib/discovery/workspace-storage";
import {
  DISCOVERY_STORAGE_KEYS,
  LEGACY_TOOL_WORKSPACE_STORAGE_KEY,
  LEGACY_WORKSPACE_BACKUP_STORAGE_KEYS,
  WORKSPACE_LEGACY_BACKUP_KEY,
  WORKSPACE_QUARANTINE_KEY,
  WORKSPACE_STORAGE_KEY,
} from "@/lib/discovery/workspace-storage-keys";
import {
  createEmptyWorkspaceState,
  normalizeWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-state";

const T0 = "2026-07-16T10:00:00.000Z";
const T1 = "2026-07-16T11:00:00.000Z";
const T2 = "2026-07-16T12:00:00.000Z";

class MemoryStorage implements WorkspaceStorage {
  readonly values = new Map<string, string>();
  readonly writes: Array<{ key: string; value: string }> = [];
  readonly failedReads = new Set<string>();
  readonly failedWrites = new Set<string>();

  constructor(entries: Record<string, string> = {}) {
    for (const [key, value] of Object.entries(entries)) {
      this.values.set(key, value);
    }
  }

  getItem(key: string) {
    if (this.failedReads.has(key)) {
      throw new DOMException("Storage unavailable", "SecurityError");
    }

    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.writes.push({ key, value });

    if (this.failedWrites.has(key)) {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    }

    this.values.set(key, value);
  }
}

function legacyZustand(
  savedSlugs: string[],
  compareSlugs: string[] = [],
  stackSlugs: string[] = [],
) {
  return JSON.stringify({
    state: {
      savedSlugs,
      compareSlugs,
      stackSlugs,
    },
    version: 0,
  });
}

function discoveryEntries(options: {
  shortlist?: unknown;
  stages?: unknown;
  memories?: unknown;
  toolStateMeta?: unknown;
  compare?: unknown;
  compareMeta?: unknown;
}) {
  return {
    [DISCOVERY_STORAGE_KEYS.shortlist]: JSON.stringify(
      options.shortlist ?? [],
    ),
    [DISCOVERY_STORAGE_KEYS.shortlistState]: JSON.stringify(
      options.stages ?? {},
    ),
    [DISCOVERY_STORAGE_KEYS.decisionMemory]: JSON.stringify(
      options.memories ?? {},
    ),
    [DISCOVERY_STORAGE_KEYS.toolStateMeta]: JSON.stringify(
      options.toolStateMeta ?? {},
    ),
    [DISCOVERY_STORAGE_KEYS.compare]: JSON.stringify(options.compare ?? []),
    [DISCOVERY_STORAGE_KEYS.compareMeta]: JSON.stringify(
      options.compareMeta ?? {},
    ),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WorkspaceStateV1 localStorage migration", () => {
  it("degrades safely when the window.localStorage getter throws", () => {
    const restrictedWindow = {};
    Object.defineProperty(restrictedWindow, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Storage blocked", "SecurityError");
      },
    });
    vi.stubGlobal("window", restrictedWindow);

    expect(getBrowserWorkspaceStorage()).toBeNull();
    expect(() =>
      canonicalToolWorkspacePersistStorage.getItem(WORKSPACE_STORAGE_KEY),
    ).not.toThrow();
    expect(
      canonicalToolWorkspacePersistStorage.getItem(WORKSPACE_STORAGE_KEY),
    ).toBeNull();
    expect(() =>
      canonicalToolWorkspacePersistStorage.setItem(WORKSPACE_STORAGE_KEY, {
        state: { savedSlugs: [], compareSlugs: [], stackSlugs: [] },
        version: 1,
      }),
    ).not.toThrow();
  });

  it("creates an empty canonical payload once and is write-free on rerun", () => {
    const storage = new MemoryStorage();
    const first = loadWorkspaceStateFromStorage(storage, { now: T0 });

    expect(first).toMatchObject({
      source: "empty",
      persistence: "persisted",
      migrated: true,
      state: createEmptyWorkspaceState(),
    });
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBe(
      JSON.stringify(createEmptyWorkspaceState()),
    );
    expect(storage.getItem(WORKSPACE_LEGACY_BACKUP_KEY)).toBeNull();
    expect(storage.getItem(WORKSPACE_MIGRATION_STATUS_KEY)).not.toBeNull();

    storage.writes.length = 0;
    const second = loadWorkspaceStateFromStorage(storage, { now: T1 });

    expect(second.state).toEqual(first.state);
    expect(second).toMatchObject({
      source: "canonical",
      migrated: false,
    });
    expect(storage.writes).toEqual([]);
  });

  it("migrates Zustand A without changing a single legacy byte", () => {
    const rawA = legacyZustand(
      ["beta", "alpha", "beta"],
      ["one", "two", "one"],
      ["gamma", "alpha", "gamma"],
    );
    const storage = new MemoryStorage({
      [LEGACY_TOOL_WORKSPACE_STORAGE_KEY]: rawA,
    });

    const result = loadWorkspaceStateFromStorage(storage, { now: T0 });

    expect(result.state.saved.slugs).toEqual(["beta", "alpha"]);
    expect(result.state.compare.slugs).toEqual(["two", "one"]);
    expect(result.state.stack.slugs).toEqual(["gamma", "alpha"]);
    expect(result.state.saved.updatedAt).toBeNull();
    expect(storage.getItem(LEGACY_TOOL_WORKSPACE_STORAGE_KEY)).toBe(rawA);
    expect(
      storage.writes.some(
        ({ key }) => key === LEGACY_TOOL_WORKSPACE_STORAGE_KEY,
      ),
    ).toBe(false);

    const backup = readWorkspaceLegacyBackup(storage);
    expect(backup?.entries[LEGACY_TOOL_WORKSPACE_STORAGE_KEY]).toBe(rawA);
  });

  it("preserves discovery B stage, note, reason, pin and timestamps", () => {
    const visitedRaw = JSON.stringify(["alpha"]);
    const storage = new MemoryStorage({
      ...discoveryEntries({
        shortlist: ["alpha"],
        stages: { alpha: "top" },
        memories: {
          alpha: {
            note: "Decisione motivata",
            save_reason: "compare",
            is_pinned: true,
            updated_at: T1,
          },
        },
        toolStateMeta: { alpha: T0 },
        compare: ["alpha"],
        compareMeta: { updated_at: T2 },
      }),
      [DISCOVERY_STORAGE_KEYS.visitedTools]: visitedRaw,
    });

    const result = loadWorkspaceStateFromStorage(storage, { now: T2 });

    expect(result.state.saved).toEqual({
      slugs: ["alpha"],
      updatedAt: T1,
    });
    expect(result.state.compare).toEqual({
      slugs: ["alpha"],
      updatedAt: T2,
    });
    expect(result.state.toolStates.alpha).toEqual({
      stage: "top",
      note: "Decisione motivata",
      saveReason: "compare",
      pinned: true,
      decision: null,
      updatedAt: T1,
    });
    expect(storage.getItem(DISCOVERY_STORAGE_KEYS.visitedTools)).toBe(
      visitedRaw,
    );
    expect(
      readWorkspaceLegacyBackup(storage)?.entries[
        DISCOVERY_STORAGE_KEYS.visitedTools
      ],
    ).toBe(visitedRaw);
  });

  it("uses a lossless A-first saved union and dated-B compare priority", () => {
    const storage = new MemoryStorage({
      [LEGACY_TOOL_WORKSPACE_STORAGE_KEY]: legacyZustand(
        ["alpha", "beta"],
        ["a-one", "a-two", "a-three"],
        ["stack-one"],
      ),
      ...discoveryEntries({
        shortlist: ["beta", "gamma"],
        stages: { beta: "review", gamma: "top" },
        memories: { gamma: { note: "Keep me", updated_at: T1 } },
        toolStateMeta: { beta: T0, gamma: T1 },
        compare: ["b-one", "b-two", "b-three", "b-four"],
        compareMeta: { updated_at: T2 },
      }),
    });

    const result = loadWorkspaceStateFromStorage(storage, { now: T2 });

    expect(result.state.saved).toEqual({
      slugs: ["alpha", "beta", "gamma"],
      updatedAt: null,
    });
    expect(result.state.stack.slugs).toEqual(["stack-one"]);
    expect(result.state.compare).toEqual({
      slugs: ["b-one", "b-two", "b-three", "b-four", "a-one"],
      updatedAt: null,
    });
    expect(result.diagnostics.compareOverflow).toEqual(["a-two", "a-three"]);
    expect(result.issues).toContainEqual({
      code: "compare-overflow",
      key: WORKSPACE_STORAGE_KEY,
      detail: "2",
    });
  });

  it("keeps a full dated discovery compare list and reports every overflow", () => {
    const storage = new MemoryStorage({
      [LEGACY_TOOL_WORKSPACE_STORAGE_KEY]: legacyZustand(
        [],
        ["legacy-one", "legacy-two"],
      ),
      ...discoveryEntries({
        compare: ["zero", "one", "two", "three", "four", "five"],
        compareMeta: { updated_at: T2 },
      }),
    });

    const result = loadWorkspaceStateFromStorage(storage, { now: T2 });

    expect(result.state.compare).toEqual({
      slugs: ["one", "two", "three", "four", "five"],
      updatedAt: T2,
    });
    expect(result.diagnostics.compareOverflow).toEqual([
      "zero",
      "legacy-one",
      "legacy-two",
    ]);
  });

  it("salvages valid sibling keys when one legacy payload is corrupt", () => {
    const corruptRaw = "{broken-json";
    const storage = new MemoryStorage({
      ...discoveryEntries({
        shortlist: ["alpha"],
        stages: { alpha: "review" },
        toolStateMeta: { alpha: T1 },
        compare: ["alpha", "beta"],
        compareMeta: { updated_at: T2 },
      }),
      [DISCOVERY_STORAGE_KEYS.decisionMemory]: corruptRaw,
    });

    const result = loadWorkspaceStateFromStorage(storage, { now: T2 });

    expect(result.state.saved.slugs).toEqual(["alpha"]);
    expect(result.state.toolStates.alpha.stage).toBe("review");
    expect(result.state.compare.slugs).toEqual(["alpha", "beta"]);
    expect(result.diagnostics.corruptKeys).toContain(
      DISCOVERY_STORAGE_KEYS.decisionMemory,
    );
    expect(storage.getItem(DISCOVERY_STORAGE_KEYS.decisionMemory)).toBe(
      corruptRaw,
    );
    expect(
      readWorkspaceLegacyBackup(storage)?.entries[
        DISCOVERY_STORAGE_KEYS.decisionMemory
      ],
    ).toBe(corruptRaw);
    expect(storage.getItem(WORKSPACE_QUARANTINE_KEY)).toContain(
      DISCOVERY_STORAGE_KEYS.decisionMemory,
    );
  });

  it("treats a strict canonical payload as authoritative without writes", () => {
    const canonical = normalizeWorkspaceState({
      schemaVersion: 1,
      clearedAt: T2,
      saved: { slugs: [], updatedAt: T2 },
      compare: { slugs: [], updatedAt: T2 },
      stack: { slugs: [], updatedAt: T2 },
      toolStates: {},
    });
    const storage = new MemoryStorage({
      [WORKSPACE_STORAGE_KEY]: JSON.stringify(canonical),
      [LEGACY_TOOL_WORKSPACE_STORAGE_KEY]: legacyZustand(["stale-tool"]),
      ...discoveryEntries({
        shortlist: ["also-stale"],
        toolStateMeta: { "also-stale": T0 },
      }),
    });

    const result = loadWorkspaceStateFromStorage(storage, { now: T2 });

    expect(result.state).toEqual(canonical);
    expect(result.source).toBe("canonical");
    expect(storage.writes).toEqual([]);
  });

  it("does not write canonical when the immutable backup cannot be stored", () => {
    const rawA = legacyZustand(["alpha"]);
    const storage = new MemoryStorage({
      [LEGACY_TOOL_WORKSPACE_STORAGE_KEY]: rawA,
    });
    storage.failedWrites.add(WORKSPACE_LEGACY_BACKUP_KEY);

    const result = loadWorkspaceStateFromStorage(storage, { now: T0 });

    expect(result.state.saved.slugs).toEqual(["alpha"]);
    expect(result.persistence).toBe("degraded");
    expect(result.migrated).toBe(false);
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(LEGACY_TOOL_WORKSPACE_STORAGE_KEY)).toBe(rawA);
  });

  it("retains backup and every legacy byte when canonical quota fails", () => {
    const legacyEntries = {
      [LEGACY_TOOL_WORKSPACE_STORAGE_KEY]: legacyZustand(["alpha"]),
      ...discoveryEntries({
        shortlist: ["beta"],
        stages: { beta: "top" },
        toolStateMeta: { beta: T1 },
      }),
    };
    const storage = new MemoryStorage(legacyEntries);
    storage.failedWrites.add(WORKSPACE_STORAGE_KEY);

    const result = loadWorkspaceStateFromStorage(storage, { now: T1 });

    expect(result.persistence).toBe("degraded");
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull();
    expect(readWorkspaceLegacyBackup(storage)).not.toBeNull();

    for (const [key, raw] of Object.entries(legacyEntries)) {
      expect(storage.getItem(key)).toBe(raw);
    }
  });

  it("aborts all writes after any legacy read SecurityError", () => {
    const storage = new MemoryStorage({
      [LEGACY_TOOL_WORKSPACE_STORAGE_KEY]: legacyZustand(["alpha"]),
    });
    storage.failedReads.add(DISCOVERY_STORAGE_KEYS.decisionMemory);

    const result = loadWorkspaceStateFromStorage(storage, { now: T0 });

    expect(result.persistence).toBe("read-only");
    expect(result.state.saved.slugs).toEqual(["alpha"]);
    expect(storage.writes).toEqual([]);
  });

  it("quarantines and recovers a salvageable canonical payload", () => {
    const corruptCanonical = JSON.stringify({
      schemaVersion: 1,
      saved: { slugs: ["alpha", "alpha"], updatedAt: T0 },
      compare: { slugs: [], updatedAt: null },
      stack: { slugs: [], updatedAt: null },
      toolStates: {},
    });
    const storage = new MemoryStorage({
      [WORKSPACE_STORAGE_KEY]: corruptCanonical,
      [LEGACY_TOOL_WORKSPACE_STORAGE_KEY]: legacyZustand(["beta"]),
    });

    const result = loadWorkspaceStateFromStorage(storage, { now: T1 });

    expect(result.source).toBe("recovered");
    expect(result.state.saved.slugs).toEqual(["alpha", "beta"]);
    const quarantine = JSON.parse(
      storage.getItem(WORKSPACE_QUARANTINE_KEY) ?? "null",
    );
    expect(quarantine.entries[0].raw).toBe(corruptCanonical);
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBe(
      JSON.stringify(result.state),
    );
  });

  it("never rebuilds stale legacy after a completed migration loses its key", () => {
    const status = JSON.stringify({
      migrationVersion: 1,
      status: "complete",
      completedAt: T1,
      backupFingerprint: null,
    });
    const storage = new MemoryStorage({
      [WORKSPACE_MIGRATION_STATUS_KEY]: status,
      [LEGACY_TOOL_WORKSPACE_STORAGE_KEY]: legacyZustand(["stale-tool"]),
    });

    const result = loadWorkspaceStateFromStorage(storage, { now: T2 });

    expect(result.source).toBe("legacy-degraded");
    expect(result.state).toEqual(createEmptyWorkspaceState());
    expect(result.issues).toContainEqual({
      code: "status-canonical-missing",
      key: WORKSPACE_STORAGE_KEY,
    });
    expect(storage.writes).toEqual([]);
  });

  it("does not overwrite an unknown future canonical version", () => {
    const futureRaw = JSON.stringify({
      schemaVersion: 2,
      payload: "future",
    });
    const storage = new MemoryStorage({
      [WORKSPACE_STORAGE_KEY]: futureRaw,
      [LEGACY_TOOL_WORKSPACE_STORAGE_KEY]: legacyZustand(["legacy"]),
    });

    const loaded = loadWorkspaceStateFromStorage(storage, { now: T0 });
    const written = persistWorkspaceStateToStorage(
      storage,
      createEmptyWorkspaceState(),
      { now: T1 },
    );

    expect(loaded.source).toBe("future-version");
    expect(written.persisted).toBe(false);
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBe(futureRaw);
    expect(storage.writes).toEqual([]);
  });

  it("preserves canonical metadata when the Zustand collection facade writes", () => {
    const base = normalizeWorkspaceState({
      schemaVersion: 1,
      clearedAt: null,
      saved: { slugs: ["alpha"], updatedAt: T0 },
      compare: { slugs: [], updatedAt: null },
      stack: { slugs: [], updatedAt: null },
      toolStates: {
        alpha: {
          stage: "top",
          note: "Do not lose",
          saveReason: "compare",
          pinned: true,
          decision: { outcome: "selected", updatedAt: T0 },
          updatedAt: T0,
        },
      },
    });
    const updated = updateWorkspaceCollections(
      base,
      {
        savedSlugs: ["alpha", "beta"],
        compareSlugs: ["beta"],
        stackSlugs: ["alpha", "beta"],
      },
      T1,
    );

    expect(updated.toolStates).toEqual(base.toolStates);
    expect(updated.saved).toEqual({
      slugs: ["alpha", "beta"],
      updatedAt: T1,
    });
    expect(updated.compare.updatedAt).toBe(T1);
    expect(updated.stack.updatedAt).toBe(T1);
  });

  it("persists raw canonical state through the Zustand adapter and clear tombstone", () => {
    const initial = reduceWorkspaceState(createEmptyWorkspaceState(), {
      type: "tool/decision",
      slug: "alpha",
      outcome: "selected",
      at: T0,
    });
    const storage = new MemoryStorage({
      [WORKSPACE_STORAGE_KEY]: JSON.stringify(initial),
    });
    vi.stubGlobal("window", {
      localStorage: storage,
    });

    canonicalToolWorkspacePersistStorage.setItem(WORKSPACE_STORAGE_KEY, {
      state: {
        savedSlugs: ["alpha", "beta"],
        compareSlugs: ["beta"],
        stackSlugs: ["alpha"],
      },
      version: 1,
    });

    const afterFacadeWrite = JSON.parse(
      storage.getItem(WORKSPACE_STORAGE_KEY) ?? "null",
    );
    expect(afterFacadeWrite.schemaVersion).toBe(1);
    expect(afterFacadeWrite.state).toBeUndefined();
    expect(afterFacadeWrite.toolStates.alpha.decision).toEqual({
      outcome: "selected",
      updatedAt: T0,
    });

    canonicalToolWorkspacePersistStorage.removeItem(WORKSPACE_STORAGE_KEY);

    const cleared = JSON.parse(
      storage.getItem(WORKSPACE_STORAGE_KEY) ?? "null",
    );
    expect(cleared.clearedAt).toEqual(expect.any(String));
    expect(cleared.saved.slugs).toEqual([]);
    expect(cleared.compare.slugs).toEqual([]);
    expect(cleared.stack.slugs).toEqual([]);
  });

  it("keeps rollback inputs byte-identical across every legacy key", () => {
    const legacyEntries = Object.fromEntries(
      LEGACY_WORKSPACE_BACKUP_STORAGE_KEYS.map((key, index) => [
        key,
        key === LEGACY_TOOL_WORKSPACE_STORAGE_KEY
          ? legacyZustand(["alpha"])
          : JSON.stringify(index % 2 === 0 ? ["alpha"] : {}),
      ]),
    );
    const storage = new MemoryStorage(legacyEntries);

    loadWorkspaceStateFromStorage(storage, { now: T0 });

    for (const [key, raw] of Object.entries(legacyEntries)) {
      expect(storage.getItem(key)).toBe(raw);
      expect(storage.writes.some((write) => write.key === key)).toBe(false);
    }

    expect(readWorkspaceLegacyBackup(storage)?.entries).toEqual(
      legacyEntries,
    );
  });
});
