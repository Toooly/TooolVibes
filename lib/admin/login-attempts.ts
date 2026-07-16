import "server-only";

import {
  clearRateLimit,
  getRequestAddress,
  peekRateLimit,
  consumeRateLimit,
  type RateLimitDecision,
} from "@/lib/security/distributed-state";
import { adminLoginRateLimitPolicy } from "@/lib/security/rate-limit-policies";

function rateLimitInput(request: Request) {
  return {
    ...adminLoginRateLimitPolicy,
    identifiers: [getRequestAddress(request)],
  };
}

export async function getLoginRateLimitStatus(
  request: Request,
): Promise<RateLimitDecision> {
  return peekRateLimit(rateLimitInput(request));
}

export async function recordFailedLoginAttempt(
  request: Request,
): Promise<RateLimitDecision> {
  return consumeRateLimit(rateLimitInput(request));
}

export async function clearLoginAttempts(request: Request): Promise<void> {
  await clearRateLimit(rateLimitInput(request));
}
