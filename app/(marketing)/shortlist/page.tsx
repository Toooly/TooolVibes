import type { Metadata } from "next";

import { Shortlist3DWrapper } from "@/components/3d-maestoso/shortlist-3d-wrapper";
import { MobileShortlistBoard } from "@/components/tools/mobile-shortlist-board";
import { getPublishedTools } from "@/lib/data/public-tools";
import { directoryTools } from "@/lib/data/tooolvibes-directory";
import type { ToolCategory, ToolRecord } from "@/lib/types/tool";

export const metadata: Metadata = {
  title: "Salvati",
  description: "Raccogli, organizza e confronta i tool salvati nella tua shortlist.",
  alternates: { canonical: "/shortlist" },
};

function directoryToolToRecord(tool: (typeof directoryTools)[number]): ToolRecord {
  return {
    id: tool.id,
    name: tool.name,
    slug: tool.slug,
    category: tool.categoryLabel as ToolCategory,
    tags: tool.tags,
    short_description_it: tool.shortDescription || tool.tldr,
    description_it: tool.longDescription || tool.description,
    website_url: tool.externalUrl,
    tooolvibes_post_url: `/toools/${tool.slug}`,
    affiliate_url: tool.affiliateUrl ?? null,
    cover_image_url: "",
    source: tool.sourceSite,
    date_discovered: tool.publishedAt,
    is_featured: tool.featured,
    is_published: true,
    editorial_state: tool.featured ? "In evidenza" : "Nuovo in archivio",
    pricing: undefined,
    platforms: [],
    best_for: tool.idealUseCase,
    editorial_note: tool.editorialReview,
    why_here: tool.whyItMatters,
    use_cases: tool.useCases,
    strengths: tool.highlights,
    cautions: [],
    editorial_scorecard: {},
    created_at: tool.publishedAt,
    updated_at: tool.publishedAt,
  };
}

export default async function ShortlistPage() {
  const publishedTools = await getPublishedTools();
  const toolsBySlug = new Map<string, ToolRecord>();

  for (const tool of directoryTools.map(directoryToolToRecord)) {
    toolsBySlug.set(tool.slug, tool);
  }

  for (const tool of publishedTools) {
    toolsBySlug.set(tool.slug, tool);
  }

  return (
    <>
      <Shortlist3DWrapper />
      <MobileShortlistBoard tools={[...toolsBySlug.values()]} />
    </>
  );
}
