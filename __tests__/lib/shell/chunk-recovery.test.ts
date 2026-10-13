import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { recoverChunkLoadError } from "@/lib/shell/chunk-recovery";

const reload = vi.fn();
let storage: Map<string, string>;
beforeEach(() => {
  storage = new Map();
  reload.mockClear();
  vi.stubEnv("TOOOLVIBES_RELEASE_SHA", "release-one");
  vi.stubGlobal("window", { location: { reload } });
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  });
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("loaded-page asset recovery", () => {
  it("reloads a caught React asset error exactly once", () => {
    expect(recoverChunkLoadError(new Error("Loading chunk 1234 failed"))).toBe(true);
    expect(recoverChunkLoadError(new Error("Loading chunk 5678 failed"))).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });
  it("allows recovery for a genuinely different release", () => {
    recoverChunkLoadError("ChunkLoadError");
    vi.stubEnv("TOOOLVIBES_RELEASE_SHA", "release-two");
    expect(recoverChunkLoadError("ChunkLoadError")).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });
  it("never reloads ordinary application bugs or resource events with no message", () => {
    expect(recoverChunkLoadError(new TypeError("Cannot read properties of undefined"))).toBe(false);
    expect(recoverChunkLoadError({ target: { tagName: "SCRIPT" } })).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
  it.each(["Loading CSS chunk 123 failed", "Failed to fetch dynamically imported module", "Importing a module script failed"])("recognizes asset failures: %s", message => {
    expect(recoverChunkLoadError(new Error(message))).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });
  it.each(["getItem", "setItem"] as const)("refuses recovery when %s cannot persist its loop guard", method => {
    vi.spyOn(sessionStorage, method).mockImplementation(() => { throw new Error("Storage blocked"); });
    expect(recoverChunkLoadError("ChunkLoadError")).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
