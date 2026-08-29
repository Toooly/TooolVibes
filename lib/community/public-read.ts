import "server-only";

import { isSupabaseAdminEnabled } from "@/lib/admin/tool-queries";
import { encodeExperienceCursor } from "@/lib/community/http";
import { listPublishedExperiences } from "@/lib/community/repository";
import { isCommunityReadEnabled } from "@/lib/community/read-flag";
import { MAX_PUBLIC_PAGE } from "@/lib/community/schema";

export async function loadPublishedExperiencesForTool(toolSlug: string) {
  if (!isCommunityReadEnabled()) {
    return { skipped: true as const };
  }
  if (!isSupabaseAdminEnabled()) {
    return { skipped: false as const, ok: false as const };
  }
  try {
    const listed = await listPublishedExperiences({
      toolSlug,
      limit: MAX_PUBLIC_PAGE,
      cursor: null,
    });
    if (!listed.ok) return { skipped: false as const, ok: false as const };
    const last = listed.page[listed.page.length - 1];
    return {
      skipped: false as const,
      ok: true as const,
      experiences: listed.page,
      nextCursor:
        listed.hasMore && last
          ? encodeExperienceCursor(last.publishedAt, last.id)
          : null,
    };
  } catch {
    console.info("[community:public-read]", { toolSlug, result: "error" });
    return { skipped: false as const, ok: false as const };
  }
}
