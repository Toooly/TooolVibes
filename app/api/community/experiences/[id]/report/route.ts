import { NextResponse } from "next/server";

import { requireCommunityUserId } from "@/lib/community/auth";
import { communityError } from "@/lib/community/errors";
import { readCommunityJson } from "@/lib/community/http";
import {
  communityRatePolicies,
  consumeCommunityRateLimit,
  getRequestAddress,
  rateLimitResponseHeaders,
} from "@/lib/community/rate-limit";
import { createExperienceReport } from "@/lib/community/report-repository";
import { createReportSchema } from "@/lib/community/schema";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireCommunityUserId(request);
  if (!auth.ok) return communityError("AUTH_REQUIRED");

  const { id } = await context.params;
  if (!id || !UUID_PATTERN.test(id)) {
    return communityError("EXPERIENCE_NOT_FOUND");
  }

  const parsedBody = await readCommunityJson(request);
  if (!parsedBody.ok) {
    return communityError(
      parsedBody.tooLarge ? "PAYLOAD_TOO_LARGE" : "INVALID_INPUT",
    );
  }
  const parsed = createReportSchema.safeParse(parsedBody.value);
  if (!parsed.success) {
    return communityError("INVALID_INPUT", { fields: parsed.error.issues });
  }

  const ip = getRequestAddress(request);
  try {
    const [userLimit, ipLimit] = await Promise.all([
      consumeCommunityRateLimit({
        ...communityRatePolicies.reportUser,
        identifiers: [auth.userId],
      }),
      consumeCommunityRateLimit({
        ...communityRatePolicies.reportIp,
        identifiers: [ip],
      }),
    ]);
    if (!userLimit.allowed || !ipLimit.allowed) {
      return communityError("RATE_LIMITED", {
        headers: rateLimitResponseHeaders(userLimit.allowed ? ipLimit : userLimit),
      });
    }
  } catch {
    // Mutating endpoint fails closed when the limiter backend is down.
    return communityError("SERVER_ERROR");
  }

  const result = await createExperienceReport({
    reporterId: auth.userId,
    experienceId: id,
    reason: parsed.data.reason,
    details: parsed.data.details ?? null,
  });
  if (result.ok) {
    return NextResponse.json(
      { id: result.report.id, status: result.report.status },
      {
        status: 201,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }
  if (result.reason === "not_found" || result.reason === "not_published") {
    // Do not reveal non-public moderation states.
    return communityError("EXPERIENCE_NOT_FOUND");
  }
  if (result.reason === "own") return communityError("CANNOT_REPORT_OWN_EXPERIENCE");
  if (result.reason === "duplicate") return communityError("EXPERIENCE_ALREADY_REPORTED");
  return communityError("SERVER_ERROR");
}
