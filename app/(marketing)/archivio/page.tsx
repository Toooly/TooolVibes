import type { Metadata } from "next";
import Link from "next/link";

import { DefinitiveArchive } from "@/components/archive/definitive-archive";
import { TinyAdzInlineSlot } from "@/components/ads/tinyadz-inline-slot";
import { PartnerEditorialInsert } from "@/components/monetization/partner-placements";
import { resolvePublicMonetizationPlacement } from "@/lib/monetization/placements";
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

  /* Partner Experience V3.1 — il Catalog Insert vive DENTRO il flusso di
     discovery: viene inserito a livello di render dopo il primo gruppo di
     card organiche (vedi DefinitiveArchive), mai prima del valore
     organico e mai in coda al catalogo. L'ordine organico resta intatto. */
  // V2 contract: non renderizzare lo slot se il record è demo/fixture/
  // development/placeholder. Wrapper identico a quello della Home V2.
  const placement = resolvePublicMonetizationPlacement("catalog-native-sponsor");

  return (
    <div className="archive-final-surface relative overflow-x-hidden">
      <DefinitiveArchive
        tools={tools}
        filterGroups={filterGroups}
        initialQuery={initialQuery}
        initialGroup={initialGroup}
        initialLevel={initialLevel}
        partnerInsert={
          placement ? (
            <PartnerEditorialInsert
              placementKey="catalog-native-sponsor"
              formatLabelOverride="Partner nel catalogo"
              className="archive-partner-placement"
              trackerRoute="/archivio"
            />
          ) : null
        }
        adInsert={<TinyAdzInlineSlot placement="archive-feed" />}
      />

      {/*
        Editorial method band — sits BETWEEN the TinyAdz mount and the
        direct-sponsor mount so the two commercial units are never
        visually adjacent on /archivio. Reinforces that the catalog
        stays editorial and that sponsored content stays labeled and
        separated. See `lib/monetization/commercial-placement-matrix.ts`
        for the canonical contract.
      */}
      <section
        className="archive-method-band"
        aria-labelledby="archive-method-band-title"
      >
        <div className="archive-method-band__inner">
          <p className="archive-method-band__eyebrow">Metodo TooolVibes</p>
          <h2
            id="archive-method-band-title"
            className="archive-method-band__title"
          >
            Il catalogo resta editoriale. Gli sponsor restano dichiarati.
          </h2>
          <ol className="archive-method-band__items">
            <li className="archive-method-band__item">
              <h3 className="archive-method-band__item-title">
                Selezione curata
              </h3>
              <p className="archive-method-band__item-body">
                Ogni tool entra dopo una valutazione editoriale, non per pagamento.
              </p>
            </li>
            <li className="archive-method-band__item">
              <h3 className="archive-method-band__item-title">
                Nessuna posizione in vendita
              </h3>
              <p className="archive-method-band__item-body">
                L&apos;ordine organico non è influenzato da partner o inserzionisti.
              </p>
            </li>
            <li className="archive-method-band__item">
              <h3 className="archive-method-band__item-title">
                Sponsor sempre marcati
              </h3>
              <p className="archive-method-band__item-body">
                I contenuti commerciali sono separati e sempre etichettati.
              </p>
            </li>
          </ol>
          <Link href="/metodo" className="archive-method-band__link">
            Scopri il metodo
          </Link>
        </div>
      </section>

    </div>
  );
}
