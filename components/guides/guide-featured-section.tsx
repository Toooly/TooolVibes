import Link from "next/link";

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
  return (
    <section
      id="guides-featured"
      className="guides-section guides-section--ink"
      aria-labelledby="guides-featured-title"
    >
      <div className="guides-section__head">
        <div className="guides-section__head-row">
          <div>
            <p className="guides-kicker is-on-dark">Guida in evidenza</p>
            <h2
              id="guides-featured-title"
              className="guides-section__title"
            >
              La <em>lettura</em> da cui partire.
            </h2>
          </div>
          <p className="guides-section__dek">
            La guida più utile di questo momento secondo la redazione —
            scelta per profondità, attualità e completezza, non per traffico.
          </p>
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

      <div className="guides-section__foot">
        <Link
          href={`/posts/${post.slug}`}
          className="guides-section__foot-link"
        >
          Apri la guida completa
          <span aria-hidden>→</span>
        </Link>
        <Link href="#guides-all" className="guides-section__foot-link">
          Vedi tutte le guide
          <span aria-hidden>↓</span>
        </Link>
      </div>
    </section>
  );
}
