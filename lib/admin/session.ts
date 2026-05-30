import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export const adminCookieName = "tooolvibes_admin";
export const adminSessionMaxAgeSeconds = 60 * 60 * 8;

export type AdminCredentialFailureReason =
  | "missing_email_env"
  | "email_mismatch"
  | "missing_password_env"
  | "password_mismatch";

export type AdminCredentialVerification =
  | { ok: true }
  | { ok: false; reason: AdminCredentialFailureReason };

function cleanAdminEnvValue(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  return normalized.replace(/^["']|["']$/g, "");
}

function getAdminEmail(): string | undefined {
  return cleanAdminEnvValue(process.env.TOOOLVIBES_ADMIN_EMAIL);
}

function getAdminPasswordHash(): string | undefined {
  const hash = cleanAdminEnvValue(process.env.TOOOLVIBES_ADMIN_PASSWORD_HASH)?.replace(
    /\\\$/g,
    "$",
  );
  return hash?.startsWith("$2") ? hash : undefined;
}

function getLegacyAdminPassword(): string | undefined {
  return cleanAdminEnvValue(process.env.TOOOLVIBES_ADMIN_PASSWORD);
}

function getSessionSecret(): string {
  const secret = cleanAdminEnvValue(process.env.TOOOLVIBES_SESSION_SECRET);
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
  const maxAgeMs = adminSessionMaxAgeSeconds * 1000;
  if (Date.now() - issuedAt > maxAgeMs) return false;

  return true;
}

export function getAdminAuthDiagnostics() {
  const rawHash = cleanAdminEnvValue(process.env.TOOOLVIBES_ADMIN_PASSWORD_HASH)?.replace(/\\\$/g, "$");
  const hash = getAdminPasswordHash();

  return {
    adminEmailPresent: Boolean(getAdminEmail()),
    adminPasswordHashPresent: Boolean(hash),
    adminPasswordHashLength: rawHash ? rawHash.length : 0,
    adminPasswordHashLooksValid: Boolean(rawHash?.startsWith("$2")),
    legacyAdminPasswordPresent: Boolean(getLegacyAdminPassword()),
    sessionSecretPresent: Boolean(cleanAdminEnvValue(process.env.TOOOLVIBES_SESSION_SECRET)),
  };
}

export function getAdminSessionCookieOptions(requestUrl?: string) {
  const isHttps = requestUrl
    ? new URL(requestUrl).protocol === "https:"
    : process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isHttps,
    path: "/",
    maxAge: adminSessionMaxAgeSeconds,
  };
}

export function getExpiredAdminSessionCookieOptions(requestUrl?: string) {
  return {
    ...getAdminSessionCookieOptions(requestUrl),
    maxAge: 0,
  };
}

export async function verifyAdminCredentialsDetailed(
  email: string,
  password: string,
): Promise<AdminCredentialVerification> {
  const configuredEmail = getAdminEmail();
  const configuredHash = getAdminPasswordHash();
  const legacyPassword = getLegacyAdminPassword();

  if (process.env.TOOOLVIBES_AUTH_DEBUG === "1") {
    console.info("[admin-auth] verify called", {
      emailReceivedLength: email?.length ?? 0,
      configuredEmailPresent: Boolean(configuredEmail),
      configuredEmailLength: configuredEmail ? configuredEmail.length : 0,
      configuredHashPresent: Boolean(configuredHash),
      configuredHashLength: configuredHash ? configuredHash.length : 0,
      legacyPasswordPresent: Boolean(legacyPassword),
    });
  }

  if (!configuredEmail) return { ok: false, reason: "missing_email_env" };

  if (email.toLowerCase().trim() !== configuredEmail.toLowerCase().trim()) {
    return { ok: false, reason: "email_mismatch" };
  }

  if (configuredHash) {
    const matches = await bcrypt.compare(password, configuredHash);
    return matches ? { ok: true } : { ok: false, reason: "password_mismatch" };
  }

  if (legacyPassword) {
    const expected = Buffer.from(legacyPassword);
    const received = Buffer.from(password);
    if (expected.length !== received.length) {
      return { ok: false, reason: "password_mismatch" };
    }
    return timingSafeEqual(expected, received)
      ? { ok: true }
      : { ok: false, reason: "password_mismatch" };
  }

  return { ok: false, reason: "missing_password_env" };
}

export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  return (await verifyAdminCredentialsDetailed(email, password)).ok;
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
