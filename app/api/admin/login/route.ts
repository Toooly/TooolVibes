import { NextResponse } from "next/server";

import {
  clearLoginAttempts,
  isLoginRateLimited,
  recordFailedLoginAttempt,
} from "@/lib/admin/login-attempts";
import {
  adminCookieName,
  createAdminSession,
  getAdminAuthDiagnostics,
  getAdminSessionCookieOptions,
  verifyAdminCredentialsDetailed,
} from "@/lib/admin/session";

export const dynamic = "force-dynamic";

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
  return NextResponse.redirect(new URL(path, request.url), 303);
}

function logLoginFailure(
  reason: string,
  details: {
    emailReceived: boolean;
    passwordReceived: boolean;
    redirect: string;
  },
) {
  console.warn("[admin-auth] login failed", {
    reason,
    ...details,
    ...getAdminAuthDiagnostics(),
  });
}

function logLoginSuccess() {
  if (process.env.TOOOLVIBES_AUTH_DEBUG === "1") {
    console.info("[admin-auth] login succeeded", {
      redirect: "/admin",
      ...getAdminAuthDiagnostics(),
    });
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
        getAdminSessionCookieOptions(request.url),
      );
      logLoginSuccess();

      return response;
    }

    if (await isLoginRateLimited()) {
      logLoginFailure("rate_limited", { ...received, redirect: "/admin/login?error=1" });
      return redirectTo(request, "/admin/login?error=1");
    }

    await recordFailedLoginAttempt();
    logLoginFailure(credentials.reason, { ...received, redirect: "/admin/login?error=1" });
    return redirectTo(request, "/admin/login?error=1");
  }

  if (await isLoginRateLimited()) {
    logLoginFailure("rate_limited", { ...received, redirect: "/admin/login?error=1" });
    return redirectTo(request, "/admin/login?error=1");
  }

  await recordFailedLoginAttempt();
  logLoginFailure("missing_form_fields", { ...received, redirect: "/admin/login?error=1" });
  return redirectTo(request, "/admin/login?error=1");
}

export function GET(request: Request) {
  return redirectTo(request, "/admin/login");
}
