import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import { PremiumBadge, PremiumLink, PremiumPanel } from "@/components/ui/premium";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import { formatItalianDate } from "@/lib/utils";

type DirectoryHeroProps = {
  tools: DirectoryTool[];
};

export function DirectoryHero({ tools }: DirectoryHeroProps) {
  const previewTools = tools.slice(0, 4);
  const featuredCount = tools.filter((tool) => tool.featured).length;

  return (
    <section className="page-shell pt-3 sm:pt-5">
      <PremiumPanel tone="light" className="px-5 py-7 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.94),transparent_72%)]" />

        <div className="relative grid gap-9 xl:grid-cols-[minmax(0,1.02fr)_minmax(23rem,0.98fr)] xl:items-center">
          <div className="max-w-[45rem] xl:pt-2">
            <PremiumBadge tone="accent">AI tools discovery platform</PremiumBadge>
            <h1 className="text-display-hero mt-5 max-w-[12ch] text-[2.85rem] text-[var(--foreground)] sm:text-[4.1rem] lg:text-[5rem]">
              Trova tool AI validi, senza perdere ore.
            </h1>
            <p className="mt-5 max-w-[42rem] text-[1.08rem] leading-8 text-[var(--muted-strong)] sm:text-[1.18rem]">
              TooolVibes seleziona AI tools, SaaS, no-code builder, vibe coding e
              automazioni con una logica pratica: meno alternative inutili, più segnali
              per capire cosa provare davvero.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <PremiumLink href="/archivio" size="lg">Scopri i Toools</PremiumLink>
              <PremiumLink href="/wishlist" tone="secondary" size="lg">
                Suggerisci un Toool
              </PremiumLink>
              <PremiumLink href="#toools" tone="ghost" size="lg">
                Esplora catalogo
              </PremiumLink>
            </div>

            <div className="mt-8 grid max-w-[42rem] gap-3 sm:grid-cols-3">
              {[
                [`${tools.length}`, "tool curati manualmente"],
                [`${featuredCount}`, "selezioni editoriali"],
                ["0", "placeholder visibili"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-[24px] border border-[rgba(83,63,170,0.1)] bg-white/76 px-4 py-3 shadow-[0_10px_26px_rgba(50,28,173,0.05)]"
                >
                  <span className="block text-[1.45rem] font-semibold leading-none text-[var(--foreground)]">
                    {value}
                  </span>
                  <span className="mt-2 block text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[var(--muted-strong)]">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {[
                "Tool curati a mano",
                "Aggiornamenti periodici",
                "Casi d'uso reali",
                "No rumore",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[rgba(83,63,170,0.1)] bg-white/70 px-3 py-1.5 text-[0.72rem] font-semibold text-[var(--muted-strong)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

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
                  className="premium-card flex h-full min-h-[13rem] flex-col p-4"
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
                  <p className="text-clamp-3 mt-3 min-h-[4.25rem] text-sm leading-6 text-[var(--muted-strong)]">
                    {tool.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-[rgba(83,63,170,0.08)] pt-3 text-[0.7rem] uppercase tracking-[0.14em] text-[var(--muted)]">
                    <span>{formatItalianDate(tool.publishedAt)}</span>
                    <span className="truncate">{tool.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PremiumPanel>
    </section>
  );
}
