import Link from "next/link";
import { BookOpenText, ArrowRight } from "lucide-react";

import type { CuratedCollection } from "@/lib/types/collection";

type CollectionGuideBridgeV4Props = {
  collection: CuratedCollection;
};

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
}: CollectionGuideBridgeV4Props) {
  const explicitSlugs = collection.stack_meta?.related_guide_slugs ?? [];
  const slotSlugs = collection.included_tools
    .map((slot) => slot.relevant_guide_slug)
    .filter((slug): slug is string => Boolean(slug));

  const allSlugs = Array.from(new Set([...explicitSlugs, ...slotSlugs]));

  if (allSlugs.length === 0) return null;

  return (
    <section
      className="cx-guide-bridge-v4 motion-reveal"
      aria-labelledby="cx-guide-bridge-title"
    >
      <header className="cx-guide-bridge-v4__head">
        <span className="cx-guide-bridge-v4__eyebrow">
          <BookOpenText className="size-3.5" aria-hidden="true" />
          Guide collegate
        </span>
        <h2 id="cx-guide-bridge-title" className="cx-guide-bridge-v4__title">
          Approfondisci i tool di questo stack
        </h2>
        <p className="cx-guide-bridge-v4__lede">
          Le Guide TooolVibes che coprono i tool presenti in questa
          raccolta. Approfondisci uno per uno, o parti da quello che ti
          incuriosisce di più.
        </p>
      </header>

      <ul className="cx-guide-bridge-v4__list motion-stagger">
        {allSlugs.map((slug) => (
          <li key={slug} className="cx-guide-bridge-v4__item">
            <Link
              href={`/posts/${slug}`}
              className="cx-guide-bridge-v4__link"
            >
              <span className="cx-guide-bridge-v4__slug">{slug}</span>
              <span className="cx-guide-bridge-v4__cta">
                Apri la guida
                <ArrowRight
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
