import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import Link from "@/components/ui/app-link";
import { MarkdownHighlight } from "@/components/editorial/markdown-content";

import { GuideThumbnail } from "./guide-thumbnail";

import { formatItalianDate } from "@/lib/utils";
import type { EditorialPostRecord } from "@/lib/types/article";

export type GuideCardVariant = "feature" | "default" | "compact" | "mobile-row";

type GuideCardProps = {
  post: EditorialPostRecord;
  variant?: GuideCardVariant;
  topic?: string;
  toolName?: string | null;
  /** Hostname used for the legitimate tool favicon thumbnail on mobile rows. */
  thumbDomain?: string | null;
  toolHref?: string | null;
  readMinutes?: number | null;
  className?: string;
};

const WORDS_PER_MINUTE = 220;

export function estimateReadingMinutes(content: string | undefined | null): number {
  if (!content) return 0;
  const text = content.replace(/```[\s\S]*?```/g, " ").replace(/[#>*_`~\-]/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function defaultTopic(post: EditorialPostRecord): string {
  if (post.tags && post.tags.length > 0) {
    return post.tags[0];
  }
  if (post.tool_slug) {
    return "Tool";
  }
  return "Guida";
}

function topicPalette(topic: string): { background: string; color: string } {
  const t = topic.toLowerCase();
  if (t.includes("scrittura") || t.includes("writing") || t.includes("seo")) {
    return { background: "rgba(43, 208, 255, 0.16)", color: "#0a6b80" };
  }
  if (t.includes("agenti") || t.includes("agent") || t.includes("automazione")) {
    return { background: "rgba(106, 60, 255, 0.16)", color: "#4d2dd6" };
  }
  if (t.includes("imagine") || t.includes("foto") || t.includes("media")) {
    return { background: "rgba(255, 192, 122, 0.22)", color: "#7c4a13" };
  }
  if (t.includes("affiliate") || t.includes("saas") || t.includes("business")) {
    return { background: "rgba(72, 200, 130, 0.18)", color: "#15643a" };
  }
  if (t.includes("schedul") || t.includes("calendario") || t.includes("produttivit")) {
    return { background: "rgba(220, 132, 247, 0.18)", color: "#5b1378" };
  }
  return { background: "rgba(106, 60, 255, 0.12)", color: "#4d2dd6" };
}

export function GuideCard({
  post,
  variant = "default",
  topic,
  toolName,
  thumbDomain = null,
  toolHref,
  readMinutes,
  className,
}: GuideCardProps) {
  const isFeature = variant === "feature";
  const isCompact = variant === "compact";
  const isMobileRow = variant === "mobile-row";

  const resolvedTopic = topic ?? defaultTopic(post);
  const palette = topicPalette(resolvedTopic);
  const minutes =
    typeof readMinutes === "number" && readMinutes > 0
      ? readMinutes
      : estimateReadingMinutes(post.content_markdown);

  // Avoid the redundant "Guida TooolVibes" pattern
  const updatedLabel = post.updated_at
    ? formatItalianDate(post.updated_at)
    : null;
  const publishedLabel = formatItalianDate(post.published_at);

  if (isFeature) {
    return (
      <article
        className={["guides-feature", className].filter(Boolean).join(" ")}
        aria-labelledby={`guide-feature-${post.slug}-title`}
      >
        <div className="guides-feature__body">
          <div className="guides-feature__topline guides-feature__topline--feature">
            <span className="guides-kicker guides-feature__kicker"><LocalizedText>{"Guida in evidenza"}</LocalizedText></span>
            <p className="guides-feature__signal">
              <span><LocalizedText>{resolvedTopic}</LocalizedText></span>
              <span className="guides-feature__signal-dot" aria-hidden>
                ·
              </span>
              <span>{minutes}<LocalizedText>{" min"}</LocalizedText></span>
            </p>
          </div>

          <h2
            id={`guide-feature-${post.slug}-title`}
            className="guides-feature__title"
          >
            <Link
              href={`/posts/${post.slug}`}
              style={{ color: "inherit", textDecoration: "none" }}
            >
              <LocalizedText>{post.title}</LocalizedText>
            </Link>
          </h2>

          {post.dek ? <p className="guides-feature__dek"><LocalizedText>{post.dek}</LocalizedText></p> : null}

          {post.highlights.length > 0 ? (
            <LocalizedAttributes><ul className="guides-feature__points" aria-label="Punti chiave">
              {post.highlights.slice(0, 4).map((point) => (
                <li key={point}>
                  <span>
                    <MarkdownHighlight content={point} />
                  </span>
                </li>
              ))}
            </ul></LocalizedAttributes>
          ) : null}

          <LocalizedAttributes><div className="guides-feature__meta" role="group" aria-label="Metadati">
            <span>
              <strong><LocalizedText>{"Pubblicata"}</LocalizedText></strong> <LocalizedText>{publishedLabel}</LocalizedText>
            </span>
            {updatedLabel && updatedLabel !== publishedLabel ? (
              <>
                <span className="guides-feature__meta-divider" aria-hidden />
                <span>
                  <strong><LocalizedText>{"Aggiornata"}</LocalizedText></strong> <LocalizedText>{updatedLabel}</LocalizedText>
                </span>
              </>
            ) : null}
            <span className="guides-feature__meta-divider" aria-hidden />
            <span>
              <strong><LocalizedText>{"Lettura"}</LocalizedText></strong> {minutes}<LocalizedText>{" min "}</LocalizedText></span>
            {toolName ? (
              <>
                <span className="guides-feature__meta-divider" aria-hidden />
                <span>
                  <strong><LocalizedText>{"Tool"}</LocalizedText></strong> <LocalizedText>{toolName}</LocalizedText>
                </span>
              </>
            ) : null}
          </div></LocalizedAttributes>

          <div className="guides-feature__cta">
            <Link
              href={`/posts/${post.slug}`}
              data-variant="primary"
            ><LocalizedText>{"Leggi la guida "}</LocalizedText><span aria-hidden>→</span>
            </Link>
            {toolHref ? (
              <Link href={toolHref} data-variant="ghost"><LocalizedText>{"Apri la scheda tool "}</LocalizedText><span aria-hidden>↗</span>
              </Link>
            ) : null}
          </div>
        </div>

        <div
          className="guides-feature__cover"
          aria-hidden
          style={{
            background: `linear-gradient(135deg, #1a1230 0%, ${palette.color} 100%)`,
          }}
        >
          <div className="guides-feature__cover-content">
            <div className="guides-feature__glyph" aria-hidden>
              <LocalizedText>{resolvedTopic.charAt(0).toUpperCase()}</LocalizedText>
            </div>
            <div className="guides-feature__cover-foot">
              <span
                className="guides-feature__topic-pill"
                style={{ background: palette.background, color: palette.color }}
              >
                <LocalizedText>{resolvedTopic}</LocalizedText>
              </span>
              <span className="guides-feature__read">{minutes}<LocalizedText>{" min di lettura"}</LocalizedText></span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (isMobileRow) {
    return (
      <LocalizedAttributes><Link
        href={`/posts/${post.slug}`}
        className={["guides-card", "guides-card--mobile-row", className]
          .filter(Boolean)
          .join(" ")}
        aria-label={`Leggi la guida: ${post.title}`}
      >
        <GuideThumbnail domain={thumbDomain} label={toolName || resolvedTopic} />
        <div className="guides-card__topline">
          <span
            className="guides-card__topic"
            style={{ background: palette.background, color: palette.color }}
          >
            <LocalizedText>{resolvedTopic}</LocalizedText>
          </span>
          <span className="guides-card__read">{minutes}<LocalizedText>{" min"}</LocalizedText></span>
        </div>
        <h3 className="guides-card__title"><LocalizedText>{post.title}</LocalizedText></h3>
        {post.dek ? <p className="guides-card__dek"><LocalizedText>{post.dek}</LocalizedText></p> : null}
        <div className="guides-card__foot">
          <span><LocalizedText>{"Pubblicata "}</LocalizedText><LocalizedText>{publishedLabel}</LocalizedText></span>
          <span className="guides-card__cta"><LocalizedText>{"Leggi la guida"}</LocalizedText></span>
        </div>
      </Link></LocalizedAttributes>
    );
  }

  return (
    <LocalizedAttributes><Link
      href={`/posts/${post.slug}`}
      className={["guides-card", isCompact && "guides-card--compact", className]
        .filter(Boolean)
        .join(" ")}
      aria-label={`Leggi la guida: ${post.title}`}
    >
      <GuideThumbnail domain={thumbDomain} label={toolName || resolvedTopic} />
      <div className="guides-card__topline">
        <span
          className="guides-card__topic"
          style={{ background: palette.background, color: palette.color }}
        >
          <LocalizedText>{resolvedTopic}</LocalizedText>
        </span>
        <span className="guides-card__read">{minutes}<LocalizedText>{" min"}</LocalizedText></span>
      </div>
      <h3 className="guides-card__title"><LocalizedText>{post.title}</LocalizedText></h3>
      {post.dek ? <p className="guides-card__dek"><LocalizedText>{post.dek}</LocalizedText></p> : null}
      <div className="guides-card__chips">
        {toolName ? (
          <span className="guides-card__chip guides-card__chip--tool">
            <LocalizedText>{toolName}</LocalizedText>
          </span>
        ) : null}
        {updatedLabel && updatedLabel !== publishedLabel ? (
          <span className="guides-card__chip"><LocalizedText>{"Aggiornata "}</LocalizedText><LocalizedText>{updatedLabel}</LocalizedText></span>
        ) : (
          <span className="guides-card__chip"><LocalizedText>{"Pubblicata "}</LocalizedText><LocalizedText>{publishedLabel}</LocalizedText></span>
        )}
      </div>
      <div className="guides-card__foot">
        <span><LocalizedText>{resolvedTopic}</LocalizedText></span>
        <span className="guides-card__cta"><LocalizedText>{"Leggi la guida"}</LocalizedText></span>
      </div>
    </Link></LocalizedAttributes>
  );
}
