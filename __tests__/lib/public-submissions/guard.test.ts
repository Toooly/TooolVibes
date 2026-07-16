import { beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  consume: vi.fn(),
  clear: vi.fn(),
  address: vi.fn(),
  verify: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/security/distributed-state", () => {
  class SecurityStateUnavailableError extends Error {}
  return {
    consumeRateLimit: dependencies.consume,
    clearRateLimit: dependencies.clear,
    getRequestAddress: dependencies.address,
    rateLimitResponseHeaders: () => new Headers({ "Retry-After": "60" }),
    SecurityStateUnavailableError,
  };
});
vi.mock("@/lib/security/public-submission", () => ({
  verifyPublicSubmissionProtection: dependencies.verify,
}));

import {
  clearSubmissionReplayGuard,
  guardPublicSubmission,
} from "@/lib/public-submissions/guard";
import { SecurityStateUnavailableError } from "@/lib/security/distributed-state";

const allowedDecision = {
  allowed: true,
  limit: 5,
  remaining: 4,
  resetAt: Date.now() + 60_000,
  retryAfterSeconds: 0,
};

function request() {
  return new Request("https://tooolvibes.eu/api/tool-requests");
}

describe("public submission distributed guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.address.mockReturnValue("203.0.113.20");
    dependencies.consume.mockResolvedValue(allowedDecision);
    dependencies.verify.mockResolvedValue({ allowed: true });
    dependencies.clear.mockResolvedValue(undefined);
  });

  it("rejects a honeypot before consuming distributed quota", async () => {
    await expect(
      guardPublicSubmission({
        request: request(),
        action: "tool_request",
        companyWebsite: "bot",
        captchaToken: "",
      }),
    ).resolves.toEqual({ allowed: false, status: 400 });
    expect(dependencies.consume).not.toHaveBeenCalled();
    expect(dependencies.verify).not.toHaveBeenCalled();
  });

  it("does not consume email quota when CAPTCHA is invalid", async () => {
    dependencies.verify.mockResolvedValue({
      allowed: false,
      reason: "captcha",
    });

    await expect(
      guardPublicSubmission({
        request: request(),
        action: "tool_request",
        companyWebsite: "",
        captchaToken: "invalid",
        email: "person@example.com",
      }),
    ).resolves.toEqual({ allowed: false, status: 400 });

    expect(dependencies.consume).toHaveBeenCalledTimes(1);
    expect(dependencies.consume.mock.calls[0][0].namespace).toBe(
      "public-tool-ip",
    );
  });

  it("uses independent IP, email and replay policies", async () => {
    const result = await guardPublicSubmission({
      request: request(),
      action: "affiliate_request",
      companyWebsite: "",
      captchaToken: "valid",
      email: "person@example.com",
      fingerprintPayload: { message: "same payload" },
    });

    expect(result).toMatchObject({
      allowed: true,
      replayGuard: { namespace: "public-affiliate-replay" },
    });
    expect(
      dependencies.consume.mock.calls.map(([input]) => input.namespace),
    ).toEqual([
      "public-affiliate-ip",
      "public-affiliate-email",
      "public-affiliate-replay",
    ]);
  });

  it("rejects replay and returns rate-limit response headers", async () => {
    dependencies.consume.mockImplementation(async (input) =>
      input.namespace === "public-tool-replay"
        ? {
            allowed: false,
            limit: 1,
            remaining: 0,
            resetAt: Date.now() + 60_000,
            retryAfterSeconds: 60,
          }
        : allowedDecision,
    );

    const result = await guardPublicSubmission({
      request: request(),
      action: "tool_request",
      companyWebsite: "",
      captchaToken: "valid",
      fingerprintPayload: { toolName: "Replay" },
    });

    expect(result).toMatchObject({ allowed: false, status: 429 });
    if (!result.allowed) {
      expect(result.headers?.get("Retry-After")).toBe("60");
    }
  });

  it("fails closed when distributed state is unavailable", async () => {
    dependencies.consume.mockRejectedValue(
      new SecurityStateUnavailableError("offline"),
    );

    await expect(
      guardPublicSubmission({
        request: request(),
        action: "waitlist",
        companyWebsite: "",
        captchaToken: "",
      }),
    ).resolves.toEqual({ allowed: false, status: 503 });
  });

  it("clears only the replay key so a failed DB write can be retried", async () => {
    await clearSubmissionReplayGuard({
      namespace: "public-tool-replay",
      identifiers: ["fingerprint"],
    });

    expect(dependencies.clear).toHaveBeenCalledWith({
      namespace: "public-tool-replay",
      identifiers: ["fingerprint"],
    });
  });
});
