import { beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  isAdminEnabled: vi.fn(),
  create: vi.fn(),
  cooldown: vi.fn(),
  notify: vi.fn(),
  guard: vi.fn(),
  clearReplay: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: dependencies.revalidate }));
vi.mock("@/lib/supabase/admin-client", () => ({
  isSupabaseAdminEnabled: dependencies.isAdminEnabled,
}));
vi.mock("@/lib/supabase/affiliate-request-repository", () => ({
  createAffiliateRequestInSupabase: dependencies.create,
}));
vi.mock("@/lib/admin/affiliate-request-queries", () => ({
  getRejectedAffiliateRequestCooldown: dependencies.cooldown,
}));
vi.mock("@/lib/email/resend", () => ({
  notifyAffiliateRequestSubmitted: dependencies.notify,
}));
vi.mock("@/lib/public-submissions/guard", () => ({
  guardPublicSubmission: dependencies.guard,
  clearSubmissionReplayGuard: dependencies.clearReplay,
}));

import { POST } from "@/app/api/affiliate-requests/route";

const validBody = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ADA@EXAMPLE.COM",
  brandName: "Analytical",
  websiteUrl: "https://example.com",
  instagram: "@ada",
  message: "Vorrei presentare TooolVibes alla mia community.",
};

function jsonRequest(body: unknown) {
  return new Request("https://tooolvibes.eu/api/affiliate-requests", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": "203.0.113.32",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/affiliate-requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.isAdminEnabled.mockReturnValue(true);
    dependencies.cooldown.mockResolvedValue(null);
    dependencies.guard.mockResolvedValue({
      allowed: true,
      replayGuard: {
        namespace: "public-affiliate-replay",
        identifiers: ["fingerprint"],
      },
    });
    dependencies.clearReplay.mockResolvedValue(undefined);
    dependencies.notify.mockResolvedValue(undefined);
    dependencies.create.mockResolvedValue({
      id: "affiliate-id",
      status: "received",
    });
  });

  it("normalizes and persists a valid request through the service path", async () => {
    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(201);
    expect(dependencies.guard).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "affiliate_request",
        email: "ada@example.com",
      }),
    );
    expect(dependencies.create).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: "Ada",
        last_name: "Lovelace",
        email: "ada@example.com",
        website_url: "https://example.com",
        channels: "Instagram: @ada",
      }),
    );
  });

  it.each([
    { ...validBody, adminNotes: "forged" },
    { ...validBody, message: "short" },
    { ...validBody, websiteUrl: "file:///etc/passwd" },
  ])("rejects forged or invalid payloads: %j", async (body) => {
    const response = await POST(jsonRequest(body));

    expect(response.status).toBe(400);
    expect(dependencies.guard).not.toHaveBeenCalled();
  });

  it("rejects oversized payloads before persistence", async () => {
    const response = await POST(
      jsonRequest({ ...validBody, message: "x".repeat(21 * 1_024) }),
    );

    expect(response.status).toBe(413);
    expect(dependencies.guard).not.toHaveBeenCalled();
  });

  it("clears replay state when persistence fails", async () => {
    dependencies.create.mockRejectedValue(new Error("DB unavailable"));

    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(500);
    expect(dependencies.clearReplay).toHaveBeenCalledWith({
      namespace: "public-affiliate-replay",
      identifiers: ["fingerprint"],
    });
  });
});
