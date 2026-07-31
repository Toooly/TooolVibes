export const adminLoginRateLimitPolicy = {
  namespace: "admin-login-ip",
  limit: 5,
  windowMs: 15 * 60 * 1000,
} as const;

export const magicLinkRateLimitPolicies = {
  // v2 namespaces intentionally rotate exhausted probe counters from Phase 7C.
  email: { namespace: "auth-magic-email-v2", limit: 3, windowMs: 60 * 1000 },
  ip: {
    namespace: "auth-magic-ip-v2",
    limit: 20,
    windowMs: 60 * 60 * 1000,
  },
} as const;

export const gateRateLimitPolicy = {
  namespace: "public-gate-ip",
  limit: 5,
  windowMs: 15 * 60 * 1000,
} as const;
