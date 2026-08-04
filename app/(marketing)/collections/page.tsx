import type { Metadata } from "next";

import { MobileCollectionsView } from "@/components/collections/mobile-collections-view";
import {
  getCuratedCollections,
  getFeaturedCollections,
  getFeaturedSpecialIssue,
} from "@/lib/data/public-collections";
import { createPublicPageMetadata } from "@/lib/seo/metadata";
import "./collections.css";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Raccolte",
  description: "Percorsi di tool organizzati per stack, workflow e scenari, per scegliere più velocemente cosa provare.",
  path: "/collections",
});

export const revalidate = 3600;

export default async function CollectionsPage() {
  const [collections, featuredCollections, specialIssue] = await Promise.all([
    getCuratedCollections(),
    getFeaturedCollections(),
    getFeaturedSpecialIssue(),
  ]);

  const leadCollection =
    featuredCollections.find((collection) => collection.slug !== specialIssue?.slug) ??
    collections.find((collection) => collection.slug !== specialIssue?.slug) ??
    specialIssue ??
    null;

  return (
    <MobileCollectionsView
      collections={collections}
      specialIssue={specialIssue ?? null}
      leadCollection={leadCollection}
    />
  );
}
