import { NextResponse } from "next/server";

import {
  clearLoginAttempts,
  isLoginRateLimited,
  recordFailedLoginAttempt,
} from "@/lib/admin/login-attempts";
import {
  adminCookieName,
  createAdminSession,
  getAdminRouteUrl,
  getAdminSessionCookieOptions,
  verifyAdminCredentialsDetailed,
  type AdminCredentialFailureReason,
} from "@/lib/admin/session";

export const dynamic = "force-dynamic";

type AdminLoginErrorCode = "credentials" | "missing-fields" | "rate-limited" | "config";

function normalizeEmailInput(value: FormDataEntryValue | null): string {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .trim();
}

function normalizePasswordInput(value: FormDataEntryValue | null): string {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(getAdminRouteUrl(request, path), 303);
}

function getLoginErrorPath(code: AdminLoginErrorCode) {
  return `/admin/login?error=${encodeURIComponent(code)}`;
}

function getCredentialErrorCode(reason: AdminCredentialFailureReason): AdminLoginErrorCode {
  if (
    reason === "missing_email_env" ||
    reason === "missing_password_env" ||
    reason === "missing_session_secret_env"
  ) {
    return "config";
  }

  return "credentials";
}

function logLoginFailure(
  reason: string,
  details: {
    emailReceived: boolean;
    passwordReceived: boolean;
    redirect: string;
  },
) {
  // Always log rich diagnostics on failure — this is critical for debugging
  // Cloudflare secret / build configuration issues.
  if (process.env.TOOOLVIBES_AUTH_DEBUG === "1") {
    console.warn("[admin-auth] login failed", { reason, ...details });
  }
}

function logLoginSuccess() {
  if (process.env.TOOOLVIBES_AUTH_DEBUG === "1") {
    console.info("[admin-auth] login succeeded", { redirect: "/admin" });
  }
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = normalizeEmailInput(formData.get("email"));
  const password = normalizePasswordInput(formData.get("password"));
  const received = {
    emailReceived: Boolean(email),
    passwordReceived: Boolean(password),
  };

  if (email && password) {
    const credentials = await verifyAdminCredentialsDetailed(email, password);

    if (credentials.ok) {
      await clearLoginAttempts();

      const token = await createAdminSession();
      const response = redirectTo(request, "/admin");

      response.cookies.set(
        adminCookieName,
        token,
        getAdminSessionCookieOptions(request),
      );
      logLoginSuccess();

      return response;
    }

    if (await isLoginRateLimited()) {
      const redirect = getLoginErrorPath("rate-limited");
      logLoginFailure("rate_limited", { ...received, redirect });
      return redirectTo(request, redirect);
    }

    await recordFailedLoginAttempt();
    const redirect = getLoginErrorPath(getCredentialErrorCode(credentials.reason));
    logLoginFailure(credentials.reason, { ...received, redirect });
    return redirectTo(request, redirect);
  }

  if (await isLoginRateLimited()) {
    const redirect = getLoginErrorPath("rate-limited");
    logLoginFailure("rate_limited", { ...received, redirect });
    return redirectTo(request, redirect);
  }

  await recordFailedLoginAttempt();
  const redirect = getLoginErrorPath("missing-fields");
  logLoginFailure("missing_form_fields", { ...received, redirect });
  return redirectTo(request, redirect);
}

export function GET(request: Request) {
  return redirectTo(request, "/admin/login");
}
