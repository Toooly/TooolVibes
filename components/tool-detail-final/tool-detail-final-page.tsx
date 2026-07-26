import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublicToolViews, getRelatedToolViewsBySlug, getToolViewBySlug } from "@/lib/data/public-tools";
import { siteConfig } from "@/lib/config/site";

import { ToolDetailHero } from "./tool-detail-hero";
import { ToolDetailScore } from "./tool-detail-score";
import { ToolDetailEditorial } from "./tool-detail-editorial";
import { ToolDetailDecisionNav } from "./tool-detail-decision-nav";
import { ToolDetailInformation } from "./tool-detail-information";
import { ToolDetailSignal } from "./tool-detail-signal";
import { ToolDetailAlternatives } from "./tool-detail-alternatives";
import { ToolDetailFooter } from "./tool-detail-footer";

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

  return {
    title: `${tool.name} — ${tool.categoryLabel}`,
    description: tool.shortDescription,
    openGraph: {
      title: `${tool.name} | ${siteConfig.name}`,
      description: tool.shortDescription,
      url: `${siteConfig.url}/toools/${tool.slug}`,
    },
  };
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

  return (
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
      <ToolDetailInformation tool={tool} />
      <ToolDetailSignal tool={tool} />
      <ToolDetailAlternatives current={tool} related={relatedTools} />
      <ToolDetailFooter />
    </div>
  );
}
