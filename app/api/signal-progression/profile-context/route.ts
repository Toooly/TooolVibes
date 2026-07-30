import { NextResponse } from "next/server";

import { createReleaseFeatureConfig } from "@/lib/config/release-features";
import {
  canReadSignalProgressionUi,
  canWriteSignalEvents,
} from "@/lib/signal-progression/flags";
import {
  MAX_SIGNAL_BODY_BYTES,
  readBearerToken,
  readJsonBodyLimited,
} from "@/lib/signal-progression/http";
import { signalProfileContextSchema } from "@/lib/signal-progression/profile-context";
import {
  resolveAuthenticatedUserId,
  upsertSignalProfileContext,
} from "@/lib/signal-progression/service";
import { assertNoClientRewardFields } from "@/lib/signal-progression/contracts";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  const config = createReleaseFeatureConfig();
  // Require progression UI or event writes so profile context stays gated
  if (!canReadSignalProgressionUi(config) && !canWriteSignalEvents(config)) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  const token = readBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const bodyResult = await readJsonBodyLimited(request, MAX_SIGNAL_BODY_BYTES);
  if (!bodyResult.ok) {
    return NextResponse.json({ error: bodyResult.error }, { status: 400 });
  }

  const forbidden = assertNoClientRewardFields(bodyResult.value);
  if (forbidden) {
    return NextResponse.json({ error: forbidden }, { status: 400 });
  }

  // Reject client claiming completion
  if (
    bodyResult.value &&
    typeof bodyResult.value === "object" &&
    ("completed" in (bodyResult.value as object) ||
      "completedAt" in (bodyResult.value as object))
  ) {
    return NextResponse.json({ error: "forbidden_field:completed" }, { status: 400 });
  }

  const parsed = signalProfileContextSchema.safeParse(bodyResult.value);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await upsertSignalProfileContext(userId, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    completed: result.completed,
    envelopes: result.envelopes,
  });
}
