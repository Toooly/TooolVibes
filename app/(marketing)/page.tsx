import { DirectoryBrowser } from "@/components/directory/directory-browser";
import { DirectoryHero } from "@/components/directory/directory-hero";
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
    <div className="space-y-8 pb-28 sm:space-y-14 sm:pb-20">
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
        <PremiumPanel tone="tint" className="px-4 py-5 sm:px-7 sm:py-8">
          <DirectoryBrowser
            tools={directoryTools}
            eyebrow="Tutti i tool"
            title="Catalogo operativo per scegliere meglio, non per scorrere all'infinito."
            description="Filtra, salva, confronta e costruisci stack: il catalogo TooolVibes porta dalla scoperta alla decisione senza perdere contesto."
          />
        </PremiumPanel>
      </section>

      <section className="page-shell">
        <div className="grid gap-5 lg:grid-cols-2">
          <PremiumPanel tone="light" className="p-5 sm:p-6">
            <PremiumBadge tone="accent">Wishlist</PremiumBadge>
            <h2 className="text-display-card mt-4 text-[1.95rem] text-[var(--foreground)] sm:text-[2.55rem]">
              Hai trovato un tool che manca?
            </h2>
            <p className="mt-4 text-[1rem] leading-7 text-[var(--muted-strong)]">
              Suggerisci nuovi AI tool, SaaS, no-code builder o automazioni e aiutaci a
              rendere la directory sempre pi&ugrave; utile.
            </p>
            <PremiumLink href="/wishlist" className="mt-5">
              Suggerisci un tool
            </PremiumLink>
          </PremiumPanel>

          <PremiumPanel tone="dark" className="p-5 sm:p-6">
            <PremiumBadge tone="dark">Community</PremiumBadge>
            <h2 className="text-display-card mt-4 text-[1.95rem] sm:text-[2.55rem]">
              Una directory viva, curata con criterio.
            </h2>
            <p className="mt-4 text-[1rem] leading-7 text-white/74">
              Use case, tool emergenti e workflow pratici entrano in TooolVibes solo
              quando hanno valore reale per chi costruisce.
            </p>
            <PremiumLink href="/community" tone="dark" className="mt-5">
              Vai alla community
            </PremiumLink>
          </PremiumPanel>
        </div>
      </section>
    </div>
  );
}
