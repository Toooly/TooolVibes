import type { Metadata } from "next";

import Link from "next/link";

import {
  getAllTags,
  getPublicToolFilterGroups,
  getPublicToolViews,
} from "@/lib/data/public-tools";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Tag",
  description: "Esplora i tool TooolVibes per tag, categoria e scenario d'uso.",
  path: "/tags",
});

export default async function TagsPage() {
  const [tags, filterGroups, tools] = await Promise.all([
    getAllTags(),
    getPublicToolFilterGroups(),
    getPublicToolViews(),
  ]);
  const tagCounts = Object.entries(tags).sort(
    (left, right) => right[1] - left[1],
  );

  return (
    <div className="page-shell tags-route space-y-5 pb-28 pt-4 sm:space-y-8 sm:pb-20 sm:pt-6">
      <section className="overflow-hidden rounded-[30px] border border-[var(--tv-border-default)] bg-[var(--tv-surface-raised)] px-5 py-5 sm:rounded-[38px] sm:px-7 sm:py-8">
        <div className="max-w-[44rem]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
            Categorie e tag
          </p>
          <h1 className="mt-4 max-w-[18ch] text-[clamp(2rem,10vw,2.65rem)] leading-[0.96] text-[var(--foreground)] sm:max-w-[24ch] sm:text-[3.2rem]">
            Esplora TooolVibes per categoria, livello e caso d&apos;uso.
          </h1>
          <p className="mt-5 max-w-[40rem] text-[1rem] leading-7 text-[var(--muted-strong)]">
            Le categorie sono pensate per farti scegliere più rapidamente: builder AI,
            no-code, automazioni, supporto clienti, video, marketing e agenti.
          </p>
        </div>
      </section>

      <section className="rounded-[28px] border border-[var(--tv-border-default)] bg-[var(--tv-surface-raised)] p-5 sm:rounded-[34px] sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-[40rem]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              Filtri guida
            </p>
            <h2 className="mt-3 text-[1.45rem] leading-[1.04] text-[var(--foreground)] sm:text-[2.4rem]">
              Le famiglie più utili per leggere il catalogo.
            </h2>
          </div>
          <span className="rounded-full border border-[var(--tv-border-default)] bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--tv-ink-secondary)]">
            {filterGroups.length - 1} categorie attive
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filterGroups
            .filter((group) => group.key !== "all")
            .map((group) => {
              const count = tools.filter((tool) =>
                tool.filterGroups.includes(group.key),
              ).length;

              return (
                <Link
                  key={group.key}
                  href={`/archivio?group=${group.key}`}
                  className="group rounded-[24px] border border-[var(--tv-border-default)] bg-[var(--tv-surface-raised)] p-4 transition-colors duration-200 hover:!border-[var(--tv-accent-brand)] focus-visible:!border-[var(--tv-accent-brand)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tv-accent-brand)] sm:rounded-[28px] sm:p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
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

      <section className="rounded-[28px] border border-[var(--tv-border-default)] bg-[var(--tv-surface-raised)] p-5 sm:rounded-[34px] sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-[40rem]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              Tutti i tag
            </p>
            <h2 className="mt-3 text-[1.45rem] leading-[1.04] text-[var(--foreground)] sm:text-[2.4rem]">
              Una mappa rapida per muoverti tra tool, risultati e casi d&apos;uso.
            </h2>
          </div>
          <span className="rounded-full border border-[var(--tv-border-default)] bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--tv-ink-secondary)]">
            {tagCounts.length} tag disponibili
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
          {tagCounts.map(([tag, count]) => (
            <Link
              key={tag}
              href={`/archivio?tag=${encodeURIComponent(tag)}`}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--tv-border-default)] bg-transparent px-3 py-2 text-[0.82rem] font-semibold text-[var(--tv-ink-primary)] transition-colors duration-200 hover:border-[var(--tv-accent-brand)] hover:bg-[var(--tv-surface-selected)] hover:text-[var(--tv-ink-on-brand)] focus-visible:border-[var(--tv-accent-brand)] focus-visible:bg-[var(--tv-surface-selected)] focus-visible:text-[var(--tv-ink-on-brand)] sm:gap-3 sm:px-4 sm:py-3 sm:text-sm"
            >
              <span>{tag}</span>
              <span className="border-l border-current/20 pl-2 text-xs">
                {count}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
