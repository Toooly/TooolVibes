import { NextResponse } from "next/server";

import { createReleaseFeatureConfig } from "@/lib/config/release-features";
import { canDeliverSignalRewards } from "@/lib/signal-progression/flags";
import { readBearerToken } from "@/lib/signal-progression/http";
import {
  listPendingSignalEnvelopes,
  resolveAuthenticatedUserId,
} from "@/lib/signal-progression/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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

  const envelopes = await listPendingSignalEnvelopes(userId, 10);
  return NextResponse.json({ envelopes });
}
