import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import securityStateWorker, {
  SecurityStateDurableObject,
  type SecurityStateDurableState,
  type SecurityStateDurableStorage,
  type SecurityStateStorageTransaction,
} from "@/workers/security-state/index";
import { CloudflareServiceSecurityStateStore } from "@/lib/security/distributed-state";

vi.mock("server-only", () => ({}));

class FakeStorage implements SecurityStateDurableStorage {
  private readonly values = new Map<string, unknown>();
  private tail: Promise<void> = Promise.resolve();
  alarm: number | null = null;

  async get<T>(key: string) { return this.values.get(key) as T | undefined; }
  async put<T>(key: string, value: T) { this.values.set(key, value); }
  async delete(key: string) { return this.values.delete(key); }
  async setAlarm(timestamp: number) { this.alarm = timestamp; }
  async deleteAlarm() { this.alarm = null; }

  async transaction<T>(closure: (transaction: SecurityStateStorageTransaction) => Promise<T>) {
    const previous = this.tail;
    let release!: () => void;
    this.tail = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    try {
      return await closure(this);
    } finally {
      release();
    }
  }
}

class FakeNamespace {
  readonly objects = new Map<string, { object: SecurityStateDurableObject; storage: FakeStorage }>();

  idFromName(name: string) { return name; }
  get(id: unknown) {
    const key = String(id);
    let entry = this.objects.get(key);
    if (!entry) {
      const storage = new FakeStorage();
      entry = { object: new SecurityStateDurableObject({ storage }), storage };
      this.objects.set(key, entry);
    }
    return {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        entry!.object.fetch(new Request(input, init)),
    };
  }
}

function createHarness() {
  const namespace = new FakeNamespace();
  const binding = {
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
      securityStateWorker.fetch(new Request(input, init), { SECURITY_STATE_DO: namespace }),
  };
  return {
    namespace,
    first: new CloudflareServiceSecurityStateStore(binding),
    second: new CloudflareServiceSecurityStateStore(binding),
  };
}

const opaqueKey = `v1:test-burst:${"a".repeat(64)}`;

describe("Cloudflare distributed security-state worker", () => {
  beforeEach(() => vi.useFakeTimers().setSystemTime(new Date("2026-07-16T12:00:00Z")));
  afterEach(() => vi.useRealTimers());

  it("serializes a burst shared by independent adapter instances", async () => {
    const { first, second } = createHarness();
    const calls = Array.from({ length: 20 }, (_, index) =>
      (index % 2 ? first : second).consumeRateLimit({ opaqueKey, limit: 5, windowMs: 60_000 }),
    );
    const decisions = await Promise.all(calls);
    expect(decisions.filter((item) => item.allowed)).toHaveLength(5);
    expect(decisions.filter((item) => !item.allowed)).toHaveLength(15);
    expect(decisions.at(-1)).toMatchObject({ remaining: 0, retryAfterSeconds: 60 });
  });

  it("resets exactly after window expiry", async () => {
    const { first } = createHarness();
    await expect(first.consumeRateLimit({ opaqueKey, limit: 1, windowMs: 2_000 })).resolves.toMatchObject({ allowed: true });
    await expect(first.consumeRateLimit({ opaqueKey, limit: 1, windowMs: 2_000 })).resolves.toMatchObject({ allowed: false });
    vi.advanceTimersByTime(2_001);
    await expect(first.consumeRateLimit({ opaqueKey, limit: 1, windowMs: 2_000 })).resolves.toMatchObject({ allowed: true, remaining: 0 });
  });

  it("clears a rate key across adapter instances", async () => {
    const { first, second } = createHarness();
    await first.consumeRateLimit({ opaqueKey, limit: 1, windowMs: 60_000 });
    await second.clearRateLimit(opaqueKey);
    await expect(first.peekRateLimit({ opaqueKey, limit: 1, windowMs: 60_000 })).resolves.toMatchObject({ allowed: true, remaining: 1 });
  });

  it("shares revocation, expires it, and removes alarm-backed state", async () => {
    const { first, second, namespace } = createHarness();
    await first.revoke(opaqueKey, 2_000);
    await expect(second.isRevoked(opaqueKey)).resolves.toBe(true);
    vi.advanceTimersByTime(2_001);
    await expect(first.isRevoked(opaqueKey)).resolves.toBe(false);

    await first.revoke(opaqueKey, 2_000);
    const entry = namespace.objects.get(opaqueKey)!;
    expect(entry.storage.alarm).not.toBeNull();
    await entry.object.alarm();
    await expect(second.isRevoked(opaqueKey)).resolves.toBe(false);
  });

  it("returns a closed 503 when durable storage fails", async () => {
    const state: SecurityStateDurableState = {
      storage: {
        get: vi.fn().mockRejectedValue(new Error("offline")),
        put: vi.fn().mockRejectedValue(new Error("offline")),
        delete: vi.fn().mockRejectedValue(new Error("offline")),
        transaction: vi.fn().mockRejectedValue(new Error("offline")),
        setAlarm: vi.fn().mockRejectedValue(new Error("offline")),
        deleteAlarm: vi.fn().mockRejectedValue(new Error("offline")),
      },
    };
    const object = new SecurityStateDurableObject(state);
    const response = await object.fetch(new Request("https://internal/v1/consume", {
      method: "POST",
      body: JSON.stringify({ limit: 1, windowMs: 1_000 }),
    }));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: "Security state unavailable" });
  });
});
