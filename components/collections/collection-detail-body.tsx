import { JsonLd } from "@/components/seo/json-ld";
import { CollectionDetailHero } from "./collection-detail-hero";
import { CollectionStackOverview } from "./collection-stack-overview";
import { CollectionStackVariants } from "./collection-stack-variants";
import { CollectionDecisionIntelligence } from "./collection-decision-intelligence";
import { CollectionAntiRecommendation } from "./collection-anti-recommendation";
import { CollectionScenario } from "./collection-scenario";
import { CollectionRelated } from "./collection-related";

import type { CuratedCollection } from "@/lib/types/collection";
import { siteConfig } from "@/lib/config/site";

type CollectionDetailBodyProps = {
  collection: CuratedCollection;
  relatedCollections: CuratedCollection[];
};

export function CollectionDetailBody({
  collection,
  relatedCollections,
}: CollectionDetailBodyProps) {
  const canonicalUrl = `${siteConfig.url}/collections/${collection.slug}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: collection.title,
        description: collection.description,
        url: canonicalUrl,
        image: collection.cover_image_url,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: collection.included_tools.length,
          itemListElement: collection.included_tools.map((slot, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: slot.tool.name,
            url: `${siteConfig.url}/toools/${slot.tool.slug}`,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "TooolVibes", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "Raccolte", item: `${siteConfig.url}/collections` },
          { "@type": "ListItem", position: 3, name: collection.title, item: canonicalUrl },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={structuredData} />
      <div className="cx-detail">
        <CollectionDetailHero collection={collection} />
        <CollectionStackOverview collection={collection} />
        <CollectionStackVariants collection={collection} />
        <CollectionDecisionIntelligence collection={collection} />
        <CollectionScenario collection={collection} />
        <CollectionAntiRecommendation collection={collection} />
        <CollectionRelated
          collection={collection}
          relatedCollections={relatedCollections}
        />
      </div>
    </>
  );
}
