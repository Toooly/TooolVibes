import "server-only";

import { readBearerToken } from "@/lib/signal-progression/http";
import { resolveAuthenticatedUserId } from "@/lib/signal-progression/service";

export async function requireCommunityUserId(request: Request) {
  const token = readBearerToken(request);
  if (!token) return { ok: false as const, code: "missing" as const };
  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) return { ok: false as const, code: "invalid" as const };
  return { ok: true as const, userId };
}
