import type { Metadata } from "next";

import { Archive3DHero } from "@/components/3d-maestoso/archive-3d-hero";
import { FloatingCatalogView } from "@/components/directory/floating-catalog-view";
import { NativePlacement } from "@/components/monetization/native-placement";
import { releaseFeatures } from "@/lib/config/release-features";
import { isCatalogDensityPolicyEnabled } from "@/lib/config/catalog-density-policy";
import { parseCatalogLevelParam } from "@/components/directory/catalog/catalog-controller";
import {
  getPublicToolFilterGroups,
  getPublicToolViews,
} from "@/lib/data/public-tools";

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
  const initialGroup = filterGroups.some((group) => group.key === params.group)
    ? params.group ?? "all"
    : "all";
  const initialLevel = parseCatalogLevelParam(params.level);

  /* B38 / MOB-702 — sponsor policy: con la density policy attiva lo
     slot sponsor NON precede il primo valore organico utile: la band
     si sposta DOPO il catalogo (categorie/tool). Flag OFF → posizione
     legacy above-the-fold, reversibilita' immediata. */
  const catalogDensityPolicy = isCatalogDensityPolicyEnabled();

  return (
    <main className="relative overflow-x-hidden">
      {releaseFeatures.threeD.enabled && <Archive3DHero />}
      {!catalogDensityPolicy && (
        <section className="page-shell relative z-10 -mt-5 pb-3 sm:-mt-8 sm:pb-5">
          <NativePlacement placementKey="catalog-native-sponsor" variant="band" />
        </section>
      )}
      <FloatingCatalogView
        tools={tools}
        filterGroups={filterGroups}
        initialQuery={initialQuery}
        initialGroup={initialGroup}
        initialTag={params.tag ?? ""}
        initialLevel={initialLevel}
        unifiedSearchEnabled={releaseFeatures.unifiedSearch.enabled}
      />
      {catalogDensityPolicy && (
        <section
          className="page-shell relative z-10 pt-3 sm:pt-5"
          aria-label="Sponsor catalogo"
        >
          <NativePlacement placementKey="catalog-native-sponsor" variant="band" />
        </section>
      )}

      {/* ═══ Semantic fallback for search engines & screen readers ═══
          A minimal structured list remains in the DOM for accessibility
          and SEO, visually hidden but discoverable by assistive tech.
      */}
      <section className="sr-only" aria-label="Catalogo tool in formato lista accessibile">
        <h1>Archivio Tool AI — TooolVibes</h1>
        <p>{tools.length} tool curati nel catalogo.</p>
        <ul>
          {tools.slice(0, 20).map((tool) => (
            <li key={tool.slug}>
              <a href={`/toools/${tool.slug}`}>{tool.name}</a>
              <span>{tool.categoryLabel}</span>
              <p>{tool.shortDescription || tool.tldr}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
