import type { Metadata } from "next";

import { DefinitiveArchive } from "@/components/archive/definitive-archive";
import { NativePlacement } from "@/components/monetization/native-placement";
import { isCatalogDensityPolicyEnabled } from "@/lib/config/catalog-density-policy";
import { parseCatalogLevelParam } from "@/components/directory/catalog/catalog-controller";
import {
  getPublicToolFilterGroups,
  getPublicToolViews,
} from "@/lib/data/public-tools";
import "./archive.css";
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
        <section className="page-shell relative z-10 -mt-5 pb-3 sm:-mt-8 sm:pb-5">
          <NativePlacement placementKey="catalog-native-sponsor" variant="band" />
        </section>
      )}

      <DefinitiveArchive
        tools={tools}
        filterGroups={filterGroups}
        initialQuery={initialQuery}
        initialGroup={initialGroup}
        initialLevel={initialLevel}
      />

      {catalogDensityPolicy && (
        <section
          className="page-shell relative z-10 pt-3 sm:pt-5"
          aria-label="Sponsor catalogo"
        >
          <NativePlacement placementKey="catalog-native-sponsor" variant="band" />
        </section>
      )}
    </div>
  );
}
