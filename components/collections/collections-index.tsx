"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { useLocale } from "@/components/i18n/locale-provider";
import type { CuratedCollection } from "@/lib/types/collection";
import { pickFeaturedCollection } from "@/lib/collections/visual-identity";

import { MemberPreviewGate } from "@/components/account/member-preview-gate";
import { CollectionCardV4 } from "./collection-card-v4";

type CollectionsIndexProps = {
  collections: CuratedCollection[];
};

export function CollectionsIndex({ collections }: CollectionsIndexProps) {
  const { locale } = useLocale();
  if (collections.length === 0) {
    return (
      <div className="cx-index">
        <div className="cx-index__inner">
          <section
            className="mobile-library-empty cx-index__empty"
            aria-labelledby="cx-index-empty-title"
          >
            <div className="mobile-library-empty__content">
              <span className="mobile-library-empty__kicker"><LocalizedText>{"Raccolte"}</LocalizedText></span>
              <h1 id="cx-index-empty-title"><LocalizedText>{"Nessuna raccolta disponibile."}</LocalizedText></h1>
              <p><LocalizedText>{"Le raccolte sono in preparazione. Intanto esplora il catalogo."}</LocalizedText></p>
            </div>
            <div className="mobile-library-empty__actions">
              <a href="/archivio" className="mobile-library-empty__cta"><LocalizedText>{"Esplora i tool "}</LocalizedText></a>
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
            <h1 className="cx-index__title">{locale === "en" ? "Stacks" : "Raccolte"}</h1>
          </div>
          <div>
            <p className="cx-index__lede">{locale === "en" ? "Tools that work together, with clear roles, costs and handoffs." : "Tool che lavorano insieme, con ruoli, costi e passaggi chiari."}</p>
          </div>
        </header>

        {lead ? (
          <div className="cx-index__grid cx-index__grid--lead motion-reveal">
            <CollectionCardV4 collection={lead} featured headingLevel={2} />
          </div>
        ) : null}

        <LocalizedAttributes><MemberPreviewGate
          title="Continua nel tuo spazio"
          body="Le altre raccolte restano nel tuo spazio."
        >
          <div className="cx-index__grid cx-index__grid--group motion-stagger">
            {rest.map((collection) => (
              <CollectionCardV4 key={collection.slug} collection={collection} headingLevel={2} />
            ))}
          </div>
        </MemberPreviewGate></LocalizedAttributes>
      </div>
    </div>
  );
}
