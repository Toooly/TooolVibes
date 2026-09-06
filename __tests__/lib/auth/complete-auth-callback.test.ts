import { describe, expect, it, vi } from "vitest";

import { completeAuthCallback } from "@/lib/auth/complete-auth-callback";

function createClient(overrides?: {
  exchangeError?: { message: string } | null;
  session?: { user: { id: string } } | null;
}) {
  return {
    auth: {
      exchangeCodeForSession: vi.fn().mockResolvedValue({
        error: overrides?.exchangeError ?? null,
      }),
      verifyOtp: vi.fn().mockResolvedValue({ error: null }),
      setSession: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: overrides?.session ?? null },
      }),
    },
  };
}

describe("completeAuthCallback", () => {
  it("maps access_denied without interpolating the raw error", async () => {
    const client = createClient();
    const result = await completeAuthCallback(client as never, {
      search: "?error=access_denied",
      hash: "",
    });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/interrotto/i);
    expect(result.message).not.toMatch(/access_denied/i);
  });

  it("exchanges an oauth code", async () => {
    const client = createClient();
    const result = await completeAuthCallback(client as never, {
      search: "?code=oauth-code",
      hash: "",
    });
    expect(result.ok).toBe(true);
    expect(client.auth.exchangeCodeForSession).toHaveBeenCalledWith("oauth-code");
  });

  it("falls back to an existing session if the code was already consumed", async () => {
    const client = createClient({
      exchangeError: { message: "invalid request: both auth code and code verifier should be non-empty" },
      session: { user: { id: "user-1" } },
    });
    const result = await completeAuthCallback(client as never, {
      search: "?code=used-code",
      hash: "",
    });
    expect(result.ok).toBe(true);
  });

  it("verifies a magic-link token hash", async () => {
    const client = createClient();
    const result = await completeAuthCallback(client as never, {
      search: "?token_hash=abc&type=email",
      hash: "",
    });
    expect(result.ok).toBe(true);
    expect(client.auth.verifyOtp).toHaveBeenCalledWith({
      token_hash: "abc",
      type: "email",
    });
  });
});
