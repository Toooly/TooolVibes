import { NextResponse } from "next/server";
import { gateCookieName } from "@/lib/gate/constants";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(gateCookieName, "", {
    maxAge: 0,
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });
  return response;
}
