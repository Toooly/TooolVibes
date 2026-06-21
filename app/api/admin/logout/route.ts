import { NextResponse, type NextRequest } from "next/server";

import {
  adminCookieName,
  getAdminRouteUrl,
  getExpiredAdminSessionCookieOptions,
  revokeAdminSession,
} from "@/lib/admin/session";

export const dynamic = "force-dynamic";

function redirectToLogin(request: Request) {
  return NextResponse.redirect(getAdminRouteUrl(request, "/admin/login"), 303);
}

export async function POST(request: NextRequest) {
  const response = redirectToLogin(request);
  const token = request.cookies.get(adminCookieName)?.value;

  if (token) {
    await revokeAdminSession(token);
  }

  response.cookies.set(
    adminCookieName,
    "",
    getExpiredAdminSessionCookieOptions(request),
  );

  return response;
}

export function GET(request: Request) {
  return redirectToLogin(request);
}
