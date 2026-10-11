import Link from "next/link";
import ReactMarkdown from "react-markdown";

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
            <span className="guides-kicker guides-feature__kicker">Guida in evidenza</span>
            <p className="guides-feature__signal">
              <span>{resolvedTopic}</span>
              <span className="guides-feature__signal-dot" aria-hidden>
                ·
              </span>
              <span>{minutes} min</span>
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
              {post.title}
            </Link>
          </h2>

          {post.dek ? <p className="guides-feature__dek">{post.dek}</p> : null}

          {post.highlights.length > 0 ? (
            <ul className="guides-feature__points" aria-label="Punti chiave">
              {post.highlights.slice(0, 4).map((point) => (
                <li key={point}>
                  <span>
                    <ReactMarkdown
                      allowedElements={["p", "strong", "em", "code"]}
                      unwrapDisallowed
                      components={{ p: ({ children }) => <span>{children}</span> }}
                    >
                      {point}
                    </ReactMarkdown>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="guides-feature__meta" role="group" aria-label="Metadati">
            <span>
              <strong>Pubblicata</strong> {publishedLabel}
            </span>
            {updatedLabel && updatedLabel !== publishedLabel ? (
              <>
                <span className="guides-feature__meta-divider" aria-hidden />
                <span>
                  <strong>Aggiornata</strong> {updatedLabel}
                </span>
              </>
            ) : null}
            <span className="guides-feature__meta-divider" aria-hidden />
            <span>
              <strong>Lettura</strong> {minutes} min
            </span>
            {toolName ? (
              <>
                <span className="guides-feature__meta-divider" aria-hidden />
                <span>
                  <strong>Tool</strong> {toolName}
                </span>
              </>
            ) : null}
          </div>

          <div className="guides-feature__cta">
            <Link
              href={`/posts/${post.slug}`}
              data-variant="primary"
            >
              Leggi la guida
              <span aria-hidden>→</span>
            </Link>
            {toolHref ? (
              <Link href={toolHref} data-variant="ghost">
                Apri la scheda tool
                <span aria-hidden>↗</span>
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
              {resolvedTopic.charAt(0).toUpperCase()}
            </div>
            <div className="guides-feature__cover-foot">
              <span
                className="guides-feature__topic-pill"
                style={{ background: palette.background, color: palette.color }}
              >
                {resolvedTopic}
              </span>
              <span className="guides-feature__read">{minutes} min di lettura</span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (isMobileRow) {
    return (
      <Link
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
            {resolvedTopic}
          </span>
          <span className="guides-card__read">{minutes} min</span>
        </div>
        <h3 className="guides-card__title">{post.title}</h3>
        {post.dek ? <p className="guides-card__dek">{post.dek}</p> : null}
        <div className="guides-card__foot">
          <span>Pubblicata {publishedLabel}</span>
          <span className="guides-card__cta">Leggi la guida</span>
        </div>
      </Link>
    );
  }

  return (
    <Link
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
          {resolvedTopic}
        </span>
        <span className="guides-card__read">{minutes} min</span>
      </div>
      <h3 className="guides-card__title">{post.title}</h3>
      {post.dek ? <p className="guides-card__dek">{post.dek}</p> : null}
      <div className="guides-card__chips">
        {toolName ? (
          <span className="guides-card__chip guides-card__chip--tool">
            {toolName}
          </span>
        ) : null}
        {updatedLabel && updatedLabel !== publishedLabel ? (
          <span className="guides-card__chip">Aggiornata {updatedLabel}</span>
        ) : (
          <span className="guides-card__chip">Pubblicata {publishedLabel}</span>
        )}
      </div>
      <div className="guides-card__foot">
        <span>{resolvedTopic}</span>
        <span className="guides-card__cta">Leggi la guida</span>
      </div>
    </Link>
  );
}
