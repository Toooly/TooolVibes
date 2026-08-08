/**
 * Topic resolver for TooolVibes Guides.
 *
 * The guide catalog is small and curated; we keep a hand-maintained mapping
 * from slug → topic label so the index page, related-rail and the topic
 * filter stay coherent. When a guide does not have a slug here, we fall back
 * to the post tags (first tag) or "Tool".
 */
import type { EditorialPostRecord } from "@/lib/types/article";

const SLUG_TOPIC: Record<string, string> = {
  betterpic: "Immagini AI",
  "frase-ai": "SEO & content",
  "jenny-ai": "Scrittura",
  "reclaim-ai": "Produttività",
  "windsor-ai": "Marketing data",
  reachifyme: "LinkedIn",
  "flowise-ai": "Agenti AI",
  "lemon-squeezy": "SaaS business",
  agentxai: "Agenti AI",
  "omi-app-ai": "Hardware AI",
  wegic: "AI websites",
  tolt: "SaaS business",
};

export function getGuideTopic(post: EditorialPostRecord): string {
  if (post.kind !== "guide") return "Tool";
  const fromMap = SLUG_TOPIC[post.slug];
  if (fromMap) return fromMap;
  if (post.tags && post.tags.length > 0) return post.tags[0];
  if (post.tool_slug) return "Tool";
  return "Guida";
}

export function getGuideTopicOrder(topic: string): number {
  // Stable visual order for topic chips.
  const order = [
    "Immagini AI",
    "Scrittura",
    "SEO & content",
    "LinkedIn",
    "Produttività",
    "Marketing data",
    "Agenti AI",
    "AI websites",
    "SaaS business",
    "Hardware AI",
    "Tool",
    "Guida",
  ];
  const idx = order.indexOf(topic);
  return idx === -1 ? 99 : idx;
}
