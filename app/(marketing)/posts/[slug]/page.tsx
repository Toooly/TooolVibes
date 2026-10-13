import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import type { Metadata } from "next";
import Link from "@/components/ui/app-link";
import { notFound } from "next/navigation";

import { MemberPreviewGate } from "@/components/account/member-preview-gate";
import { GuideMarkdown } from "@/components/guides/guide-markdown";
import { HeaderAccountControl } from "@/components/layout/header-account-control";
import { GuideArticleToc } from "@/components/guides/guide-article-toc";
import { GuideArticleHero } from "@/components/guides/guide-article-hero";
import { GuideArticleEnd } from "@/components/guides/guide-article-end";
import { GuideRelatedRail } from "@/components/guides/guide-related";
import { GuidePartnerExperience } from "@/components/guides/guide-partner-experience";
import {
  GuideCallout,
  GuideTakeawaysDisclosure,
  GuideByline,
} from "@/components/guides/guide-callout";
import {
  estimateReadingMinutes,
} from "@/components/guides/guide-card";
import { ReadingProgressBar } from "@/components/posts/reading-progress-bar";
import { TinyAdzInlineSlot } from "@/components/ads/tinyadz-inline-slot";
import { JsonLd } from "@/components/seo/json-ld";

import { siteConfig } from "@/lib/config/site";
import { getRelatedGuides } from "@/lib/data/guide-related";
import { getToolsForGuide } from "@/lib/graph/entity-relations";
import { EntityCardList } from "@/components/graph/entity-cards";
import { directoryTools } from "@/lib/data/tooolvibes-directory";
import { getGuideTopic } from "@/lib/data/guide-topics";
import {
  getEditorialPostBySlug,
  getPublishedEditorialPosts,
} from "@/lib/data/public-articles";
import { getToolBySlug } from "@/lib/data/public-tools";
import { getDirectoryToolBySlug } from "@/lib/data/tooolvibes-directory";
import {
  createPublicPageMetadata,
  defaultSocialImage,
  organizationLogoUrl,
} from "@/lib/seo/metadata";
import { shouldSuppressTinyAdzForPaidPartner } from "@/lib/monetization/commercial-density-policy";
import { partnerSegmentsForToolSlug } from "@/lib/sponsors/partner-context";
import {
  getMonetizationPlacement,
  isPublicMonetizationPlacement,
} from "@/lib/monetization/placements";
import { SponsorOpportunityLink } from "@/components/monetization/partner-placements";
import type { EditorialPostRecord } from "@/lib/types/article";

type EditorialPostPageProps = {
  params: Promise<{ slug: string }>;
};

const kindLabels: Record<EditorialPostRecord["kind"], string> = {
  "tool-writeup": "Analisi tool",
  guide: "Guida",
  editorial: "Blog",
};

export async function generateStaticParams() {
  const posts = await getPublishedEditorialPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: EditorialPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getEditorialPostBySlug(slug);
  if (!post) return {};

  return createPublicPageMetadata({
    title: post.title,
    description: post.dek || post.summary,
    path: `/posts/${post.slug}`,
    type: "article",
    publishedTime: post.published_at,
    modifiedTime: post.updated_at,
    authors: [post.author_name || siteConfig.name],
    image: post.cover_image_url
      ? {
          url: post.cover_image_url,
          alt: post.cover_image_alt ?? post.title,
        }
      : defaultSocialImage,
  });
}

export default async function EditorialPostPage({ params }: EditorialPostPageProps) {
  const { slug } = await params;
  const post = await getEditorialPostBySlug(slug);

  if (!post) {
    notFound();
  }

  let tool: Awaited<ReturnType<typeof getToolBySlug>> = null;

  let toolWebsiteHost = "";
  if (post.tool_slug) {
    tool = await getToolBySlug(post.tool_slug);
    const websiteUrl = tool?.urls.website ?? "";
    if (websiteUrl) {
      try {
        toolWebsiteHost = new URL(websiteUrl).hostname;
      } catch {
        toolWebsiteHost = "";
      }
    }
    if (!toolWebsiteHost) {
      const fallback = getDirectoryToolBySlug(post.tool_slug);
      const fallbackUrl = fallback?.externalUrl ?? "";
      if (fallbackUrl) {
        try {
          toolWebsiteHost = new URL(fallbackUrl).hostname;
        } catch {
          toolWebsiteHost = "";
        }
      }
    }
  }

  const isAuthoredPost = Boolean(post.content_markdown);
  const serverHeadings = (post.content_markdown ?? "")
    .split("\n")
    .filter((line) => line.startsWith("### "))
    .map((line) => line.replace(/^###\s+/, "").trim())
    .filter(Boolean)
    .slice(0, 5);
  const kindLabel = kindLabels[post.kind];
  const canonicalUrl = `${siteConfig.url}/posts/${post.slug}`;
  const subjectDirectoryTool = getDirectoryToolBySlug(post.tool_slug ?? post.slug);
  const partnerContext = {
    toolSlug: subjectDirectoryTool?.slug ?? post.tool_slug ?? undefined,
    tags: subjectDirectoryTool
      ? partnerSegmentsForToolSlug(subjectDirectoryTool.slug)
      : (post.tags ?? []),
    text: `${post.title} ${post.dek ?? ""}`,
  };
  const partnerRailHostId = `guide-partner-rail-${post.slug}`;
  const guidePartnerPlacement = getMonetizationPlacement(
    "guide-inline-promo",
    partnerContext,
  );
  const hasPaidGuidePartner = isPublicMonetizationPlacement(guidePartnerPlacement);
  const showArticleTinyAdz = !shouldSuppressTinyAdzForPaidPartner({
    hasPaidPartner: hasPaidGuidePartner,
    surface: "posts",
  });
  const readingMinutes = estimateReadingMinutes(post.content_markdown);
  const toolHrefForArticle = tool ? `/toools/${tool.slug}` : null;
  const topicLabel = getGuideTopic(post);

  const relatedGuides = await getRelatedGuides(post, 3);
const guideContent = [post.title, post.dek, post.summary].filter(Boolean).join(" ");
const relatedTools = getToolsForGuide(guideContent, directoryTools);

  const postStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: post.title,
        description: post.dek || post.summary,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": canonicalUrl,
        },
        datePublished: post.published_at,
        dateModified: post.updated_at,
        image: post.cover_image_url ?? defaultSocialImage.url,
        inLanguage: "it-IT",
        publisher: {
          "@type": "Organization",
          name: siteConfig.name,
          url: siteConfig.url,
          logo: {
            "@type": "ImageObject",
            url: organizationLogoUrl,
          },
        },
        author:
          post.author_name && post.author_name !== siteConfig.name
            ? { "@type": "Person", name: post.author_name }
            : { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
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
            name: "Guide",
            item: `${siteConfig.url}/posts`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: post.title,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={postStructuredData} />
      <ReadingProgressBar contentSelector="[data-guides-article-body]" />
      <div className="guides-article">
        <LocalizedAttributes><nav
          aria-label="Breadcrumb"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.4rem 0.6rem",
            alignItems: "center",
            color: "var(--guides-text-on-dark-muted)",
            fontSize: "0.78rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
            padding: "0 0.25rem",
          }}
        >
          <Link href="/posts" style={{ color: "var(--tv-accent-violet-on-dark)", textDecoration: "none" }}><LocalizedText>{"← Tutte le guide "}</LocalizedText></Link>
          <span aria-hidden>·</span>
          <span><LocalizedText>{kindLabel}</LocalizedText></span>
          <span aria-hidden>·</span>
          <span><LocalizedText>{topicLabel}</LocalizedText></span>
        </nav></LocalizedAttributes>

        <GuideArticleHero
          post={post}
          readingMinutes={readingMinutes}
          topicLabel={topicLabel}
        />

        {tool ? (
          <LocalizedAttributes><figure className="guides-article__hero-media" aria-label={`Visuale prodotto: ${tool.name}`}>
            <span className="guides-article__hero-media-visual" aria-hidden="true">
              {toolWebsiteHost ? (
                // eslint-disable-next-line @next/next/no-img-element
                <LocalizedAttributes><img
                  src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(toolWebsiteHost)}&sz=128`}
                  alt=""
                  loading="eager"
                  decoding="async"
                /></LocalizedAttributes>
              ) : (
                <span className="guides-article__hero-media-glyph" aria-hidden="true">
                  {tool.name.charAt(0).toUpperCase()}
                </span>
              )}
            </span>
            <figcaption className="guides-article__hero-media-caption">
              {tool.name} · <LocalizedText>{topicLabel}</LocalizedText>
            </figcaption>
          </figure></LocalizedAttributes>
        ) : null}

        {isAuthoredPost && serverHeadings.length > 0 ? (
          <LocalizedAttributes><nav className="guides-article__hero-index" aria-label="In questa guida">
            <p className="guides-article__hero-index-title"><LocalizedText>{"In questa guida"}</LocalizedText></p>
            <ol>
              {serverHeadings.slice(0, 5).map((heading, index) => (
                <li key={heading}>
                  {index + 1}. <LocalizedText>{heading}</LocalizedText>
                </li>
              ))}
            </ol>
          </nav></LocalizedAttributes>
        ) : null}

        {isAuthoredPost ? (
          <div className="guides-article__dark-meta">
            <GuideByline
              author={post.author_name}
              publishedAt={post.published_at}
              updatedAt={post.updated_at}
              readingMinutes={readingMinutes}
            />

            <GuideTakeawaysDisclosure items={post.highlights} />
          </div>
        ) : null}

        <div className="guides-article__layout">
          <div className="guides-article-mobileheader">
            <Link href="/posts" className="guides-article-mobileheader__back"><LocalizedText>{"← Tutte le guide "}</LocalizedText></Link>
            <HeaderAccountControl
              linkClassName="guides-article-mobileheader__account"
              menuClassName="guides-article-mobileheader__menu"
              panelClassName="guides-article-mobileheader__panel"
              showLabel={false}
            />
          </div>

          <div className="guides-article__main">
            {isAuthoredPost ? (
              <article
                className="guides-article__body"
                data-guides-article-body
                aria-labelledby="guide-article-title"
              >
                <LocalizedAttributes><MemberPreviewGate
                  title="Continua nel tuo spazio"
                  body="Il resto della guida resta nel tuo spazio, insieme alle decisioni e alle note sul tool."
                >
                  <GuideMarkdown content={post.content_markdown ?? ""} />
                  <LocalizedAttributes><GuideCallout kind="decision" title="In sintesi">
                    <LocalizedText>{post.summary}</LocalizedText>
                  </GuideCallout></LocalizedAttributes>
                </MemberPreviewGate></LocalizedAttributes>
              </article>
            ) : (
              <article className="guides-article__body" data-guides-article-body>
                <p style={{ color: "var(--guides-text-soft)" }}><LocalizedText>{post.summary}</LocalizedText></p>
                <LocalizedAttributes><MemberPreviewGate
                  title="Continua nel tuo spazio"
                  body="Il resto della guida resta nel tuo spazio."
                >
                  {post.details.length > 0 ? (
                    <ul>
                      {post.details.map((d) => (
                        <li key={d}><LocalizedText>{d}</LocalizedText></li>
                      ))}
                    </ul>
                  ) : null}
                </MemberPreviewGate></LocalizedAttributes>
              </article>
            )}

            <GuideArticleEnd
              currentSlug={post.slug}
              relatedPosts={relatedGuides}
            />

            {/* Partner & sponsor placements are owned by the monetization team.
                Keep them OUT of the guides-styled content; surface them as
                a dedicated band that the partner system controls. */}
            <GuidePartnerExperience
              context={partnerContext}
              railHostId={partnerRailHostId}
              trackerRoute={`/posts/${post.slug}`}
            />

            {showArticleTinyAdz ? (
              <TinyAdzInlineSlot placement="article-body" />
            ) : null}

            <div className="internal-editorial-page__sponsor-opportunity">
              <SponsorOpportunityLink placementId="posts-sponsor-opportunity" route={`/posts/${slug}`} />
            </div>
          </div>

          <div className="guides-article__rail">
            <GuideArticleToc
              readingMinutes={readingMinutes}
            />
            <div
              id={partnerRailHostId}
              className="guides-article__partner-rail"
              data-guide-partner-rail-host
            />
            {relatedTools.length > 0 ? (
  <LocalizedAttributes><section className="guides-related-tools" aria-label="Tool correlati">
    <p className="td-final-section-eyebrow"><LocalizedText>{"Tool correlati"}</LocalizedText></p>
    <h2 className="td-final-section-title"><LocalizedText>{"Tool menzionati in questa guida"}</LocalizedText></h2>
    <EntityCardList entities={relatedTools.map((t) => ({ href: `/toools/${t.slug}`, title: t.name, kind: "tool" as const }))} />
  </section></LocalizedAttributes>
) : null}
<GuideRelatedRail
              tool={tool}
              toolHref={toolHrefForArticle}
            />
          </div>
        </div>
      </div>
    </>
  );
}
