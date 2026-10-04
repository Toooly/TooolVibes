import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * P0 RUNTIME REGRESSION: getDiscoveryLocalSnapshot() fallback must be
 * referentially stable for useSyncExternalStore.getSnapshot().
 *
 * If getCanonicalToolWorkspaceState() throws, the fallback snapshot must:
 * 1. NOT throw
 * 2. Return the SAME reference (Object.is) on repeated calls
 * 3. NOT mutate persisted state
 * 4. Allow recovery on next valid read
 */

const storage = new Map<string, string>();
let shouldThrow = false;

vi.stubGlobal("localStorage", {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => void storage.set(key, value),
  removeItem: (key: string) => void storage.delete(key),
  clear: () => storage.clear(),
});

vi.mock("@/lib/stores/tool-workspace-store", () => ({
  getCanonicalToolWorkspaceState: () => {
    if (shouldThrow) throw new Error("corrupted state");
    return {
      saved: { slugs: ["tool-a"] },
      compare: { slugs: [] },
      stacks: [],
      workingStackSlugs: [],
      toolStates: { "tool-a": { shortlist_stage: "saved" } },
    };
  },
  commitCanonicalToolWorkspaceState: vi.fn(),
  refreshCanonicalToolWorkspaceStateFromStorage: vi.fn(),
}));

const { getDiscoveryLocalSnapshot } = await import("@/lib/discovery/local-storage");

describe("getDiscoveryLocalSnapshot fallback (P0 runtime safety)", () => {
  beforeEach(() => {
    storage.clear();
    shouldThrow = false;
  });

  it("FS-01: does not throw when getCanonicalToolWorkspaceState throws", () => {
    shouldThrow = true;
    expect(() => getDiscoveryLocalSnapshot()).not.toThrow();
  });

  it("FS-02: repeated failing calls return the SAME reference (Object.is)", () => {
    shouldThrow = true;
    const snap1 = getDiscoveryLocalSnapshot();
    const snap2 = getDiscoveryLocalSnapshot();
    const snap3 = getDiscoveryLocalSnapshot();
    expect(Object.is(snap1, snap2)).toBe(true);
    expect(Object.is(snap2, snap3)).toBe(true);
  });

  it("FS-03: fallback nested arrays/objects are frozen (immutable)", () => {
    shouldThrow = true;
    const snap = getDiscoveryLocalSnapshot();
    expect(Object.isFrozen(snap.visitedTools)).toBe(true);
    expect(Object.isFrozen(snap.shortlist)).toBe(true);
    expect(Object.isFrozen(snap.compare)).toBe(true);
    expect(Object.isFrozen(snap.shortlistStages)).toBe(true);
  });

  it("FS-04: fallback does not mutate persisted state", () => {
    storage.set("test-key", "test-value");
    shouldThrow = true;
    getDiscoveryLocalSnapshot();
    expect(storage.get("test-key")).toBe("test-value");
  });

  it("FS-05: recovery on next valid read returns canonical state", () => {
    shouldThrow = true;
    const fallback = getDiscoveryLocalSnapshot();
    expect(fallback.shortlist).toEqual([]);

    shouldThrow = false;
    const valid = getDiscoveryLocalSnapshot();
    expect(valid.shortlistStages).toHaveProperty("tool-a");
  });

  it("FS-06: valid state returns different reference than fallback", () => {
    shouldThrow = true;
    const fallback = getDiscoveryLocalSnapshot();
    shouldThrow = false;
    const valid = getDiscoveryLocalSnapshot();
    expect(Object.is(fallback, valid)).toBe(false);
  });
});
