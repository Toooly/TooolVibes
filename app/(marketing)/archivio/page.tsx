import type { Metadata } from "next";

import { DefinitiveArchive } from "@/components/archive/definitive-archive";
import { PartnerToolCard } from "@/components/monetization/partner-placements";
import { isCatalogDensityPolicyEnabled } from "@/lib/config/catalog-density-policy";
import { parseCatalogLevelParam } from "@/components/directory/catalog/catalog-controller";
import {
  getPublicToolFilterGroups,
  getPublicToolViews,
} from "@/lib/data/public-tools";
import "@/styles/archive-v4.css";

export const metadata: Metadata = {
  title: "Archivio tool",
  description: "Esplora tool AI, SaaS, no-code e vibe coding selezionati da TooolVibes.",
  alternates: { canonical: "/archivio" },
};

type ArchivePageProps = {
  searchParams: Promise<{ q?: string; tag?: string; group?: string; level?: string }>;
};

export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const params = await searchParams;
  const [tools, filterGroups] = await Promise.all([
    getPublicToolViews(),
    getPublicToolFilterGroups(),
  ]);
  const initialQuery = params.q?.trim() ?? "";
  const requestedGroup = params.group ?? params.tag;
  const initialGroup = filterGroups.some((group) => group.key === requestedGroup)
    ? requestedGroup ?? "all"
    : "all";
  const initialLevel = parseCatalogLevelParam(params.level);

  /* B38 / MOB-702 — sponsor policy: con la density policy attiva lo
     slot sponsor NON precede il primo valore organico utile: la band
     si sposta DOPO il catalogo (categorie/tool). Flag OFF → posizione
     legacy above-the-fold, reversibilita' immediata. */
  const catalogDensityPolicy = isCatalogDensityPolicyEnabled();

  return (
    <div className="archive-final-surface relative overflow-x-hidden">
      {!catalogDensityPolicy && (
        <PartnerToolCard
          placementKey="catalog-native-sponsor"
          className="archive-partner-placement archive-partner-placement--before"
        />
      )}

      <DefinitiveArchive
        tools={tools}
        filterGroups={filterGroups}
        initialQuery={initialQuery}
        initialGroup={initialGroup}
        initialLevel={initialLevel}
      />

      {catalogDensityPolicy && (
        <PartnerToolCard
          placementKey="catalog-native-sponsor"
          className="archive-partner-placement archive-partner-placement--after"
        />
      )}
    </div>
  );
}
