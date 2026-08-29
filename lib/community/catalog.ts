import "server-only";

import { getPublicToolViews, getToolViewBySlug } from "@/lib/data/public-tools";
import { toolSlugSchema } from "@/lib/community/schema";

export async function requirePublicToolSlug(raw: string | null) {
  const parsed = toolSlugSchema.safeParse(raw ?? "");
  if (!parsed.success) return { ok: false as const };
  const tool = await getToolViewBySlug(parsed.data);
  if (!tool) return { ok: false as const };
  return { ok: true as const, slug: parsed.data };
}

export async function resolveCatalogToolLabels(slugs: string[]) {
  const unique = Array.from(new Set(slugs));
  const views = await getPublicToolViews().catch(() => []);
  const bySlug = new Map(views.map((tool) => [tool.slug, tool.name]));
  return unique.reduce<Record<string, { name: string; missing: boolean }>>(
    (acc, slug) => {
      const name = bySlug.get(slug);
      acc[slug] = name
        ? { name, missing: false }
        : { name: "Tool non più nel catalogo", missing: true };
      return acc;
    },
    {},
  );
}
