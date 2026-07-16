import "server-only";

import {
  clearRateLimit,
  consumeRateLimit,
  getRequestAddress,
  rateLimitResponseHeaders,
  SecurityStateUnavailableError,
  type RateLimitInput,
} from "@/lib/security/distributed-state";
import type { PublicSubmissionAction } from "@/lib/public-submissions/contracts";
import { verifyPublicSubmissionProtection } from "@/lib/security/public-submission";

type SubmissionPolicy = {
  ip: Pick<RateLimitInput, "namespace" | "limit" | "windowMs">;
  email?: Pick<RateLimitInput, "namespace" | "limit" | "windowMs">;
  replay?: Pick<RateLimitInput, "namespace" | "limit" | "windowMs">;
};

const MINUTE = 60 * 1_000;
const HOUR = 60 * MINUTE;

const policies: Record<PublicSubmissionAction, SubmissionPolicy> = {
  waitlist: {
    ip: { namespace: "public-waitlist-ip", limit: 5, windowMs: 15 * MINUTE },
    email: { namespace: "public-waitlist-email", limit: 3, windowMs: HOUR },
  },
  tool_request: {
    ip: { namespace: "public-tool-ip", limit: 5, windowMs: 15 * MINUTE },
    email: { namespace: "public-tool-email", limit: 3, windowMs: HOUR },
    replay: { namespace: "public-tool-replay", limit: 1, windowMs: 24 * HOUR },
  },
  affiliate_request: {
    ip: { namespace: "public-affiliate-ip", limit: 3, windowMs: 30 * MINUTE },
    email: { namespace: "public-affiliate-email", limit: 2, windowMs: 24 * HOUR },
    replay: { namespace: "public-affiliate-replay", limit: 1, windowMs: 24 * HOUR },
  },
};

type ReplayGuard = Pick<RateLimitInput, "namespace" | "identifiers">;

export type PublicSubmissionGuardResult =
  | { allowed: true; replayGuard?: ReplayGuard }
  | { allowed: false; status: 400 | 429 | 503; headers?: Headers };

async function payloadFingerprint(payload: unknown) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function consumePolicy(
  policy: Pick<RateLimitInput, "namespace" | "limit" | "windowMs">,
  identifier: string,
): Promise<PublicSubmissionGuardResult | null> {
  const decision = await consumeRateLimit({
    ...policy,
    identifiers: [identifier],
  });
  if (decision.allowed) {
    return null;
  }
  return {
    allowed: false,
    status: 429,
    headers: rateLimitResponseHeaders(decision),
  };
}

export async function guardPublicSubmission(input: {
  request: Request;
  action: PublicSubmissionAction;
  companyWebsite: string;
  captchaToken: string;
  email?: string;
  fingerprintPayload?: unknown;
}): Promise<PublicSubmissionGuardResult> {
  const policy = policies[input.action];
  const requestAddress = getRequestAddress(input.request);

  if (requestAddress === "unknown" && process.env.NODE_ENV === "production") {
    return { allowed: false, status: 503 };
  }

  if (input.companyWebsite.trim()) {
    return { allowed: false, status: 400 };
  }

  try {
    const ipDenied = await consumePolicy(policy.ip, requestAddress);
    if (ipDenied) {
      return ipDenied;
    }

    const protection = await verifyPublicSubmissionProtection({
      request: input.request,
      action: input.action,
      companyWebsite: input.companyWebsite,
      captchaToken: input.captchaToken,
    });
    if (!protection.allowed) {
      return {
        allowed: false,
        status:
          protection.reason === "bot" || protection.reason === "captcha"
            ? 400
            : 503,
      };
    }
    if (policy.email && input.email) {
      const emailDenied = await consumePolicy(policy.email, input.email);
      if (emailDenied) {
        return emailDenied;
      }
    }

    if (policy.replay && input.fingerprintPayload !== undefined) {
      const replayGuard = {
        namespace: policy.replay.namespace,
        identifiers: [
          await payloadFingerprint(input.fingerprintPayload),
        ],
      };
      const replayDenied = await consumePolicy(
        policy.replay,
        replayGuard.identifiers[0],
      );
      if (replayDenied) {
        return replayDenied;
      }
      return { allowed: true, replayGuard };
    }

    return { allowed: true };
  } catch (error) {
    if (error instanceof SecurityStateUnavailableError) {
      return { allowed: false, status: 503 };
    }
    throw error;
  }
}

export async function clearSubmissionReplayGuard(
  replayGuard: ReplayGuard | undefined,
) {
  if (!replayGuard) {
    return;
  }
  await clearRateLimit(replayGuard);
}
