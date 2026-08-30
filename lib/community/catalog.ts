import "server-only";

import {
  findPublicToolIndexEntry,
  PUBLIC_TOOL_SLUG_INDEX,
} from "@/lib/data/public-tool-slug-index";
import { toolSlugSchema } from "@/lib/community/schema";

export async function requirePublicToolSlug(raw: string | null) {
  const parsed = toolSlugSchema.safeParse(raw ?? "");
  if (!parsed.success) return { ok: false as const };
  const tool = findPublicToolIndexEntry(parsed.data);
  if (!tool) return { ok: false as const };
  return { ok: true as const, slug: parsed.data };
}

export async function resolveCatalogToolLabels(slugs: string[]) {
  const unique = Array.from(new Set(slugs));
  const bySlug = new Map(
    PUBLIC_TOOL_SLUG_INDEX.map((tool) => [tool.slug, tool.name]),
  );
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
