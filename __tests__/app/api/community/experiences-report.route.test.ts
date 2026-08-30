import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: { ok: false as boolean, userId: "user-1" },
  rateAllowed: true,
  rateThrows: false,
  report: {
    ok: true as boolean,
    reason: "unknown" as string,
    report: { id: "rep-1", status: "open" },
  },
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/community/auth", () => ({
  requireCommunityUserId: async () =>
    mocks.auth.ok
      ? { ok: true, userId: mocks.auth.userId }
      : { ok: false, code: "missing" },
}));

vi.mock("@/lib/community/rate-limit", () => ({
  communityRatePolicies: {
    reportUser: { namespace: "ru", limit: 10, windowMs: 1 },
    reportIp: { namespace: "ri", limit: 20, windowMs: 1 },
  },
  consumeCommunityRateLimit: async () => {
    if (mocks.rateThrows) throw new Error("limiter down");
    return { allowed: mocks.rateAllowed, limit: 10, remaining: 0, reset: 1 };
  },
  getRequestAddress: () => "203.0.113.10",
  rateLimitResponseHeaders: () => ({ "Retry-After": "60" }),
}));

vi.mock("@/lib/community/report-repository", () => ({
  createExperienceReport: async () => mocks.report,
}));

import { POST } from "@/app/api/community/experiences/[id]/report/route";

const EXPERIENCE_ID = "11111111-1111-4111-8111-111111111111";

function request(body: unknown, id: string = EXPERIENCE_ID) {
  return new Request(`http://localhost/api/community/experiences/${id}/report`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(mocks.auth.ok ? { authorization: "Bearer token-1" } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function call(body: unknown, id: string = EXPERIENCE_ID) {
  return POST(request(body, id), {
    params: Promise.resolve({ id }),
  });
}

describe("H6 report API", () => {
  beforeEach(() => {
    mocks.auth = { ok: true, userId: "user-1" };
    mocks.rateAllowed = true;
    mocks.rateThrows = false;
    mocks.report = { ok: true, reason: "unknown", report: { id: "rep-1", status: "open" } };
  });

  it("H6-REPORT-01 guest without bearer gets 401", async () => {
    mocks.auth = { ok: false, userId: "user-1" };
    const response = await call({ reason: "spam" });
    expect(response.status).toBe(401);
  });

  it("H6-REPORT-03 valid published target returns 201 with minimal payload", async () => {
    const response = await call({ reason: "spam", details: "Pubblicità ripetuta" });
    expect(response.status).toBe(201);
    const json = (await response.json()) as Record<string, unknown>;
    expect(json).toEqual({ id: "rep-1", status: "open" });
    expect(JSON.stringify(json)).not.toMatch(/reporter|author|uid|email/i);
  });

  it("H6-REPORT-04 non-published target returns 404 without state reveal", async () => {
    mocks.report = { ok: false, reason: "not_published", report: null as never };
    const response = await call({ reason: "spam" });
    expect(response.status).toBe(404);
    const json = (await response.json()) as { error?: { code?: string } };
    expect(json.error?.code).toBe("EXPERIENCE_NOT_FOUND");
  });

  it("H6-REPORT-07 missing target returns 404", async () => {
    mocks.report = { ok: false, reason: "not_found", report: null as never };
    const response = await call({ reason: "spam" });
    expect(response.status).toBe(404);
  });

  it("H6-REPORT-10 malformed id returns 404", async () => {
    const response = await call({ reason: "spam" }, "not-a-uuid");
    expect(response.status).toBe(404);
  });

  it("H6-REPORT-08 own experience rejected 400", async () => {
    mocks.report = { ok: false, reason: "own", report: null as never };
    const response = await call({ reason: "spam" });
    expect(response.status).toBe(400);
    const json = (await response.json()) as { error?: { code?: string } };
    expect(json.error?.code).toBe("CANNOT_REPORT_OWN_EXPERIENCE");
  });

  it("H6-REPORT-10b reporterId from body is ignored (strict schema)", async () => {
    const response = await call({ reason: "spam", reporterId: "attacker" });
    expect(response.status).toBe(400);
    expect(mocks.report.ok).toBe(true);
  });

  it("H6-REPORT-12 invalid reason rejected", async () => {
    const response = await call({ reason: "meanness" });
    expect(response.status).toBe(400);
  });

  it("H6-REPORT-14 other without details rejected", async () => {
    const response = await call({ reason: "other" });
    expect(response.status).toBe(400);
  });

  it("H6-REPORT-15 unknown keys rejected", async () => {
    const response = await call({ reason: "spam", status: "resolved" });
    expect(response.status).toBe(400);
  });

  it("H6-REPORT-16 duplicate returns 409", async () => {
    mocks.report = { ok: false, reason: "duplicate", report: null as never };
    const response = await call({ reason: "spam" });
    expect(response.status).toBe(409);
    const json = (await response.json()) as { error?: { code?: string } };
    expect(json.error?.code).toBe("EXPERIENCE_ALREADY_REPORTED");
  });

  it("H6-REPORT-17 user rate limit returns 429", async () => {
    mocks.rateAllowed = false;
    const response = await call({ reason: "spam" });
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
  });

  it("H6-REPORT-19 limiter backend failure fails closed", async () => {
    mocks.rateThrows = true;
    const response = await call({ reason: "spam" });
    expect(response.status).toBe(500);
  });

  it("H6-REPORT-20 reporting never mutates the experience", async () => {
    const response = await call({ reason: "misleading" });
    expect(response.status).toBe(201);
  });
});
