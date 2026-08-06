// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
vi.mock("@/lib/supabase/browser-client", () => ({
  getBrowserSupabaseClient: () => ({ auth: { getSession } }),
}));

import {
  ACK_STORAGE_KEY,
  MAX_ACK_IDS,
  acknowledgeSignalRewardGrant,
  isGrantAcknowledged,
  readAcknowledgedGrantIds,
  rememberAcknowledgedGrantId,
} from "@/lib/rewards/acknowledgement";

class FakeStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe("reward acknowledgement", () => {
  beforeEach(() => {
    sessionStorage.clear();
    getSession.mockReset();
  });

  it("returns an empty set for a missing key", () => {
    expect(readAcknowledgedGrantIds()).toEqual(new Set());
  });

  it("returns an empty set for invalid JSON", () => {
    sessionStorage.setItem(ACK_STORAGE_KEY, "not-json");
    expect(readAcknowledgedGrantIds()).toEqual(new Set());
  });

  it("returns an empty set for non-array JSON", () => {
    sessionStorage.setItem(ACK_STORAGE_KEY, JSON.stringify({ ids: [] }));
    expect(readAcknowledgedGrantIds()).toEqual(new Set());
  });

  it("dedupes ids and drops the oldest ids over the limit", () => {
    const storage = new FakeStorage();
    rememberAcknowledgedGrantId("first", storage);
    rememberAcknowledgedGrantId("second", storage);
    rememberAcknowledgedGrantId("first", storage);
    expect([...readAcknowledgedGrantIds(storage)]).toEqual(["second", "first"]);
    for (let i = 0; i < MAX_ACK_IDS + 1; i += 1) {
      rememberAcknowledgedGrantId(`grant-${i}`, storage);
    }
    const ids = [...readAcknowledgedGrantIds(storage)];
    expect(ids).toHaveLength(MAX_ACK_IDS);
    expect(ids).not.toContain("second");
    expect(ids).toContain(`grant-${MAX_ACK_IDS}`);
  });

  it("posts the acknowledgement and settles locally when fetch rejects", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "token" } } });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("offline"));
    await expect(acknowledgeSignalRewardGrant("g1", "dismissed")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/signal-progression/acknowledge", expect.objectContaining({
      method: "POST",
      headers: { Authorization: "Bearer token", "Content-Type": "application/json" },
      body: JSON.stringify({ grantId: "g1", status: "dismissed" }),
      credentials: "same-origin",
    }));
    expect(isGrantAcknowledged("g1")).toBe(true);
    fetchMock.mockRestore();
  });
});
