import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/community/release-gate", () => ({
  isCommunityPublicReadReleased: () => false,
  isCommunityWriteReleased: () => false,
  isCommunityOwnerGetReleased: () => false,
  isCommunityReportReleased: () => false,
}));

vi.mock("@/lib/community/auth", () => ({
  requireCommunityUserId: async () => ({ ok: true, userId: "user-1" }),
}));

vi.mock("@/lib/community/catalog", () => ({
  requirePublicToolSlug: async () => ({ ok: true, slug: "blink" }),
}));

vi.mock("@/lib/community/turnstile", () => ({
  verifyCommunityTurnstile: async () => ({ allowed: true }),
}));

vi.mock("@/lib/community/rate-limit", () => ({
  communityRatePolicies: {
    createUser: { namespace: "u", limit: 5, windowMs: 1 },
    createIp: { namespace: "i", limit: 10, windowMs: 1 },
    updateUser: { namespace: "p", limit: 20, windowMs: 1 },
    deleteUser: { namespace: "d", limit: 20, windowMs: 1 },
    publicGetIp: { namespace: "g", limit: 120, windowMs: 1 },
    reportUser: { namespace: "ru", limit: 10, windowMs: 1 },
    reportIp: { namespace: "ri", limit: 20, windowMs: 1 },
  },
  consumeCommunityRateLimit: async () => ({
    allowed: true,
    limit: 5,
    remaining: 4,
    reset: 1,
  }),
  getRequestAddress: () => "203.0.113.10",
  rateLimitResponseHeaders: () => ({}),
}));

vi.mock("@/lib/community/repository", () => ({
  listPublishedExperiences: async () => ({ ok: true, page: [{ id: "x" }], hasMore: false }),
  createExperience: async () => ({ ok: true, experience: { id: "x" } }),
  getOwnerExperience: async () => ({ ok: true, experience: { id: "x" } }),
  updateOwnerExperience: async () => ({ ok: true, experience: { id: "x" } }),
  deleteOwnerExperience: async () => ({ ok: true, toolSlug: "blink" }),
}));

vi.mock("@/lib/community/report-repository", () => ({
  createExperienceReport: async () => ({ ok: true, report: { id: "r", status: "open" } }),
}));

import { GET as getPublic, POST as create } from "@/app/api/community/experiences/route";
import { GET as getMine } from "@/app/api/community/experiences/mine/route";
import { DELETE, PATCH } from "@/app/api/community/experiences/[id]/route";
import { POST as report } from "@/app/api/community/experiences/[id]/report/route";

const ID = "11111111-1111-4111-8111-111111111111";

describe("H7 API feature gates when Community is dark", () => {
  it("public GET is 404 FEATURE_DISABLED", async () => {
    const response = await getPublic(
      new Request("http://localhost/api/community/experiences?tool=blink"),
    );
    expect(response.status).toBe(404);
    const json = (await response.json()) as { error?: { code?: string } };
    expect(json.error?.code).toBe("FEATURE_DISABLED");
  });

  it("owner GET is 404 FEATURE_DISABLED", async () => {
    const response = await getMine(
      new Request("http://localhost/api/community/experiences/mine?tool=blink", {
        headers: { authorization: "Bearer tok" },
      }),
    );
    expect(response.status).toBe(404);
  });

  it("create/patch/delete/report are 404 FEATURE_DISABLED even with auth", async () => {
    const headers = {
      authorization: "Bearer tok",
      "content-type": "application/json",
    };
    const post = await create(
      new Request("http://localhost/api/community/experiences", {
        method: "POST",
        headers,
        body: JSON.stringify({ toolSlug: "blink" }),
      }),
    );
    const patch = await PATCH(
      new Request("http://localhost/api/community/experiences/" + ID, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ expectedUpdatedAt: "2026-08-30T10:00:00.000Z" }),
      }),
      { params: Promise.resolve({ id: ID }) },
    );
    const del = await DELETE(
      new Request("http://localhost/api/community/experiences/" + ID, {
        method: "DELETE",
        headers,
      }),
      { params: Promise.resolve({ id: ID }) },
    );
    const reported = await report(
      new Request("http://localhost/api/community/experiences/" + ID + "/report", {
        method: "POST",
        headers,
        body: JSON.stringify({ reason: "spam" }),
      }),
      { params: Promise.resolve({ id: ID }) },
    );
    expect(post.status).toBe(404);
    expect(patch.status).toBe(404);
    expect(del.status).toBe(404);
    expect(reported.status).toBe(404);
  });
});
