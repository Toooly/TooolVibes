import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-types";

export function toolName(
  catalog: readonly PublicToolCatalogItem[],
  slug: string,
) {
  return catalog.find((item) => item.slug === slug)?.name ?? slug;
}
