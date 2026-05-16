import { DirectoryBrowser } from "@/components/directory/directory-browser";
import { ArchiveFlowPanel } from "@/components/directory/archive-flow-panel";
import {
  directoryFilterGroups,
  directoryTools,
  type DirectoryFilterGroup,
} from "@/lib/data/tooolvibes-directory";

type ArchivePageProps = {
  searchParams: Promise<{ q?: string; tag?: string; group?: string }>;
};

export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const params = await searchParams;
  const initialGroup = directoryFilterGroups.some(
    (group) => group.key === params.group,
  )
    ? (params.group as DirectoryFilterGroup)
    : "all";

  return (
    <div className="page-shell space-y-5 pb-28 pt-4 sm:space-y-8 sm:pb-20 sm:pt-6">
      <section className="hero-shell hero-shell-radar motion-reveal px-5 py-5 shadow-[0_24px_72px_rgba(8,14,38,0.22)] sm:rounded-[38px] sm:px-7 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.52fr)] lg:items-center">
          <div className="max-w-[46rem]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
              Archivio tool
            </p>
            <h1 className="mt-4 max-w-[15ch] text-[clamp(2rem,9vw,3.25rem)] leading-[1.05] text-white">
              Cerca meglio. Scegli pi&ugrave; in fretta.
            </h1>
            <p className="mt-4 max-w-[40rem] text-[0.98rem] leading-7 text-white/68 sm:mt-5 sm:text-[1rem]">
              Cerca per nome, categoria, tag e descrizione. Qui l&apos;archivio resta
              pulito, utile e pronto a portarti direttamente al tool o alla scheda interna.
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

      <DirectoryBrowser
        tools={directoryTools}
        eyebrow="Esplora il catalogo"
        title="Tutti i tool selezionati in una vista pulita."
        description="Filtra, salva, confronta e costruisci uno stack senza perdere contesto."
        initialQuery={params.q ?? ""}
        initialTag={params.tag ?? ""}
        initialGroup={initialGroup}
      />
    </div>
  );
}
