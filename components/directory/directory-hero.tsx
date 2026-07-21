import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import { HomeLiveLayer } from "@/components/directory/home-live-layer";
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
    <section className="page-shell pt-2 sm:pt-5">
      <PremiumPanel tone="blue" className="motion-reveal px-4 py-5 sm:px-8 sm:py-9 lg:px-10 lg:py-11">
        <div className="absolute inset-0 bg-[linear-gradient(118deg,transparent_0_34%,rgba(167,139,250,0.08)_34.2%_34.45%,transparent_34.7%_100%),linear-gradient(64deg,transparent_0_58%,rgba(94,226,255,0.07)_58.2%_58.45%,transparent_58.7%_100%)]" />
        <div className="absolute inset-x-6 top-6 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.34),transparent)]" />

        <div className="relative grid gap-8 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:items-center lg:gap-10 xl:grid-cols-[minmax(0,0.98fr)_minmax(25rem,1.02fr)] xl:items-center">
          <div className="max-w-[45rem] xl:pt-2">
            <PremiumBadge tone="accent">Guida italiana ai tool AI</PremiumBadge>
            <h1 className="text-display-hero mt-4 max-w-[12ch] text-[clamp(2rem,8vw,4.85rem)] text-white sm:mt-5">
              Trova tool AI validi. Senti la direzione.
            </h1>
            <p className="mt-3 max-w-[42rem] text-[0.9rem] leading-6 text-white/74 sm:mt-5 sm:text-[1.13rem] sm:leading-8">
              TooolVibes seleziona tool AI, SaaS, no-code, vibe coding e
              automazioni con una logica pratica: meno alternative inutili, più segnali
              per capire cosa provare davvero.
            </p>

            <div className="mt-5 grid gap-2.5 sm:mt-6 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
              <PremiumLink href="/archivio" size="md">Esplora i tool</PremiumLink>
              <PremiumLink href="/archivio#stack-builder" tone="secondary" size="md">
                Crea la tua lista
              </PremiumLink>
              <PremiumLink href="/shortlist#wishlist" tone="ghost" size="md" className="hidden sm:inline-flex">
                Suggerisci un tool
              </PremiumLink>
            </div>

            <HomeLiveLayer toolCount={tools.length} featuredCount={featuredCount} />

            <div className="motion-stagger mt-7 hidden max-w-[42rem] gap-3 sm:grid sm:grid-cols-3">
              {[
                [`${tools.length}`, "tool curati manualmente"],
                [`${featuredCount}`, "selezioni editoriali"],
                ["3", "azioni per scegliere"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="group rounded-[22px] border border-white/12 bg-white/9 px-4 py-3 shadow-[0_10px_34px_rgba(8,14,38,0.12)] transition duration-200 hover:-translate-y-0.5 hover:border-white/22 hover:bg-white/13"
                >
                  <span className="block text-[1.45rem] font-semibold leading-none text-white">
                    {value}
                  </span>
                  <span className="mt-2 block text-xs font-semibold uppercase tracking-[0.15em] text-white/58">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 hidden flex-wrap gap-2 sm:flex">
              {[
                "Tool curati a mano",
                "Segnali ad alto contrasto",
                "Casi d'uso reali",
                "Zero rumore",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-semibold text-white/72"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="hero-mini-visual hidden rounded-[32px] border border-white/12 bg-[linear-gradient(145deg,rgba(255,255,255,0.13),rgba(244,239,255,0.08))] p-4 shadow-[0_22px_70px_rgba(8,14,38,0.22)] xl:block">
            <div className="flex items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-white/8 px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/48">
                  Anteprima selezione
                </p>
                <p className="mt-1 text-sm text-white/68">
                  Tool, segnali e azioni operative nello stesso flusso.
                </p>
              </div>
              <PremiumBadge tone="dark">Premium</PremiumBadge>
            </div>

            <div className="mt-4 grid gap-3">
              {previewTools.map((tool) => (
                <div
                  key={tool.slug}
                  className="group flex min-h-[7.6rem] items-start gap-3 rounded-[24px] border border-white/10 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-white/22 hover:bg-white/9"
                  style={{
                    background: `radial-gradient(circle at top right, ${tool.accentFrom}30, transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.052))`,
                  }}
                >
                  <DirectoryToolGlyph tool={tool} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/46">
                          {tool.levelLabel}
                        </p>
                        <p className="mt-1 truncate text-[1rem] font-semibold text-white">
                          {tool.name}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/58">
                        {formatItalianDate(tool.publishedAt)}
                      </span>
                    </div>
                    <p className="text-clamp-2 mt-2 text-sm leading-6 text-white/70">
                      {tool.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {tool.highlights.slice(0, 2).map((highlight) => (
                        <span
                          key={highlight}
                          className="rounded-full border border-white/10 bg-white/7 px-2.5 py-1 text-xs font-semibold text-white/62"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
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
