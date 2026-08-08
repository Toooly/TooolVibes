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
import {
  getGuidePosts,
} from "@/lib/data/public-articles";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPublicPageMetadata({
  title: "Guide TooolVibes",
  description:
    "Guide editoriali verticali su tool AI, SaaS, produttività e business. Scritte per chi deve decidere, non per riempire una SERP.",
  path: "/posts",
});

export const revalidate = 3600;

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
  const itemsSorted = [...items].sort((a, b) => {
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
        topTopics={topics.slice(0, 6)}
        totalTools={tools.length}
        totalCollections={Math.min(20, tools.length)}
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

      {/* Editorial close block */}
      <section
        className="guides-section guides-section--ink"
        aria-labelledby="guides-close-title"
      >
        <div className="guides-section__head guides-section__head-row">
          <div>
            <p className="guides-kicker is-on-dark">Prossimi passi</p>
            <h2 id="guides-close-title" className="guides-section__title">
              Una guida ti fa <em>partire</em>. Il catalogo ti porta dove vuoi.
            </h2>
          </div>
          <p className="guides-section__dek">
            Le guide sono il punto di ingresso. Il catalogo tool e le raccolte
            tematiche sono dove confronti le alternative in modo strutturato.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 16rem), 1fr))",
            gap: "0.85rem",
          }}
        >
          <div
            className="guides-article__end-card"
            style={{ background: "rgba(255, 255, 255, 0.04)" }}
          >
            <p className="label">01 · Catalogo</p>
            <p className="title">Confronta i tool</p>
            <p className="dek">
              Tutti i tool presenti nelle guide, con prezzi, integrazioni e
              giudizio editoriale.
            </p>
            <Link href="/archivio">Apri il catalogo →</Link>
          </div>
          <div
            className="guides-article__end-card"
            style={{ background: "rgba(255, 255, 255, 0.04)" }}
          >
            <p className="label">02 · Raccolte</p>
            <p className="title">Tool per obiettivo</p>
            <p className="dek">
              Le guide sono verticali. Le raccolte sono laterali — gruppi di
              tool che risolvono lo stesso problema.
            </p>
            <Link href="/collections">Vai alle raccolte →</Link>
          </div>
          <div
            className="guides-article__end-card"
            style={{ background: "rgba(255, 255, 255, 0.04)" }}
          >
            <p className="label">03 · Radar</p>
            <p className="title">Tool appena arrivati</p>
            <p className="dek">
              Quello che emerge nelle prossime settimane. Le guide arriveranno
              quando il tema è maturo.
            </p>
            <Link href="/radar">Apri il radar →</Link>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.6rem",
            paddingTop: "0.4rem",
            marginTop: "0.6rem",
          }}
        >
          <Link
            href="/metodo"
            className="guides-section__foot-link"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              borderColor: "rgba(255, 255, 255, 0.14)",
              color: "var(--guides-text-on-dark)",
            }}
          >
            Come scriviamo le guide
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/shortlist"
            className="guides-section__foot-link"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              borderColor: "rgba(255, 255, 255, 0.14)",
              color: "var(--guides-text-on-dark)",
            }}
          >
            Salva i tool che ti interessano
            <span aria-hidden>+</span>
          </Link>
        </div>

        <p
          style={{
            color: "var(--guides-text-on-dark-muted)",
            fontSize: "0.78rem",
            marginTop: "0.5rem",
          }}
        >
          Lettura media: <strong style={{ color: "var(--guides-text-on-dark)" }}>{readingTime} min</strong>{" "}
          per guida · ultimo aggiornamento editoriale:{" "}
          <strong style={{ color: "var(--guides-text-on-dark)" }}>
            {new Date().toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
          </strong>
        </p>
      </section>
    </div>
  );
}
