import { DirectoryHero } from "@/components/directory/directory-hero";
import { HomeBrandIntro } from "@/components/app/home-brand-intro";
import { HomeCatalogPreview } from "@/components/directory/home-catalog-preview";
import { DirectoryWeeklySpotlight } from "@/components/directory/directory-weekly-spotlight";
import { HomeExperienceSections } from "@/components/directory/home-experience-sections";
import { MobileQuickStart } from "@/components/directory/mobile-quick-start";
import { MobileExpandableHomeBlock } from "@/components/directory/mobile-expandable-home-block";
import { ProductHuntRankings } from "@/components/product-hunt/product-hunt-rankings";
import { PremiumBadge, PremiumLink, PremiumPanel } from "@/components/ui/premium";
import {
  directoryTools,
  getFeaturedDirectoryTools,
  getToolOfTheWeek,
} from "@/lib/data/tooolvibes-directory";

export default function HomePage() {
  const weeklyTool = getToolOfTheWeek();
  const supportingTools = getFeaturedDirectoryTools(4).filter(
    (tool) => tool.slug !== weeklyTool?.slug,
  );

  return (
    <div className="space-y-5 pb-28 sm:space-y-14 sm:pb-20">
      <HomeBrandIntro />
      <DirectoryHero tools={directoryTools} />

      <MobileQuickStart />

      <HomeExperienceSections />

      {weeklyTool ? (
        <DirectoryWeeklySpotlight
          weeklyTool={weeklyTool}
          supportingTools={supportingTools.slice(0, 3)}
        />
      ) : null}

      <section className="page-shell sm:hidden">
        <div className="grid gap-2">
          <PremiumPanel tone="violet" className="dynamic-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <PremiumBadge tone="accent">Wishlist</PremiumBadge>
                <h2 className="mt-2 text-[1.18rem] font-semibold leading-tight text-white">
                  Manca un tool?
                </h2>
              </div>
              <PremiumLink href="/wishlist" size="sm">
                Suggerisci
              </PremiumLink>
            </div>
          </PremiumPanel>

          <PremiumPanel tone="blue" className="dynamic-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <PremiumBadge tone="dark">Community</PremiumBadge>
                <h2 className="mt-2 text-[1.18rem] font-semibold leading-tight text-white">
                  Workflow e idee condivise.
                </h2>
              </div>
              <PremiumLink href="/community" tone="dark" size="sm">
                Entra
              </PremiumLink>
            </div>
          </PremiumPanel>
        </div>
      </section>

      <MobileExpandableHomeBlock
        eyebrow="Radar live"
        title="Product Hunt compatto"
        description="Apri solo quando vuoi vedere lanci, segnali e dettagli."
      >
        <ProductHuntRankings variant="wide" />
      </MobileExpandableHomeBlock>

      <section className="page-shell hidden sm:block">
        <ProductHuntRankings variant="wide" />
      </section>

      <MobileExpandableHomeBlock
        eyebrow="Preview tool"
        title="Catalogo in callout"
        description="Tocca per espandere la preview senza un blocco infinito."
      >
        <HomeCatalogPreview tools={directoryTools} />
      </MobileExpandableHomeBlock>

      <section id="toools" className="page-shell hidden sm:block">
        <HomeCatalogPreview tools={directoryTools} />
      </section>

      <section className="page-shell hidden sm:block">
        <div className="motion-stagger grid gap-5 lg:grid-cols-2">
          <PremiumPanel tone="violet" className="dynamic-card p-4 sm:p-6">
            <PremiumBadge tone="accent">Wishlist</PremiumBadge>
            <h2 className="text-display-card mt-3 text-[1.55rem] text-white sm:mt-4 sm:text-[2.55rem]">
              Hai trovato un tool che manca?
            </h2>
            <p className="mt-3 text-[0.92rem] leading-6 text-white/72 sm:mt-4 sm:text-[1rem] sm:leading-7">
              Suggerisci nuovi AI tool, SaaS, no-code builder o automazioni e aiutaci a
              rendere la directory sempre pi&ugrave; utile.
            </p>
            <PremiumLink href="/wishlist" size="sm" className="mt-4 sm:mt-5 sm:text-sm">
              Suggerisci un tool
            </PremiumLink>
          </PremiumPanel>

          <PremiumPanel tone="blue" className="dynamic-card p-4 sm:p-6">
            <PremiumBadge tone="dark">Community</PremiumBadge>
            <h2 className="text-display-card mt-3 text-[1.55rem] sm:mt-4 sm:text-[2.55rem]">
              Una directory viva, curata con criterio.
            </h2>
            <p className="mt-3 text-[0.92rem] leading-6 text-white/74 sm:mt-4 sm:text-[1rem] sm:leading-7">
              Use case, tool emergenti e workflow pratici entrano in TooolVibes solo
              quando hanno valore reale per chi costruisce.
            </p>
            <PremiumLink href="/community" tone="dark" size="sm" className="mt-4 sm:mt-5 sm:text-sm">
              Vai alla community
            </PremiumLink>
          </PremiumPanel>
        </div>
      </section>
    </div>
  );
}
