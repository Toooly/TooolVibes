import type { CuratedCollection } from "@/lib/types/collection";
import { pickFeaturedCollection } from "@/lib/collections/visual-identity";

import { MemberPreviewGate } from "@/components/account/member-preview-gate";
import { CollectionCardV4 } from "./collection-card-v4";

type CollectionsIndexProps = {
  collections: CuratedCollection[];
};

export function CollectionsIndex({ collections }: CollectionsIndexProps) {
  if (collections.length === 0) {
    return (
      <div className="cx-index">
        <div className="cx-index__inner">
          <section
            className="mobile-library-empty cx-index__empty"
            aria-labelledby="cx-index-empty-title"
          >
            <div className="mobile-library-empty__content">
              <span className="mobile-library-empty__kicker">Raccolte</span>
              <h1 id="cx-index-empty-title">Nessuna raccolta disponibile.</h1>
              <p>Le raccolte sono in preparazione. Intanto esplora il catalogo.</p>
            </div>
            <div className="mobile-library-empty__actions">
              <a href="/archivio" className="mobile-library-empty__cta">
                Esplora i tool
              </a>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const lead = pickFeaturedCollection(collections);
  const rest = lead
    ? collections.filter((c) => c.slug !== lead.slug)
    : collections;

  return (
    <div className="cx-index">
      <div className="cx-index__inner">
        <header className="cx-index__masthead motion-reveal">
          <div>
            <h1 className="cx-index__title">Raccolte</h1>
          </div>
          <div>
            <p className="cx-index__lede">Stack completi per risultati concreti.</p>
          </div>
        </header>

        {lead ? (
          <div className="cx-index__grid cx-index__grid--lead motion-reveal">
            <CollectionCardV4 collection={lead} featured />
          </div>
        ) : null}

        <MemberPreviewGate
          title="Continua nel tuo spazio"
          body="Le altre raccolte restano nel tuo spazio."
        >
          <div className="cx-index__grid cx-index__grid--group motion-stagger">
            {rest.map((collection) => (
              <CollectionCardV4 key={collection.slug} collection={collection} />
            ))}
          </div>
        </MemberPreviewGate>
      </div>
    </div>
  );
}
