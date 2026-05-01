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
      <PremiumPanel tone="dark" className="px-5 py-6 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[rgba(168,85,247,0.22)] blur-3xl" />
        <div className="absolute -right-24 top-10 h-80 w-80 rounded-full bg-[rgba(57,210,246,0.12)] blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.02fr)_minmax(23rem,0.98fr)] xl:items-center">
          <div className="max-w-[45rem] xl:pt-2">
            <PremiumBadge tone="accent">AI tools discovery platform</PremiumBadge>
            <h1 className="text-display-hero mt-5 max-w-[12ch] text-[2.62rem] text-white sm:text-[4.1rem] lg:text-[5rem]">
              Trova tool AI validi. Taglia il rumore.
            </h1>
            <p className="mt-5 max-w-[42rem] text-[1.08rem] leading-8 text-white/72 sm:text-[1.18rem]">
              TooolVibes seleziona AI tools, SaaS, no-code builder, vibe coding e
              automazioni con una logica pratica: meno alternative inutili, più segnali
              per capire cosa provare davvero.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <PremiumLink href="/archivio" size="lg">Esplora i tool</PremiumLink>
              <PremiumLink href="#stack-builder" tone="secondary" size="lg" className="hidden sm:inline-flex">
                Crea il tuo stack
              </PremiumLink>
              <PremiumLink href="/wishlist" tone="ghost" size="lg" className="hidden sm:inline-flex">
                Suggerisci un Toool
              </PremiumLink>
            </div>

            <div className="mt-7 hidden max-w-[42rem] gap-3 sm:grid sm:grid-cols-3">
              {[
                [`${tools.length}`, "tool curati manualmente"],
                [`${featuredCount}`, "selezioni editoriali"],
                ["3", "azioni workspace"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-[24px] border border-white/10 bg-white/8 px-4 py-3 shadow-[0_10px_34px_rgba(0,0,0,0.16)]"
                >
                  <span className="block text-[1.45rem] font-semibold leading-none text-white">
                    {value}
                  </span>
                  <span className="mt-2 block text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-white/58">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 hidden flex-wrap gap-2 sm:flex">
              {[
                "Tool curati a mano",
                "Aggiornamenti periodici",
                "Casi d'uso reali",
                "No rumore",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[0.72rem] font-semibold text-white/72"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="hidden rounded-[32px] border border-white/10 bg-white/8 p-4 shadow-[0_22px_70px_rgba(0,0,0,0.28)] backdrop-blur xl:block">
            <div className="flex items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-white/8 px-4 py-3">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/48">
                  App preview
                </p>
                <p className="mt-1 text-sm text-white/68">
                  Tool, segnali e azioni operative in una vista sola.
                </p>
              </div>
              <PremiumBadge tone="dark">Premium</PremiumBadge>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {previewTools.map((tool) => (
                <div
                  key={tool.slug}
                  className="premium-card flex h-full min-h-[13rem] flex-col p-4"
                  style={{
                    background: `radial-gradient(circle at top right, ${tool.accentFrom}30, transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.052))`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <DirectoryToolGlyph tool={tool} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-white/46">
                        {tool.levelLabel}
                      </p>
                      <p className="mt-1 text-[1rem] font-semibold text-white">
                        {tool.name}
                      </p>
                    </div>
                  </div>
                  <p className="text-clamp-3 mt-3 min-h-[4.25rem] text-sm leading-6 text-white/70">
                    {tool.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-[0.7rem] uppercase tracking-[0.14em] text-white/46">
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
