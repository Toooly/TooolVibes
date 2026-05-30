import { NextResponse } from "next/server";

import {
  adminCookieName,
  getExpiredAdminSessionCookieOptions,
} from "@/lib/admin/session";

export const dynamic = "force-dynamic";

function redirectToLogin(request: Request) {
  return NextResponse.redirect(new URL("/admin/login", request.url), 303);
}

export function POST(request: Request) {
  const response = redirectToLogin(request);

  response.cookies.set(
    adminCookieName,
    "",
    getExpiredAdminSessionCookieOptions(request.url),
  );

  return response;
}

export function GET(request: Request) {
  return redirectToLogin(request);
}
