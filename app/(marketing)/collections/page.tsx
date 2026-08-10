import type { Metadata } from "next";

import { CollectionsIndex } from "@/components/collections/collections-index";
import { getCuratedCollections } from "@/lib/data/public-collections";
import { createPublicPageMetadata } from "@/lib/seo/metadata";
import "./collections.css";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Raccolte",
  description:
    "Stack operativi TooolVibes: tool, ruoli e ordine di lavoro per costruire un risultato preciso. Non un elenco di preferiti.",
  path: "/collections",
});

export const revalidate = 3600;

export default async function CollectionsPage() {
  const collections = await getCuratedCollections();
  return <CollectionsIndex collections={collections} />;
}

