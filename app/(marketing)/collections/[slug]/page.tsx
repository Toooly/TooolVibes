import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CollectionDetailBodyV4 } from "@/components/collections/collection-detail-body-v4";
import { CollectionSignalTracker } from "@/components/collections/collection-signal-tracker";
import {
  PartnerCollectionModule,
  SponsorOpportunityLink,
} from "@/components/monetization/partner-placements";
import { partnerSegmentsForToolSlugs } from "@/lib/sponsors/partner-context";
import { getCollectionThemeLabel } from "@/lib/collections/helpers";
import {
  getCollectionBySlug,
  getCuratedCollections,
  getRelatedCollectionsForSlug,
} from "@/lib/data/public-collections";
import { createPublicPageMetadata } from "@/lib/seo/metadata";
import "../collections.css";

type CollectionPageProps = {
  params: Promise<{ slug: string }>;
};

// Collections are public editorial content. Pre-render known slugs and
// revalidate in the background instead of resolving every request cold.
export const revalidate = 3600;

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);

  if (!collection) {
    return {};
  }

  return createPublicPageMetadata({
    title: collection.title,
    description: collection.description,
    path: `/collections/${collection.slug}`,
    image: {
      url: collection.cover_image_url,
      alt: collection.title,
    },
  });
}

export default async function CollectionDetailPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const [collection, relatedCollections, allCollections] = await Promise.all([
    getCollectionBySlug(slug),
    getRelatedCollectionsForSlug(slug),
    getCuratedCollections(),
  ]);

  if (!collection) {
    notFound();
  }

  /* Collection Partner matching depth: derive catalogue segments from the
     included tools so the contextual resolver receives structured metadata
     instead of free text. Uncatalogued slugs are skipped (never forced). */
  const collectionPartnerTags = partnerSegmentsForToolSlugs(
    collection.included_tools.map((slot) => slot.tool_slug),
  );
  const theme = getCollectionThemeLabel(collection.theme);

  return (
    <>
      <CollectionSignalTracker
        slug={collection.slug}
        stepCount={collection.included_tools.length}
      />
      <CollectionDetailBodyV4
        collection={collection}
        relatedCollections={relatedCollections}
        allCollections={allCollections}
      />

      {/* Collection Partner — ending Partner Experience: appears only after the
          full curated tool list, so the sponsor never precedes or shapes the
          editorial selection. Resolver-driven; renders null without relevance. */}
      <div className="collection-detail-partner" style={{ width: "min(100%, var(--tv-container-uw))", marginInline: "auto", padding: "0 clamp(1rem, 4vw, 3rem) 4rem" }}>
        <PartnerCollectionModule
          placementKey="collection-native-sponsor"
          context={{
            tags: collectionPartnerTags,
            text: `${collection.title} ${collection.description} ${theme}`,
          }}
        />
      </div>

      <div style={{ width: "min(100%, var(--tv-container-uw))", marginInline: "auto", padding: "0 clamp(1rem, 4vw, 3rem) 5rem" }}>
        <SponsorOpportunityLink placementId="collections-sponsor-opportunity" route={`/collections/${collection.slug}`} />
      </div>
    </>
  );
}

