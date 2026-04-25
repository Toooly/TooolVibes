import Link from "next/link";

import { SurfaceIntro } from "@/components/sections/surface-intro";
import { getAllTags } from "@/lib/data/public-tools";

export default async function TagsPage() {
  const tags = await getAllTags();
  const sortedTags = Object.entries(tags).sort((left, right) => right[1] - left[1]);
  const topTags = sortedTags.slice(0, 6);

  return (
    <div className="tone-screen page-shell space-y-4 pb-14 pt-6 sm:space-y-6 sm:pb-18 sm:pt-9">
      <SurfaceIntro
        eyebrow="Esplorazione"
        title="Tag editoriali"
        description="Una superficie piu` utile per attraversare l'archivio per task, vibe e famiglie funzionali senza perdere il filo curatoriale."
        helperEyebrow="Come usarli"
        helperCopy="Usa i tag quando non stai ancora cercando un nome preciso ma vuoi restringere il territorio. Sono il layer piu` veloce per passare da curiosita` diffusa a esplorazione orientata."
        actions={
          <>
            <Link
              href="/archivio"
              className="button-shell button-secondary text-ui-strong inline-flex rounded-full px-5 py-3.5 text-sm font-semibold"
            >
              Apri archivio
            </Link>
            <Link
              href="/collections"
              className="button-shell button-secondary text-ui-strong inline-flex rounded-full px-5 py-3.5 text-sm font-semibold"
            >
              Collection curate
            </Link>
          </>
        }
        asideEyebrow="Mappa editoriale"
        asideTitle={`${sortedTags.length} tag per leggere meglio il catalogo.`}
        asideCopy="Non sono etichette decorative: servono a far emergere affinita` operative e famiglie di tool che altrimenti resterebbero troppo distanti tra loro."
      />

      {topTags.length > 0 ? (
        <section className="brand-panel panel-lift rounded-[34px] p-5 sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5 soft-divider">
            <div className="max-w-[42rem]">
              <p className="editorial-label">Tag guida</p>
              <h2 className="text-display-card mt-2.5 max-w-none text-[1.62rem] sm:max-w-[18ch] sm:text-[1.94rem] sm:text-balance">
                I cluster che oggi raccontano meglio il tono di TooolVibes.
              </h2>
            </div>
            <span className="selection-status">{topTags.length} tag in primo piano</span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {topTags.map(([tag, count], index) => (
              <Link
                key={tag}
                href={`/archivio?tag=${encodeURIComponent(tag)}`}
                className="interactive-surface relative overflow-hidden rounded-[28px] border p-4.5"
                style={{
                  borderColor: index < 2 ? "rgba(112,82,255,0.18)" : "var(--line)",
                  background:
                    index < 2
                      ? "linear-gradient(180deg, rgba(247,241,255,0.94), rgba(233,224,255,0.84))"
                      : "linear-gradient(180deg, rgba(255,255,255,0.8), rgba(243,237,255,0.72))",
                }}
              >
                <div className="card-glow absolute inset-0" />
                <div className="relative">
                  <p className="editorial-label">Tag editoriale</p>
                  <h3 className="text-display-card mt-3 text-[1.34rem]">#{tag}</h3>
                  <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
                    {count} tool collegati in archivio. Un buon punto di partenza se vuoi leggere il catalogo per territorio, non per nome.
                  </p>
                  <p className="mt-4 text-[0.72rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--accent-strong)" }}>
                    Apri filtro nell&apos;archivio
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="brand-panel panel-lift rounded-[34px] p-5 sm:p-6 lg:p-7">
        <div className="max-w-[42rem]">
          <p className="editorial-label">Tutti i tag</p>
          <h2 className="text-display-card mt-2.5 max-w-none text-[1.52rem] sm:max-w-[18ch] sm:text-[1.82rem] sm:text-balance">
            Un indice leggero da attraversare rapidamente.
          </h2>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {sortedTags.length > 0 ? (
            sortedTags.map(([tag, count], index) => (
              <Link
                key={tag}
                href={`/archivio?tag=${encodeURIComponent(tag)}`}
                className="inline-flex items-center gap-3 rounded-full border px-4 py-3 text-sm font-medium transition-transform duration-200 hover:-translate-y-0.5"
                style={{
                  borderColor: "var(--line)",
                  background:
                    index < 4
                      ? "linear-gradient(180deg, rgba(247,241,255,0.92), rgba(233,224,255,0.84))"
                      : "rgba(255,255,255,0.72)",
                }}
              >
                <span>#{tag}</span>
                <span
                  className="rounded-full px-2 py-1 text-xs"
                  style={{ background: "rgba(255,255,255,0.8)", color: "var(--muted)" }}
                >
                  {count}
                </span>
              </Link>
            ))
          ) : (
            <div
              className="w-full rounded-[var(--radius-lg)] border px-6 py-10 text-center"
              style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.62)" }}
            >
              <h3 className="text-2xl">I tag compariranno qui.</h3>
              <p className="mt-3 text-sm leading-7" style={{ color: "var(--muted)" }}>
                Pubblica i primi tool per generare automaticamente il layer di tag editoriali.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
