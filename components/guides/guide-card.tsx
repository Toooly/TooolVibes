"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { useLocale } from "@/components/i18n/locale-provider";
import Link from "@/components/ui/app-link";
import { MarkdownHighlight } from "@/components/editorial/markdown-content";
import { GuideReadingVisual } from "./guide-reading-visual";
import { getGuidePreviewCopy } from "./guide-preview-copy";

import { GuideThumbnail } from "./guide-thumbnail";

import { formatItalianDate } from "@/lib/utils";
import type { EditorialPostRecord } from "@/lib/types/article";
import { estimateReadingMinutes } from "@/lib/editorial/reading-time";

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
    return { background: "rgba(43, 208, 255, 0.16)", color: "var(--tv-color-cyan-300)" };
  }
  if (t.includes("agenti") || t.includes("agent") || t.includes("automazione")) {
    return { background: "rgba(106, 60, 255, 0.16)", color: "var(--tv-color-violet-300)" };
  }
  if (t.includes("imagine") || t.includes("foto") || t.includes("media")) {
    return { background: "rgba(255, 192, 122, 0.22)", color: "var(--tv-color-gold-300)" };
  }
  if (t.includes("affiliate") || t.includes("saas") || t.includes("business")) {
    return { background: "rgba(72, 200, 130, 0.18)", color: "var(--tv-color-cyan-300)" };
  }
  if (t.includes("schedul") || t.includes("calendario") || t.includes("produttivit")) {
    return { background: "rgba(220, 132, 247, 0.18)", color: "var(--tv-color-violet-300)" };
  }
  return { background: "rgba(106, 60, 255, 0.12)", color: "var(--tv-color-violet-300)" };
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
  const { locale, t } = useLocale();
  const isFeature = variant === "feature";
  const isCompact = variant === "compact";
  const isMobileRow = variant === "mobile-row";

  const resolvedTopic = topic ?? defaultTopic(post);
  const preview = getGuidePreviewCopy(post);
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
            <span className="guides-kicker guides-feature__kicker">{locale === "en" ? "Featured guide" : "Guida in evidenza"}</span>
            <p className="guides-feature__signal">
              <span><LocalizedText>{resolvedTopic}</LocalizedText></span>
              {minutes > 0 && <><span className="guides-feature__signal-dot" aria-hidden>·</span><span>{minutes}{" min"}</span></>}
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
              <LocalizedText>{preview.title}</LocalizedText>
            </Link>
          </h2>

          {preview.dek ? <p className="guides-feature__dek"><LocalizedText>{preview.dek}</LocalizedText></p> : null}

          {preview.highlights.length > 0 ? (
            <LocalizedAttributes><ul className="guides-feature__points" aria-label="Punti chiave">
              {preview.highlights.slice(0, 2).map((point) => (
                <li key={point}>
                  <span>
                    <MarkdownHighlight content={point} />
                  </span>
                </li>
              ))}
            </ul></LocalizedAttributes>
          ) : null}

          <div className="guides-feature__cta">
            <Link
              href={`/posts/${post.slug}`}
              data-variant="primary"
            ><LocalizedText>{"Leggi la guida "}</LocalizedText><span aria-hidden>→</span>
            </Link>
            {toolHref ? (
              <Link href={toolHref} data-variant="ghost">{locale === "en" ? "Open tool" : "Apri la scheda tool"}<span aria-hidden>↗</span>
              </Link>
            ) : null}
          </div>
        </div>

        <div
          className="guides-feature__cover"
          aria-hidden
          style={{
            background: `radial-gradient(ellipse at 80% 0%, ${palette.background}, transparent 70%), var(--tv-material-panel)`,
          }}
        >
          <GuideReadingVisual subject={toolName || resolvedTopic} domain={thumbDomain} />
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
        aria-label={`${locale === "en" ? "Read the guide" : "Leggi la guida"}: ${t(preview.title)}`}
      >
        <GuideThumbnail domain={thumbDomain} label={toolName || resolvedTopic} />
        <div className="guides-card__topline">
          <span
            className="guides-card__topic"
            style={{ background: palette.background, color: palette.color }}
          >
            <LocalizedText>{resolvedTopic}</LocalizedText>
          </span>
          {minutes > 0 && <span className="guides-card__read">{minutes}{" min"}</span>}
        </div>
        <h3 className="guides-card__title"><LocalizedText>{preview.title}</LocalizedText></h3>
        {preview.dek ? <p className="guides-card__dek"><LocalizedText>{preview.dek}</LocalizedText></p> : null}
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
      aria-label={`${locale === "en" ? "Read the guide" : "Leggi la guida"}: ${t(preview.title)}`}
    >
      <GuideThumbnail domain={thumbDomain} label={toolName || resolvedTopic} />
      <div className="guides-card__topline">
        {toolName && <span className="guides-card__subject">{toolName}</span>}
        <span
          className="guides-card__topic"
          style={{ background: palette.background, color: palette.color }}
        >
          <LocalizedText>{resolvedTopic}</LocalizedText>
        </span>
        {minutes > 0 && <span className="guides-card__read">{minutes}{" min"}</span>}
      </div>
      <h3 className="guides-card__title"><LocalizedText>{preview.title}</LocalizedText></h3>
      {preview.dek ? <p className="guides-card__dek"><LocalizedText>{preview.dek}</LocalizedText></p> : null}
      <div className="guides-card__chips">
        {updatedLabel && updatedLabel !== publishedLabel ? (
          <span className="guides-card__chip"><LocalizedText>{"Aggiornata "}</LocalizedText><LocalizedText>{updatedLabel}</LocalizedText></span>
        ) : (
          <span className="guides-card__chip"><LocalizedText>{"Pubblicata "}</LocalizedText><LocalizedText>{publishedLabel}</LocalizedText></span>
        )}
      </div>
      <div className="guides-card__foot">
        <span className="guides-card__cta"><LocalizedText>{"Leggi la guida"}</LocalizedText></span>
      </div>
    </Link></LocalizedAttributes>
  );
}
