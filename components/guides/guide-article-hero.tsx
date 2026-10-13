import { LocalizedText } from "@/components/i18n/localized-text";
import { formatItalianDate } from "@/lib/utils";
import type { EditorialPostRecord } from "@/lib/types/article";

type GuideArticleHeroProps = {
  post: EditorialPostRecord;
  readingMinutes: number;
  topicLabel: string;
};

function safeFormat(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return formatItalianDate(iso);
  } catch {
    return "";
  }
}

export function GuideArticleHero({
  post,
  readingMinutes,
  topicLabel,
}: GuideArticleHeroProps) {
  const published = safeFormat(post.published_at);
  const updated = safeFormat(post.updated_at);
  const showUpdated = updated && updated !== published;

  const palette = (() => {
    const t = topicLabel.toLowerCase();
    if (t.includes("scrittura") || t.includes("writing") || t.includes("seo")) {
      return { glow: "rgba(43, 208, 255, 0.22)" };
    }
    if (t.includes("agenti") || t.includes("agent")) {
      return { glow: "rgba(106, 60, 255, 0.22)" };
    }
    if (t.includes("affiliate") || t.includes("saas") || t.includes("business")) {
      return { glow: "rgba(72, 200, 130, 0.22)" };
    }
    if (t.includes("media") || t.includes("immagini") || t.includes("foto")) {
      return { glow: "rgba(255, 192, 122, 0.22)" };
    }
    return { glow: "rgba(126, 130, 255, 0.22)" };
  })();

  return (
    <section
      className="guides-article__hero"
      aria-labelledby="guide-article-title"
      style={
        {
          ["--guides-article-hero-glow" as string]: palette.glow,
        } as React.CSSProperties
      }
    >
      <div className="guides-article__hero-main">
        <div className="guides-article__hero-meta">
          <span className="pill pill--accent"><LocalizedText>{"Guida"}</LocalizedText></span>
          <span className="pill" data-guide-pill="topic"><LocalizedText>{topicLabel}</LocalizedText></span>
          <span className="pill" data-guide-pill="date"><LocalizedText>{"Pubblicata "}</LocalizedText><LocalizedText>{published}</LocalizedText></span>
          {showUpdated ? (
            <span className="pill" data-guide-pill="updated"><LocalizedText>{"Aggiornata "}</LocalizedText><LocalizedText>{updated}</LocalizedText>
            </span>
          ) : null}
          <span className="pill" data-guide-pill="time">{readingMinutes}<LocalizedText>{" min di lettura"}</LocalizedText></span>
        </div>

        <h1 id="guide-article-title" className="guides-article__hero-h1">
          <LocalizedText>{post.title}</LocalizedText>
        </h1>

        {post.dek ? <p className="guides-article__hero-dek"><LocalizedText>{post.dek}</LocalizedText></p> : null}
      </div>
    </section>
  );
}
