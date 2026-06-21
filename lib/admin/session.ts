import "server-only";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import { adminCookieName } from "@/lib/admin/constants";
import {
  adminSessionMaxAgeSeconds,
  getRequiredSessionSecret,
  revokeSessionToken,
  signSessionPayload,
  verifySessionToken,
} from "@/lib/admin/session-token";

export { adminCookieName };
export { adminSessionMaxAgeSeconds, verifySessionToken };

export type AdminCredentialFailureReason =
  | "missing_email_env"
  | "email_mismatch"
  | "missing_password_env"
  | "missing_session_secret_env"
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

export function getAdminAuthDiagnostics() {
  const rawHash = cleanAdminEnvValue(process.env.TOOOLVIBES_ADMIN_PASSWORD_HASH)?.replace(/\\\$/g, "$");
  const hash = getAdminPasswordHash();

  return {
    adminEmailPresent: Boolean(getAdminEmail()),
    adminPasswordHashPresent: Boolean(hash),
    adminPasswordHashLooksValid: Boolean(rawHash?.startsWith("$2")),
    sessionSecretPresent: Boolean(cleanAdminEnvValue(process.env.TOOOLVIBES_SESSION_SECRET)),
  };
}

function getRequestProtocol(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwardedProto === "http" || forwardedProto === "https") {
    return forwardedProto;
  }

  return new URL(request.url).protocol.replace(":", "");
}

export function getAdminRouteUrl(request: Request, path: string) {
  const baseUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const requestHost = request.headers.get("host")?.trim();
  const host = requestHost || forwardedHost;
  const protocol = getRequestProtocol(request);

  if (host) {
    baseUrl.host = host;
  }

  baseUrl.protocol = `${protocol}:`;

  return new URL(path, baseUrl);
}

export function getAdminSessionCookieOptions(request?: Request | string) {
  const isHttps =
    typeof request === "string"
      ? new URL(request).protocol === "https:"
      : request
        ? getRequestProtocol(request) === "https"
        : process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isHttps,
    path: "/",
    maxAge: adminSessionMaxAgeSeconds,
  };
}

export function getExpiredAdminSessionCookieOptions(request?: Request | string) {
  return {
    ...getAdminSessionCookieOptions(request),
    maxAge: 0,
  };
}

export async function verifyAdminCredentialsDetailed(
  email: string,
  password: string,
): Promise<AdminCredentialVerification> {
  const configuredEmail = getAdminEmail();
  const configuredHash = getAdminPasswordHash();

  if (process.env.TOOOLVIBES_AUTH_DEBUG === "1") {
    console.info("[admin-auth] verify called", {
      configuredEmailPresent: Boolean(configuredEmail),
      configuredHashPresent: Boolean(configuredHash),
      sessionSecretPresent: Boolean(cleanAdminEnvValue(process.env.TOOOLVIBES_SESSION_SECRET)),
    });
  }

  if (!configuredEmail) return { ok: false, reason: "missing_email_env" };
  if (!cleanAdminEnvValue(process.env.TOOOLVIBES_SESSION_SECRET)) {
    return { ok: false, reason: "missing_session_secret_env" };
  }

  if (email.toLowerCase().trim() !== configuredEmail.toLowerCase().trim()) {
    return { ok: false, reason: "email_mismatch" };
  }

  if (!configuredHash) {
    return { ok: false, reason: "missing_password_env" };
  }

  const matches = await bcrypt.compare(password, configuredHash);
  return matches ? { ok: true } : { ok: false, reason: "password_mismatch" };
}

export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  return (await verifyAdminCredentialsDetailed(email, password)).ok;
}

export async function createAdminSession(): Promise<string> {
  getRequiredSessionSecret();
  const issuedAt = Date.now().toString(36);
  const nonce = randomBytes(8).toString("hex");
  const payload = `${issuedAt}:${nonce}`;
  return signSessionPayload(payload);
}

export async function revokeAdminSession(token: string): Promise<void> {
  await revokeSessionToken(token);
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
