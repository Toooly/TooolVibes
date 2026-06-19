import Link from "next/link";

import {
  directoryFilterGroups,
  directoryTools,
  getDirectoryTags,
} from "@/lib/data/tooolvibes-directory";

export default function TagsPage() {
  const tagCounts = Object.entries(getDirectoryTags()).sort(
    (left, right) => right[1] - left[1],
  );

  return (
    <div className="page-shell space-y-5 pb-28 pt-4 sm:space-y-8 sm:pb-20 sm:pt-6">
      <section className="light-surface overflow-hidden rounded-[30px] border border-[rgba(83,63,170,0.12)] bg-[linear-gradient(135deg,#fdfcff_0%,#f5f0ff_44%,#eef2ff_100%)] px-5 py-5 shadow-[0_24px_72px_rgba(38,21,104,0.08)] sm:rounded-[38px] sm:px-7 sm:py-8">
        <div className="max-w-[44rem]">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
            Categorie e tag
          </p>
          <h1 className="mt-4 max-w-[14ch] text-[clamp(2rem,10vw,2.65rem)] leading-[0.96] text-[var(--foreground)] sm:text-[3.2rem]">
            Esplora TooolVibes per categoria, livello e caso d&apos;uso.
          </h1>
          <p className="mt-5 max-w-[40rem] text-[1rem] leading-7 text-[var(--muted-strong)]">
            Le categorie sono pensate per farti scegliere più rapidamente: builder AI,
            no-code, automazioni, supporto clienti, video, marketing e agenti.
          </p>
        </div>
      </section>

      <section className="light-surface rounded-[28px] border border-[rgba(83,63,170,0.12)] bg-white/86 p-5 shadow-[0_22px_64px_rgba(35,18,95,0.08)] sm:rounded-[34px] sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-[40rem]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              Filtri guida
            </p>
            <h2 className="mt-3 text-[1.45rem] leading-[1.04] text-[var(--foreground)] sm:text-[2.4rem]">
              Le famiglie più utili per leggere il catalogo.
            </h2>
          </div>
          <span className="rounded-full border border-[rgba(83,63,170,0.1)] bg-[rgba(246,244,255,0.86)] px-4 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
            {directoryFilterGroups.length - 1} categorie attive
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {directoryFilterGroups
            .filter((group) => group.key !== "all")
            .map((group) => {
              const count = directoryTools.filter((tool) =>
                tool.segments.includes(group.key),
              ).length;

              return (
                <Link
                  key={group.key}
                  href={`/archivio?group=${group.key}`}
                  className="light-surface group rounded-[24px] border border-[rgba(83,63,170,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,241,255,0.9))] p-4 shadow-[0_16px_40px_rgba(34,19,94,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(108,76,255,0.22)] sm:rounded-[28px] sm:p-5"
                >
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    Categoria
                  </p>
                  <h3 className="mt-3 text-[1.32rem] leading-[1.1] text-[var(--foreground)]">
                    {group.label}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">
                    {count} tool collegati. Apri l&apos;archivio e usa ricerca, livello e
                    tag per arrivare al profilo giusto più velocemente.
                  </p>
                </Link>
              );
            })}
        </div>
      </section>

      <section className="light-surface rounded-[28px] border border-[rgba(83,63,170,0.12)] bg-white/86 p-5 shadow-[0_22px_64px_rgba(35,18,95,0.08)] sm:rounded-[34px] sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-[40rem]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              Tutti i tag
            </p>
            <h2 className="mt-3 text-[1.45rem] leading-[1.04] text-[var(--foreground)] sm:text-[2.4rem]">
              Una mappa rapida per muoverti tra tool, risultati e casi d&apos;uso.
            </h2>
          </div>
          <span className="rounded-full border border-[rgba(83,63,170,0.1)] bg-[rgba(246,244,255,0.86)] px-4 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
            {tagCounts.length} tag disponibili
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
          {tagCounts.map(([tag, count]) => (
            <Link
              key={tag}
              href={`/archivio?tag=${encodeURIComponent(tag)}`}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[rgba(83,63,170,0.1)] bg-[rgba(246,244,255,0.9)] px-3 py-2 text-[0.82rem] font-semibold text-[var(--muted-strong)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(108,76,255,0.22)] hover:text-[var(--accent-strong)] sm:gap-3 sm:px-4 sm:py-3 sm:text-sm"
            >
              <span>{tag}</span>
              <span className="rounded-full bg-white/84 px-2 py-1 text-[0.72rem] text-[var(--muted)]">
                {count}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
