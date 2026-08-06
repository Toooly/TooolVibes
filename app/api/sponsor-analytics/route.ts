import "server-only";

import { NextResponse } from "next/server";

import {
  SPONSOR_ANALYTICS_MAX_BODY_BYTES,
  validateSponsorAnalyticsPayload,
} from "@/lib/analytics/sponsor-ingest";
import { readJsonBodyLimited } from "@/lib/signal-progression/http";
import {
  consumeRateLimit,
  getRequestAddress,
} from "@/lib/security/distributed-state";

export const dynamic = "force-dynamic";

function noStoreResponse(status: number) {
  return new NextResponse(null, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  // Rate limiting is best-effort: analytics must never block or fail the client.
  try {
    const ip = getRequestAddress(request) ?? "unknown";
    await consumeRateLimit({
      namespace: "sponsor-analytics",
      identifiers: [ip],
      limit: 120,
      windowMs: 60_000,
    });
  } catch {
    // Non-fatal: continue even if the rate-limit store is unavailable.
  }

  const bodyResult = await readJsonBodyLimited(
    request,
    SPONSOR_ANALYTICS_MAX_BODY_BYTES,
  );
  if (!bodyResult.ok) {
    return noStoreResponse(
      bodyResult.error === "too_large"
        ? 413
        : bodyResult.error === "unsupported_media"
          ? 415
          : 400,
    );
  }

  const validated = validateSponsorAnalyticsPayload(bodyResult.value);
  if (!validated.ok) {
    return noStoreResponse(validated.status);
  }

  // Broadcast to the canonical observability layer (Cloudflare Workers Logs
  // via the enabled `observability` block). Only anonymous fields are logged.
  console.log("[sponsor-analytics]", validated.value);

  return noStoreResponse(204);
}

export function GET() {
  return noStoreResponse(405);
}
