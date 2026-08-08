import "server-only";

import { cache } from "react";

import { getGuidePosts, getEditorialPostBySlug } from "@/lib/data/public-articles";
import { getGuideTopic } from "@/lib/data/guide-topics";
import type { EditorialPostRecord } from "@/lib/types/article";

/**
 * Return guides related to the given post.
 * Strategy:
 * 1. Same topic, different slug.
 * 2. If the post has a tool_slug, prefer guides whose tool_slug matches.
 * 3. If the post has related_collection_slugs, use them as a secondary signal.
 * 4. Fall back to most recent.
 */
export const getRelatedGuides = cache(async (
  post: EditorialPostRecord,
  limit = 3,
): Promise<EditorialPostRecord[]> => {
  const all = await getGuidePosts();
  const topic = getGuideTopic(post);

  const sameTopic = all.filter(
    (g) => g.slug !== post.slug && getGuideTopic(g) === topic,
  );

  const sameTool = post.tool_slug
    ? all.filter(
        (g) => g.slug !== post.slug && g.tool_slug === post.tool_slug,
      )
    : [];

  // Merge, dedupe by slug, keep order: sameTool → sameTopic → rest.
  const seen = new Set<string>([post.slug]);
  const merged: EditorialPostRecord[] = [];

  for (const g of sameTool) {
    if (!seen.has(g.slug)) {
      seen.add(g.slug);
      merged.push(g);
    }
  }
  for (const g of sameTopic) {
    if (!seen.has(g.slug)) {
      seen.add(g.slug);
      merged.push(g);
    }
  }
  for (const g of all) {
    if (!seen.has(g.slug)) {
      seen.add(g.slug);
      merged.push(g);
    }
    if (merged.length >= limit) break;
  }

  return merged.slice(0, limit);
});

export const getRelatedGuidesForSlug = cache(async (
  slug: string,
  limit = 3,
): Promise<EditorialPostRecord[]> => {
  const post = await getEditorialPostBySlug(slug);
  if (!post) return [];
  return getRelatedGuides(post, limit);
});
