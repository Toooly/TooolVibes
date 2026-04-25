import { DirectoryBrowser } from "@/components/directory/directory-browser";
import { DirectoryHero } from "@/components/directory/directory-hero";
import { DirectoryWeeklySpotlight } from "@/components/directory/directory-weekly-spotlight";
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
    <div className="space-y-10 pb-16 sm:space-y-14 sm:pb-20">
      <DirectoryHero tools={directoryTools} />

      {weeklyTool ? (
        <DirectoryWeeklySpotlight
          weeklyTool={weeklyTool}
          supportingTools={supportingTools.slice(0, 3)}
        />
      ) : null}

      <section id="toools" className="page-shell">
        <div className="rounded-[36px] border border-[rgba(83,63,170,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(246,242,255,0.9))] px-5 py-6 shadow-[0_24px_70px_rgba(37,21,102,0.08)] sm:px-7 sm:py-8">
          <DirectoryBrowser
            tools={directoryTools}
            eyebrow="Tutti i Toools"
            title="Scopri tutti i Toools che abbiamo selezionato per te."
            description="Una vista piu' chiara e piu' moderna del catalogo originale: ricerca client-side, filtri utili, card curate e link pronti al click."
          />
        </div>
      </section>
    </div>
  );
}
