import { NextResponse } from "next/server";

import { createReleaseFeatureConfig } from "@/lib/config/release-features";
import { canWriteSignalEvents } from "@/lib/signal-progression/flags";
import {
  MAX_SIGNAL_BODY_BYTES,
  readBearerToken,
  readJsonBodyLimited,
} from "@/lib/signal-progression/http";
import {
  acceptSignalEngagement,
  resolveAuthenticatedUserId,
} from "@/lib/signal-progression/service";
import { validateSignalEventPayload } from "@/lib/signal-progression/validate-event";
import {
  consumeRateLimit,
  getRequestAddress,
  rateLimitResponseHeaders,
} from "@/lib/security/distributed-state";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const config = createReleaseFeatureConfig();
  if (!canWriteSignalEvents(config)) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  const token = readBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const ip = getRequestAddress(request) ?? "unknown";
    const decision = await consumeRateLimit({
      namespace: "signal-event-write",
      identifiers: [ip, token.slice(0, 24)],
      limit: 60,
      windowMs: 60_000,
    });
    if (!decision.allowed) {
      return NextResponse.json(
        { error: "rate_limited" },
        { status: 429, headers: rateLimitResponseHeaders(decision) },
      );
    }
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const bodyResult = await readJsonBodyLimited(request, MAX_SIGNAL_BODY_BYTES);
  if (!bodyResult.ok) {
    const status =
      bodyResult.error === "too_large"
        ? 413
        : bodyResult.error === "unsupported_media"
          ? 415
          : 400;
    return NextResponse.json({ error: bodyResult.error }, { status });
  }

  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const validated = validateSignalEventPayload(bodyResult.value, userId);
  if (!validated.ok) {
    return NextResponse.json(
      { error: validated.error },
      { status: validated.status },
    );
  }

  const result = await acceptSignalEngagement(userId, validated.value);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({
    status: result.status,
    granted: result.granted,
    spAwarded: result.spAwarded,
    envelope: result.envelope,
  });
}
