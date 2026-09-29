import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/lib/config/site";
import { getPublicToolViews, getRelatedToolViewsBySlug, getToolViewBySlug } from "@/lib/data/public-tools";
import { isCommunityReadEnabled } from "@/lib/community/read-flag";
import {
  createPublicPageMetadata,
  defaultSocialImage,
} from "@/lib/seo/metadata";

import Link from "next/link";


import { ToolDetailHero } from "./tool-detail-hero";
import { ToolDetailDecisionBrief } from "./tool-detail-decision-brief";
import { ToolDetailExtendedContent } from "./tool-detail-extended-content";
import { ToolDetailDecisionNav } from "./tool-detail-decision-nav";
import { ExperienceSection } from "@/components/community/experience-section";
import { ToolDetailAlternatives } from "./tool-detail-alternatives";
import { ToolDetailPricing } from "./tool-detail-pricing";
import { ToolDetailInformation } from "./tool-detail-information";
import { TinyAdzInlineSlot } from "@/components/ads/tinyadz-inline-slot";
import { buildToolDetailSections, getNavSections } from "@/lib/graph/section-registry";
import { getGuidesForTool, getStacksForTool } from "@/lib/graph/entity-relations";
import { EntityCardList } from "@/components/graph/entity-cards";
import {
  PartnerToolCard,
} from "@/components/monetization/partner-placements";

/**
 * ToolDetailFinalPage — public cognitive compression.
 *
 * Layers:
 *   1. Hero            identity, deck, score, best-for, level, actions
 *   2. Snapshot        Fa per te / Non fa per te / trade-off / verdetto
 *   3. Approfondisci   progressive disclosure (details/summary)
 *   4. Alternatives    one comparison section
 *   5. Sponsor         PartnerToolCard, separated
 *
 * The page is server-rendered (SEO, static params, structured data).
 * The action surface and alternative cards are client islands that
 * read the canonical workspace store.
 */

type ToolPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const tools = await getPublicToolViews();
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolViewBySlug(slug);

  if (!tool) return {};

  return createPublicPageMetadata({
    title: `${tool.name} — ${tool.categoryLabel}`,
    description: tool.shortDescription,
    path: `/toools/${tool.slug}`,
    image: tool.publicTool.media.coverImageUrl
      ? {
          url: tool.publicTool.media.coverImageUrl,
          alt: tool.name,
        }
      : defaultSocialImage,
  });
}

function hasAffiliateSignal(href: string | null | undefined) {
  if (!href) return false;
  try {
    const url = new URL(href);
    return ["aff", "affiliate", "ref", "referral", "via"].some((key) => url.searchParams.has(key));
  } catch {
    return false;
  }
}

export async function ToolDetailFinalPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = await getToolViewBySlug(slug);

  if (!tool) {
    notFound();
  }

  const relatedTools = await getRelatedToolViewsBySlug(tool.slug, 3);
  const hasExtendedContent = Boolean(tool.extendedContent && tool.extendedContent.trim().length > 0);
  const hasTechnicalData = Boolean(tool.categoryLabel || tool.levelLabel || tool.domain);
  const hasPricing = Boolean((tool.publicTool as Record<string, unknown>)?.pricingPlans) || hasExtendedContent;
  let relatedGuides: Array<{ slug: string; name: string; relation: string }> = [];
  try {
    const { getGuidePosts } = await import("@/lib/data/public-articles");
    const allGuides = await getGuidePosts();
    const guideData = allGuides.map((g) => ({ slug: g.slug, title: g.title, content: g.summary ?? g.dek ?? "" }));
    relatedGuides = getGuidesForTool(tool.slug, guideData);
  } catch {}
  const relatedStacks = getStacksForTool(tool.slug, []);
  const sections = buildToolDetailSections({
    hasExtendedContent: hasExtendedContent,
    hasRelatedTools: relatedTools.length > 0,
    hasRelatedGuides: relatedGuides.length > 0,
    hasRelatedStacks: relatedStacks.length > 0,
    hasTechnicalData: hasTechnicalData,
    hasPricing: hasPricing,
  });
  const navSections = getNavSections(sections);
  const showExperiences = isCommunityReadEnabled();
  const catalogNames = showExperiences
    ? Object.fromEntries((await getPublicToolViews()).map((item) => [item.slug, item.name]))
    : {};
  const isAffiliateLink = Boolean(tool.affiliateUrl) || hasAffiliateSignal(tool.url);
  const canonicalUrl = `${siteConfig.url}/toools/${tool.slug}`;
  const toolStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: tool.name,
        url: canonicalUrl,
        description: tool.shortDescription,
        applicationCategory: tool.categoryLabel,
        inLanguage: "it-IT",
        brand: {
          "@type": "Organization",
          name: siteConfig.name,
          url: siteConfig.url,
        },
        operatingSystem:
          tool.publicTool.attributes.platforms.length > 0
            ? tool.publicTool.attributes.platforms.join(", ")
            : undefined,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "TooolVibes",
            item: siteConfig.url,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Catalogo",
            item: `${siteConfig.url}/archivio`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: tool.name,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={toolStructuredData} />
      <div className="td-final-page">
        <nav className="td-final-breadcrumb" aria-label="Breadcrumb">
          <Link href="/archivio" className="td-final-breadcrumb__link">← Catalogo</Link>
          <span className="td-final-breadcrumb__sep" aria-hidden="true">/</span>
          <span className="td-final-breadcrumb__current">{tool.name}</span>
        </nav>
        <section
          id="td-final-overview" data-td-section data-td-section-target="td-final-overview" data-td-section-title="Panoramica"
          className="td-final-hero"
          aria-labelledby="td-final-tool-name"
        >
          <div className="td-final-hero__inner">
            <ToolDetailHero tool={tool} isAffiliateLink={isAffiliateLink} />
          </div>
        </section>

        <ToolDetailDecisionNav showAlternatives={relatedTools.length > 0} navSections={navSections} />
        <ToolDetailDecisionBrief tool={tool} />
        <ToolDetailExtendedContent
          tool={tool}
          experiences={
            showExperiences ? (
              <ExperienceSection toolSlug={tool.slug} catalogNames={catalogNames} />
            ) : null
          }
        />
        <ToolDetailPricing tool={tool} />
        <ToolDetailAlternatives current={tool} related={relatedTools} />
        {relatedGuides.length > 0 ? (
          <section id="td-final-related-guides" data-td-section data-td-section-target="td-final-related-guides" data-td-section-title="Guide correlate" className="td-final-related-guides">
            <p className="td-final-section-eyebrow">Guide correlate</p>
            <h2 className="td-final-section-title">Approfondisci questo tool</h2>
            <EntityCardList entities={relatedGuides.map((g) => ({ href: `/posts/${g.slug}`, title: g.name, kind: "guide" as const }))} />
          </section>
        ) : null}
        {relatedStacks.length > 0 ? (
          <section id="td-final-related-stacks" data-td-section data-td-section-target="td-final-related-stacks" data-td-section-title="In questi Stack" className="td-final-related-stacks">
            <p className="td-final-section-eyebrow">In questi Stack</p>
            <h2 className="td-final-section-title">Presente in questi Stack</h2>
            <EntityCardList entities={relatedStacks.map((s) => ({ href: `/collections/${s.slug}`, title: s.name, subtitle: `${s.toolCount} tool`, kind: "stack" as const }))} />
          </section>
        ) : null}
        <ToolDetailInformation tool={tool} />
        <TinyAdzInlineSlot placement="tool-detail" />
        {slug !== "taylora" ? (
          <div className="td-final-page__partner">
            <PartnerToolCard
              placementKey="tool-sponsored-alternative"
              trackerRoute={`/toools/${slug}`}
              context={{
                toolSlug: slug,
                tags: [...tool.filterGroups, ...tool.tags],
                text: `${tool.name} ${tool.shortDescription ?? ""}`,
              }}
            />
          </div>
        ) : null}
      </div>
    </>
  );
}
