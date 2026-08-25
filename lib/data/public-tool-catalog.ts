import "server-only";

import { directoryTools } from "@/lib/data/tooolvibes-directory";
import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-types";

const publicToolCatalogSnapshot: readonly PublicToolCatalogItem[] =
  directoryTools.map((tool) => ({
    slug: tool.slug,
    name: tool.name,
    categoryLabel: tool.categoryLabel,
    shortDescription: tool.shortDescription,
    featured: tool.featured === true,
    toolOfWeek: tool.toolOfWeek === true,
    tags: tool.tags,
    levelLabel: tool.levelLabel,
    domain: tool.domain,
    accentFrom: tool.accentFrom,
    accentTo: tool.accentTo,
  }));

export function getPublicToolCatalogSnapshot(): readonly PublicToolCatalogItem[] {
  return publicToolCatalogSnapshot;
}
