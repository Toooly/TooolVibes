import type { Metadata } from "next";

import { DefinitiveArchive } from "@/components/archive/definitive-archive";
import { TinyAdzInlineSlot } from "@/components/ads/tinyadz-inline-slot";
import {
  PartnerToolCard,
  SponsorOpportunityLink,
} from "@/components/monetization/partner-placements";
import { resolvePublicMonetizationPlacement } from "@/lib/monetization/placements";
import { isCatalogDensityPolicyEnabled } from "@/lib/config/catalog-density-policy";
import { parseCatalogLevelParam } from "@/components/directory/catalog/catalog-controller";
import {
  getPublicToolFilterGroups,
  getPublicToolViews,
} from "@/lib/data/public-tools";
import { createPublicPageMetadata } from "@/lib/seo/metadata";
import "@/styles/archive-v4.css";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Catalogo di tool AI, SaaS e no-code",
  description:
    "Esplora il catalogo TooolVibes: cerca e filtra tool AI, SaaS e no-code, salva i candidati e confronta le alternative per il tuo stack.",
  path: "/archivio",
  openGraphTitle: "Catalogo · Trova i tool da valutare",
  openGraphDescription:
    "Cerca, filtra e confronta tool AI, SaaS e no-code. Riduci le alternative e trova i candidati giusti per il tuo stack.",
});

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

  // V2 contract: non renderizzare lo slot se il record è demo/fixture/
  // development/placeholder. Wrapper identico a quello della Home V2.
  const placement = resolvePublicMonetizationPlacement("catalog-native-sponsor");

  return (
    <div className="archive-final-surface relative overflow-x-hidden">
      {!catalogDensityPolicy && placement ? (
        <div className="archive-partner-placement-wrap archive-partner-placement-wrap--before">
          <PartnerToolCard
            placementKey="catalog-native-sponsor"
            formatLabelOverride="Partner nel catalogo"
            className="archive-partner-placement archive-partner-placement--before"
            trackerRoute="/archivio"
          />
          <SponsorOpportunityLink />
        </div>
      ) : null}

      <DefinitiveArchive
        tools={tools}
        filterGroups={filterGroups}
        initialQuery={initialQuery}
        initialGroup={initialGroup}
        initialLevel={initialLevel}
      />

      <TinyAdzInlineSlot placement="archive-feed" />

      {catalogDensityPolicy && placement ? (
        <div className="archive-partner-placement-wrap archive-partner-placement-wrap--after">
          <PartnerToolCard
            placementKey="catalog-native-sponsor"
            formatLabelOverride="Partner nel catalogo"
            className="archive-partner-placement archive-partner-placement--after"
            trackerRoute="/archivio"
          />
          <SponsorOpportunityLink />
        </div>
      ) : null}
    </div>
  );
}
