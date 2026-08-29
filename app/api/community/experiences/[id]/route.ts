import { NextResponse } from "next/server";

import { requireCommunityUserId } from "@/lib/community/auth";
import { requirePublicToolSlug } from "@/lib/community/catalog";
import { communityError } from "@/lib/community/errors";
import { readCommunityJson } from "@/lib/community/http";
import {
  communityRatePolicies,
  consumeCommunityRateLimit,
  rateLimitResponseHeaders,
} from "@/lib/community/rate-limit";
import {
  deleteOwnerExperience,
  updateOwnerExperience,
} from "@/lib/community/repository";
import { revalidateExperienceToolPage } from "@/lib/community/revalidate";
import { updateExperienceSchema } from "@/lib/community/schema";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireCommunityUserId(request);
  if (!auth.ok) return communityError("AUTH_REQUIRED");

  const { id } = await context.params;
  if (!id) return communityError("EXPERIENCE_NOT_FOUND");

  const parsedBody = await readCommunityJson(request);
  if (!parsedBody.ok) {
    return communityError(parsedBody.tooLarge ? "PAYLOAD_TOO_LARGE" : "INVALID_INPUT");
  }
  const parsed = updateExperienceSchema.safeParse(parsedBody.value);
  if (!parsed.success) {
    return communityError("INVALID_INPUT", { fields: parsed.error.issues });
  }
  if (parsed.data.switchedFromSlug) {
    const previous = await requirePublicToolSlug(parsed.data.switchedFromSlug);
    if (!previous.ok) return communityError("INVALID_TOOL");
  }

  try {
    const decision = await consumeCommunityRateLimit({
      ...communityRatePolicies.updateUser,
      identifiers: [auth.userId],
    });
    if (!decision.allowed) {
      return communityError("RATE_LIMITED", {
        headers: rateLimitResponseHeaders(decision),
      });
    }
  } catch {
    return communityError("SERVER_ERROR");
  }

  const updated = await updateOwnerExperience({
    id,
    userId: auth.userId,
    expectedUpdatedAt: parsed.data.expectedUpdatedAt,
    payload: parsed.data,
  });
  if (!updated.ok) {
    if (updated.reason === "not_found") return communityError("EXPERIENCE_NOT_FOUND");
    if (updated.reason === "conflict") {
      return communityError("EXPERIENCE_VERSION_CONFLICT");
    }
    if (updated.reason === "check") return communityError("INVALID_INPUT");
    return communityError("SERVER_ERROR");
  }
  revalidateExperienceToolPage(updated.experience.toolSlug);
  return NextResponse.json({ experience: updated.experience });
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireCommunityUserId(request);
  if (!auth.ok) return communityError("AUTH_REQUIRED");
  const { id } = await context.params;
  if (!id) return communityError("EXPERIENCE_NOT_FOUND");

  try {
    const decision = await consumeCommunityRateLimit({
      ...communityRatePolicies.deleteUser,
      identifiers: [auth.userId],
    });
    if (!decision.allowed) {
      return communityError("RATE_LIMITED", {
        headers: rateLimitResponseHeaders(decision),
      });
    }
  } catch {
    return communityError("SERVER_ERROR");
  }

  const deleted = await deleteOwnerExperience({ id, userId: auth.userId });
  if (!deleted.ok) {
    if (deleted.reason === "not_found") return communityError("EXPERIENCE_NOT_FOUND");
    return communityError("SERVER_ERROR");
  }
  revalidateExperienceToolPage(deleted.toolSlug);
  return new NextResponse(null, { status: 204 });
}
