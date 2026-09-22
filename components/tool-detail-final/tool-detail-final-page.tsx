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

import { HeaderAccountControl } from "@/components/layout/header-account-control";

import { ToolDetailHero } from "./tool-detail-hero";
import { ToolDetailDecisionBrief } from "./tool-detail-decision-brief";
import { ToolDetailExtendedContent } from "./tool-detail-extended-content";
import { ToolDetailDecisionNav } from "./tool-detail-decision-nav";
import { ExperienceSection } from "@/components/community/experience-section";
import { ToolDetailAlternatives } from "./tool-detail-alternatives";
import { TinyAdzInlineSlot } from "@/components/ads/tinyadz-inline-slot";
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
        <div className="td-final-mobileheader">
          <Link href="/archivio" className="td-final-mobileheader__back">
            ← Torna al catalogo
          </Link>
          <div className="td-final-mobileheader__actions">
            <HeaderAccountControl linkClassName="td-final-mobileheader__back" menuClassName="td-final-mobileheader__menu" panelClassName="td-final-mobileheader__panel" />
          </div>
        </div>
        <section
          id="td-final-overview"
          className="td-final-hero"
          aria-labelledby="td-final-tool-name"
        >
          <div className="td-final-hero__inner">
            <ToolDetailHero tool={tool} isAffiliateLink={isAffiliateLink} />
          </div>
        </section>

        <ToolDetailDecisionNav showAlternatives={relatedTools.length > 0} />
        <ToolDetailDecisionBrief tool={tool} />
        <ToolDetailExtendedContent
          tool={tool}
          experiences={
            showExperiences ? (
              <ExperienceSection toolSlug={tool.slug} catalogNames={catalogNames} />
            ) : null
          }
        />
        <TinyAdzInlineSlot placement="tool-detail" />
        <ToolDetailAlternatives current={tool} related={relatedTools} />
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
