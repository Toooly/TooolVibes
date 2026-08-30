import "server-only";

import {
  consumeRateLimit,
  getRequestAddress,
  rateLimitResponseHeaders,
} from "@/lib/security/distributed-state";

const HOUR = 60 * 60 * 1000;

export const communityRatePolicies = {
  createUser: {
    namespace: "community-experience-create-user",
    limit: 5,
    windowMs: HOUR,
  },
  createIp: {
    namespace: "community-experience-create-ip",
    limit: 10,
    windowMs: HOUR,
  },
  updateUser: {
    namespace: "community-experience-update-user",
    limit: 20,
    windowMs: HOUR,
  },
  deleteUser: {
    namespace: "community-experience-delete-user",
    limit: 20,
    windowMs: HOUR,
  },
  publicGetIp: {
    namespace: "community-experience-get-ip",
    limit: 120,
    windowMs: 60 * 1000,
  },
  reportUser: {
    namespace: "community-experience-report-user",
    limit: 10,
    windowMs: HOUR,
  },
  reportIp: {
    namespace: "community-experience-report-ip",
    limit: 20,
    windowMs: HOUR,
  },
} as const;

export async function consumeCommunityRateLimit(input: {
  namespace: string;
  identifiers: string[];
  limit: number;
  windowMs: number;
}) {
  return consumeRateLimit(input);
}

export { getRequestAddress, rateLimitResponseHeaders };
