import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";

import type { CuratedCollection } from "@/lib/types/collection";

type CollectionAntiRecommendationProps = {
  collection: CuratedCollection;
};

export function CollectionAntiRecommendation({ collection }: CollectionAntiRecommendationProps) {
  const anti = collection.anti_recommendation;
  if (!anti) return null;

  const links = (anti.look_instead_at ?? [])
    .map((slug) => {
      // Slugs may reference collections or guides. We only have a runtime
      // collection list available via the page; pages pass the linked
      // collections in via the same prop. Fall back to a slug-only link.
      return { slug, title: slug };
    })
    .filter(Boolean);

  return (
    <section className="cx-anti cx-anti--not-for" aria-labelledby="cx-anti-title">
      <header className="cx-anti__head">
        <span className="cx-anti__eyebrow">
          <ShieldAlert className="size-3.5" aria-hidden="true" />
          Quando NON è la raccolta giusta
        </span>
        <h2 id="cx-anti-title" className="cx-anti__title">
          Non fa per te se…
        </h2>
      </header>
      <p className="cx-anti__body">{anti.not_for}</p>
      {links.length > 0 && (
        <div className="cx-anti__links">
          {links.map((link) => (
            <Link
              key={link.slug}
              href={`/collections/${link.slug}`}
              className="cx-anti__link"
            >
              <span>Vai invece a: {link.slug.replace(/-/g, " ")}</span>
              <span className="cx-anti__link-cta">
                Apri
                <ArrowRight className="size-3" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
