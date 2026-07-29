import { NextResponse } from "next/server";

import { createReleaseFeatureConfig } from "@/lib/config/release-features";
import { canDeliverSignalRewards } from "@/lib/signal-progression/flags";
import { signalAcknowledgeSchema } from "@/lib/signal-progression/contracts";
import {
  MAX_SIGNAL_BODY_BYTES,
  readBearerToken,
  readJsonBodyLimited,
} from "@/lib/signal-progression/http";
import {
  acknowledgeSignalReward,
  resolveAuthenticatedUserId,
} from "@/lib/signal-progression/service";
import { assertNoClientRewardFields } from "@/lib/signal-progression/contracts";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const config = createReleaseFeatureConfig();
  if (!canDeliverSignalRewards(config)) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  const token = readBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) {
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

  const parsed = signalAcknowledgeSchema.safeParse(bodyResult.value);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const result = await acknowledgeSignalReward(
    token,
    parsed.data.grantId,
    parsed.data.status,
  );
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ ok: true, grantId: parsed.data.grantId, status: parsed.data.status });
}
