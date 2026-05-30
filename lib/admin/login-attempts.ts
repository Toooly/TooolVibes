import "server-only";

import { headers } from "next/headers";

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

async function getLoginAttemptKey() {
  const headersList = await headers();
  return (
    headersList.get("cf-connecting-ip") ??
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function isLoginRateLimited(): Promise<boolean> {
  const key = await getLoginAttemptKey();
  const attempt = loginAttempts.get(key);
  const now = Date.now();

  if (!attempt || now > attempt.resetAt) {
    loginAttempts.delete(key);
    return false;
  }

  return attempt.count >= MAX_LOGIN_ATTEMPTS;
}

export async function recordFailedLoginAttempt(): Promise<void> {
  const key = await getLoginAttemptKey();
  const now = Date.now();
  const attempt = loginAttempts.get(key);

  if (!attempt || now > attempt.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }

  attempt.count++;
}

export async function clearLoginAttempts(): Promise<void> {
  const key = await getLoginAttemptKey();
  loginAttempts.delete(key);
}
