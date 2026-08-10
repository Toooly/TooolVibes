import Link from "next/link";
import { ArrowRight, BookOpenText, GitMerge } from "lucide-react";

import type { CuratedCollection } from "@/lib/types/collection";
import { getCollectionAreaLabel, getCollectionCoreToolSlugs } from "@/lib/collections/helpers";

type CollectionRelatedProps = {
  collection: CuratedCollection;
  relatedCollections: CuratedCollection[];
};

export function CollectionRelated({
  collection,
  relatedCollections,
}: CollectionRelatedProps) {
  const declaredSlugs = collection.stack_meta?.related_collection_slugs ?? [];
  const guideSlugs = collection.stack_meta?.related_guide_slugs ?? [];

  // Merge declared + computed, dedupe, filter out the current collection.
  const mergedSlugs = Array.from(
    new Set([
      ...declaredSlugs,
      ...relatedCollections.map((c) => c.slug),
    ]),
  ).filter((slug) => slug !== collection.slug);

  const finalCollections = mergedSlugs
    .map((slug) => relatedCollections.find((c) => c.slug === slug))
    .filter((c): c is CuratedCollection => Boolean(c));

  // Build set of guide slugs that are also referenced inside slots, so we
  // don't double-link.
  const slotGuideSlugs = new Set(
    collection.included_tools
      .map((slot) => slot.relevant_guide_slug)
      .filter(Boolean) as string[],
  );

  const surfaceGuides = guideSlugs.filter((slug) => !slotGuideSlugs.has(slug));

  if (finalCollections.length === 0 && surfaceGuides.length === 0 && slotGuideSlugs.size === 0) {
    return null;
  }

  return (
    <section aria-label="Approfondisci" style={{ display: "grid", gap: "1.4rem" }}>
      {finalCollections.length > 0 && (
        <div>
          <header
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: "1rem",
              marginBottom: "0.85rem",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--tv-font-family-display)",
                fontWeight: 400,
                fontSize: "clamp(1.2rem, 1.8vw, 1.5rem)",
                lineHeight: 1.05,
                margin: 0,
                color: "var(--tv-ink-primary)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <GitMerge className="size-4" aria-hidden="true" />
              Dove andare dopo
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "var(--tv-ink-muted)",
              }}
            >
              Prossimo passo
            </p>
          </header>
          <div className="cx-related-grid">
            {finalCollections.map((related) => (
              <Link
                key={related.slug}
                href={`/collections/${related.slug}`}
                className="cx-related-card"
              >
                <span className="cx-related-card-eyebrow cx-related-card-eyebrow--collection">
                  {getCollectionAreaLabel(related)}
                </span>
                <h4 className="cx-related-card-title">{related.title}</h4>
                <p className="cx-related-card-promise">
                  {related.stack_meta?.concise_promise ?? related.description}
                </p>
                <div className="cx-related-card-meta">
                  <span>{getCollectionCoreToolSlugs(related).length} CORE</span>
                  <span className="cx-related-card-meta-sep" aria-hidden="true" />
                  <span>Apri</span>
                  <ArrowRight className="size-3" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {(surfaceGuides.length > 0 || slotGuideSlugs.size > 0) && (
        <div>
          <header
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: "1rem",
              marginBottom: "0.85rem",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--tv-font-family-display)",
                fontWeight: 400,
                fontSize: "clamp(1.2rem, 1.8vw, 1.5rem)",
                lineHeight: 1.05,
                margin: 0,
                color: "var(--tv-ink-primary)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <BookOpenText className="size-4" aria-hidden="true" />
              Guide collegate
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "var(--tv-ink-muted)",
              }}
            >
              Approfondisci un tool
            </p>
          </header>
          <div className="cx-related-grid">
            {Array.from(
              new Set([...surfaceGuides, ...Array.from(slotGuideSlugs)]),
            ).map((slug) => (
              <Link
                key={slug}
                href={`/posts/${slug}`}
                className="cx-related-card cx-related-card--guide"
              >
                <span className="cx-related-card-eyebrow">Guida</span>
                <h4 className="cx-related-card-title">
                  {slug.replace(/-/g, " ")}
                </h4>
                <p className="cx-related-card-promise">
                  Approfondimento editoriale su questo tool, scritto per
                  decidere meglio.
                </p>
                <div className="cx-related-card-meta">
                  <span>Apri la guida</span>
                  <ArrowRight className="size-3" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
