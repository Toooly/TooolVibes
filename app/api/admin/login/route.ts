import { NextResponse } from "next/server";

import {
  clearLoginAttempts,
  getLoginRateLimitStatus,
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
import {
  rateLimitResponseHeaders,
  type RateLimitDecision,
} from "@/lib/security/distributed-state";

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

function acceptsHtml(request: Request) {
  return request.headers.get("accept")?.toLowerCase().includes("text/html") ?? false;
}

function copyHeaders(response: NextResponse, headers: Headers) {
  headers.forEach((value, key) => response.headers.set(key, value));
  return response;
}

function rateLimitedResponse(request: Request, decision: RateLimitDecision) {
  const headers = rateLimitResponseHeaders(decision);
  if (acceptsHtml(request)) {
    return copyHeaders(redirectTo(request, getLoginErrorPath("rate-limited")), headers);
  }
  return NextResponse.json(
    {
      ok: false,
      error: "rate_limited",
      message: "Troppi tentativi. Attendi qualche minuto e riprova.",
    },
    { status: 429, headers },
  );
}

function unavailableResponse(request: Request) {
  if (acceptsHtml(request)) return redirectTo(request, getLoginErrorPath("config"));
  return NextResponse.json(
    {
      ok: false,
      error: "security_state_unavailable",
      message: "Login admin non configurato correttamente. Controlla le variabili ambiente.",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
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

  try {
    const current = await getLoginRateLimitStatus(request);
    if (!current.allowed) {
      const redirect = getLoginErrorPath("rate-limited");
      logLoginFailure("rate_limited", { ...received, redirect });
      return rateLimitedResponse(request, current);
    }
  } catch {
    return unavailableResponse(request);
  }

  if (email && password) {
    const credentials = await verifyAdminCredentialsDetailed(email, password);

    if (credentials.ok) {
      try {
        await clearLoginAttempts(request);
      } catch {
        return unavailableResponse(request);
      }

      const token = await createAdminSession();
      const response = redirectTo(request, "/admin");
      response.cookies.set(adminCookieName, token, getAdminSessionCookieOptions(request));
      logLoginSuccess();
      return response;
    }

    let recorded: RateLimitDecision;
    try {
      recorded = await recordFailedLoginAttempt(request);
    } catch {
      return unavailableResponse(request);
    }
    if (!recorded.allowed) {
      const redirect = getLoginErrorPath("rate-limited");
      logLoginFailure("rate_limited", { ...received, redirect });
      return rateLimitedResponse(request, recorded);
    }

    const redirect = getLoginErrorPath(getCredentialErrorCode(credentials.reason));
    logLoginFailure(credentials.reason, { ...received, redirect });
    return redirectTo(request, redirect);
  }

  let recorded: RateLimitDecision;
  try {
    recorded = await recordFailedLoginAttempt(request);
  } catch {
    return unavailableResponse(request);
  }
  if (!recorded.allowed) {
    const redirect = getLoginErrorPath("rate-limited");
    logLoginFailure("rate_limited", { ...received, redirect });
    return rateLimitedResponse(request, recorded);
  }

  const redirect = getLoginErrorPath("missing-fields");
  logLoginFailure("missing_form_fields", { ...received, redirect });
  return redirectTo(request, redirect);
}

export function GET(request: Request) {
  return redirectTo(request, "/admin/login");
}
