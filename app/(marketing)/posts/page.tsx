import Link from "next/link";

import { GuideMasthead } from "@/components/guides/guide-masthead";
import { GuideFeaturedSection } from "@/components/guides/guide-featured-section";
import {
  GuideGridSection,
  type GuideGridItem,
} from "@/components/guides/guide-grid-section";
import {
  estimateReadingMinutes,
} from "@/components/guides/guide-card";
import { getGuideTopic, getGuideTopicOrder } from "@/lib/data/guide-topics";
import { getPublishedTools } from "@/lib/data/public-tools";
import { getCuratedCollections } from "@/lib/data/public-collections";
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
  const [guides, tools, collections] = await Promise.all([
    getGuidePosts(),
    getPublishedTools(),
    getCuratedCollections(),
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

  // All guides as grid items.
  const items: GuideGridItem[] = guides.map((post) => {
    const topic = getGuideTopic(post);
    const tool = post.tool_slug ? toolBySlug.get(post.tool_slug) : null;
    return {
      post,
      topic,
      toolName: tool?.name ?? null,
      toolHref: tool ? `/toools/${tool.slug}` : null,
      readingMinutes: estimateReadingMinutes(post.content_markdown),
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
  for (const item of itemsSorted) {
    topicCounts.set(item.topic, (topicCounts.get(item.topic) ?? 0) + 1);
  }
  const topics = Array.from(topicCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort(
      (a, b) =>
        getGuideTopicOrder(a.label) - getGuideTopicOrder(b.label) ||
        b.count - a.count,
    );

  const totalReadingMinutes = items.reduce(
    (acc, i) => acc + i.readingMinutes,
    0,
  );

  const readingTime = Math.max(1, Math.round(totalReadingMinutes / Math.max(1, items.length)));

  return (
    <div className="guides-page">
      <GuideMasthead
        totalGuides={items.length}
        totalReadingMinutes={totalReadingMinutes}
        totalTools={tools.length}
        totalCollections={collections.length}
      />

      {featureCandidate ? (
        <GuideFeaturedSection
          post={featureCandidate}
          topicLabel={featureTopic}
          toolName={featureTool?.name ?? null}
          toolHref={featureToolHref}
          readingMinutes={featureMinutes}
        />
      ) : null}

      <GuideGridSection
        items={itemsSorted}
        topics={topics}
        initialVisible={9}
      />

      <section
        className="guides-section guides-section--ink"
        aria-labelledby="guides-close-title"
      >
        <p className="guides-kicker is-on-dark" id="guides-close-title">
          Prossimi passi
        </p>
        <nav className="guides-next-steps" aria-label="Prossimi passi">
          <Link href="/archivio">Catalogo</Link>
          <span aria-hidden>·</span>
          <Link href="/collections">Raccolte</Link>
          <span aria-hidden>·</span>
          <Link href="/radar">Radar</Link>
        </nav>
        <p className="guides-section__meta guides-section__meta--ink">
          Lettura media: <strong>{readingTime} min</strong>{" "}
          per guida · ultimo aggiornamento editoriale:{" "}
          <strong>
            {new Date().toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
          </strong>
        </p>
      </section>
    </div>
  );
}
