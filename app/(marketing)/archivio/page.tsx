import { DirectoryBrowser } from "@/components/directory/directory-browser";
import { Layers3, Search, SlidersHorizontal } from "lucide-react";
import {
  directoryFilterGroups,
  directoryTools,
  type DirectoryFilterGroup,
} from "@/lib/data/tooolvibes-directory";

type ArchivePageProps = {
  searchParams: Promise<{ q?: string; tag?: string; group?: string }>;
};

const flussoActions = [
  { icon: Search, title: "Cerca", copy: "Nome, tag e use case.", href: "#archive-search" },
  { icon: SlidersHorizontal, title: "Filtra", copy: "Categorie prima, tag dopo.", href: "#archive-filters" },
  { icon: Layers3, title: "Costruisci", copy: "Salvati, confronto e stack.", href: "#stack-builder" },
];

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
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.52fr)] lg:items-end">
          <div className="max-w-[46rem]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
              Archivio tool
            </p>
            <h1 className="mt-4 max-w-[15ch] text-[clamp(2rem,9vw,3.25rem)] leading-[0.98] text-white">
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

          <div className="hero-mini-visual rounded-[28px] border border-white/12 bg-white/9 p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/48">
              Flusso catalogo
            </p>
            <div className="mt-4 grid gap-3">
              {flussoActions.map((item) => {
                const Icon = item.icon;

                return (
                  <a
                    key={item.title}
                    href={item.href}
                    className="flex items-center gap-3 rounded-[20px] border border-white/12 bg-white/8 p-3 transition hover:-translate-y-0.5 hover:border-white/24 hover:bg-white/12"
                  >
                    <span className="grid size-10 place-items-center rounded-[16px] bg-white/10 text-white">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="text-sm text-white/56">{item.copy}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
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
