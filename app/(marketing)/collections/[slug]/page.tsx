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
import { getGuidePosts } from "@/lib/data/public-articles";
import "../collections.css";

type CollectionPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const collections = await getCuratedCollections();
  return collections.map((collection) => ({ slug: collection.slug }));
}

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
  const [collection, relatedCollections, allCollections, guides] = await Promise.all([
    getCollectionBySlug(slug),
    getRelatedCollectionsForSlug(slug),
    getCuratedCollections(),
    getGuidePosts(),
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
        guideTitles={Object.fromEntries(guides.map((guide) => [guide.slug, guide.title]))}
      />

      {/* Collection Partner — ending Partner Experience: appears only after the
          full curated tool list, so the sponsor never precedes or shapes the
          editorial selection. Resolver-driven; renders null without relevance.
          Wrapper is a positioning host — vertical padding is gated by
          `:not(:empty)` in collections.css so a null resolver doesn't
          reserve blank space. */}
      <div className="cx-detail-partner">
        <PartnerCollectionModule
          placementKey="collection-native-sponsor"
          context={{
            tags: collectionPartnerTags,
            text: `${collection.title} ${collection.description} ${theme}`,
          }}
        />
      </div>

      {/* Route-scoped modifier swaps the sponsor-opportunity ink tokens
          to on-dark (light text on the dark collections canvas). Same
          null-spacing discipline. */}
      <div className="cx-collection-detail-page cx-detail-sponsor-slot">
        <SponsorOpportunityLink
          placementId="collections-sponsor-opportunity"
          route={`/collections/${collection.slug}`}
        />
      </div>
    </>
  );
}

