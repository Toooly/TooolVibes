import type { Metadata } from "next";

import { Archive3DHero } from "@/components/3d-maestoso/archive-3d-hero";
import { FloatingCatalogView } from "@/components/directory/floating-catalog-view";
import { NativePlacement } from "@/components/monetization/native-placement";
import {
  directoryFilterGroups,
  directoryTools,
  type DirectoryFilterGroup,
} from "@/lib/data/tooolvibes-directory";

export const metadata: Metadata = {
  title: "Archivio tool",
  description: "Esplora tool AI, SaaS, no-code e vibe coding selezionati da TooolVibes.",
  alternates: { canonical: "/archivio" },
};

type ArchivePageProps = {
  searchParams: Promise<{ q?: string; tag?: string; group?: string }>;
};

export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const params = await searchParams;
  const initialQuery = params.q?.trim() ?? "";
  const initialGroup = directoryFilterGroups.some(
    (group) => group.key === params.group,
  )
    ? (params.group as DirectoryFilterGroup)
    : "all";

  return (
    <main className="relative overflow-x-hidden">
      <Archive3DHero />
      <section className="page-shell relative z-10 -mt-5 pb-3 sm:-mt-8 sm:pb-5">
        <NativePlacement placementKey="catalog-native-sponsor" variant="band" />
      </section>
      <FloatingCatalogView
        tools={directoryTools}
        filterGroups={directoryFilterGroups}
        initialQuery={initialQuery}
        initialGroup={initialGroup}
        initialTag={params.tag ?? ""}
      />

      {/* ═══ Semantic fallback for search engines & screen readers ═══
          A minimal structured list remains in the DOM for accessibility
          and SEO, visually hidden but discoverable by assistive tech.
      */}
      <section className="sr-only" aria-label="Catalogo tool in formato lista accessibile">
        <h1>Archivio Tool AI — TooolVibes</h1>
        <p>{directoryTools.length} tool curati nel catalogo.</p>
        <ul>
          {directoryTools.slice(0, 20).map((tool) => (
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
