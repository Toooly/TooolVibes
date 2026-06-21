import { NextResponse, type NextRequest } from "next/server";

import { adminCookieName } from "@/lib/admin/constants";
import { verifySessionToken } from "@/lib/admin/session-token";

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin") || pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(adminCookieName)?.value;

  if (!token || !(await verifySessionToken(token))) {
    return NextResponse.redirect(getRedirectUrl(request, "/admin/login"));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
