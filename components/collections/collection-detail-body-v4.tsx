import { JsonLd } from "@/components/seo/json-ld";

import type { CuratedCollection } from "@/lib/types/collection";
import { siteConfig } from "@/lib/config/site";

import { CollectionDetailHeroV4 } from "./collection-detail-hero-v4";
import { CollectionStackFlowV4 } from "./collection-stack-flow-v4";
import { CollectionVariantPathsV4 } from "./collection-variant-paths-v4";
import { CollectionDecisionNotesV4 } from "./collection-decision-notes-v4";
import { CollectionScenarioV4 } from "./collection-scenario-v4";
import { CollectionAntiRecommendationV4 } from "./collection-anti-recommendation-v4";
import { CollectionGuideBridgeV4 } from "./collection-guide-bridge-v4";
import { CollectionNextStepV4 } from "./collection-next-step-v4";

type CollectionDetailBodyV4Props = {
  collection: CuratedCollection;
  relatedCollections: CuratedCollection[];
  allCollections: CuratedCollection[];
};

/**
 * Detail Body V4 — orchestrator for the redesigned detail page.
 *
 * 9 sections in a guided sequence:
 *   1. HERO                    — composed, stack preview inline
 *   2. STACK FLOW              — connected vertical composition
 *   3. VARIANT PATHS           — additive or architectural
 *   4. DECISION NOTES          — editorial grouping
 *   5. SCENARIO                — visual sequence
 *   6. ANTI-RECOMMENDATION     — editorial honesty
 *   7. GUIDE BRIDGE            — deeper knowledge
 *   8. NEXT STEP               — progression to related Collections
 *   9. (Sponsor modules, in the page itself — preserved untouched)
 *
 * Each section uses elevated surface only where it adds meaning.
 * The DNA of V4.1 (real tool glyphs, restrained accent, controlled
 * spacing) is preserved across all sections.
 */
export function CollectionDetailBodyV4({
  collection,
  relatedCollections,
  allCollections,
}: CollectionDetailBodyV4Props) {
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
      <div className="cx-detail-v4">
        <CollectionDetailHeroV4 collection={collection} />
        <CollectionStackFlowV4 collection={collection} />
        <CollectionVariantPathsV4 collection={collection} />
        <CollectionDecisionNotesV4 collection={collection} />
        <CollectionScenarioV4 collection={collection} />
        <CollectionAntiRecommendationV4
          collection={collection}
          allCollections={allCollections}
        />
        <CollectionGuideBridgeV4 collection={collection} />
        <CollectionNextStepV4
          relatedCollections={relatedCollections}
        />
      </div>
    </>
  );
}
