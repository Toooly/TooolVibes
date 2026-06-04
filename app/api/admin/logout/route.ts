import { NextResponse } from "next/server";

import {
  adminCookieName,
  getAdminRouteUrl,
  getExpiredAdminSessionCookieOptions,
} from "@/lib/admin/session";

export const dynamic = "force-dynamic";

function redirectToLogin(request: Request) {
  return NextResponse.redirect(getAdminRouteUrl(request, "/admin/login"), 303);
}

export function POST(request: Request) {
  const response = redirectToLogin(request);

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
