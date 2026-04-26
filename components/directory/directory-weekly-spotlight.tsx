import Link from "next/link";

import { DirectoryToolCard } from "@/components/directory/directory-tool-card";
import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import { formatItalianDate } from "@/lib/utils";

type DirectoryWeeklySpotlightProps = {
  weeklyTool: DirectoryTool;
  supportingTools: DirectoryTool[];
};

export function DirectoryWeeklySpotlight({
  weeklyTool,
  supportingTools,
}: DirectoryWeeklySpotlightProps) {
  return (
    <section className="page-shell space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[40rem]">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
            Tool della settimana
          </p>
          <h2 className="mt-3 text-[2rem] leading-[0.98] text-[var(--foreground)] sm:text-[2.7rem]">
            Il focus editoriale da provare prima degli altri.
          </h2>
          <p className="mt-4 text-[1rem] leading-7 text-[var(--muted-strong)]">
            Blink apre la selezione: rapido da capire, chiaro da testare e vicino al
            tipo di builder che trasforma un&apos;idea in qualcosa di navigabile.
          </p>
        </div>

        <Link href="/archivio" className="text-sm font-semibold text-[var(--accent-strong)]">
          Vai a tutti i Toools
        </Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(21rem,0.85fr)]">
        <article className="overflow-hidden rounded-[34px] border border-[rgba(83,63,170,0.14)] bg-[linear-gradient(135deg,#161128_0%,#24144f_56%,#1a1037_100%)] px-5 py-5 text-white shadow-[0_28px_70px_rgba(18,10,51,0.28)] sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <DirectoryToolGlyph tool={weeklyTool} size="lg" className="border-white/14" />
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/60">
                  Card principale
                </p>
                <p className="mt-1 text-[1.3rem] font-semibold">{weeklyTool.name}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/14 bg-white/8 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/84">
                {weeklyTool.levelLabel}
              </span>
              <span className="rounded-full border border-white/14 bg-white/8 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/84">
                {weeklyTool.categoryLabel}
              </span>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(15rem,0.92fr)]">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/56">
                Featured pick
              </p>
              <h3 className="mt-3 max-w-[11ch] text-[2.4rem] leading-[0.94] sm:text-[3.2rem]">
                {weeklyTool.name}
              </h3>
              <p className="mt-4 max-w-[36rem] text-[1rem] leading-7 text-white/76">
                {weeklyTool.longDescription}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {weeklyTool.highlights.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-white/84"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={weeklyTool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5"
                  style={{ color: "#24144d" }}
                >
                  {weeklyTool.ctaLabel}
                </a>
                <Link
                  href={`/toools/${weeklyTool.slug}`}
                  className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/8 px-5 py-3 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5"
                  style={{ color: "#ffffff" }}
                >
                  Apri la scheda
                </Link>
              </div>
            </div>

            <div className="flex h-full flex-col rounded-[28px] border border-white/10 bg-white/6 p-5">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/56">
                Perch&eacute; adesso
              </p>
              <p className="mt-3 text-[1rem] leading-7 text-white/82">
                {weeklyTool.whyItMatters}
              </p>

              <div className="mt-5 space-y-3">
                {weeklyTool.useCases.slice(0, 3).map((item, index) => (
                  <div
                    key={item}
                    className="rounded-[20px] border border-white/10 bg-white/6 px-4 py-3.5"
                  >
                    <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-white/44">
                      Uso {String(index + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/84">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-[0.74rem] uppercase tracking-[0.16em] text-white/56">
                <span>{formatItalianDate(weeklyTool.publishedAt)}</span>
                <span>{weeklyTool.readingTime}</span>
              </div>
            </div>
          </div>
        </article>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
          {supportingTools.map((tool) => (
            <DirectoryToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </div>
    </section>
  );
}
