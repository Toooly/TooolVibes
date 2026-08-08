import { getDirectoryToolBySlug } from "@/lib/data/tooolvibes-directory";

/**
 * Structured partner-context tags for direct-sponsor matching.
 *
 * The contextual resolver scores a campaign by matching the subject catalogue
 * segments against the campaign declared context. Free-text title/summary
 * alone is too weak to reach the relevance threshold, so surfaces that only
 * passed free text (collections, hand-written guides) never matched a partner
 * even when a relevant one existed.
 *
 * These helpers derive canonical segment tags from the directory so the
 * resolver receives structured metadata instead of an informal string.
 * Deterministic and inspectable - no embeddings, no hidden matching.
 */

/** Segments of one directory tool by slug; empty when the slug is unknown. */
export function partnerSegmentsForToolSlug(slug: string): string[] {
  const tool = getDirectoryToolBySlug(slug);
  return tool ? [...tool.segments] : [];
}

/**
 * Union of catalogue segments across a set of directory tools (for example the
 * tools inside a curated collection). Unknown slugs are skipped so a collection
 * with uncatalogued tools never forces a match.
 */
export function partnerSegmentsForToolSlugs(
  slugs: readonly string[],
): string[] {
  const segments = new Set<string>();
  for (const slug of slugs) {
    for (const segment of partnerSegmentsForToolSlug(slug)) {
      segments.add(segment);
    }
  }
  return [...segments];
}
