import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: { ok: false as boolean, userId: "user-1" },
  toolOk: true,
  turnstile: { allowed: true as boolean, reason: "failed" as "required" | "failed" | "unavailable" },
  rateAllowed: true,
  list: {
    ok: true as boolean,
    page: [] as Array<Record<string, unknown>>,
    hasMore: false,
  },
  create: { ok: true as boolean, reason: "unique" as string, experience: { id: "exp-1", status: "pending" } },
  owner: { ok: true as boolean, experience: { id: "exp-1", status: "pending" } as Record<string, unknown> | null },
  update: { ok: true as boolean, reason: "conflict" as string, experience: { id: "exp-1", status: "pending" } },
  remove: { ok: true as boolean, reason: "not_found" as string },
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/community/release-gate", () => ({
  isCommunityPublicReadReleased: () => true,
  isCommunityWriteReleased: () => true,
  isCommunityOwnerGetReleased: () => true,
  isCommunityReportReleased: () => true,
}));

vi.mock("@/lib/community/auth", () => ({
  requireCommunityUserId: async () =>
    mocks.auth.ok
      ? { ok: true, userId: mocks.auth.userId }
      : { ok: false, code: "missing" },
}));

vi.mock("@/lib/community/catalog", () => ({
  requirePublicToolSlug: async (raw: string | null) =>
    mocks.toolOk && raw === "blink"
      ? { ok: true, slug: "blink" }
      : { ok: false },
}));

vi.mock("@/lib/community/turnstile", () => ({
  verifyCommunityTurnstile: async () =>
    mocks.turnstile.allowed
      ? { allowed: true }
      : { allowed: false, reason: mocks.turnstile.reason },
}));

vi.mock("@/lib/community/rate-limit", () => ({
  communityRatePolicies: {
    createUser: { namespace: "u", limit: 5, windowMs: 1 },
    createIp: { namespace: "i", limit: 10, windowMs: 1 },
    updateUser: { namespace: "p", limit: 20, windowMs: 1 },
    deleteUser: { namespace: "d", limit: 20, windowMs: 1 },
    publicGetIp: { namespace: "g", limit: 120, windowMs: 1 },
  },
  consumeCommunityRateLimit: async () => ({
    allowed: mocks.rateAllowed,
    limit: 5,
    remaining: 0,
    reset: 1,
  }),
  getRequestAddress: () => "203.0.113.10",
  rateLimitResponseHeaders: () => ({ "Retry-After": "60" }),
}));

vi.mock("@/lib/community/repository", () => ({
  listPublishedExperiences: async () => mocks.list,
  createExperience: async () => mocks.create,
  getOwnerExperience: async () => mocks.owner,
  updateOwnerExperience: async () => mocks.update,
  deleteOwnerExperience: async () => mocks.remove,
}));

import { GET as getPublic, POST } from "@/app/api/community/experiences/route";
import { GET as getMine } from "@/app/api/community/experiences/mine/route";
import {
  DELETE,
  PATCH,
} from "@/app/api/community/experiences/[id]/route";

const validBody = {
  toolSlug: "blink",
  displayName: "Gianmaria",
  useCase: "AI coding",
  body: "Used this tool daily for client landing pages and kept coming back when the stack already had a builder.",
  pros: ["Fast preview cycle"],
  limits: ["Weak collaboration"],
  durationBucket: "months_1_3",
  captchaToken: "token-token",
};

function request(path: string, init?: RequestInit) {
  return new Request(`http://localhost${path}`, init);
}

describe("community experiences API", () => {
  beforeEach(() => {
    mocks.auth.ok = false;
    mocks.toolOk = true;
    mocks.turnstile.allowed = true;
    mocks.rateAllowed = true;
    mocks.list = { ok: true, page: [], hasMore: false };
    mocks.create = {
      ok: true,
      reason: "unique",
      experience: { id: "exp-1", status: "pending" },
    };
    mocks.owner = { ok: true, experience: { id: "exp-1", status: "pending" } };
    mocks.update = {
      ok: true,
      reason: "conflict",
      experience: { id: "exp-1", status: "pending" },
    };
    mocks.remove = { ok: true, reason: "not_found" };
  });

  it("H2-GET published projection without author_id", async () => {
    mocks.list.page = [
      {
        id: "exp-1",
        toolSlug: "blink",
        displayName: "Gianmaria",
        useCase: "AI coding",
        body: validBody.body,
        pros: ["Fast preview cycle"],
        limits: ["Weak collaboration"],
        durationBucket: "months_1_3",
        switchedFromSlug: null,
        switchedFromLabel: null,
        publishedAt: "2026-08-30T00:00:00.000Z",
        updatedAt: "2026-08-30T00:00:00.000Z",
      },
    ];
    const response = await getPublic(request("/api/community/experiences?tool=blink"));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(JSON.stringify(json)).not.toContain("author");
    expect(json.experiences[0].displayName).toBe("Gianmaria");
  });

  it("H2-GET unknown tool 404", async () => {
    mocks.toolOk = false;
    const response = await getPublic(request("/api/community/experiences?tool=nope"));
    expect(response.status).toBe(404);
  });

  it("H2-AUTH missing bearer 401", async () => {
    const response = await POST(
      request("/api/community/experiences", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validBody),
      }),
    );
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("AUTH_REQUIRED");
  });

  it("H2-CREATE pending 201 and rejects privileged keys", async () => {
    mocks.auth.ok = true;
    const created = await POST(
      request("/api/community/experiences", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validBody),
      }),
    );
    expect(created.status).toBe(201);
    expect((await created.json()).experience.status).toBe("pending");

    const privileged = await POST(
      request("/api/community/experiences", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...validBody, status: "published", authorId: "x" }),
      }),
    );
    expect(privileged.status).toBe(400);
  });

  it("H2-CREATE duplicate 409 and turnstile/rate-limit", async () => {
    mocks.auth.ok = true;
    mocks.create.ok = false;
    mocks.create.reason = "unique";
    const duplicate = await POST(
      request("/api/community/experiences", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validBody),
      }),
    );
    expect(duplicate.status).toBe(409);

    mocks.create.ok = true;
    mocks.turnstile.allowed = false;
    mocks.turnstile.reason = "failed";
    const captcha = await POST(
      request("/api/community/experiences", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validBody),
      }),
    );
    expect(captcha.status).toBe(400);

    mocks.turnstile.allowed = true;
    mocks.rateAllowed = false;
    const limited = await POST(
      request("/api/community/experiences", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validBody),
      }),
    );
    expect(limited.status).toBe(429);
  });

  it("H2-OWNER GET uses token identity", async () => {
    mocks.auth.ok = true;
    const response = await getMine(request("/api/community/experiences/mine?tool=blink"));
    expect(response.status).toBe(200);
    expect((await response.json()).experience.id).toBe("exp-1");
  });

  it("H2-UPDATE conflict 409 and cross-user 404", async () => {
    mocks.auth.ok = true;
    mocks.update.ok = false;
    mocks.update.reason = "conflict";
    const conflict = await PATCH(
      request("/api/community/experiences/exp-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedUpdatedAt: "2026-08-30T00:00:00.000Z",
          useCase: "video editing",
        }),
      }),
      { params: Promise.resolve({ id: "exp-1" }) },
    );
    expect(conflict.status).toBe(409);

    mocks.update.reason = "not_found";
    const missing = await PATCH(
      request("/api/community/experiences/exp-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedUpdatedAt: "2026-08-30T00:00:00.000Z",
          useCase: "video editing",
        }),
      }),
      { params: Promise.resolve({ id: "exp-1" }) },
    );
    expect(missing.status).toBe(404);
  });

  it("H2-DELETE owner 204 and other user 404", async () => {
    mocks.auth.ok = true;
    const deleted = await DELETE(request("/api/community/experiences/exp-1", { method: "DELETE" }), {
      params: Promise.resolve({ id: "exp-1" }),
    });
    expect(deleted.status).toBe(204);

    mocks.remove.ok = false;
    mocks.remove.reason = "not_found";
    const missing = await DELETE(request("/api/community/experiences/exp-1", { method: "DELETE" }), {
      params: Promise.resolve({ id: "exp-1" }),
    });
    expect(missing.status).toBe(404);
  });
});
