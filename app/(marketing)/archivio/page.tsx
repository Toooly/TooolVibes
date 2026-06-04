import { DirectoryBrowser } from "@/components/directory/directory-browser";
import { ArchiveFlowPanel } from "@/components/directory/archive-flow-panel";
import { DesktopVibeArchive } from "@/components/desktop/desktop-vibe-archive";
import { PageOrbitShell } from "@/components/app/orbital-system";
import type { OrbitalItem } from "@/components/app/orbital-system";
import {
  directoryFilterGroups,
  directoryTools,
  type DirectoryFilterGroup,
} from "@/lib/data/tooolvibes-directory";

function toolToOrbital(tool: typeof directoryTools[0], sectionId: string): OrbitalItem {
  const words = tool.name.split(/\s+/).filter(Boolean);
  const initials = words.length === 1
    ? words[0].slice(0, 2).toUpperCase()
    : (words[0]?.[0] ?? "") + (words[1]?.[0] ?? "");
  return {
    id: `${sectionId}-${tool.slug}`,
    title: tool.name,
    initials: initials.toUpperCase(),
    description: tool.shortDescription || tool.description,
    category: tool.categoryLabel,
    href: `/toools/${tool.slug}`,
    sectionId,
    priority: 1,
    color: tool.accentFrom || "#6a3cff",
  };
}

const archiveItems: OrbitalItem[] = directoryTools.slice(0, 6).map((t) => toolToOrbital(t, "archive-page"));

type ArchivePageProps = {
  searchParams: Promise<{ q?: string; tag?: string; group?: string }>;
};

export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const params = await searchParams;
  const initialQuery = params.q?.trim() ?? "";
  const isDirectSearch = Boolean(initialQuery);
  const initialGroup = directoryFilterGroups.some(
    (group) => group.key === params.group,
  )
    ? (params.group as DirectoryFilterGroup)
    : "all";

  return (
    <PageOrbitShell sectionId="archive-page" label="Archivio" items={archiveItems}>
      <>
        {!isDirectSearch ? (
          <DesktopVibeArchive
            tools={directoryTools}
            initialQuery={initialQuery}
            initialTag={params.tag ?? ""}
            initialGroup={initialGroup}
          />
        ) : null}

        <div className={`page-shell space-y-5 pb-28 pt-4 sm:space-y-8 sm:pb-20 sm:pt-6 ${isDirectSearch ? "" : "lg:hidden"}`}>
          {!isDirectSearch ? (
            <section className="hero-shell hero-shell-radar motion-reveal px-5 py-5 shadow-[0_24px_72px_rgba(8,14,38,0.22)] sm:rounded-[38px] sm:px-7 sm:py-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.52fr)] lg:items-center">
                <div className="max-w-[46rem]">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                    Archivio tool
                  </p>
                  <h1 className="mt-4 max-w-[15ch] text-[clamp(2rem,9vw,3.25rem)] leading-[1.05] text-white">
                    Cerca meglio. Scegli con piu vibe.
                  </h1>
                  <p className="mt-4 max-w-[40rem] text-[0.98rem] leading-7 text-white/68 sm:mt-5 sm:text-[1rem]">
                    Cerca per nome, categoria, tag e descrizione. Qui il catalogo resta
                    pulito, vivo e pronto a portarti al tool giusto senza rumore.
                  </p>

                  <div className="mt-5 hidden gap-2 overflow-x-auto pb-1 sm:mt-6 sm:flex sm:flex-wrap sm:gap-3">
                    {[
                      `${directoryTools.length} tool verificati`,
                      "Filtri rapidi",
                      "Schede e link ufficiali",
                    ].map((item) => (
                      <span
                        key={item}
                        className="shrink-0 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-white/68 sm:px-4 sm:py-2 sm:text-[0.74rem]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <ArchiveFlowPanel />
              </div>
            </section>
          ) : null}

          <DirectoryBrowser
            tools={directoryTools}
            eyebrow={isDirectSearch ? "Risultato" : "Esplora il catalogo"}
            title={isDirectSearch ? "Risultato diretto" : "Tutti i tool selezionati in una vista che respira."}
            description={isDirectSearch ? "" : "Filtra, salva, confronta e costruisci uno stack senza perdere contesto o ritmo."}
            initialQuery={initialQuery}
            initialTag={params.tag ?? ""}
            initialGroup={initialGroup}
            directSearchMode={isDirectSearch}
          />
        </div>
      </>
    </PageOrbitShell>
  );
}
