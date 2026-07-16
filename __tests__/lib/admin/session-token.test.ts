import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const securityState = vi.hoisted(() => ({
  isRevoked: vi.fn(),
  revoke: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/security/distributed-state", () => ({
  isValueRevoked: securityState.isRevoked,
  revokeValue: securityState.revoke,
}));

import {
  adminSessionMaxAgeSeconds,
  revokeSessionToken,
  signSessionPayload,
  verifySessionToken,
} from "@/lib/admin/session-token";

describe("distributed admin session revocation", () => {
  beforeEach(() => {
    vi.useFakeTimers().setSystemTime(new Date("2026-07-16T12:00:00Z"));
    process.env.TOOOLVIBES_SESSION_SECRET = "session-secret-at-least-thirty-two-characters";
    securityState.isRevoked.mockResolvedValue(false);
    securityState.revoke.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    delete process.env.TOOOLVIBES_SESSION_SECRET;
  });

  async function validToken() {
    return signSessionPayload(`${Date.now().toString(36)}:nonce`);
  }

  it("accepts a valid token and denies the same token when another instance revoked it", async () => {
    const token = await validToken();
    await expect(verifySessionToken(token)).resolves.toBe(true);
    securityState.isRevoked.mockResolvedValue(true);
    await expect(verifySessionToken(token)).resolves.toBe(false);
    expect(securityState.isRevoked).toHaveBeenLastCalledWith({
      namespace: "admin-session-revoked",
      value: token,
    });
  });

  it("fails closed when the distributed store is unavailable", async () => {
    const token = await validToken();
    securityState.isRevoked.mockRejectedValue(new Error("offline"));
    await expect(verifySessionToken(token)).resolves.toBe(false);
  });

  it("stores a valid logout revocation only for the remaining session lifetime", async () => {
    const token = await validToken();
    await revokeSessionToken(token);
    expect(securityState.revoke).toHaveBeenCalledWith({
      namespace: "admin-session-revoked",
      value: token,
      ttlMs: adminSessionMaxAgeSeconds * 1000,
    });
  });

  it("does not allocate durable state for invalid or expired tokens", async () => {
    await revokeSessionToken("invalid");
    const expired = await signSessionPayload(`${(Date.now() - (adminSessionMaxAgeSeconds + 1) * 1000).toString(36)}:nonce`);
    await revokeSessionToken(expired);
    expect(securityState.revoke).not.toHaveBeenCalled();
  });
});
