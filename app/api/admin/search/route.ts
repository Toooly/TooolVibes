import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/session";
import { getAdminArticlesRuntime } from "@/lib/admin/article-queries";
import { getAdminCollectionsRuntime } from "@/lib/admin/collection-queries";
import { getAdminToolsRuntime } from "@/lib/admin/tool-queries";
import { getManagedCampaigns } from "@/lib/sponsors/commercial-overrides";
import { getManagedPartners } from "@/lib/sponsors/managed-commercial";

export async function GET(request: Request) {
  await requireAdminSession();
  const q = new URL(request.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
  const [tools, articles, collections] = await Promise.all([
    getAdminToolsRuntime(),
    getAdminArticlesRuntime(),
    getAdminCollectionsRuntime(),
  ]);
  const match = (value: string) => !q || value.toLowerCase().includes(q);
  return NextResponse.json({
    tools: tools.tools
      .filter((tool) => match(`${tool.name} ${tool.slug}`))
      .slice(0, 6)
      .map((tool) => ({ id: tool.id, label: tool.name, href: `/admin/tools/${tool.id}/edit` })),
    articles: articles.articles
      .filter((article) => match(`${article.title} ${article.slug}`))
      .slice(0, 6)
      .map((article) => ({ id: article.id, label: article.title, href: `/admin/articles/${article.id}/edit` })),
    collections: collections.collections
      .filter((collection) => match(`${collection.title} ${collection.slug}`))
      .slice(0, 6)
      .map((collection) => ({ id: collection.id, label: collection.title, href: `/admin/collections/${collection.id}` })),
    partners: getManagedPartners()
      .filter((partner) => match(`${partner.name} ${partner.id}`))
      .slice(0, 6)
      .map((partner) => ({ id: partner.id, label: partner.name, href: `/admin/commercial/partners/${partner.id}` })),
    campaigns: getManagedCampaigns()
      .filter((campaign) => match(`${campaign.name} ${campaign.id}`))
      .slice(0, 6)
      .map((campaign) => ({ id: campaign.id, label: campaign.name, href: `/admin/commercial/campaigns/${campaign.id}` })),
  });
}
