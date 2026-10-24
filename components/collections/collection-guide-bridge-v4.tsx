import { LocalizedText } from "@/components/i18n/localized-text";
import Link from "@/components/ui/app-link";
import { BookOpenText, ArrowRight } from "lucide-react";

import type { CuratedCollection } from "@/lib/types/collection";
import { getGuidePreviewTitle } from "@/components/guides/guide-preview-copy";

type CollectionGuideBridgeV4Props = {
  collection: CuratedCollection;
  guideTitles?: Record<string, string>;
};

function guideLabel(slug: string, titles: Record<string, string>) {
  const title = titles[slug]?.trim();
  if (title) return getGuidePreviewTitle(slug, title);
  return slug.split(/[-_]+/).filter(Boolean).map((word) =>
    word.toLowerCase() === "ai" ? "AI" : word.charAt(0).toUpperCase() + word.slice(1),
  ).join(" ");
}

/**
 * Guide Bridge V4 — final "deeper knowledge" section listing the
 * most useful Guides for this Collection.
 *
 * Deduplicates by slug and respects the explicit `related_guide_slugs`
 * from stack_meta when present. Falls back to scanning tool slots for
 * `relevant_guide_slug`.
 */
export function CollectionGuideBridgeV4({
  collection,
  guideTitles = {},
}: CollectionGuideBridgeV4Props) {
  const explicitSlugs = collection.stack_meta?.related_guide_slugs ?? [];
  const slotSlugs = collection.included_tools
    .map((slot) => slot.relevant_guide_slug)
    .filter((slug): slug is string => Boolean(slug));

  const allSlugs = Array.from(new Set([...explicitSlugs, ...slotSlugs]));

  if (allSlugs.length === 0) return null;

  return (
    <section
      id="cx-detail-guides"
      className="cx-guide-bridge-v4 motion-reveal"
      aria-labelledby="cx-guide-bridge-title"
    >
      <header className="cx-guide-bridge-v4__head">
        <span className="cx-guide-bridge-v4__eyebrow">
          <BookOpenText className="size-3.5" aria-hidden="true" /><LocalizedText>{"Guide collegate "}</LocalizedText></span>
        <h2 id="cx-guide-bridge-title" className="cx-guide-bridge-v4__title"><LocalizedText>{"Capire meglio i singoli strumenti"}</LocalizedText></h2>
        <p className="cx-guide-bridge-v4__lede"><LocalizedText>{"Passaggi pratici e limiti dei tool, uno alla volta."}</LocalizedText></p>
      </header>

      <ul className="cx-guide-bridge-v4__list motion-stagger">
        {allSlugs.map((slug) => (
          <li key={slug} className="cx-guide-bridge-v4__item">
            <Link
              href={`/posts/${slug}`}
              className="cx-guide-bridge-v4__link"
            >
              <span className="cx-guide-bridge-v4__slug"><LocalizedText>{guideLabel(slug, guideTitles)}</LocalizedText></span>
              <span className="cx-guide-bridge-v4__cta"><LocalizedText>{"Apri la guida "}</LocalizedText><ArrowRight
                  className="size-3.5"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
