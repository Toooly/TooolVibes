import type { Metadata } from "next";

import { MobileCollectionsView } from "@/components/collections/mobile-collections-view";
import {
  getCuratedCollections,
  getFeaturedCollections,
  getFeaturedSpecialIssue,
} from "@/lib/data/public-collections";
import "./collections.css";

export const metadata: Metadata = {
  title: "Collections",
  description: "Raccolte editoriali di tool per scegliere piu velocemente cosa provare.",
  alternates: { canonical: "/collections" },
};

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
