"use client";

import { LocalizedText } from "@/components/i18n/localized-text";
import { useLocale } from "@/components/i18n/locale-provider";
import type { EditorialPostRecord } from "@/lib/types/article";

import { GuideCard } from "@/components/guides/guide-card";

type GuideFeaturedSectionProps = {
  post: EditorialPostRecord;
  topicLabel: string;
  toolName?: string | null;
  toolHref?: string | null;
  readingMinutes: number;
};

export function GuideFeaturedSection({
  post,
  topicLabel,
  toolName,
  toolHref,
  readingMinutes,
}: GuideFeaturedSectionProps) {
  const { locale } = useLocale();
  return (
    <section
      id="guides-featured"
      className="guides-section guides-section--ink"
      aria-labelledby="guides-featured-title"
    >
      <div className="guides-section__head">
        <div className="guides-section__head-row">
          <div>
            <p className="guides-kicker is-on-dark"><LocalizedText>{"Guida in evidenza"}</LocalizedText></p>
            <h2
              id="guides-featured-title"
              className="guides-section__title"
            >{locale === "en" ? <>Start with <em>this guide</em>.</> : <>La <em>lettura</em> da cui partire.</>}</h2>
          </div>
          <p className="guides-section__dek"><LocalizedText>{"La guida più utile di questo momento secondo la redazione — scelta per profondità, attualità e completezza, non per traffico. "}</LocalizedText></p>
        </div>
      </div>

      <GuideCard
        post={post}
        variant="feature"
        topic={topicLabel}
        toolName={toolName ?? null}
        toolHref={toolHref ?? null}
        readMinutes={readingMinutes}
      />
    </section>
  );
}
