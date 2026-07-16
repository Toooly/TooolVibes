import { NextResponse, type NextRequest } from "next/server";
import { createGateToken, verifyGateToken } from "@/lib/gate/session";
import { gateCookieName, gateMaxAge } from "@/lib/gate/constants";
import {
  clearRateLimit,
  consumeRateLimit,
  getRequestAddress,
  peekRateLimit,
  rateLimitResponseHeaders,
} from "@/lib/security/distributed-state";
import { gateRateLimitPolicy } from "@/lib/security/rate-limit-policies";

function shouldUseSecureCookie(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return process.env.NODE_ENV === "production" || request.nextUrl.protocol === "https:" || forwardedProto === "https";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { password } = body as { password?: string };
    const expected = process.env.TOOOLVIBES_GATE_PASSWORD?.trim().replace(/^["']|["']$/g, "");
    if (!expected) {
      return NextResponse.json({ error: "Gate non configurato" }, { status: 500 });
    }

    const rateInput = {
      ...gateRateLimitPolicy,
      identifiers: [getRequestAddress(request)],
    };
    const current = await peekRateLimit(rateInput);
    if (!current.allowed) {
      return NextResponse.json(
        { error: "Accesso non valido. Controlla la password e riprova." },
        { status: 429, headers: rateLimitResponseHeaders(current) },
      );
    }

    if (!password || password !== expected) {
      const recorded = await consumeRateLimit(rateInput);
      return NextResponse.json(
        { error: "Accesso non valido. Controlla la password e riprova." },
        recorded.allowed
          ? { status: 401, headers: { "Cache-Control": "no-store" } }
          : { status: 429, headers: rateLimitResponseHeaders(recorded) },
      );
    }

    await clearRateLimit(rateInput);
    const token = await createGateToken();
    const response = NextResponse.json({ success: true });
    response.cookies.set(gateCookieName, token, {
      httpOnly: true,
      secure: shouldUseSecureCookie(request),
      sameSite: "strict",
      maxAge: gateMaxAge,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Errore durante l'accesso. Riprova." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(gateCookieName)?.value;
    if (!token) {
      return NextResponse.json({ open: false }, { status: 200 });
    }
    const valid = await verifyGateToken(token);
    return NextResponse.json({ open: valid }, { status: 200 });
  } catch {
    return NextResponse.json({ open: false }, { status: 200 });
  }
}
