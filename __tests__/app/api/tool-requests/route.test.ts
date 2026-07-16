import { beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  isAdminEnabled: vi.fn(),
  create: vi.fn(),
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
vi.mock("@/lib/supabase/suggestion-repository", () => ({
  createToolRequestInSupabase: dependencies.create,
}));
vi.mock("@/lib/email/resend", () => ({
  notifyToolRequestSubmitted: dependencies.notify,
}));
vi.mock("@/lib/public-submissions/guard", () => ({
  guardPublicSubmission: dependencies.guard,
  clearSubmissionReplayGuard: dependencies.clearReplay,
}));

import { POST } from "@/app/api/tool-requests/route";

const validBody = {
  submitterType: "community",
  toolName: "Example Tool",
  toolUrl: "https://example.com/tool",
  category: "Automation",
  level: "beginner",
  email: "PERSON@EXAMPLE.COM",
  message: "Un tool utile.",
};

function jsonRequest(body: unknown) {
  return new Request("https://tooolvibes.eu/api/tool-requests", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": "203.0.113.31",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/tool-requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.isAdminEnabled.mockReturnValue(true);
    dependencies.guard.mockResolvedValue({
      allowed: true,
      replayGuard: {
        namespace: "public-tool-replay",
        identifiers: ["fingerprint"],
      },
    });
    dependencies.clearReplay.mockResolvedValue(undefined);
    dependencies.notify.mockResolvedValue(undefined);
    dependencies.create.mockResolvedValue({
      id: "request-id",
      status: "received",
    });
  });

  it("persists a valid request only through the controlled repository", async () => {
    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(201);
    expect(dependencies.guard).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "tool_request",
        email: "person@example.com",
        companyWebsite: "",
        captchaToken: "",
      }),
    );
    expect(dependencies.create).toHaveBeenCalledExactlyOnceWith({
      submitter_type: "community",
      tool_name: "Example Tool",
      tool_url: "https://example.com/tool",
      category: "Automation",
      level: "beginner",
      email: "person@example.com",
      message: "Un tool utile.",
      use_case: null,
      referral_url: null,
      media_url: null,
      personal_notes: null,
      founder_name: null,
      company_role: null,
      launch_stage: null,
      budget_range: null,
      requested_services: [],
    });
  });

  it.each([
    { ...validBody, status: "approved" },
    { ...validBody, userId: "00000000-0000-0000-0000-000000000001" },
    { ...validBody, toolUrl: "javascript:alert(1)" },
  ])("rejects forged or invalid fields: %j", async (body) => {
    const response = await POST(jsonRequest(body));

    expect(response.status).toBe(400);
    expect(dependencies.guard).not.toHaveBeenCalled();
    expect(dependencies.create).not.toHaveBeenCalled();
  });

  it("rejects an oversized body before schema validation", async () => {
    const response = await POST(
      jsonRequest({ ...validBody, message: "x".repeat(25 * 1_024) }),
    );

    expect(response.status).toBe(413);
    expect(dependencies.guard).not.toHaveBeenCalled();
  });

  it("propagates durable 429 headers without persisting", async () => {
    dependencies.guard.mockResolvedValue({
      allowed: false,
      status: 429,
      headers: new Headers({ "Retry-After": "60" }),
    });

    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(dependencies.create).not.toHaveBeenCalled();
  });

  it("clears the replay guard after a DB failure so a legitimate retry can pass", async () => {
    dependencies.create.mockRejectedValue(new Error("DB unavailable"));

    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(500);
    expect(dependencies.clearReplay).toHaveBeenCalledWith({
      namespace: "public-tool-replay",
      identifiers: ["fingerprint"],
    });
  });

  it("fails closed when service-role persistence is unavailable", async () => {
    dependencies.isAdminEnabled.mockReturnValue(false);

    const response = await POST(jsonRequest(validBody));

    expect(response.status).toBe(503);
    expect(dependencies.guard).not.toHaveBeenCalled();
    expect(dependencies.create).not.toHaveBeenCalled();
  });
});
