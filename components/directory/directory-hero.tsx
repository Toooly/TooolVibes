import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import { ProductHuntRankings } from "@/components/product-hunt/product-hunt-rankings";
import { PremiumBadge, PremiumLink, PremiumPanel } from "@/components/ui/premium";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import { formatItalianDate } from "@/lib/utils";

type DirectoryHeroProps = {
  tools: DirectoryTool[];
};

export function DirectoryHero({ tools }: DirectoryHeroProps) {
  const previewTools = tools.slice(0, 4);

  return (
    <section className="page-shell pt-3 sm:pt-5">
      <PremiumPanel tone="light" className="px-5 py-6 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),transparent_72%)]" />

        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.04fr)_minmax(24rem,0.96fr)] xl:items-start">
          <div className="max-w-[44rem] xl:pt-4">
            <PremiumBadge tone="accent">AI tools discovery platform</PremiumBadge>
            <h1 className="text-display-hero mt-5 max-w-[13.5ch] text-[2.75rem] text-[var(--foreground)] sm:text-[3.9rem] lg:text-[4.9rem]">
              Scopri i Toools migliori per creare, automatizzare e lanciare pi&ugrave;
              velocemente.
            </h1>
            <p className="mt-5 max-w-[41rem] text-[1.06rem] leading-8 text-[var(--muted-strong)] sm:text-[1.14rem]">
              Una directory editoriale di AI tool, SaaS, no-code builder, vibe coding e
              automazioni. Meno rumore, pi&ugrave; segnali utili per scegliere cosa provare
              davvero.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <PremiumLink href="/archivio" size="lg">Scopri i Toools</PremiumLink>
              <PremiumLink href="/wishlist" tone="secondary" size="lg">
                Suggerisci un Toool
              </PremiumLink>
              <PremiumLink href="#product-hunt" tone="ghost" size="lg">
                Top Product Hunt
              </PremiumLink>
            </div>

            <div className="mt-7 grid max-w-[38rem] gap-3 sm:grid-cols-3">
              {[
                `${tools.length} tool curati`,
                "30 link integrati",
                "Wishlist e Product Hunt",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[22px] border border-[rgba(83,63,170,0.1)] bg-white/72 px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.15em] text-[var(--muted-strong)] shadow-[0_10px_26px_rgba(50,28,173,0.05)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[32px] border border-white/70 bg-white/82 p-4 shadow-[0_22px_60px_rgba(38,22,108,0.12)] backdrop-blur">
              <div className="flex items-center justify-between gap-3 rounded-[24px] border border-[rgba(83,63,170,0.08)] bg-[rgba(246,244,255,0.92)] px-4 py-3">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    Directory snapshot
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted-strong)]">
                    Builder, automation, SaaS e AI workflow in una vista sola.
                  </p>
                </div>
                <PremiumBadge tone="accent">Premium</PremiumBadge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {previewTools.map((tool) => (
                  <div
                    key={tool.slug}
                    className="premium-card flex h-full min-h-[14rem] flex-col p-4"
                    style={{
                      background: `radial-gradient(circle at top right, ${tool.accentFrom}1f, transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,241,255,0.92))`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <DirectoryToolGlyph tool={tool} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                          {tool.levelLabel}
                        </p>
                        <p className="mt-1 text-[1rem] font-semibold text-[var(--foreground)]">
                          {tool.name}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 min-h-[4.5rem] text-sm leading-6 text-[var(--muted-strong)]">
                      {tool.description}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-[rgba(83,63,170,0.08)] pt-3 text-[0.7rem] uppercase tracking-[0.14em] text-[var(--muted)]">
                      <span>{formatItalianDate(tool.publishedAt)}</span>
                      <span>{tool.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <ProductHuntRankings />
          </div>
        </div>
      </PremiumPanel>
    </section>
  );
}
