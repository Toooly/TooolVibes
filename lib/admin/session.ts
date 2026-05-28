import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export const adminCookieName = "tooolvibes_admin";

function getAdminEmail(): string | undefined {
  return process.env.TOOOLVIBES_ADMIN_EMAIL?.trim() || undefined;
}

function getAdminPasswordHash(): string | undefined {
  return process.env.TOOOLVIBES_ADMIN_PASSWORD_HASH?.trim() || undefined;
}

function getLegacyAdminPassword(): string | undefined {
  return process.env.TOOOLVIBES_ADMIN_PASSWORD?.trim() || undefined;
}

function getSessionSecret(): string {
  const secret = process.env.TOOOLVIBES_SESSION_SECRET?.trim();
  if (secret) return secret;
  const hash = getAdminPasswordHash() || getLegacyAdminPassword() || "fallback-dev-secret";
  return hash;
}

function signSessionToken(payload: string): string {
  const secret = getSessionSecret();
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

function verifySessionToken(token: string): boolean {
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return false;

  const payload = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);
  const secret = getSessionSecret();
  const expected = createHmac("sha256", secret).update(payload).digest("hex");

  if (signature.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;

  const issuedAtStr = payload.split(":")[0];
  if (!issuedAtStr) return false;
  const issuedAt = parseInt(issuedAtStr, 36);
  if (Number.isNaN(issuedAt)) return false;
  const maxAgeMs = 8 * 60 * 60 * 1000;
  if (Date.now() - issuedAt > maxAgeMs) return false;

  return true;
}

export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const configuredEmail = getAdminEmail();
  const configuredHash = getAdminPasswordHash();
  const legacyPassword = getLegacyAdminPassword();

  if (!configuredEmail) return false;

  if (email.toLowerCase().trim() !== configuredEmail.toLowerCase().trim()) return false;

  if (configuredHash) {
    return bcrypt.compare(password, configuredHash);
  }

  if (legacyPassword) {
    const expected = Buffer.from(legacyPassword);
    const received = Buffer.from(password);
    if (expected.length !== received.length) return false;
    return timingSafeEqual(expected, received);
  }

  return false;
}

export async function createAdminSession(): Promise<string> {
  const issuedAt = Date.now().toString(36);
  const nonce = randomBytes(8).toString("hex");
  const payload = `${issuedAt}:${nonce}`;
  return signSessionToken(payload);
}

export async function isAdminSessionUnlocked(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(adminCookieName)?.value;

  if (!token) return false;

  return verifySessionToken(token);
}

export async function requireAdminSession() {
  if (!(await isAdminSessionUnlocked())) {
    redirect("/admin/login");
  }
}
