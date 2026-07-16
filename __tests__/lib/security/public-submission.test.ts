import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/security/distributed-state", () => ({
  getRequestAddress: () => "203.0.113.10",
}));

import {
  readJsonRequestBody,
  verifyPublicSubmissionProtection,
} from "@/lib/security/public-submission";

function jsonRequest(body: string, contentType = "application/json") {
  return new Request("https://tooolvibes.eu/api/tool-requests", {
    method: "POST",
    headers: { "content-type": contentType },
    body,
  });
}

describe("public submission body and Turnstile protection", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects wrong content types, malformed JSON and streamed oversize bodies", async () => {
    await expect(
      readJsonRequestBody(jsonRequest("{}", "text/plain"), 100),
    ).rejects.toMatchObject({
      code: "invalid_content_type",
    });
    await expect(
      readJsonRequestBody(jsonRequest("{"), 100),
    ).rejects.toMatchObject({
      code: "invalid_json",
    });
    await expect(
      readJsonRequestBody(jsonRequest(JSON.stringify({ value: "x".repeat(200) })), 100),
    ).rejects.toMatchObject({
      code: "too_large",
    });
  });

  it("rejects honeypots without contacting Turnstile", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      verifyPublicSubmissionProtection({
        request: jsonRequest("{}"),
        action: "tool_request",
        companyWebsite: "https://bot.example",
        captchaToken: "token",
      }),
    ).resolves.toEqual({ allowed: false, reason: "bot" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed in production when Turnstile is not configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.TOOOLVIBES_TURNSTILE_SECRET_KEY;

    await expect(
      verifyPublicSubmissionProtection({
        request: jsonRequest("{}"),
        action: "waitlist",
        companyWebsite: "",
        captchaToken: "",
      }),
    ).resolves.toEqual({ allowed: false, reason: "configuration" });
  });

  it("validates action and rejects a replayed single-use token", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TOOOLVIBES_TURNSTILE_SECRET_KEY", "turnstile-secret");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ success: true, action: "affiliate_request" }),
      )
      .mockResolvedValueOnce(
        Response.json({
          success: false,
          action: "affiliate_request",
          "error-codes": ["timeout-or-duplicate"],
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const input = {
      request: jsonRequest("{}"),
      action: "affiliate_request" as const,
      companyWebsite: "",
      captchaToken: "single-use-token",
    };

    await expect(
      verifyPublicSubmissionProtection(input),
    ).resolves.toEqual({ allowed: true });
    await expect(
      verifyPublicSubmissionProtection(input),
    ).resolves.toEqual({ allowed: false, reason: "captcha" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
