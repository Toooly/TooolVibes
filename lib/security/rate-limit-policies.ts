export const adminLoginRateLimitPolicy = {
  namespace: "admin-login-ip",
  limit: 5,
  windowMs: 15 * 60 * 1000,
} as const;

export const magicLinkRateLimitPolicies = {
  email: { namespace: "auth-magic-email", limit: 1, windowMs: 60 * 1000 },
  ip: {
    namespace: "auth-magic-ip",
    limit: 5,
    windowMs: 60 * 60 * 1000,
  },
} as const;

export const gateRateLimitPolicy = {
  namespace: "public-gate-ip",
  limit: 5,
  windowMs: 15 * 60 * 1000,
} as const;
