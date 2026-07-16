import { beforeEach, describe, expect, it, vi } from "vitest";

const attempts = vi.hoisted(() => ({
  clear: vi.fn(),
  peek: vi.fn(),
  record: vi.fn(),
}));
const session = vi.hoisted(() => ({
  verify: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/lib/admin/login-attempts", () => ({
  clearLoginAttempts: attempts.clear,
  getLoginRateLimitStatus: attempts.peek,
  recordFailedLoginAttempt: attempts.record,
}));
vi.mock("@/lib/admin/session", () => ({
  adminCookieName: "tooolvibes_admin",
  createAdminSession: session.create,
  getAdminRouteUrl: (request: Request, path: string) => new URL(path, request.url),
  getAdminSessionCookieOptions: () => ({ httpOnly: true, path: "/", maxAge: 100 }),
  verifyAdminCredentialsDetailed: session.verify,
}));
vi.mock("@/lib/security/distributed-state", () => ({
  rateLimitResponseHeaders: (item: { limit: number; remaining: number; retryAfterSeconds: number }) =>
    new Headers({
      "RateLimit-Limit": String(item.limit),
      "RateLimit-Remaining": String(item.remaining),
      "Retry-After": String(item.retryAfterSeconds),
    }),
}));

import { POST } from "@/app/api/admin/login/route";

const allowed = { allowed: true, limit: 5, remaining: 4, resetAt: 60_000, retryAfterSeconds: 0 };
const denied = { allowed: false, limit: 5, remaining: 0, resetAt: 60_000, retryAfterSeconds: 45 };

function loginRequest(accept: string) {
  return new Request("https://tooolvibes.eu/api/admin/login", {
    method: "POST",
    headers: { accept, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ email: "admin@example.com", password: "wrong" }),
  });
}

describe("POST /api/admin/login rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    attempts.peek.mockResolvedValue(allowed);
    attempts.record.mockResolvedValue(allowed);
    attempts.clear.mockResolvedValue(undefined);
    session.verify.mockResolvedValue({ ok: false, reason: "password_mismatch" });
    session.create.mockResolvedValue("token");
  });

  it("keeps native HTML form UX with 303 and Retry-After", async () => {
    attempts.peek.mockResolvedValue(denied);
    const response = await POST(loginRequest("text/html,application/xhtml+xml"));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://tooolvibes.eu/admin/login?error=rate-limited");
    expect(response.headers.get("retry-after")).toBe("45");
  });

  it("returns JSON 429 with Retry-After to non-HTML clients", async () => {
    attempts.peek.mockResolvedValue(denied);
    const response = await POST(loginRequest("application/json"));
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("45");
    await expect(response.json()).resolves.toMatchObject({ error: "rate_limited" });
  });

  it("fails closed before credential verification when the store fails", async () => {
    attempts.peek.mockRejectedValue(new Error("offline"));
    const response = await POST(loginRequest("application/json"));
    expect(response.status).toBe(503);
    expect(session.verify).not.toHaveBeenCalled();
  });

  it("records failures and preserves the existing credential redirect", async () => {
    const request = loginRequest("text/html");
    const response = await POST(request);
    expect(attempts.record).toHaveBeenCalledWith(request);
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("error=credentials");
  });

  it("does not issue a session if clearing distributed failures fails", async () => {
    session.verify.mockResolvedValue({ ok: true });
    attempts.clear.mockRejectedValue(new Error("offline"));
    const response = await POST(loginRequest("application/json"));
    expect(response.status).toBe(503);
    expect(session.create).not.toHaveBeenCalled();
  });
});
