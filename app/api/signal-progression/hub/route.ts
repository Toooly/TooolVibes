import { NextResponse } from "next/server";

import { createReleaseFeatureConfig } from "@/lib/config/release-features";
import { canReadSignalProgressionUi } from "@/lib/signal-progression/flags";
import { readBearerToken } from "@/lib/signal-progression/http";
import {
  getSignalProgressHub,
  resolveAuthenticatedUserId,
} from "@/lib/signal-progression/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const config = createReleaseFeatureConfig();
  if (!canReadSignalProgressionUi(config)) {
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

  const hub = await getSignalProgressHub(userId);
  if (!hub) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  return NextResponse.json({ hub });
}
