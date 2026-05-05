import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import { PremiumBadge, PremiumLink, PremiumPanel } from "@/components/ui/premium";
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
    <section className="page-shell space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[40rem]">
          <PremiumBadge tone="accent">Tool della settimana</PremiumBadge>
          <h2 className="mt-3 text-[1.65rem] leading-[1.02] text-[var(--foreground)] sm:text-[2.45rem]">
            Il focus editoriale da provare prima degli altri.
          </h2>
          <p className="mt-3 text-[0.95rem] leading-7 text-[var(--muted-strong)] sm:mt-4 sm:text-[1rem]">
            Blink apre la selezione: rapido da capire, chiaro da testare e vicino al
            tipo di builder che trasforma un&apos;idea in qualcosa di navigabile.
          </p>
        </div>

        <PremiumLink href="/archivio" tone="ghost" size="sm">
          Vai al catalogo
        </PremiumLink>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(21rem,0.82fr)]">
        <PremiumPanel
          as="article"
          tone="violet"
          className="overflow-hidden px-4 py-5 text-white sm:px-6 sm:py-6"
        >
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

          <div className="mt-5 grid gap-5 sm:mt-6 lg:grid-cols-[minmax(0,1.03fr)_minmax(15rem,0.97fr)] lg:gap-6">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/56">
                Featured pick
              </p>
              <h3 className="mt-3 max-w-[11ch] text-[2rem] leading-[0.96] sm:text-[2.85rem]">
                {weeklyTool.name}
              </h3>
              <p className="mt-4 max-w-[36rem] text-[1rem] leading-7 text-white/76">
                {weeklyTool.longDescription}
              </p>

              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                {[
                  ["Use case", weeklyTool.useCases.length.toString()],
                  ["Lettura", weeklyTool.readingTime],
                  ["Fonte", weeklyTool.domain],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[18px] border border-white/10 bg-white/7 px-3 py-3">
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white/42">
                      {label}
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
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
                <PremiumLink
                  href={weeklyTool.url}
                  external
                  tone="primary"
                >
                  {weeklyTool.ctaLabel}
                </PremiumLink>
                <PremiumLink
                  href={`/toools/${weeklyTool.slug}`}
                  tone="ghost"
                  className="border-white/14 bg-white/8 text-white hover:bg-white/12"
                >
                  Apri la scheda
                </PremiumLink>
              </div>
            </div>

            <div className="flex h-full flex-col rounded-[24px] border border-white/10 bg-white/6 p-4 sm:rounded-[28px] sm:p-5">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/56">
                Perch&eacute; adesso
              </p>
              <p className="mt-3 text-[1rem] leading-7 text-white/82">
                {weeklyTool.whyItMatters}
              </p>

              <div className="mt-5 grid gap-3">
                {weeklyTool.useCases.slice(0, 3).map((item, index) => (
                  <div
                    key={item}
                    className="rounded-[20px] border border-white/10 bg-white/6 px-4 py-3.5 transition duration-200 hover:border-white/18 hover:bg-white/8"
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
        </PremiumPanel>

        <div className="motion-stagger tool-rail -mx-1.5 flex snap-x gap-3 overflow-x-auto px-1.5 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-1">
          {supportingTools.map((tool) => (
            <article
              key={tool.slug}
              className="group w-[min(78vw,19rem)] shrink-0 snap-start rounded-[26px] border border-white/12 bg-white/9 p-4 text-white transition duration-200 hover:-translate-y-1 hover:border-violet-200/36 hover:bg-white/14 hover:shadow-[0_18px_44px_rgba(8,14,38,0.2)] md:w-auto"
            >
              <div className="flex items-start gap-3">
                <DirectoryToolGlyph tool={tool} size="md" />
                <div className="min-w-0">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white/44">
                    Alternativa
                  </p>
                  <h3 className="mt-1 truncate text-[1.05rem] font-semibold text-white">
                    {tool.name}
                  </h3>
                </div>
              </div>
              <p className="text-clamp-3 mt-4 text-sm leading-6 text-white/66">
                {tool.shortDescription}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {tool.highlights.slice(0, 2).map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/7 px-2.5 py-1 text-[0.62rem] font-semibold text-white/58"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <PremiumLink href={`/toools/${tool.slug}`} tone="ghost" size="sm" className="mt-4 w-full">
                Apri scheda
              </PremiumLink>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
