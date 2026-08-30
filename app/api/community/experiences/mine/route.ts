import { NextResponse } from "next/server";

import { requireCommunityUserId } from "@/lib/community/auth";
import { requirePublicToolSlug } from "@/lib/community/catalog";
import { communityError } from "@/lib/community/errors";
import { isCommunityOwnerGetReleased } from "@/lib/community/release-gate";
import { getOwnerExperience } from "@/lib/community/repository";

export async function GET(request: Request) {
  if (!isCommunityOwnerGetReleased()) {
    return communityError("FEATURE_DISABLED");
  }
  const auth = await requireCommunityUserId(request);
  if (!auth.ok) return communityError("AUTH_REQUIRED");

  const url = new URL(request.url);
  const tool = await requirePublicToolSlug(url.searchParams.get("tool"));
  if (!tool.ok) return communityError("INVALID_TOOL");

  const result = await getOwnerExperience({
    userId: auth.userId,
    toolSlug: tool.slug,
  });
  if (!result.ok) return communityError("SERVER_ERROR");
  return NextResponse.json(
    { experience: result.experience },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
