import { describe, expect, it, vi, beforeAll, beforeEach } from "vitest";

let reloadMock: ReturnType<typeof vi.fn>;
let addEventListenerMock: ReturnType<typeof vi.fn>;
let storage: Map<string, string>;
let errorCallback: (event: { message?: string; target?: unknown }) => void;
let rejectionCallback: (event: { reason?: { message?: string }; preventDefault?: () => void }) => void;

beforeAll(async () => {
  storage = new Map();
  reloadMock = vi.fn();
  addEventListenerMock = vi.fn();

  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => void storage.set(key, value),
    removeItem: (key: string) => void storage.delete(key),
    clear: () => storage.clear(),
  });

  vi.stubGlobal("window", {
    location: { reload: reloadMock },
    addEventListener: addEventListenerMock,
    removeEventListener: vi.fn(),
  });

  const mod = await import("@/lib/shell/chunk-recovery");
  mod.initChunkRecovery();

  // Capture the registered callbacks once
  const errCall = addEventListenerMock.mock.calls.find((c: unknown[]) => c[0] === "error");
  errorCallback = errCall?.[1] as typeof errorCallback;
  const rejCall = addEventListenerMock.mock.calls.find((c: unknown[]) => c[0] === "unhandledrejection");
  rejectionCallback = rejCall?.[1] as typeof rejectionCallback;
});

beforeEach(() => {
  storage.clear();
  reloadMock.mockClear();
});

describe("chunk-recovery", () => {
  it("CR-01: first recognized chunk failure → exactly one reload", () => {
    errorCallback({ message: "Loading chunk 1234 failed", target: { tagName: "SCRIPT" } });
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("CR-02: same failure again → NO loop", () => {
    errorCallback({ message: "Loading chunk 1234 failed", target: { tagName: "SCRIPT" } });
    errorCallback({ message: "Loading chunk 1234 failed", target: { tagName: "SCRIPT" } });
    errorCallback({ message: "Loading chunk 1234 failed", target: { tagName: "SCRIPT" } });
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("CR-03: different failure signature → recovery fires once more", () => {
    errorCallback({ message: "Loading chunk 1234 failed", target: { tagName: "SCRIPT" } });
    errorCallback({ message: "Loading chunk 5678 failed", target: { tagName: "SCRIPT" } });
    expect(reloadMock).toHaveBeenCalledTimes(2);
  });

  it("CR-04: unrelated TypeError → NO reload", () => {
    errorCallback({ message: "Cannot read properties of undefined", target: { tagName: "SCRIPT" } });
    errorCallback({ message: "x is not defined", target: { tagName: "DIV" } });
    expect(reloadMock).toHaveBeenCalledTimes(0);
  });

  it("CR-05: unhandledrejection with chunk error → one reload", () => {
    rejectionCallback({ reason: { message: "Failed to fetch dynamically imported module: https://x/y.js" }, preventDefault: () => {} });
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("CR-06: unhandledrejection with generic error → NO reload", () => {
    rejectionCallback({ reason: { message: "NetworkError when attempting to fetch resource." } });
    expect(reloadMock).toHaveBeenCalledTimes(0);
  });

  it("CR-07: listeners registered exactly once", () => {
    const errorCalls = addEventListenerMock.mock.calls.filter((c: unknown[]) => c[0] === "error");
    expect(errorCalls.length).toBe(1);
  });

  it("CR-08: recovery guard key includes release context", () => {
    errorCallback({ message: "Loading chunk 9999 failed", target: { tagName: "SCRIPT" } });
    const keys = Array.from(storage.keys());
    expect(keys.some((k) => k.startsWith("__tvChunkRecovery:"))).toBe(true);
  });
});
