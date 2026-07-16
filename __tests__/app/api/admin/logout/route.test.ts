import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const session = vi.hoisted(() => ({ revoke: vi.fn() }));
vi.mock("@/lib/admin/session", () => ({
  adminCookieName: "tooolvibes_admin",
  getAdminRouteUrl: (request: Request, path: string) => new URL(path, request.url),
  getExpiredAdminSessionCookieOptions: () => ({ httpOnly: true, path: "/", maxAge: 0 }),
  revokeAdminSession: session.revoke,
}));

import { POST } from "@/app/api/admin/logout/route";

function request() {
  return new NextRequest("https://tooolvibes.eu/api/admin/logout", {
    method: "POST",
    headers: { cookie: "tooolvibes_admin=signed-token" },
  });
}

describe("POST /api/admin/logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    session.revoke.mockResolvedValue(undefined);
  });

  it("persists revocation before expiring the current cookie", async () => {
    const response = await POST(request());
    expect(session.revoke).toHaveBeenCalledWith("signed-token");
    expect(response.status).toBe(303);
    expect(response.headers.get("set-cookie")).toContain("tooolvibes_admin=");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("returns 503 and does not claim logout when revocation storage fails", async () => {
    session.revoke.mockRejectedValue(new Error("offline"));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(response.headers.get("set-cookie")).toBeNull();
    await expect(response.json()).resolves.toMatchObject({ ok: false });
  });
});
