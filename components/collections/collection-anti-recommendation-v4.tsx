import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { CuratedCollection } from "@/lib/types/collection";
import { isCollectionPublic } from "@/lib/collections/editorial";

type CollectionAntiRecommendationV4Props = {
  collection: CuratedCollection;
  allCollections: CuratedCollection[];
};

/**
 * Anti-Recommendation V4 — editorial honesty, not warning.
 *
 * "Quando NON sceglierei questo stack" — short editorial section with
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
      data-cx-accent="indigo"
      className="cx-anti-rec-v4"
      aria-labelledby="cx-anti-rec-title"
    >
      <header className="cx-anti-rec-v4__head">
        <span className="cx-anti-rec-v4__eyebrow">
          Onestà editoriale
        </span>
        <h2 id="cx-anti-rec-title" className="cx-anti-rec-v4__title">
          Quando NON sceglierei questo stack
        </h2>
        <p className="cx-anti-rec-v4__lede">
          Alcune raccolte non sono la risposta giusta per tutti. E va
          bene così.
        </p>
      </header>

      {ar.not_for && (
        <p className="cx-anti-rec-v4__body">{ar.not_for}</p>
      )}

      {lookInstead.length > 0 && (
        <div className="cx-anti-rec-v4__instead">
          <span className="cx-anti-rec-v4__instead-label">
            Vai invece a
          </span>
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
                    {alt.title}
                  </span>
                  {alt.stack_meta?.concise_promise && (
                    <span className="cx-anti-rec-v4__instead-promise">
                      {alt.stack_meta.concise_promise}
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
