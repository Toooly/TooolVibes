import { describe, expect, it } from "vitest";

import {
  ADVERTISING_CONSENT_STORAGE_KEY,
  ADVERTISING_CONSENT_VERSION,
  clearAdvertisingConsentRecord,
  createConsentToken,
  isAdvertisingConsentState,
  readAdvertisingConsentRecord,
  writeAdvertisingConsentRecord,
} from "@/lib/ads/advertising-consent";

function makeMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    clear: () => {
      map.clear();
    },
  };
}

describe("readAdvertisingConsentRecord", () => {
  it("returns unknown for missing storage", () => {
    const record = readAdvertisingConsentRecord(undefined);
    expect(record.state).toBe("unknown");
    expect(record.version).toBe(ADVERTISING_CONSENT_VERSION);
  });

  it("returns unknown when nothing is stored", () => {
    const record = readAdvertisingConsentRecord(makeMemoryStorage());
    expect(record.state).toBe("unknown");
  });

  it("returns unknown for malformed JSON", () => {
    const storage = makeMemoryStorage();
    storage.setItem(ADVERTISING_CONSENT_STORAGE_KEY, "not-json");
    expect(readAdvertisingConsentRecord(storage).state).toBe("unknown");
  });

  it("returns unknown for a future/unknown version", () => {
    const storage = makeMemoryStorage();
    storage.setItem(
      ADVERTISING_CONSENT_STORAGE_KEY,
      JSON.stringify({ state: "granted", version: 999, token: "x" }),
    );
    expect(readAdvertisingConsentRecord(storage).state).toBe("unknown");
  });

  it("restores a granted choice after a reload (re-read from storage)", () => {
    const storage = makeMemoryStorage();
    writeAdvertisingConsentRecord(storage, "granted");
    const restored = readAdvertisingConsentRecord(storage);
    expect(restored.state).toBe("granted");
  });
});

describe("writeAdvertisingConsentRecord", () => {
  it("persists accept (granted)", () => {
    const storage = makeMemoryStorage();
    const record = writeAdvertisingConsentRecord(storage, "granted");
    expect(record.state).toBe("granted");
    expect(typeof record.token).toBe("string");
    expect(readAdvertisingConsentRecord(storage).state).toBe("granted");
  });

  it("persists reject (denied) and clears the grant token", () => {
    const storage = makeMemoryStorage();
    writeAdvertisingConsentRecord(storage, "granted");
    const denied = writeAdvertisingConsentRecord(storage, "denied");
    expect(denied.state).toBe("denied");
    expect(denied.token).toBeUndefined();
    expect(readAdvertisingConsentRecord(storage).state).toBe("denied");
  });

  it("withdrawal overwrites a previous grant", () => {
    const storage = makeMemoryStorage();
    const granted = writeAdvertisingConsentRecord(storage, "granted");
    expect(granted.token).toBeTruthy();
    writeAdvertisingConsentRecord(storage, "denied");
    expect(readAdvertisingConsentRecord(storage).state).toBe("denied");
    expect(
      readAdvertisingConsentRecord(storage).token,
    ).toBeUndefined();
  });

  it("generates a stable token across successive reads of the same grant", () => {
    const storage = makeMemoryStorage();
    writeAdvertisingConsentRecord(storage, "granted");
    const a = readAdvertisingConsentRecord(storage);
    const b = readAdvertisingConsentRecord(storage);
    expect(a.token).toBeTruthy();
    expect(b.token).toBe(a.token);
  });

  it("clears the record explicitly", () => {
    const storage = makeMemoryStorage();
    writeAdvertisingConsentRecord(storage, "granted");
    clearAdvertisingConsentRecord(storage);
    expect(storage.getItem(ADVERTISING_CONSENT_STORAGE_KEY)).toBeNull();
    expect(readAdvertisingConsentRecord(storage).state).toBe("unknown");
  });
});

describe("isAdvertisingConsentState / createConsentToken", () => {
  it("validates allowed states only", () => {
    expect(isAdvertisingConsentState("unknown")).toBe(true);
    expect(isAdvertisingConsentState("granted")).toBe(true);
    expect(isAdvertisingConsentState("denied")).toBe(true);
    expect(isAdvertisingConsentState("yes")).toBe(false);
    expect(isAdvertisingConsentState(null)).toBe(false);
    expect(isAdvertisingConsentState(undefined)).toBe(false);
    expect(isAdvertisingConsentState(1)).toBe(false);
  });

  it("produces a non-empty unique token", () => {
    expect(createConsentToken()).toBeTruthy();
    expect(createConsentToken()).not.toBe(createConsentToken());
  });
});
