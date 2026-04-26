import { DirectoryBrowser } from "@/components/directory/directory-browser";
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
    <div className="page-shell space-y-6 pb-16 pt-4 sm:space-y-8 sm:pb-20 sm:pt-6">
      <section className="overflow-hidden rounded-[38px] border border-[rgba(83,63,170,0.12)] bg-[linear-gradient(135deg,#fdfcff_0%,#f5f0ff_44%,#eef2ff_100%)] px-5 py-6 shadow-[0_24px_72px_rgba(38,21,104,0.08)] sm:px-7 sm:py-8">
        <div className="max-w-[46rem]">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
            Archivio dei Toools
          </p>
          <h1 className="mt-4 text-[2.4rem] leading-[0.95] text-[var(--foreground)] sm:max-w-[14ch] sm:text-[3.4rem]">
            La directory in cui cerchi meglio e scegli pi&ugrave; in fretta.
          </h1>
          <p className="mt-5 max-w-[40rem] text-[1rem] leading-7 text-[var(--muted-strong)]">
            Cerca per nome, categoria, tag e descrizione. Qui l&apos;archivio resta
            pulito, utile e pronto a portarti direttamente al tool o alla scheda interna.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {[
              `${directoryTools.length} tool verificati`,
              "Filtri client-side",
              "Link referral e source link integrati",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-[rgba(83,63,170,0.1)] bg-white/82 px-4 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <DirectoryBrowser
        tools={directoryTools}
        eyebrow="Esplora il catalogo"
        title="Tutti i Toools selezionati in un&apos;unica vista."
        description="Niente rumore, niente card rotte, niente CTA vuote. Solo tool utili, categorie leggibili e un&apos;esperienza più premium."
        initialQuery={params.q ?? ""}
        initialTag={params.tag ?? ""}
        initialGroup={initialGroup}
      />
    </div>
  );
}
