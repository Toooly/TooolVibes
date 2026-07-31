import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const state = vi.hoisted(() => ({
  consume: vi.fn(),
}));
const admin = vi.hoisted(() => ({
  create: vi.fn(),
}));
const email = vi.hoisted(() => ({
  send: vi.fn(),
}));
const env = vi.hoisted(() => ({
  getAdmin: vi.fn(),
}));
const fetchMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/security/distributed-state", () => ({
  consumeRateLimit: state.consume,
  getRequestAddress: () => "203.0.113.10",
  rateLimitResponseHeaders: (item: { retryAfterSeconds: number }) =>
    new Headers({ "Retry-After": String(item.retryAfterSeconds), "Cache-Control": "no-store" }),
}));

vi.mock("@/lib/supabase/admin-client", () => ({
  createAdminSupabaseClient: admin.create,
}));

vi.mock("@/lib/supabase/env", () => ({
  getSupabaseAdminEnv: env.getAdmin,
}));

vi.mock("@/lib/email/resend", () => ({
  sendEmail: email.send,
}));

import { POST as magicLinkPost } from "@/app/api/auth/magic-link/route";

const allowed = { allowed: true, limit: 5, remaining: 4, resetAt: 60_000, retryAfterSeconds: 0 };
const denied = { allowed: false, limit: 5, remaining: 0, resetAt: 60_000, retryAfterSeconds: 42 };

function request(body: unknown) {
  return new Request("https://tooolvibes.eu/api/auth/magic-link", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("magic-link route diagnostics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", fetchMock);
    process.env.NEXT_PUBLIC_SITE_URL = "https://tooolvibes.eu";
    process.env.NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN = "https://tooolvibes.eu";
    process.env.ALLOWED_AUTH_ORIGINS = "https://tooolvibes.eu";
    delete process.env.TOOOLVIBES_AUTH_DEBUG;
    state.consume.mockResolvedValue(allowed);
    env.getAdmin.mockReturnValue({
      url: "https://pjyasxaebxvvmcjxvnno.supabase.co",
      serviceRoleKey: "eyJhbGciOiJIUzI1NiJ9.e30.sig",
      serviceRoleProjectRef: "pjyasxaebxvvmcjxvnno",
    });
    admin.create.mockReturnValue({});
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ hashed_token: "hash-token-value" }), { status: 200 }),
    );
    email.send.mockResolvedValue({ sent: true });
  });

  it("returns 503 when admin environment cannot be constructed", async () => {
    admin.create.mockImplementation(() => {
      throw new Error("missing");
    });
    const response = await magicLinkPost(request({ email: "user@example.com" }));
    const json = await response.json();
    expect(response.status).toBe(503);
    expect(json.correlationId).toEqual(expect.any(String));
    expect(JSON.stringify(json)).not.toMatch(/eyJ|sb_secret|hash-token/);
  });

  it("returns 503 when service key project ref mismatches URL ref", async () => {
    env.getAdmin.mockReturnValue({
      url: "https://pjyasxaebxvvmcjxvnno.supabase.co",
      serviceRoleKey: "eyJhbGciOiJIUzI1NiJ9.e30.sig",
      serviceRoleProjectRef: "otherprojectref0001",
    });
    const response = await magicLinkPost(request({ email: "user@example.com" }));
    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 500 with correlation id when generateLink fails", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ msg: "boom eyJhbGciOiJIUzI1NiJ9.e30.sig", error_code: "unexpected_failure" }), {
        status: 500,
      }),
    );
    const response = await magicLinkPost(request({ email: "user@example.com" }));
    const json = await response.json();
    expect(response.status).toBe(500);
    expect(json.message).toMatch(/generare il link/i);
    expect(json.correlationId).toEqual(expect.any(String));
    expect(JSON.stringify(json)).not.toMatch(/eyJhbGciOiJIUzI1NiJ9|boom/);
  });

  it("returns 500 when hashed_token is absent without supabase error", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    const response = await magicLinkPost(request({ email: "user@example.com" }));
    expect(response.status).toBe(500);
  });

  it("returns 400 when redirect origin is misconfigured", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN;
    delete process.env.ALLOWED_AUTH_ORIGINS;
    const response = await magicLinkPost(request({ email: "user@example.com" }));
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 429 with retry headers when rate limited", async () => {
    state.consume.mockResolvedValue(denied);
    const response = await magicLinkPost(request({ email: "user@example.com" }));
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("42");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends custom email on successful generateLink", async () => {
    const response = await magicLinkPost(request({ email: "User@Example.com" }));
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://pjyasxaebxvvmcjxvnno.supabase.co/auth/v1/admin/generate_link",
      expect.objectContaining({ method: "POST" }),
    );
    const init = fetchMock.mock.calls[0][1] as { body: string };
    expect(JSON.parse(init.body)).toMatchObject({
      type: "magiclink",
      email: "user@example.com",
      options: { redirect_to: "https://tooolvibes.eu/auth/callback" },
    });
    expect(email.send).toHaveBeenCalled();
    const sent = vi.mocked(email.send).mock.calls[0][0] as { html: string };
    expect(sent.html).toContain("/auth/callback?token_hash=hash-token-value&type=email");
    expect(JSON.stringify(json)).not.toContain("hash-token-value");
  });

  it("does not leak secrets when generateLink returns invalid JSON", async () => {
    fetchMock.mockResolvedValue(new Response("error code: 1003\nsb_secret_abc123", { status: 500 }));
    const response = await magicLinkPost(request({ email: "user@example.com" }));
    const json = await response.json();
    expect(response.status).toBe(500);
    expect(JSON.stringify(json)).not.toContain("sb_secret_abc123");
  });
});
