import type { Metadata } from "next";

import { CollectionsIndex } from "@/components/collections/collections-index";
import { getCuratedCollections } from "@/lib/data/public-collections";
import { createPublicPageMetadata } from "@/lib/seo/metadata";
import "./collections.css";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Raccolte: stack operativi AI e no-code",
  description:
    "Raccolte TooolVibes: tool, ruoli e ordine di lavoro già decisi per un risultato preciso.",
  path: "/collections",
});

export default async function CollectionsPage() {
  const collections = await getCuratedCollections();
  return <CollectionsIndex collections={collections} />;
}

