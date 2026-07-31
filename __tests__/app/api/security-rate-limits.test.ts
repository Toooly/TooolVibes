import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { NextRequest } from "next/server";

const state = vi.hoisted(() => ({
  clear: vi.fn(),
  consume: vi.fn(),
  peek: vi.fn(),
}));
const gate = vi.hoisted(() => ({ create: vi.fn(), verify: vi.fn() }));
const supabase = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("@/lib/security/distributed-state", () => ({
  clearRateLimit: state.clear,
  consumeRateLimit: state.consume,
  peekRateLimit: state.peek,
  getRequestAddress: () => "203.0.113.10",
  rateLimitResponseHeaders: (item: { retryAfterSeconds: number }) =>
    new Headers({ "Retry-After": String(item.retryAfterSeconds), "Cache-Control": "no-store" }),
}));
vi.mock("@/lib/gate/session", () => ({
  createGateToken: gate.create,
  verifyGateToken: gate.verify,
}));
vi.mock("@/lib/supabase/admin-client", () => ({
  createAdminSupabaseClient: supabase.create,
}));
vi.mock("@/lib/supabase/env", () => ({
  getSupabaseAdminEnv: () => ({
    url: "https://pjyasxaebxvvmcjxvnno.supabase.co",
    serviceRoleKey: "test-service-role",
    serviceRoleProjectRef: "pjyasxaebxvvmcjxvnno",
  }),
}));
vi.mock("@/lib/email/resend", () => ({ sendEmail: vi.fn() }));

import { POST as gatePost } from "@/app/api/gate/route";
import { POST as magicLinkPost } from "@/app/api/auth/magic-link/route";

const allowed = { allowed: true, limit: 5, remaining: 4, resetAt: 60_000, retryAfterSeconds: 0 };
const denied = { allowed: false, limit: 5, remaining: 0, resetAt: 60_000, retryAfterSeconds: 60 };

describe("public auth security rate limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TOOOLVIBES_GATE_PASSWORD = "correct";
    state.peek.mockResolvedValue(allowed);
    state.consume.mockResolvedValue(allowed);
    state.clear.mockResolvedValue(undefined);
    gate.create.mockResolvedValue("gate-token");
  });

  it("returns gate 429 with Retry-After without checking a blocked password", async () => {
    state.peek.mockResolvedValue(denied);
    const response = await gatePost(new NextRequest("https://tooolvibes.eu/api/gate", {
      method: "POST",
      body: JSON.stringify({ password: "wrong" }),
    }));
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(state.consume).not.toHaveBeenCalled();
  });

  it("turns the first over-limit invalid gate attempt into 429", async () => {
    state.consume.mockResolvedValue(denied);
    const response = await gatePost(new NextRequest("https://tooolvibes.eu/api/gate", {
      method: "POST",
      body: JSON.stringify({ password: "wrong" }),
    }));
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
  });

  it("fails gate closed when clearing failures becomes unavailable", async () => {
    state.clear.mockRejectedValue(new Error("offline"));
    const response = await gatePost(new NextRequest("https://tooolvibes.eu/api/gate", {
      method: "POST",
      body: JSON.stringify({ password: "correct" }),
    }));
    expect(response.status).toBe(503);
    expect(gate.create).not.toHaveBeenCalled();
  });

  it("applies independent email and IP limits to magic links", async () => {
    state.consume.mockResolvedValueOnce(allowed).mockResolvedValueOnce(denied);
    const response = await magicLinkPost(new Request("https://tooolvibes.eu/api/auth/magic-link", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "PERSON@example.com" }),
    }));
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(state.consume.mock.calls[0][0]).toMatchObject({ namespace: "auth-magic-email-v2", identifiers: ["person@example.com"] });
    expect(state.consume.mock.calls[1][0]).toMatchObject({ namespace: "auth-magic-ip-v2", identifiers: ["203.0.113.10"] });
    expect(supabase.create).not.toHaveBeenCalled();
  });

  it("fails magic link closed when distributed state is unavailable", async () => {
    state.consume.mockRejectedValue(new Error("offline"));
    const response = await magicLinkPost(new Request("https://tooolvibes.eu/api/auth/magic-link", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "person@example.com" }),
    }));
    expect(response.status).toBe(503);
    expect(supabase.create).not.toHaveBeenCalled();
  });
});
