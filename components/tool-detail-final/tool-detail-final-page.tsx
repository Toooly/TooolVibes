import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/lib/config/site";
import { getPublicToolViews, getRelatedToolViewsBySlug, getToolViewBySlug } from "@/lib/data/public-tools";
import {
  createPublicPageMetadata,
  defaultSocialImage,
} from "@/lib/seo/metadata";

import { ToolDetailHero } from "./tool-detail-hero";
import { ToolDetailScore } from "./tool-detail-score";
import { ToolDetailEditorial } from "./tool-detail-editorial";
import { ToolDetailExtendedContent } from "./tool-detail-extended-content";
import { ToolDetailDecisionNav } from "./tool-detail-decision-nav";
import { ToolDetailInformation } from "./tool-detail-information";
import { ToolDetailSignal } from "./tool-detail-signal";
import { ToolDetailAlternatives } from "./tool-detail-alternatives";
import { TinyAdzInlineSlot } from "@/components/ads/tinyadz-inline-slot";
import { ToolDetailFooter } from "./tool-detail-footer";
import {
  PartnerToolCard,
  SponsorOpportunityLink,
} from "@/components/monetization/partner-placements";

/**
 * ToolDetailFinalPage — clean baseline owner.
 *
 * One new orchestrator, one isolated namespace (.td-final-*),
 * zero legacy component imports, zero premium-button mappings.
 *
 * Sections composed here:
 *   A. ToolDetailHero        (Identity + Action Surface)
 *   B. ToolDetailScore       (Score Instrument, rendered inside hero grid 7/5)
 *   C. ToolDetailEditorial   (Editorial Rationale)
 *   D. ToolDetailDecisionNav (In-page nav)
 *   E. ToolDetailInformation (Product Information)
 *   F. ToolDetailSignal      (Trend / Signal)
 *   G. ToolDetailAlternatives (Decision Desk)
 *   ToolDetailFooter         (route-level end marker)
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
        <section
          id="td-final-overview"
          className="td-final-hero"
          aria-labelledby="td-final-tool-name"
        >
          <div className="td-final-hero__inner">
            <ToolDetailHero tool={tool} isAffiliateLink={isAffiliateLink} />
            <ToolDetailScore tool={tool} />
          </div>
        </section>

        <ToolDetailDecisionNav showAlternatives={relatedTools.length > 0} />
        <ToolDetailEditorial tool={tool} />
        <ToolDetailExtendedContent
          content={tool.extendedContent}
          toolName={tool.name}
        />
        <TinyAdzInlineSlot placement="tool-detail" />
        <ToolDetailInformation tool={tool} />
        <ToolDetailSignal tool={tool} />
        <ToolDetailAlternatives current={tool} related={relatedTools} />
        {slug !== "taylora" ? (
          <div className="td-final-page__partner">
            <PartnerToolCard
              placementKey="tool-sponsored-alternative"
              trackerRoute={`/toools/${slug}`}
            />
            <SponsorOpportunityLink />
          </div>
        ) : null}
        <ToolDetailFooter />
      </div>
    </>
  );
}
