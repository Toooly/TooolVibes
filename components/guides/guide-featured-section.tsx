import type { EditorialPostRecord } from "@/lib/types/article";

import { GuideCard } from "@/components/guides/guide-card";

type GuideFeaturedSectionProps = {
  post: EditorialPostRecord;
  topicLabel: string;
  toolName?: string | null;
  toolHref?: string | null;
  toolDomain?: string | null;
  readingMinutes: number;
};

export function GuideFeaturedSection({
  post,
  topicLabel,
  toolName,
  toolHref,
  toolDomain,
  readingMinutes,
}: GuideFeaturedSectionProps) {
  return (
    <section
      id="guides-featured"
      className="guides-featured-stage"
      aria-labelledby={`guide-feature-${post.slug}-title`}
    >
      <GuideCard
        post={post}
        variant="feature"
        topic={topicLabel}
        toolName={toolName ?? null}
        toolHref={toolHref ?? null}
        thumbDomain={toolDomain ?? null}
        readMinutes={readingMinutes}
      />
    </section>
  );
}
