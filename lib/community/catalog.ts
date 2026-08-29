import "server-only";

import { getToolViewBySlug } from "@/lib/data/public-tools";
import { toolSlugSchema } from "@/lib/community/schema";

export async function requirePublicToolSlug(raw: string | null) {
  const parsed = toolSlugSchema.safeParse(raw ?? "");
  if (!parsed.success) return { ok: false as const };
  const tool = await getToolViewBySlug(parsed.data);
  if (!tool) return { ok: false as const };
  return { ok: true as const, slug: parsed.data };
}
