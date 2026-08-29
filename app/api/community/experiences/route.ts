import { NextResponse } from "next/server";

import { requireCommunityUserId } from "@/lib/community/auth";
import { requirePublicToolSlug } from "@/lib/community/catalog";
import { communityError } from "@/lib/community/errors";
import {
  decodeExperienceCursor,
  encodeExperienceCursor,
  readCommunityJson,
} from "@/lib/community/http";
import {
  communityRatePolicies,
  consumeCommunityRateLimit,
  getRequestAddress,
  rateLimitResponseHeaders,
} from "@/lib/community/rate-limit";
import {
  createExperience,
  listPublishedExperiences,
} from "@/lib/community/repository";
import {
  MAX_PUBLIC_LIMIT,
  MAX_PUBLIC_PAGE,
  createExperienceSchema,
} from "@/lib/community/schema";
import { verifyCommunityTurnstile } from "@/lib/community/turnstile";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tool = await requirePublicToolSlug(url.searchParams.get("tool"));
  if (!tool.ok) {
    return communityError("INVALID_TOOL");
  }

  const ip = getRequestAddress(request);
  try {
    const decision = await consumeCommunityRateLimit({
      ...communityRatePolicies.publicGetIp,
      identifiers: [ip],
    });
    if (!decision.allowed) {
      return communityError("RATE_LIMITED", {
        headers: rateLimitResponseHeaders(decision),
      });
    }
  } catch {
    // Public GET fails open if the limiter is down.
  }

  const rawLimit = Number(url.searchParams.get("limit") ?? MAX_PUBLIC_PAGE);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(MAX_PUBLIC_LIMIT, Math.max(1, Math.floor(rawLimit)))
    : MAX_PUBLIC_PAGE;
  const cursor = decodeExperienceCursor(url.searchParams.get("cursor"));

  const listed = await listPublishedExperiences({
    toolSlug: tool.slug,
    limit,
    cursor,
  });
  if (!listed.ok) {
    return communityError("SERVER_ERROR");
  }

  const last = listed.page[listed.page.length - 1];
  const nextCursor =
    listed.hasMore && last
      ? encodeExperienceCursor(last.publishedAt, last.id)
      : null;

  return NextResponse.json(
    { experiences: listed.page, nextCursor },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(request: Request) {
  const auth = await requireCommunityUserId(request);
  if (!auth.ok) return communityError("AUTH_REQUIRED");

  const parsedBody = await readCommunityJson(request);
  if (!parsedBody.ok) {
    return communityError(parsedBody.tooLarge ? "PAYLOAD_TOO_LARGE" : "INVALID_INPUT");
  }

  const parsed = createExperienceSchema.safeParse(parsedBody.value);
  if (!parsed.success) {
    return communityError("INVALID_INPUT", { fields: parsed.error.issues });
  }

  const tool = await requirePublicToolSlug(parsed.data.toolSlug);
  if (!tool.ok) return communityError("INVALID_TOOL");
  if (parsed.data.switchedFromSlug) {
    const previous = await requirePublicToolSlug(parsed.data.switchedFromSlug);
    if (!previous.ok) return communityError("INVALID_TOOL");
  }

  const captcha = await verifyCommunityTurnstile(request, parsed.data.captchaToken);
  if (!captcha.allowed) {
    if (captcha.reason === "required") return communityError("TURNSTILE_REQUIRED");
    if (captcha.reason === "unavailable") return communityError("TURNSTILE_UNAVAILABLE");
    return communityError("TURNSTILE_FAILED");
  }

  const ip = getRequestAddress(request);
  try {
    const [userLimit, ipLimit] = await Promise.all([
      consumeCommunityRateLimit({
        ...communityRatePolicies.createUser,
        identifiers: [auth.userId],
      }),
      consumeCommunityRateLimit({
        ...communityRatePolicies.createIp,
        identifiers: [ip],
      }),
    ]);
    if (!userLimit.allowed || !ipLimit.allowed) {
      return communityError("RATE_LIMITED", {
        headers: rateLimitResponseHeaders(userLimit.allowed ? ipLimit : userLimit),
      });
    }
  } catch {
    return communityError("SERVER_ERROR");
  }

  const created = await createExperience({ userId: auth.userId, payload: parsed.data });
  if (!created.ok) {
    if (created.reason === "unique") return communityError("EXPERIENCE_ALREADY_EXISTS");
    return communityError("SERVER_ERROR");
  }
  return NextResponse.json({ experience: created.experience }, { status: 201 });
}
