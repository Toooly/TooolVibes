import { NextResponse, type NextRequest } from "next/server";

import { adminCookieName } from "@/lib/admin/constants";
import { verifySessionToken } from "@/lib/admin/session-token";
import { releaseFeatures } from "@/lib/config/release-features";
import { gateCookieName } from "@/lib/gate/constants";
import { verifyGateToken } from "@/lib/gate/session";
import { getStrictTransportSecurityValue } from "@/lib/security/browser-headers";

function getRedirectUrl(request: NextRequest, path: string) {
  const redirectUrl = request.nextUrl.clone();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const requestHost = request.headers.get("host")?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();

  redirectUrl.pathname = path;
  redirectUrl.search = "";

  if (requestHost || forwardedHost) {
    redirectUrl.host = requestHost || forwardedHost || redirectUrl.host;
  }

  if (forwardedProto === "http" || forwardedProto === "https") {
    redirectUrl.protocol = `${forwardedProto}:`;
  }

  return redirectUrl;
}

function withTransportSecurity(
  request: NextRequest,
  response: NextResponse,
) {
  const hstsValue = getStrictTransportSecurityValue({
    nodeEnv: process.env.NODE_ENV,
    requestUrl: getRedirectUrl(request, request.nextUrl.pathname).toString(),
    enableHsts: process.env.TOOOLVIBES_SECURITY_HSTS,
  });
  if (hstsValue) {
    response.headers.set("Strict-Transport-Security", hstsValue);
  }

  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin gate (esistente)
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return withTransportSecurity(request, NextResponse.next());
    }
    const token = request.cookies.get(adminCookieName)?.value;
    if (!token || !(await verifySessionToken(token))) {
      return withTransportSecurity(request, NextResponse.redirect(getRedirectUrl(request, "/admin/login")));
    }
    return withTransportSecurity(request, NextResponse.next());
  }
  if (!releaseFeatures.publicGate.enabled) {
    return withTransportSecurity(request, NextResponse.next());
  }

  // Public access gate
  const gateCookie = request.cookies.get(gateCookieName)?.value;
  let isGateOpen = false;
  if (gateCookie) {
    try {
      isGateOpen = await verifyGateToken(gateCookie);
    } catch {
      isGateOpen = false;
    }
  }

  if (isGateOpen) {
    return withTransportSecurity(request, NextResponse.next());
  }

  // Always allow these paths
  if (
    (process.env.NODE_ENV !== "production" && pathname.startsWith("/dev")) ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/gate") ||
    pathname === "/api/waitlist" ||
    pathname === "/api/security/csp-report" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/brand") ||
    pathname.startsWith("/images") ||
    pathname === "/favicon.ico" ||
    pathname === "/coming-soon"
  ) {
    return withTransportSecurity(request, NextResponse.next());
  }

  // If not authenticated, only allow /
  if (pathname === "/") {
    return withTransportSecurity(request, NextResponse.next());
  }

  // Block everything else
  return withTransportSecurity(request, NextResponse.redirect(new URL("/", request.url)));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand|images).*)"],
};
