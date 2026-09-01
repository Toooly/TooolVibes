import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MemberPreviewGate } from "@/components/account/member-preview-gate";
import { GuideMarkdown } from "@/components/guides/guide-markdown";
import { GuideArticleToc } from "@/components/guides/guide-article-toc";
import { GuideArticleHero } from "@/components/guides/guide-article-hero";
import { GuideArticleEnd } from "@/components/guides/guide-article-end";
import { GuideRelatedRail } from "@/components/guides/guide-related";
import { GuidePartnerExperience } from "@/components/guides/guide-partner-experience";
import {
  GuideCallout,
  GuideKeyTakeaways,
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
} from "@/lib/seo/metadata";
import { shouldSuppressTinyAdzForPaidPartner } from "@/lib/monetization/commercial-density-policy";
import { partnerSegmentsForToolSlug } from "@/lib/sponsors/partner-context";
import {
  getMonetizationPlacement,
  isPublicMonetizationPlacement,
} from "@/lib/monetization/placements";
import { SponsorOpportunityLink } from "@/components/monetization/partner-placements";
import type { EditorialPostRecord } from "@/lib/types/article";
import type { TocItem as TocItemType } from "@/components/guides/guide-article-toc";

type EditorialPostPageProps = {
  params: Promise<{ slug: string }>;
};

const kindLabels: Record<EditorialPostRecord["kind"], string> = {
  "tool-writeup": "Analisi tool",
  guide: "Guida",
  editorial: "Blog",
};

function dedupeHeadings(headings: TocItemType[]): TocItemType[] {
  const seen = new Set<string>();
  return headings.filter((h) => {
    if (seen.has(h.id)) return false;
    seen.add(h.id);
    return true;
  });
}

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

  if (post.tool_slug) {
    tool = await getToolBySlug(post.tool_slug);
  }

  const isAuthoredPost = Boolean(post.content_markdown);
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
        publisher: {
          "@type": "Organization",
          name: siteConfig.name,
          url: siteConfig.url,
        },
        author: {
          "@type": "Organization",
          name: post.author_name ?? "TooolVibes",
        },
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

  // Heading collector ref; populated during render.
  const headingsRef: { current: TocItemType[] } = { current: [] };
  const onHeadings = (next: TocItemType[]) => {
    headingsRef.current = dedupeHeadings(next);
  };

  return (
    <>
      <JsonLd data={postStructuredData} />
      <ReadingProgressBar contentSelector="[data-guides-article-body]" />
      <div className="guides-article">
        <nav
          aria-label="Breadcrumb"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.4rem 0.6rem",
            alignItems: "center",
            color: "var(--guides-text-muted)",
            fontSize: "0.78rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
            padding: "0 0.25rem",
          }}
        >
          <Link href="/posts" style={{ color: "var(--guides-accent-strong)", textDecoration: "none" }}>
            ← Tutte le guide
          </Link>
          <span aria-hidden>·</span>
          <span>{kindLabel}</span>
          <span aria-hidden>·</span>
          <span>{topicLabel}</span>
        </nav>

        <GuideArticleHero
          post={post}
          tool={tool}
          toolHref={toolHrefForArticle}
          readingMinutes={readingMinutes}
          topicLabel={topicLabel}
          relatedPosts={relatedGuides}
        />

        <div className="guides-article__layout">
          <div className="guides-article__main">
            {isAuthoredPost ? (
              <article
                className="guides-article__body"
                data-guides-article-body
                aria-labelledby="guide-article-title"
              >
                <GuideByline
                  author={post.author_name}
                  publishedAt={post.published_at}
                  updatedAt={post.updated_at}
                  readingMinutes={readingMinutes}
                />

                {post.highlights.length > 0 ? (
                  <GuideKeyTakeaways
                    title="Cosa otterrai da questa guida"
                    items={post.highlights}
                  />
                ) : null}

                <MemberPreviewGate
                  title="Continua nel tuo spazio"
                  body="Il resto della guida resta nel tuo spazio, insieme alle decisioni e alle note sul tool."
                >
                  <GuideMarkdown content={post.content_markdown ?? ""} onHeadings={onHeadings} />
                  <GuideCallout kind="decision" title="In sintesi">
                    {post.summary}
                  </GuideCallout>
                </MemberPreviewGate>
              </article>
            ) : (
              <article className="guides-article__body" data-guides-article-body>
                <p style={{ color: "var(--guides-text-soft)" }}>{post.summary}</p>
                <MemberPreviewGate
                  title="Continua nel tuo spazio"
                  body="Il resto della guida resta nel tuo spazio."
                >
                  {post.details.length > 0 ? (
                    <ul>
                      {post.details.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  ) : null}
                </MemberPreviewGate>
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
              items={headingsRef.current}
              readingMinutes={readingMinutes}
            />
            <div
              id={partnerRailHostId}
              className="guides-article__partner-rail"
              data-guide-partner-rail-host
            />
            <GuideRelatedRail
              post={post}
              tool={tool}
              toolHref={toolHrefForArticle}
              relatedPosts={relatedGuides}
              topicLabel={topicLabel}
            />
          </div>
        </div>
      </div>
    </>
  );
}
