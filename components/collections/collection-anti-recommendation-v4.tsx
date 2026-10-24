import { LocalizedText } from "@/components/i18n/localized-text";
import Link from "@/components/ui/app-link";
import { ArrowRight } from "lucide-react";

import type { CuratedCollection } from "@/lib/types/collection";
import { getCollectionPreviewCopy } from "./collection-preview-copy";
import { isCollectionPublic } from "@/lib/collections/editorial";

type CollectionAntiRecommendationV4Props = {
  collection: CuratedCollection;
  allCollections: CuratedCollection[];
};

/**
 * Anti-Recommendation V4 — editorial honesty, not warning.
 *
 * "Quando scegliere un altro stack" — short editorial section with
 * 2-3 bullets + contextual links to alternate Collections.
 *
 * No warning-red visual language. No alarm icon. Clean editorial tone.
 */
export async function CollectionAntiRecommendationV4({
  collection,
  allCollections,
}: CollectionAntiRecommendationV4Props) {
  const ar = collection.anti_recommendation;
  if (!ar) return null;

  const lookInsteadSlugs = ar.look_instead_at ?? [];
  const lookInstead = lookInsteadSlugs
    .map((slug) => allCollections.find((c) => c.slug === slug))
    .filter((c): c is CuratedCollection => {
      if (!c) return false;
      return isCollectionPublic(c);
    })
    .slice(0, 3);

  return (
    <section
      id="cx-detail-anti"
      className="cx-anti-rec-v4 motion-reveal"
      aria-labelledby="cx-anti-rec-title"
    >
      <header className="cx-anti-rec-v4__head">
        <h2 id="cx-anti-rec-title" className="cx-anti-rec-v4__title"><LocalizedText>{"Quando scegliere un altro stack "}</LocalizedText></h2>
      </header>

      {ar.not_for && (
        <p className="cx-anti-rec-v4__body"><LocalizedText>{ar.not_for}</LocalizedText></p>
      )}

      {lookInstead.length > 0 && (
        <div className="cx-anti-rec-v4__instead">
          <span className="cx-anti-rec-v4__instead-label"><LocalizedText>{"Valuta anche "}</LocalizedText></span>
          <ul className="cx-anti-rec-v4__instead-list">
            {lookInstead.map((alt) => (
              <li
                key={alt.slug}
                className="cx-anti-rec-v4__instead-item"
              >
                <Link
                  href={`/collections/${alt.slug}`}
                  className="cx-anti-rec-v4__instead-link"
                >
                  <span className="cx-anti-rec-v4__instead-name">
                    <LocalizedText>{getCollectionPreviewCopy(alt).title}</LocalizedText>
                  </span>
                  {alt.stack_meta?.concise_promise && (
                    <span className="cx-anti-rec-v4__instead-promise">
                      <LocalizedText>{getCollectionPreviewCopy(alt).description}</LocalizedText>
                    </span>
                  )}
                  <ArrowRight
                    className="size-3.5"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

// Keep the symbol signature compatible with synchronous server pages —
// callers wrap in <Suspense> if needed. (This file is intended to be
// used in a server component; React's tree of async server components
// is fine.)
export const __isAsyncServerComponent = true;
