import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  CloudflareServiceSecurityStateStore,
  DistributedSecurityStateClient,
  SecurityStateUnavailableError,
  rateLimitResponseHeaders,
  type DistributedSecurityStateStore,
  type RateLimitDecision,
} from "@/lib/security/distributed-state";

const allowed: RateLimitDecision = {
  allowed: true,
  limit: 5,
  remaining: 4,
  resetAt: 61_000,
  retryAfterSeconds: 0,
};

class CapturingStore implements DistributedSecurityStateStore {
  keys: string[] = [];
  revoked = false;

  async consumeRateLimit(input: { opaqueKey: string }) {
    this.keys.push(input.opaqueKey);
    return allowed;
  }
  async peekRateLimit(input: { opaqueKey: string }) {
    this.keys.push(input.opaqueKey);
    return allowed;
  }
  async clearRateLimit(opaqueKey: string) {
    this.keys.push(opaqueKey);
  }
  async revoke(opaqueKey: string) {
    this.keys.push(opaqueKey);
    this.revoked = true;
  }
  async isRevoked(opaqueKey: string) {
    this.keys.push(opaqueKey);
    return this.revoked;
  }
}

describe("distributed security-state client", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("derives stable, namespace-separated HMAC keys without persisting PII", async () => {
    const store = new CapturingStore();
    const client = new DistributedSecurityStateClient(store, "s".repeat(32));

    await client.consumeRateLimit({
      namespace: "auth-magic-email",
      identifiers: ["person@example.com"],
      limit: 1,
      windowMs: 60_000,
    });
    await client.peekRateLimit({
      namespace: "auth-magic-email",
      identifiers: ["person@example.com"],
      limit: 1,
      windowMs: 60_000,
    });
    await client.consumeRateLimit({
      namespace: "auth-magic-ip",
      identifiers: ["person@example.com"],
      limit: 1,
      windowMs: 60_000,
    });

    expect(store.keys[0]).toBe(store.keys[1]);
    expect(store.keys[2]).not.toBe(store.keys[0]);
    expect(store.keys.every((key) => /^v1:[a-z0-9-]+:[a-f0-9]{64}$/.test(key))).toBe(true);
    expect(store.keys.join(" ")).not.toContain("person@example.com");
  });

  it("keeps revoke and lookup on the same opaque token key", async () => {
    const store = new CapturingStore();
    const client = new DistributedSecurityStateClient(store, "r".repeat(32));
    await client.revokeValue({ namespace: "admin-session-revoked", value: "secret-token", ttlMs: 5_000 });
    await expect(client.isValueRevoked({ namespace: "admin-session-revoked", value: "secret-token" })).resolves.toBe(true);
    expect(store.keys[0]).toBe(store.keys[1]);
    expect(store.keys[0]).not.toContain("secret-token");
  });

  it("rejects weak secrets and invalid policies before touching the store", async () => {
    const store = new CapturingStore();
    const weak = new DistributedSecurityStateClient(store, "short");
    await expect(weak.consumeRateLimit({ namespace: "test", identifiers: ["id"], limit: 1, windowMs: 1_000 })).rejects.toBeInstanceOf(SecurityStateUnavailableError);
    expect(store.keys).toHaveLength(0);
  });

  it("fails closed on rejected, non-ok and malformed service responses", async () => {
    const rejected = new CloudflareServiceSecurityStateStore({
      fetch: vi.fn().mockRejectedValue(new Error("offline")),
    });
    await expect(rejected.isRevoked("v1:test:" + "a".repeat(64))).rejects.toBeInstanceOf(SecurityStateUnavailableError);

    const unavailable = new CloudflareServiceSecurityStateStore({
      fetch: vi.fn().mockResolvedValue(new Response(null, { status: 503 })),
    });
    await expect(unavailable.isRevoked("v1:test:" + "a".repeat(64))).rejects.toBeInstanceOf(SecurityStateUnavailableError);

    const malformed = new CloudflareServiceSecurityStateStore({
      fetch: vi.fn().mockResolvedValue(Response.json({ allowed: "yes" })),
    });
    await expect(malformed.consumeRateLimit({ opaqueKey: "v1:test:" + "a".repeat(64), limit: 1, windowMs: 1_000 })).rejects.toBeInstanceOf(SecurityStateUnavailableError);
  });

  it("emits Retry-After only for denied decisions", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000);
    const denied = rateLimitResponseHeaders({ ...allowed, allowed: false, remaining: 0, retryAfterSeconds: 60 });
    expect(denied.get("Retry-After")).toBe("60");
    expect(denied.get("RateLimit-Reset")).toBe("60");
    expect(rateLimitResponseHeaders(allowed).has("Retry-After")).toBe(false);
  });
});
