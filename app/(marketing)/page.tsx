import { DirectoryHero } from "@/components/directory/directory-hero";
import { HomeCatalogPreview } from "@/components/directory/home-catalog-preview";
import { DirectoryWeeklySpotlight } from "@/components/directory/directory-weekly-spotlight";
import { HomeExperienceSections } from "@/components/directory/home-experience-sections";
import { MobileQuickStart } from "@/components/directory/mobile-quick-start";
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
      <DirectoryHero tools={directoryTools} />

      <MobileQuickStart />

      <HomeExperienceSections />

      {weeklyTool ? (
        <DirectoryWeeklySpotlight
          weeklyTool={weeklyTool}
          supportingTools={supportingTools.slice(0, 3)}
        />
      ) : null}

      <section className="page-shell">
        <ProductHuntRankings variant="wide" />
      </section>

      <section id="toools" className="page-shell">
        <HomeCatalogPreview tools={directoryTools} />
      </section>

      <section className="page-shell">
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
