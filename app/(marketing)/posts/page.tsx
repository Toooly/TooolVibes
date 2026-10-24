import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import Link from "@/components/ui/app-link";

import { GuideMasthead } from "@/components/guides/guide-masthead";
import { GuideCard } from "@/components/guides/guide-card";
import { GuideFeaturedSection } from "@/components/guides/guide-featured-section";
import {
  GuideGridSection,
  type GuideGridItem,
} from "@/components/guides/guide-grid-section";
import { estimateReadingMinutes } from "@/lib/editorial/reading-time";
import { getGuideTopic, getGuideTopicOrder } from "@/lib/data/guide-topics";
import { getPublishedTools } from "@/lib/data/public-tools";
import {
  getGuidePosts,
} from "@/lib/data/public-articles";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPublicPageMetadata({
  title: "Guide per decidere i tool",
  description:
    "Guide editoriali su tool AI, SaaS e flussi di lavoro. Scritte per chi deve scegliere.",
  path: "/posts",
});

const FEATURED_SLUGS = [
  "frase-ai",
  "jenny-ai",
  "lemon-squeezy",
  "tolt",
  "wegic",
  "omi-app-ai",
  "betterpic",
  "flowise-ai",
  "reclaim-ai",
  "windsor-ai",
  "reachifyme",
  "agentxai",
] as const;

export default async function PostsPage() {
  const [guides, tools] = await Promise.all([
    getGuidePosts(),
    getPublishedTools(),
  ]);

  // Build a tool slug → tool map for fast lookup.
  const toolBySlug = new Map(tools.map((t) => [t.slug, t]));

  // Pick the feature: first guide that has a tool, fall back to first.
  const featureCandidate =
    guides.find((g) => g.tool_slug && toolBySlug.has(g.tool_slug)) ?? guides[0];
  const featureTool = featureCandidate?.tool_slug
    ? toolBySlug.get(featureCandidate.tool_slug) ?? null
    : null;
  const featureTopic = featureCandidate
    ? getGuideTopic(featureCandidate)
    : "Tool";
  const featureMinutes = featureCandidate
    ? estimateReadingMinutes(featureCandidate.content_markdown)
    : 0;
  const featureToolHref = featureTool ? `/toools/${featureTool.slug}` : null;

  const GM_TOPIC_ORDER = ["Tutte", "Scrittura", "Agenti AI", "SEO & content"];

  // All guides as grid items.
  const toolDomain = (
    tool:
      | { domain?: string | null; urls?: { website?: string | null }; url?: string | null }
      | null
      | undefined,
  ): string | null => {
    if (tool?.domain) return tool.domain;
    const site = tool?.urls?.website ?? tool?.url ?? null;
    if (!site) return null;
    try {
      return new URL(site).hostname;
    } catch {
      return null;
    }
  };
  const hostFromTool = toolDomain;

  const items: GuideGridItem[] = guides.map((post) => {
    const topic = getGuideTopic(post);
    const tool = post.tool_slug ? toolBySlug.get(post.tool_slug) : null;
    return {
      post,
      topic,
      toolName: tool?.name ?? null,
      toolHref: tool ? `/toools/${tool.slug}` : null,
      readingMinutes: estimateReadingMinutes(post.content_markdown),
      toolDomain: hostFromTool(tool),
    };
  });

  // Sort items: featured first, then by reading time desc, then by date desc.
  const featuredSet = new Set<string>(FEATURED_SLUGS);
  const featuredSlug = featureCandidate?.slug ?? null;
  const itemsSorted = [...items]
    .filter((item) => item.post.slug !== featuredSlug)
    .sort((a, b) => {
      const aFeat = featuredSet.has(a.post.slug) ? 0 : 1;
      const bFeat = featuredSet.has(b.post.slug) ? 0 : 1;
      if (aFeat !== bFeat) return aFeat - bFeat;
      if (b.readingMinutes !== a.readingMinutes) {
        return b.readingMinutes - a.readingMinutes;
      }
      return b.post.published_at.localeCompare(a.post.published_at);
    });

  // Topic counts.
  const topicCounts = new Map<string, number>();
  for (const item of items) {
    topicCounts.set(item.topic, (topicCounts.get(item.topic) ?? 0) + 1);
  }
  const topics = Array.from(topicCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort(
      (a, b) =>
        getGuideTopicOrder(a.label) - getGuideTopicOrder(b.label) ||
        b.count - a.count,
    );

  const featuredRowItem: GuideGridItem | null = featureCandidate
    ? {
        post: featureCandidate,
        topic: featureTopic,
        toolName: featureTool?.name ?? null,
        toolHref: featureToolHref,
        readingMinutes: featureMinutes,
        toolDomain: hostFromTool(featureTool),
      }
    : null;

  const featuredSection = featureCandidate ? (
    <GuideFeaturedSection
      post={featureCandidate}
      topicLabel={featureTopic}
      toolName={featureTool?.name ?? null}
      toolHref={featureToolHref}
      toolDomain={hostFromTool(featureTool)}
      readingMinutes={featureMinutes}
    />
  ) : null;

  const orderedTopics = [...topics].sort((a, b) => {
    const ia = GM_TOPIC_ORDER.indexOf(a.label);
    const ib = GM_TOPIC_ORDER.indexOf(b.label);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return 0;
  });

  return (
    <div className="guides-page">
      <GuideMasthead />

      {featuredSection ? (
        <div className="guides-page__featured">{featuredSection}</div>
      ) : null}

      <GuideGridSection
        items={itemsSorted}
        featuredItem={featuredRowItem}
        topics={orderedTopics}
        initialVisible={9}
        featured={
          featuredRowItem ? (
              <GuideCard
                post={featuredRowItem.post}
                topic={featuredRowItem.topic}
                toolName={featuredRowItem.toolName ?? null}
                toolHref={featuredRowItem.toolHref ?? null}
                readMinutes={featuredRowItem.readingMinutes}
                thumbDomain={featuredRowItem.toolDomain ?? null}
              />
          ) : null
        }
      />

      <section
        className="guides-section guides-section--ink"
        aria-labelledby="guides-close-title"
      >
        <p className="guides-kicker is-on-dark" id="guides-close-title"><LocalizedText>{"Prossimi passi "}</LocalizedText></p>
        <LocalizedAttributes><nav className="guides-next-steps" aria-label="Prossimi passi">
          <Link href="/archivio"><LocalizedText>{"Catalogo"}</LocalizedText></Link>
          <span aria-hidden>·</span>
          <Link href="/collections"><LocalizedText>{"Raccolte"}</LocalizedText></Link>
          <span aria-hidden>·</span>
          <Link href="/radar"><LocalizedText>{"Radar"}</LocalizedText></Link>
        </nav></LocalizedAttributes>
      </section>
    </div>
  );
}
